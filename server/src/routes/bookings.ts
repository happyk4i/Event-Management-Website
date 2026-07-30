import { Router, Request, Response } from 'express';
import { prisma } from '../config/db.ts';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.ts';
import { uploadImage, deleteImage, getSignedUrl } from '../utils/cloudinary.js';
import multer from 'multer';

export const bookingsRouter = Router();

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new Error('INVALID_TYPE') as any, false);
  },
});

function hasValidSignature(buf: Buffer, mime: string): boolean {
  if (mime === 'image/jpeg') return buf[0] === 0xff && buf[1] === 0xd8;
  if (mime === 'image/png')
    return (
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47
    );
  if (mime === 'image/webp')
    return buf.slice(0, 4).toString() === 'RIFF' &&
      buf.slice(8, 12).toString() === 'WEBP';
  return false;
}

export async function cancelBookingAtomically(
  bookingId: string,
  paymentStatus: 'expired' | 'rejected',
  rejectReason?: string,
  actorId?: string
) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: { event: true },
    });
    if (!booking) throw new Error('Booking not found.');
    if (booking.paymentStatus !== 'uploaded' && paymentStatus === 'rejected') return false;
    if (booking.paymentStatus !== 'pending' && paymentStatus === 'expired') return false;

    const claimed = await tx.booking.updateMany({
      where: { id: bookingId, paymentStatus: booking.paymentStatus },
      data: {
        status: 'cancelled',
        paymentStatus,
        ...(rejectReason ? { rejectReason } : {}),
        ...(actorId ? { verifiedByUserId: actorId, verifiedAt: new Date() } : {}),
      },
    });
    if (claimed.count !== 1) return false;

    await tx.event.update({
      where: { id: booking.eventId },
      data: { availableSeats: { increment: 1 } },
    });

    if (booking.appliedPoints > 0) {
      await tx.user.update({
        where: { id: booking.userId },
        data: { pointsBalance: { increment: booking.appliedPoints } },
      });
      await tx.pointRecord.create({
        data: {
          userId: booking.userId,
          points: booking.appliedPoints,
          type: 'REFUNDED',
          description: `Refunded points from ${paymentStatus} booking #${bookingId}`,
        },
      });
    }

    const txRecord = await tx.transaction.findFirst({
      where: { eventId: booking.eventId, buyerId: booking.userId },
      orderBy: { createdAt: 'desc' },
    });
    if (txRecord?.couponUsedId) {
      await tx.coupon.update({ where: { id: txRecord.couponUsedId }, data: { isUsed: false } });
    }
    if (booking.voucherId) {
      await tx.voucher.update({ where: { id: booking.voucherId }, data: { usedCount: { decrement: 1 } } });
    }
    return true;
  });
}

bookingsRouter.post(
  '/:bookingId/upload-proof',
  verifyToken,
  upload.single('paymentProof'),
  async (req: Request, res: Response) => {
    try {
      const { bookingId } = req.params;
      const userId = req.user?.id;

      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      if (!req.file) return res.status(400).json({ error: 'Payment proof image is required.' });

      if (!hasValidSignature(req.file.buffer, req.file.mimetype)) {
        return res.status(400).json({ error: 'File content does not match the declared image type.' });
      }

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: {
          userId: true,
          paymentStatus: true,
          status: true,
          bookedAt: true,
          paymentProofPublicId: true,
        },
      });

      if (!booking) return res.status(404).json({ error: 'Booking not found.' });
      if (booking.userId !== userId) return res.status(403).json({ error: 'This booking does not belong to you.' });

      if (booking.status === 'confirmed' || booking.paymentStatus === 'waived') {
        return res.status(400).json({ error: 'This booking is already confirmed. No proof required.' });
      }
      if (booking.paymentStatus !== 'pending') {
        return res.status(400).json({ error: `Cannot upload. Current status: ${booking.paymentStatus}` });
      }

      const deadline = new Date(booking.bookedAt.getTime() + 30 * 60 * 1000);
      if (new Date() > deadline) {

        await cancelBookingAtomically(bookingId, 'expired');
        return res.status(410).json({ error: 'Payment deadline has passed. Booking has been cancelled.' });
      }

      if (booking.paymentProofPublicId) {
        try { await deleteImage(booking.paymentProofPublicId); } catch (_) {  }
      }

      const result = await uploadImage(req.file.buffer, 'eventkuy/payment-proofs', req.file.mimetype);

      const updated = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          paymentProofUrl: result.url,
          paymentProofPublicId: result.publicId,
          paymentStatus: 'uploaded',
        },
        select: { id: true, paymentProofUrl: true, paymentStatus: true, totalPrice: true, status: true },
      });

      res.json({ message: 'Payment proof uploaded. Waiting for organizer verification.', booking: updated });
    } catch (error: any) {
      console.error('Upload proof error:', error);
      if (error.message === 'INVALID_TYPE') {
        return res.status(400).json({ error: 'Only JPEG, PNG, and WebP images are allowed.' });
      }
      res.status(500).json({ error: 'Failed to upload payment proof.' });
    }
  }
);

bookingsRouter.put(
  '/:bookingId/verify',
  verifyToken,
  authorizeRoles('Organizer', 'Admin'),
  async (req: Request, res: Response) => {
    try {
      const { bookingId } = req.params;
      const { paymentStatus: newStatus, rejectReason } = req.body;
      const actorId = req.user?.id;
      const actorRole = req.user?.role;
      if (!actorId) return res.status(401).json({ error: 'Unauthorized' });

      if (!['verified', 'rejected'].includes(newStatus)) {
        return res.status(400).json({ error: 'paymentStatus must be "verified" or "rejected".' });
      }

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { event: { select: { createdById: true, name: true, id: true, availableSeats: true } } },
      });

      if (!booking) return res.status(404).json({ error: 'Booking not found.' });

      if (actorRole !== 'Admin' && booking.event.createdById !== actorId) {
        return res.status(403).json({ error: 'You are not the organizer of this event.' });
      }

      if (booking.paymentStatus !== 'uploaded') {
        return res.status(400).json({ error: `Cannot verify. Current status: ${booking.paymentStatus}` });
      }

      if (newStatus === 'verified') {

        await prisma.$transaction(async (tx) => {
          await tx.booking.update({
            where: { id: bookingId, paymentStatus: 'uploaded' },
            data: {
              status: 'confirmed',
              paymentStatus: 'verified',
              verifiedByUserId: actorId,
              verifiedAt: new Date(),
            },
          });

          const pointsEarned = Math.floor(Number(booking.totalPrice) / 1000);
          if (pointsEarned > 0) {
            await tx.user.update({
              where: { id: booking.userId },
              data: { pointsBalance: { increment: pointsEarned } },
            });
            await tx.pointRecord.create({
              data: {
                userId: booking.userId,
                points: pointsEarned,
                type: 'EARNED',
                description: `Points from verified booking #${booking.id} — ${booking.event.name}`,
              },
            });
          }
        });
      } else {

        await cancelBookingAtomically(bookingId, 'rejected', rejectReason, actorId);
      }

      const updated = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { id: true, status: true, paymentStatus: true, verifiedAt: true, rejectReason: true },
      });

      res.json({ message: `Payment ${newStatus} successfully.`, booking: updated });
    } catch (error: any) {
      console.error('Verify payment error:', error);
      res.status(500).json({ error: 'Failed to verify payment.' });
    }
  }
);

bookingsRouter.get(
  '/pending-verification',
  verifyToken,
  authorizeRoles('Organizer', 'Admin'),
  async (req: Request, res: Response) => {
    try {
      const actorId = req.user?.id;
      const actorRole = req.user?.role;
      if (!actorId) return res.status(401).json({ error: 'Unauthorized' });

      const whereClause =
        actorRole === 'Admin'
          ? { paymentStatus: 'uploaded' }
          : { paymentStatus: 'uploaded', event: { createdById: actorId } };

      const bookings = await prisma.booking.findMany({
        where: whereClause,
        include: {
          user: { select: { id: true, name: true, email: true } },
          event: { select: { id: true, name: true, date: true, time: true, price: true, createdById: true } },
          bookingItems: { include: { ticketType: true } },
        },
        orderBy: { bookedAt: 'asc' },
      });

      const result = bookings.map((b) => ({
        ...b,
        paymentProofUrl: b.paymentProofPublicId ? getSignedUrl(b.paymentProofPublicId) : null,
        paymentProofPublicId: undefined,
      }));

      res.json(result);
    } catch (error: any) {
      console.error('Pending verification error:', error);
      res.status(500).json({ error: 'Failed to fetch pending bookings.' });
    }
  }
);

bookingsRouter.get('/my', verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        event: { select: { id: true, name: true, date: true, time: true, location: true, price: true } },
        bookingItems: { include: { ticketType: true } },
      },
      orderBy: { bookedAt: 'desc' },
    });

    const result = bookings.map((b) => ({
      ...b,
      paymentProofUrl:
        b.paymentProofPublicId && (b.paymentStatus === 'uploaded' || b.paymentStatus === 'verified')
          ? getSignedUrl(b.paymentProofPublicId)
          : null,
      paymentProofPublicId: undefined,
    }));

    res.json(result);
  } catch (error: any) {
    console.error('My bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings.' });
  }
});
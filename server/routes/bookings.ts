import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { verifyToken, authorizeRoles } from '../auth.middleware.js';
import { uploadImage, deleteImage } from '../utils/cloudinary.js';
import multer from 'multer';

export const bookingsRouter = Router();

// Multer: store in memory buffer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed') as any, false);
    }
  },
});

// POST /api/bookings/:id/upload-proof — Buyer uploads payment proof
bookingsRouter.post('/:bookingId/upload-proof', verifyToken, upload.single('paymentProof'), async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!req.file) return res.status(400).json({ error: 'Payment proof image is required.' });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { userId: true, paymentStatus: true, paymentProofUrl: true, paymentProofPublicId: true }
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    if (booking.userId !== userId) return res.status(403).json({ error: 'This booking does not belong to you.' });
    if (booking.paymentStatus !== 'pending') return res.status(400).json({ error: `Payment proof cannot be uploaded. Current status: ${booking.paymentStatus}` });

    // Delete old proof if exists
    if (booking.paymentProofPublicId) {
      try { await deleteImage(booking.paymentProofPublicId); } catch (_) { /* ignore */ }
    }

    // Upload to Cloudinary
    const result = await uploadImage(req.file.buffer, 'eventkuy_payments', req.file.mimetype);

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentProofUrl: result.url,
        paymentProofPublicId: result.publicId,
        paymentStatus: 'uploaded',
      },
      select: {
        id: true,
        paymentProofUrl: true,
        paymentStatus: true,
        totalPrice: true,
        status: true,
      }
    });

    res.json({ message: 'Payment proof uploaded. Waiting for organizer verification.', booking: updated });
  } catch (error: any) {
    console.error('Upload proof error:', error);
    if (error.message === 'Only image files are allowed') {
      return res.status(400).json({ error: 'Only image files (JPEG, PNG, etc.) are allowed.' });
    }
    res.status(500).json({ error: 'Failed to upload payment proof.' });
  }
});

// PUT /api/bookings/:id/verify — Organizer verifies or rejects payment
bookingsRouter.put('/:bookingId/verify', verifyToken, authorizeRoles('Organizer'), async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const { paymentStatus, rejectReason } = req.body;
    const organizerId = req.user?.id;
    if (!organizerId) return res.status(401).json({ error: 'Unauthorized' });

    if (!['verified', 'rejected'].includes(paymentStatus)) {
      return res.status(400).json({ error: 'Payment status must be "verified" or "rejected".' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { event: { select: { createdById: true, name: true, id: true } } }
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    if (booking.event.createdById !== organizerId) return res.status(403).json({ error: 'You are not the organizer of this event.' });
    if (booking.paymentStatus !== 'uploaded') return res.status(400).json({ error: `Cannot verify. Current status: ${booking.paymentStatus}` });

    const updateData: any = {
      paymentStatus,
      verifiedByUserId: organizerId,
      verifiedAt: new Date(),
    };

    if (paymentStatus === 'verified') {
      updateData.status = 'confirmed';
    } else if (paymentStatus === 'rejected' && rejectReason) {
      updateData.rejectReason = rejectReason;
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        paymentProofUrl: true,
        verifiedAt: true,
      }
    });

    // If verified, decrement seats and award points
    if (paymentStatus === 'verified') {
      await prisma.$transaction(async (tx) => {
        await tx.event.update({
          where: { id: booking.eventId },
          data: { availableSeats: { decrement: 1 } },
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
              description: `Points from verified booking #${booking.id} - ${booking.event.name}`,
            },
          });
        }
      });
    }

    res.json({ message: `Payment ${paymentStatus} successfully.`, booking: updated });
  } catch (error: any) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: 'Failed to verify payment.' });
  }
});

// GET /api/bookings/pending-verification — Organizer sees pending bookings for their events
bookingsRouter.get('/pending-verification', verifyToken, authorizeRoles('Organizer'), async (req: Request, res: Response) => {
  try {
    const organizerId = req.user?.id;
    if (!organizerId) return res.status(401).json({ error: 'Unauthorized' });

    const bookings = await prisma.booking.findMany({
      where: {
        paymentStatus: 'uploaded',
        event: { createdById: organizerId },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        event: { select: { id: true, name: true, date: true, time: true, price: true } },
        bookingItems: { include: { ticketType: true } },
      },
      orderBy: { bookedAt: 'desc' },
    });

    res.json(bookings);
  } catch (error: any) {
    console.error('Pending verification error:', error);
    res.status(500).json({ error: 'Failed to fetch pending bookings.' });
  }
});

// GET /api/bookings/my — Buyer sees their own bookings
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

    res.json(bookings);
  } catch (error: any) {
    console.error('My bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings.' });
  }
});
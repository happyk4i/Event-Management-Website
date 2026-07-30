import { prisma } from '../config/db.ts';

export async function expireOldPendingBookings(): Promise<number> {
  const cutoff = new Date(Date.now() - 30 * 60 * 1000);
  const expired = await prisma.booking.findMany({
    where: { status: 'pending', paymentStatus: 'pending', bookedAt: { lt: cutoff } },
    select: { id: true },
  });

  let count = 0;
  for (const booking of expired) {
    await prisma.$transaction(async (tx) => {
      const current = await tx.booking.findUnique({ where: { id: booking.id } });
      if (!current || current.paymentStatus !== 'pending' || current.status !== 'pending') return;

      const claimed = await tx.booking.updateMany({
        where: { id: booking.id, status: 'pending', paymentStatus: 'pending' },
        data: { status: 'cancelled', paymentStatus: 'expired' },
      });
      if (claimed.count !== 1) return;

      await tx.event.update({
        where: { id: current.eventId },
        data: { availableSeats: { increment: 1 } },
      });

      if (current.appliedPoints > 0) {
        await tx.user.update({
          where: { id: current.userId },
          data: { pointsBalance: { increment: current.appliedPoints } },
        });
        await tx.pointRecord.create({
          data: {
            userId: current.userId,
            points: current.appliedPoints,
            type: 'REFUNDED',
            description: `Refunded points from expired booking #${current.id}`,
          },
        });
      }

      const txRecord = await tx.transaction.findFirst({
        where: { eventId: current.eventId, buyerId: current.userId },
        orderBy: { createdAt: 'desc' },
      });
      if (txRecord?.couponUsedId) {
        await tx.coupon.update({ where: { id: txRecord.couponUsedId }, data: { isUsed: false } });
      }
      if (current.voucherId) {
        await tx.voucher.update({ where: { id: current.voucherId }, data: { usedCount: { decrement: 1 } } });
      }
      count += 1;
    });
  }

  return count;
}

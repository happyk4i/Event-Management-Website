import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { verifyToken } from '../auth.middleware.js';

export const transactionsRouter = Router();

// Create new booking (transaction)
transactionsRouter.post('/', verifyToken, async (req: Request, res: Response) => {
  const { eventId, buyerId, useCouponId, usePointsAmount } = req.body;

  if (!eventId || !buyerId) {
    return res.status(400).json({ error: 'Event ID and Buyer ID are required.' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event) throw new Error('Event not found.');
      if (event.availableSeats <= 0) throw new Error('This event is sold out.');

      const buyer = await tx.user.findUnique({ where: { id: buyerId } });
      if (!buyer) throw new Error('Buyer not found.');

      let finalPrice = event.price;
      let pointsDeducted = 0;
      let couponUsed = null;

      if (useCouponId) {
        const coupon = await tx.coupon.findUnique({ where: { id: useCouponId } });
        if (coupon && !coupon.isUsed && coupon.minPurchase <= finalPrice) {
          finalPrice -= coupon.discountAmount;
          finalPrice = Math.max(0, finalPrice);
          couponUsed = coupon;
        } else if (!coupon) {
          throw new Error('Coupon not found.');
        } else if (coupon.isUsed) {
          throw new Error('Coupon already used.');
        } else if (coupon.minPurchase > finalPrice) {
          throw new Error(`Coupon minimum purchase of Rp${coupon.minPurchase} not met.`);
        }
      }

      if (usePointsAmount && usePointsAmount > 0) {
        if (buyer.pointsBalance >= usePointsAmount) {
          pointsDeducted = usePointsAmount;
          finalPrice -= pointsDeducted * 100;
          finalPrice = Math.max(0, finalPrice);
        } else {
          throw new Error('Insufficient points balance.');
        }
      }

      if (couponUsed) {
        await tx.coupon.update({
          where: { id: couponUsed.id },
          data: { isUsed: true },
        });
      }

      if (pointsDeducted > 0) {
        await tx.user.update({
          where: { id: buyerId },
          data: { pointsBalance: { decrement: pointsDeducted } },
        });
        await tx.pointRecord.create({
          data: {
            userId: buyerId,
            points: -pointsDeducted,
            type: 'USED',
            description: `Used points for ${event.name} ticket purchase`,
          },
        });
      }

      // Create Booking with paymentPending status
      const booking = await tx.booking.create({
        data: {
          eventId,
          userId: buyerId,
          totalPrice: finalPrice,
          status: 'pending',
          paymentStatus: 'pending',
          appliedPoints: pointsDeducted || 0,
        },
      });

      // Also create legacy transaction record
      await tx.transaction.create({
        data: {
          eventId,
          buyerId,
          pricePaid: finalPrice,
          pointsUsed: pointsDeducted,
          couponUsedId: couponUsed ? couponUsed.id : null,
        },
      });

      // Reward points (will be applied after payment verification)
      return { booking, finalPrice };
    });

    res.status(201).json({
      message: 'Booking created. Please upload payment proof for verification.',
      booking: result.booking,
      summary: {
        originalAmount: result.finalPrice + (result.finalPrice > 0 ? 0 : 0),
        finalAmount: result.finalPrice,
      },
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Transaction failed.' });
  }
});

// GET transactions. Customers may read only their own history; organizers and admins may read all.
transactionsRouter.get('/', verifyToken, async (req: Request, res: Response) => {
  const requestedBuyerId = typeof req.query.buyerId === 'string' ? req.query.buyerId : undefined;
  const canReadAll = req.user?.role === 'Admin' || req.user?.role === 'Organizer';
  const buyerId = canReadAll ? requestedBuyerId : req.user?.id;

  if (!canReadAll && requestedBuyerId && requestedBuyerId !== req.user?.id) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  try {
    const transactions = buyerId
      ? await prisma.transaction.findMany({
          where: { buyerId },
          include: { event: true },
        })
      : await prisma.transaction.findMany({
          include: { event: true, buyer: { select: { id: true, name: true, email: true } } },
        });

    res.json(transactions);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve transactions.' });
  }
});

// GET transaction by ID
transactionsRouter.get('/:id', verifyToken, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: { event: true, buyer: { select: { id: true, name: true, email: true } } },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    if (req.user?.id !== transaction.buyerId && req.user?.role !== 'Admin' && req.user?.role !== 'Organizer') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    res.json(transaction);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve transaction.' });
  }
});
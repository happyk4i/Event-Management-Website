
import { Router, Request, Response } from 'express';
import { prisma } from '../config/db.ts';
import { verifyToken } from '../middlewares/auth.middleware.ts';

export const transactionsRouter = Router();


transactionsRouter.post('/', verifyToken, async (req: Request, res: Response) => {
  const { eventId, buyerId, quantity: rawQty, useCouponId, usePointsAmount } = req.body;
  const quantity = Math.max(1, Math.min(Number(rawQty) || 1, 100));

  if (!eventId || !buyerId) {
    return res.status(400).json({ error: 'Event ID and Buyer ID are required.' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event) throw new Error('Event not found.');
      if (event.availableSeats < quantity) throw new Error(`Only ${event.availableSeats} seats available.`);

      const buyer = await tx.user.findUnique({ where: { id: buyerId } });
      if (!buyer) throw new Error('Buyer not found.');

      let finalPrice = event.price * quantity;
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


      await tx.event.update({
              where: { id: eventId },
              data: { availableSeats: { decrement: quantity } },
            });


      const isFree = finalPrice <= 0;


      const booking = await tx.booking.create({
              data: {
                eventId,
                userId: buyerId,
                totalPrice: finalPrice,
                status: isFree ? 'confirmed' : 'pending',
                paymentStatus: isFree ? 'waived' : 'pending',
                appliedPoints: pointsDeducted || 0,
              },
            });

            // Create BookingItem with quantity
            const ticketType = await tx.ticketType.findFirst({ where: { eventId } });
            if (ticketType) {
              const pricePerItem = quantity > 0 ? finalPrice / quantity : 0;
              await tx.bookingItem.create({
                data: {
                  bookingId: booking.id,
                  ticketTypeId: ticketType.id,
                  quantity,
                  pricePerItem,
                  subtotal: finalPrice,
                },
              });
            }

            await tx.transaction.create({
        data: {
          eventId,
          buyerId,
          pricePaid: finalPrice,
          pointsUsed: pointsDeducted,
          couponUsedId: couponUsed ? couponUsed.id : null,
        },
      });


      if (isFree) {
        const pointsEarned = Math.floor(Number(finalPrice) / 1000);

      }

      return { booking, finalPrice, isFree, pointsDeducted, couponDiscount: couponUsed ? couponUsed.discountAmount : 0 };
    });

    res.status(201).json({
      message: result.isFree ? 'Booking confirmed successfully!' : 'Booking created. Please upload payment proof for verification.',
      booking: result.booking,
      summary: {
        originalAmount: result.finalPrice + result.pointsDeducted * 100 + result.couponDiscount,
        finalAmount: result.finalPrice,
      },
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Transaction failed.' });
  }
});


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
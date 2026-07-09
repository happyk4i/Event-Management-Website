import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';

export const transactionsRouter = Router();

// Purchase/Book ticket route
transactionsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { eventId, buyerId, useCouponId, usePointsAmount } = req.body;

    if (!eventId || !buyerId) {
      res.status(400).json({ error: 'Event ID and Buyer ID are required to complete transaction.' });
      return;
    }

    // 1. Fetch user & event
    const buyer = await prisma.user.findUnique({ where: { id: buyerId } });
    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!buyer) {
      res.status(404).json({ error: 'Purchasing user account was not found.' });
      return;
    }

    if (!event) {
      res.status(404).json({ error: 'The requested event is not found.' });
      return;
    }

    if (event.status === 'Draft' || event.status === 'Archived') {
      res.status(400).json({ error: 'This event is currently unavailable for bookings.' });
      return;
    }

    if (event.availableSeats <= 0) {
      res.status(400).json({ error: 'This event is fully booked! Tickets are sold out.' });
      return;
    }

    // 2. Pricing calculations (all in IDR)
    let originalPrice = event.price;
    let discountApplied = 0;
    let pointsDeducted = 0;
    let couponUsed = false;

    // Check date-based promo discount (early-bird discount)
    // If the event date is > 30 days away, give 5% early-bird discount automatically
    const eventDate = new Date(event.date);
    const currentDate = new Date();
    const daysUntilEvent = (eventDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24);
    if (daysUntilEvent > 30 && originalPrice > 0) {
      const earlyBirdDiscount = originalPrice * 0.05; // 5% discount
      discountApplied += earlyBirdDiscount;
    }

    // 3. Apply 10% Referral Discount Coupon if selected
    if (useCouponId) {
      const coupon = await prisma.coupon.findFirst({
        where: {
          id: useCouponId,
          userId: buyerId,
          isUsed: false,
          expiryDate: { gte: currentDate.toISOString().split('T')[0] }
        }
      });

      if (coupon) {
        const couponDiscount = (originalPrice - discountApplied) * coupon.discount;
        discountApplied += couponDiscount;
        couponUsed = true;
        
        // Mark coupon as used
        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { isUsed: true }
        });
      } else {
        res.status(400).json({ error: 'The selected 10% discount coupon is invalid or expired.' });
        return;
      }
    }

    // 4. Redeem referral points (1 point = 1 IDR reduction)
    const currentPriceAfterDiscount = originalPrice - discountApplied;
    if (usePointsAmount && usePointsAmount > 0 && currentPriceAfterDiscount > 0) {
      // Re-verify user's points balance from active non-expired records
      const todayStr = currentDate.toISOString().split('T')[0];
      const activePointRecords = await prisma.pointRecord.findMany({
        where: {
          userId: buyerId,
          isUsed: false,
          expiryDate: { gte: todayStr }
        },
        orderBy: { expiryDate: 'asc' } // Consume oldest expiring points first
      });

      const totalActivePoints = activePointRecords.reduce((sum: number, r: typeof activePointRecords[number]) => sum + r.amount, 0);
      const pointsToRedeem = Math.min(usePointsAmount, totalActivePoints, currentPriceAfterDiscount);

      if (pointsToRedeem > 0) {
        let remainingPointsToDeduct = pointsToRedeem;
        pointsDeducted = pointsToRedeem;
        discountApplied += pointsToRedeem;

        // Consume active point records step by step
        for (const record of activePointRecords) {
          if (remainingPointsToDeduct <= 0) break;

          if (record.amount <= remainingPointsToDeduct) {
            remainingPointsToDeduct -= record.amount;
            await prisma.pointRecord.update({
              where: { id: record.id },
              data: { isUsed: true, amount: 0 }
            });
          } else {
            const leftover = record.amount - remainingPointsToDeduct;
            remainingPointsToDeduct = 0;
            await prisma.pointRecord.update({
              where: { id: record.id },
              data: { amount: leftover }
            });
          }
        }

        // Sync buyer's profile total points balance
        await prisma.user.update({
          where: { id: buyerId },
          data: {
            pointsBalance: {
              decrement: pointsToRedeem
            }
          }
        });
      }
    }

    const finalPrice = Math.max(0, originalPrice - discountApplied);

    // 5. Create Transaction Record
    const transaction = await prisma.transaction.create({
      data: {
        eventId: event.id,
        eventName: event.name,
        buyerId: buyer.id,
        buyerName: buyer.name,
        originalPrice,
        discountApplied,
        finalPrice,
        pointsUsed: pointsDeducted,
        couponUsed,
        purchaseDate: currentDate.toISOString().split('T')[0]
      }
    });

    // 6. Update Available seats & status
    const remainingSeats = event.availableSeats - 1;
    await prisma.event.update({
      where: { id: event.id },
      data: {
        availableSeats: remainingSeats,
        status: remainingSeats === 0 ? 'Sold Out' : event.status
      }
    });

    res.status(201).json({
      success: true,
      message: 'Ticket purchased successfully!',
      transaction
    });
  } catch (error: any) {
    console.error('Error handling checkout transaction:', error);
    res.status(500).json({ error: 'Failed to complete checkout transaction.', details: error.message });
  }
});

// GET all completed transaction listings (for monitoring/reporting)
transactionsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { buyerId } = req.query;
    const whereClause: any = {};
    if (buyerId) {
      whereClause.buyerId = String(buyerId);
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    res.json(transactions);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch transaction logs.' });
  }
});

// GET statistics for organizer dashboard
// Handles reporting with filters: per day, per month, per year
transactionsRouter.get('/organizer/stats', async (req: Request, res: Response) => {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { purchaseDate: 'asc' }
    });

    const events = await prisma.event.findMany();

    // 1. Calculate general stats
    const totalSalesRevenue = transactions.reduce((sum: any, t: { finalPrice: any; }) => sum + t.finalPrice, 0);
    const ticketsSold = transactions.length;
    const activeEventsCount = events.filter((e: { status: string; }) => e.status === 'Active').length;

    // 2. Generate Daily Report
    const dailyData: { [date: string]: { revenue: number; tickets: number } } = {};
    // 3. Generate Monthly Report
    const monthlyData: { [month: string]: { revenue: number; tickets: number } } = {};
    // 4. Generate Yearly Report
    const yearlyData: { [year: string]: { revenue: number; tickets: number } } = {};

    transactions.forEach((t: { purchaseDate: any; finalPrice: number; }) => {
      const date = t.purchaseDate; // YYYY-MM-DD
      const month = date.slice(0, 7); // YYYY-MM
      const year = date.slice(0, 4); // YYYY

      // Daily
      if (!dailyData[date]) dailyData[date] = { revenue: 0, tickets: 0 };
      dailyData[date].revenue += t.finalPrice;
      dailyData[date].tickets += 1;

      // Monthly
      if (!monthlyData[month]) monthlyData[month] = { revenue: 0, tickets: 0 };
      monthlyData[month].revenue += t.finalPrice;
      monthlyData[month].tickets += 1;

      // Yearly
      if (!yearlyData[year]) yearlyData[year] = { revenue: 0, tickets: 0 };
      yearlyData[year].revenue += t.finalPrice;
      yearlyData[year].tickets += 1;
    });

    // Format for charts (e.g. Recharts)
    const dailyReport = Object.keys(dailyData).map(k => ({
      name: k,
      revenue: dailyData[k].revenue,
      tickets: dailyData[k].tickets
    })).slice(-15); // limit to last 15 days

    const monthlyReport = Object.keys(monthlyData).map(k => ({
      name: k,
      revenue: monthlyData[k].revenue,
      tickets: monthlyData[k].tickets
    }));

    const yearlyReport = Object.keys(yearlyData).map(k => ({
      name: k,
      revenue: yearlyData[k].revenue,
      tickets: yearlyData[k].tickets
    }));

    // 5. Category-wise distribution
    const categoryDistribution: { [cat: string]: number } = {};
    events.forEach((e: { category: string | number; }) => {
      categoryDistribution[e.category] = (categoryDistribution[e.category] || 0) + 1;
    });

    const categoryReport = Object.keys(categoryDistribution).map(cat => ({
      name: cat,
      value: categoryDistribution[cat]
    }));

    res.json({
      summary: {
        totalSalesRevenue,
        ticketsSold,
        activeEventsCount
      },
      reports: {
        daily: dailyReport,
        monthly: monthlyReport,
        yearly: yearlyReport,
        category: categoryReport
      }
    });

  } catch (error: any) {
    console.error('Error calculating dashboard statistics:', error);
    res.status(500).json({ error: 'Failed to build organizer statistics.' });
  }
});

import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { verifyToken } from '../auth.middleware.js';

export const reviewsRouter = Router();

// Create Review Route
reviewsRouter.post('/', verifyToken, async (req: Request, res: Response) => {
  try {
    const { eventId, rating, feedback } = req.body;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Get user's name from database
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const userName = user.name;

    if (!eventId || rating === undefined || !feedback) {
      return res.status(400).json({ error: 'Event ID, rating, and feedback are required.' });
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
    }

    // Verify booking exists so only genuine attendees can rate
    const hasBooking = await prisma.booking.findFirst({
      where: {
        eventId,
        userId,
        status: 'confirmed'
      }
    });

    if (!hasBooking) {
      return res.status(403).json({ error: 'Only confirmed attendees who have booked a ticket can submit reviews.' });
    }

    // Check if user already reviewed this event
    const existingReview = await prisma.review.findFirst({
      where: { eventId, userId }
    });

    if (existingReview) {
      return res.status(409).json({ error: 'You have already submitted a review for this event.' });
    }

    const review = await prisma.review.create({
      data: {
        eventId,
        userId,
        rating: numericRating,
        feedback: feedback.trim()
      }
    });

    res.status(201).json({
      success: true,
      message: 'Thank you! Your feedback has been registered.',
      review
    });
  } catch (error: any) {
    console.error('Error in review creation:', error);
    res.status(500).json({ error: 'Failed to record your review.', details: error.message });
  }
});

// Fetch Reviews for an Event
reviewsRouter.get('/event/:eventId', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { eventId },
      include: {
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Compute metrics
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
      : 0;

    res.json({
      reviews,
      stats: {
        totalReviews,
        averageRating
      }
    });
  } catch (error: any) {
    console.error('Error fetching event reviews:', error);
    res.status(500).json({ error: 'Failed to retrieve reviews.', details: error.message });
  }
});

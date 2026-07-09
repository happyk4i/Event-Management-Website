import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';

export const reviewsRouter = Router();

// Create Review Route
reviewsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { eventId, userId, userName, rating, feedback } = req.body;

    if (!eventId || !userId || !userName || rating === undefined || !feedback) {
      res.status(400).json({ error: 'All fields (eventId, userId, userName, rating, feedback) are required.' });
      return;
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
      return;
    }

    // Verify transaction exists so only genuine attendees can rate
    const hasTicket = await prisma.transaction.findFirst({
      where: {
        eventId,
        buyerId: userId
      }
    });

    if (!hasTicket) {
      res.status(403).json({ error: 'Only attendees who have purchased a ticket can submit reviews.' });
      return;
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        eventId,
        userId,
        userName,
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
    res.status(500).json({ error: 'Failed to record your review.' });
  }
});

// Fetch Reviews for an Event
reviewsRouter.get('/event/:eventId', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' }
    });

    // Compute metrics
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? Number((reviews.reduce((sum: any, r: { rating: any; }) => sum + r.rating, 0) / totalReviews).toFixed(1))
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
    res.status(500).json({ error: 'Failed to retrieve reviews.' });
  }
});

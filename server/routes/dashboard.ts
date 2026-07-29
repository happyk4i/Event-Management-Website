import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { verifyToken, authorizeRoles, AuthenticatedUser } from '../auth.middleware.js';

export const dashboardRouter = Router();

// Get organizer statistics
dashboardRouter.get('/stats/:organizerId', verifyToken, authorizeRoles('Organizer'), async (req: Request, res: Response) => {
  try {
    const { organizerId } = req.params;
    const currentUser = (req as any).user as AuthenticatedUser | undefined;

    // Security check: prevent unauthorized access
    if (currentUser?.id !== organizerId) {
      return res.status(403).json({ error: 'Access denied. You cannot view this dashboard.' });
    }

    // Get all events created by this organizer
    const organizerEvents = await prisma.event.findMany({
      where: { createdById: organizerId },
      include: {
        bookings: {
          where: { status: 'confirmed' },
          include: {
            bookingItems: { include: { ticketType: true } }
          }
        }
      }
    });

    let totalEvents = organizerEvents.length;
    let totalTicketsSold = 0;
    let totalRevenue = 0;
    const monthlyDataMap: { [key: string]: number } = {};

    organizerEvents.forEach(event => {
      const ticketsFromCapacity = event.capacity - event.availableSeats;
      if (ticketsFromCapacity > 0) {
        totalTicketsSold += ticketsFromCapacity;
      }

      event.bookings.forEach(booking => {
        totalRevenue += Number(booking.totalPrice);

        const yearMonth = new Date(booking.bookedAt).toISOString().substring(0, 7);
        monthlyDataMap[yearMonth] = (monthlyDataMap[yearMonth] || 0) + Number(booking.totalPrice);
      });
    });

    const chartData = Object.keys(monthlyDataMap)
      .sort()
      .map(monthStr => ({
        month: monthStr,
        revenue: monthlyDataMap[monthStr]
      }));

    res.json({
      success: true,
      summary: {
        totalEvents,
        totalTicketsSold,
        totalRevenue
      },
      chartData
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to load dashboard stats', details: error.message });
  }
});

// Get user bookings
dashboardRouter.get('/bookings/:userId', verifyToken, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUser = (req as any).user as AuthenticatedUser | undefined;

    if (currentUser?.id !== userId && currentUser?.role !== 'Organizer') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        event: true,
        bookingItems: { include: { ticketType: true } },
        voucher: true
      },
      orderBy: { bookedAt: 'desc' }
    });

    res.json(bookings);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get event bookings (for organizers)
dashboardRouter.get('/event-bookings/:eventId', verifyToken, authorizeRoles('Organizer'), async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const currentUser = (req as any).user as AuthenticatedUser | undefined;

    // Verify event belongs to this organizer
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { createdById: true }
    });

    if (!event || event.createdById !== currentUser?.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const bookings = await prisma.booking.findMany({
      where: { eventId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        bookingItems: { include: { ticketType: true } },
        voucher: true
      },
      orderBy: { bookedAt: 'desc' }
    });

    res.json(bookings);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch event bookings' });
  }
});
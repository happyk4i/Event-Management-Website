import { Router, Request, Response } from 'express';
import { prisma } from '../config/db.ts';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.ts';
import { uploadImage, deleteImage } from '../utils/cloudinary.js';

export const eventsRouter = Router();

const formatDate = (date: Date) => date.toISOString().split('T')[0];

eventsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { search, category, status, location, page, limit } = req.query;

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: String(search), mode: 'insensitive' as const } },
        { code: { contains: String(search), mode: 'insensitive' as const } },
        { location: { contains: String(search), mode: 'insensitive' as const } },
        { description: { contains: String(search), mode: 'insensitive' as const } }
      ];
    }

    if (category && category !== 'All') {
      whereClause.category = String(category);
    }

    if (status && status !== 'All') {
      whereClause.status = String(status);
    }

    if (location && location !== 'All' && String(location).trim() !== '') {
      whereClause.location = { contains: String(location).trim(), mode: 'insensitive' as const };
    }

    const pageNum = page ? parseInt(String(page), 10) : 1;
    const limitNum = limit ? parseInt(String(limit), 10) : 6;
    const skip = (pageNum - 1) * limitNum;

    const totalCount = await prisma.event.count({ where: whereClause });
    const events = await prisma.event.findMany({
      where: whereClause,
      orderBy: { date: 'asc' },
      skip,
      take: limitNum,
      include: { ticketTypes: true }
    });

    const formattedEvents = events.map(event => ({
      ...event,
      date: formatDate(event.date),
      ticketTypes: event.ticketTypes.map(tt => ({
        ...tt,
        price: Number(tt.price)
      }))
    }));

    res.json({
      events: formattedEvents,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
      currentPage: pageNum,
      limit: limitNum
    });
  } catch (error: any) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

eventsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        ticketTypes: true,
        reviews: {
          include: { user: { select: { name: true } } },
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const formattedEvent = {
      ...event,
      date: formatDate(event.date),
      ticketTypes: event.ticketTypes.map(tt => ({
        ...tt,
        price: Number(tt.price)
      }))
    };

    res.json(formattedEvent);
  } catch (error: any) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

eventsRouter.post('/', verifyToken, async (req: Request, res: Response) => {
  try {
    const { name, code, category, price, capacity, availableSeats, date, time, location, description, status, ticketTypes } = req.body;
    const createdById = req.user?.id;

    if (!name || !code || !category || price === undefined || capacity === undefined || !date || !location || !status || !createdById) {
      res.status(400).json({ error: 'All required fields (name, code, category, price, capacity, date, location, status, createdById) are missing.' });
      return;
    }

    const eventPrice = parseFloat(String(price));
    const eventCapacity = parseInt(String(capacity), 10);
    const eventAvailableSeats = availableSeats !== undefined ? parseInt(String(availableSeats), 10) : eventCapacity;

    if (isNaN(eventPrice) || eventPrice < 0 || isNaN(eventCapacity) || eventCapacity <= 0) {
      res.status(400).json({ error: 'Invalid price or capacity.' });
      return;
    }

    if (isNaN(eventAvailableSeats) || eventAvailableSeats < 0 || eventAvailableSeats > eventCapacity) {
      res.status(400).json({ error: 'Invalid available seats.' });
      return;
    }

    const existingEvent = await prisma.event.findUnique({
      where: { code: String(code).toUpperCase() }
    });

    if (existingEvent) {
      res.status(400).json({ error: `Event with code '${code}' already exists.` });
      return;
    }

    const newEvent = await prisma.event.create({
      data: {
        name,
        code: String(code).toUpperCase(),
        category,
        price: eventPrice,
        capacity: eventCapacity,
        availableSeats: eventAvailableSeats,
        date: new Date(date),
        time: time || '19:00',
        location,
        description: description || '',
        status,
        createdById: createdById,
        ...(Array.isArray(ticketTypes) && ticketTypes.length > 0 ? {
          ticketTypes: {
            create: ticketTypes.map((tt) => ({
              name: tt.name,
              price: parseFloat(String(tt.price)),
              capacity: parseInt(String(tt.capacity), 10),
              description: tt.description || ''
            }))
          }
        } : {})
      },
      include: { ticketTypes: true }
    });

    res.status(201).json(newEvent);
  } catch (error: any) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

eventsRouter.put('/:id', verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, code, category, price, capacity, availableSeats, date, time, location, description, status, createdById, ticketTypes } = req.body;

    if (!name || !code || !category || price === undefined || capacity === undefined || !date || !location || !status || !createdById) {
      res.status(400).json({ error: 'All required fields are missing for update.' });
      return;
    }

    const eventPrice = parseFloat(String(price));
    const eventCapacity = parseInt(String(capacity), 10);
    const eventAvailableSeats = availableSeats !== undefined ? parseInt(String(availableSeats), 10) : eventCapacity;

    if (isNaN(eventPrice) || eventPrice < 0 || isNaN(eventCapacity) || eventCapacity <= 0) {
      res.status(400).json({ error: 'Invalid price or capacity.' });
      return;
    }

    if (isNaN(eventAvailableSeats) || eventAvailableSeats < 0 || eventAvailableSeats > eventCapacity) {
      res.status(400).json({ error: 'Invalid available seats.' });
      return;
    }

    const currentEvent = await prisma.event.findUnique({
      where: { id }
    });

    if (!currentEvent) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }

    const normalizedCode = String(code).toUpperCase();
    if (normalizedCode !== currentEvent.code) {
      const codeCollision = await prisma.event.findUnique({
        where: { code: normalizedCode }
      });
      if (codeCollision) {
        res.status(400).json({ error: `Event code '${code}' is already taken by another event.` });
        return;
      }
    }

    await prisma.ticketType.deleteMany({ where: { eventId: id } });

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        name,
        code: normalizedCode,
        category,
        price: eventPrice,
        capacity: eventCapacity,
        availableSeats: eventAvailableSeats,
        date: new Date(date),
        time: time || '19:00',
        location,
        description: description || '',
        status,
        createdById: createdById,
        ticketTypes: {
          create: ticketTypes.map((tt: any) => ({
            name: tt.name,
            price: parseFloat(String(tt.price)),
            capacity: parseInt(String(tt.capacity), 10),
            description: tt.description || ''
          }))
        }
      },
      include: { ticketTypes: true }
    });

    res.json(updatedEvent);
  } catch (error: any) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

eventsRouter.delete('/:id', verifyToken, authorizeRoles('Admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const event = await prisma.event.findUnique({
      where: { id }
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    // Delete Cloudinary image
    if (event.imagePublicId) {
      await deleteImage(event.imagePublicId).catch(() => { });
    }

    await prisma.bookingItem.deleteMany({ where: { booking: { eventId: id } } });
    await prisma.booking.deleteMany({ where: { eventId: id } });
    await prisma.review.deleteMany({ where: { eventId: id } });
    await prisma.ticketType.deleteMany({ where: { eventId: id } });

    await prisma.event.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// POST /api/events/seed - Seed 30 events with images
eventsRouter.post('/seed', verifyToken, async (req: Request, res: Response) => {
  try {
    const { count = 30 } = req.body;
    const eventsToSeed = Math.min(Number(count), 100);

    console.log(`🌱 Starting seed process for ${eventsToSeed} events...`);

    const CATEGORIES = [
      'Music',
      'Technology',
      'Arts & Crafts',
      'Food & Culinary',
      'Workshop',
      'Sports',
    ];

    const eventsData = Array.from({ length: eventsToSeed }, (_, i) => {
      const monthsAhead = Math.floor(i / 3) + 1;
      const date = new Date();
      date.setMonth(date.getMonth() + monthsAhead);
      date.setDate(Math.floor(Math.random() * 28) + 1);

      const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
      const price = [0, 0, 0, 50000, 100000, 150000, 200000, 500000][Math.floor(Math.random() * 8)];
      const capacity = [100, 200, 500, 1000, 2000][Math.floor(Math.random() * 5)];

      return {
        name: `Event ${i + 1}`,
        code: `EV-${i + 100}`,
        category,
        description: `Exciting ${category.toLowerCase()} event in Indonesia. Book early for amazing experiences!`,
        price,
        capacity,
        availableSeats: capacity,
        date,
        time: '19:00',
        location: ['Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Denpasar'][Math.floor(Math.random() * 5)],
        status: 'Active',
        imageUrl: '',
        imagePublicId: '',
      };
    });

    let uploaded = 0;
    let created = 0;

    for (let i = 0; i < eventsData.length; i++) {
      const event = eventsData[i];
      try {
        const imageUrl = `https://picsum.photos/seed/${event.code}/800/400`;
        const response = await fetch(imageUrl);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadResult = await uploadImage(
          buffer,
          'eventkuy/event-images',
          response.headers.get('content-type') || 'image/jpeg'
        );

        event.imageUrl = uploadResult.url;
        event.imagePublicId = uploadResult.publicId;
        uploaded++;
      } catch (uploadError: any) {
        console.error(`  ❌ Event ${i + 1} failed to upload image:`, uploadError.message);
      }
    }

    for (let i = 0; i < eventsData.length; i++) {
      const event = eventsData[i];
      try {
        await prisma.event.create({
          data: {
            name: event.name,
            code: event.code,
            category: event.category,
            description: event.description,
            price: event.price,
            capacity: event.capacity,
            availableSeats: event.availableSeats,
            date: event.date,
            time: event.time,
            location: event.location,
            status: event.status,
            imageUrl: event.imageUrl,
            imagePublicId: event.imagePublicId,
            createdById: 'cms8mqnrl00002kbwezae2t5n', // Admin ID
            ticketTypes: {
              create: [{
                name: 'VIP Access',
                price: event.price === 0 ? 0 : event.price * 1.5,
                capacity: event.availableSeats,
                description: 'Early access and exclusive seating',
              }],
            },
          }
        });
        created++;
      } catch (createError: any) {
        console.error(`  ❌ Event ${i + 1} failed to create:`, createError.message);
      }
    }

    res.json({
      success: true,
      message: `Successfully seeded ${created} events with ${uploaded} images.`,
      stats: { uploaded, created, total: eventsToSeed },
    });
  } catch (error: any) {
    console.error('❌ Error during seed:', error);
    res.status(500).json({ error: error.message || 'Seed failed.' });
  }
});

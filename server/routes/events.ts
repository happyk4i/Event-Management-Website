import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';

export const eventsRouter = Router();

// GET all events with filtering, search, location and pagination
eventsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { search, category, status, location, page, limit } = req.query;

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: String(search) } },
        { code: { contains: String(search) } },
        { location: { contains: String(search) } },
        { description: { contains: String(search) } }
      ];
    }

    if (category && category !== 'All') {
      whereClause.category = String(category);
    }

    if (status && status !== 'All') {
      whereClause.status = String(status);
    }

    if (location && location !== 'All' && String(location).trim() !== '') {
      whereClause.location = { contains: String(location).trim() };
    }

    // Pagination logic
    const pageNum = page ? parseInt(String(page), 10) : 1;
    const limitNum = limit ? parseInt(String(limit), 10) : 6;
    const skip = (pageNum - 1) * limitNum;

    const totalCount = await prisma.event.count({ where: whereClause });
    const events = await prisma.event.findMany({
      where: whereClause,
      orderBy: { date: 'asc' },
      skip,
      take: limitNum
    });

    res.json({
      events,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
      currentPage: pageNum,
      limit: limitNum
    });
  } catch (error: any) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events', details: error.message });
  }
});

// GET single event
eventsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const event = await prisma.event.findUnique({
      where: { id }
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    res.json(event);
  } catch (error: any) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// POST create event
eventsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { name, code, category, price, capacity, availableSeats, date, time, location, description, status, organizerId } = req.body;

    // Basic Validation
    if (!name || !code || !category || price === undefined || capacity === undefined || !date || !location || !status) {
      res.status(400).json({ error: 'All fields (name, code, category, price, capacity, date, location, status) are required.' });
      return;
    }

    if (isNaN(Number(price)) || Number(price) < 0) {
      res.status(400).json({ error: 'Ticket price must be a valid non-negative number.' });
      return;
    }

    if (isNaN(Number(capacity)) || Number(capacity) <= 0 || !Number.isInteger(Number(capacity))) {
      res.status(400).json({ error: 'Total capacity must be a valid positive integer.' });
      return;
    }

    const remainingSeats = availableSeats !== undefined ? Number(availableSeats) : Number(capacity);
    if (isNaN(remainingSeats) || remainingSeats < 0 || remainingSeats > Number(capacity)) {
      res.status(400).json({ error: 'Available seats must be a non-negative integer less than or equal to total capacity.' });
      return;
    }

    // Check if Code already exists (analogous to SKU)
    const existingEvent = await prisma.event.findUnique({
      where: { code: String(code).toUpperCase() }
    });

    if (existingEvent) {
      res.status(400).json({ error: `An event with Code '${code}' already exists.` });
      return;
    }

    const event = await prisma.event.create({
      data: {
        name,
        code: String(code).toUpperCase(),
        category,
        price: parseFloat(price),
        capacity: parseInt(capacity, 10),
        availableSeats: parseInt(String(remainingSeats), 10),
        date,
        time: time || '19:00',
        location,
        description: description || '',
        status,
        organizerId: organizerId || null
      }
    });

    res.status(201).json(event);
  } catch (error: any) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event', details: error.message });
  }
});

// PUT update event
eventsRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, code, category, price, capacity, availableSeats, date, time, location, description, status, organizerId } = req.body;

    if (!name || !code || !category || price === undefined || capacity === undefined || !date || !location || !status) {
      res.status(400).json({ error: 'All fields are required for update.' });
      return;
    }

    if (isNaN(Number(price)) || Number(price) < 0) {
      res.status(400).json({ error: 'Ticket price must be a non-negative number.' });
      return;
    }

    if (isNaN(Number(capacity)) || Number(capacity) <= 0 || !Number.isInteger(Number(capacity))) {
      res.status(400).json({ error: 'Total capacity must be a positive integer.' });
      return;
    }

    const remainingSeats = availableSeats !== undefined ? Number(availableSeats) : Number(capacity);
    if (isNaN(remainingSeats) || remainingSeats < 0 || remainingSeats > Number(capacity)) {
      res.status(400).json({ error: 'Available seats must be a non-negative integer less than or equal to total capacity.' });
      return;
    }

    // Check if the event exists
    const currentEvent = await prisma.event.findUnique({
      where: { id }
    });

    if (!currentEvent) {
      res.status(404).json({ error: 'Event to update was not found.' });
      return;
    }

    // Check if Code is changed and already exists on another event
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

    const event = await prisma.event.update({
      where: { id },
      data: {
        name,
        code: normalizedCode,
        category,
        price: parseFloat(price),
        capacity: parseInt(capacity, 10),
        availableSeats: parseInt(String(remainingSeats), 10),
        date,
        time: time || '19:00',
        location,
        description: description || '',
        status,
        organizerId: organizerId || null
      }
    });

    res.json(event);
  } catch (error: any) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event', details: error.message });
  }
});

// DELETE event
eventsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check existence
    const event = await prisma.event.findUnique({
      where: { id }
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    await prisma.event.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event', details: error.message });
  }
});

// POST seed initial mock event data
eventsRouter.post('/seed', async (req: Request, res: Response) => {
  try {
    const count = await prisma.event.count();
    if (count > 0) {
      res.json({ message: 'Database already has records, seeding skipped.', count });
      return;
    }

    const seedEvents = [
      { name: 'Jakarta Jazz Festival 2026', code: 'JAZZ-JKT-2026', category: 'Music', price: 450000, capacity: 5000, availableSeats: 4850, date: '2026-09-12', time: '17:00', location: 'JIExpo Kemayoran, Jakarta', description: 'Experience the ultimate jazz gathering featuring world-class local and international jazz acts across multiple stages.', status: 'Active' },
      { name: 'Bali Art & Pottery Workshop', code: 'ART-BALI-002', category: 'Arts & Crafts', price: 150000, capacity: 30, availableSeats: 12, date: '2026-07-28', time: '10:00', location: 'Ubud Creative Hub, Bali', description: 'Unleash your creativity and shape beautiful clay art mentored by Ubud\'s legendary master craftsmen.', status: 'Active' },
      { name: 'Asia Pacific Developer Conference', code: 'CONF-DEV-2026', category: 'Technology', price: 950000, capacity: 1200, availableSeats: 1105, date: '2026-10-05', time: '09:00', location: 'Ritz-Carlton Mega Kuningan, JKT', description: 'Join leading cloud architects, web developers, and AI researchers to explore state-of-the-art tech frameworks.', status: 'Active' },
      { name: 'Indonesian Culinary Festival', code: 'FOOD-RI-2026', category: 'Food & Culinary', price: 25000, capacity: 10000, availableSeats: 9800, date: '2026-08-17', time: '11:00', location: 'Gelora Bung Karno, Jakarta', description: 'Savor traditional culinary specialties, sambals, and traditional sweet beverages from all 38 Indonesian provinces.', status: 'Active' },
      { name: 'Intimate Concert with Isyana Sarasvati', code: 'CONC-ISYANA-26', category: 'Music', price: 650000, capacity: 300, availableSeats: 0, date: '2026-08-01', time: '20:00', location: 'Nusa Indah Theatre, Jakarta', description: 'An exclusive neoclassical experience up close and personal with Indonesia\'s iconic multi-instrumentalist songstress.', status: 'Sold Out' },
      { name: 'UI/UX Design Masterclass', code: 'WORK-UIUX-05', category: 'Workshop', price: 320000, capacity: 50, availableSeats: 8, date: '2026-07-20', time: '13:00', location: 'CoHive Kuningan, Jakarta', description: 'Develop wireframing techniques, typography layout rules, and dynamic prototyping skills using industry-standard tools.', status: 'Active' },
      { name: 'Surabaya Half Marathon 2026', code: 'RUN-SUB-2026', category: 'Sports', price: 275000, capacity: 2500, availableSeats: 1200, date: '2026-11-08', time: '05:00', location: 'Bumi Surabaya, Surabaya', description: 'Race through historical routes of Surabaya in the crisp morning air with standard cheering stations and hydration support.', status: 'Active' },
      { name: 'Private Coffee Cupping Session', code: 'WORK-COF-CUP', category: 'Workshop', price: 180000, capacity: 15, availableSeats: 15, date: '2026-07-15', time: '15:00', location: 'Prism Coffee Labs, Bandung', description: 'Learn to distinguish fine specialty coffee flavor notes including acidity, body, aroma, and aftertaste.', status: 'Draft' }
    ];

    await prisma.event.createMany({
      data: seedEvents
    });

    res.json({ success: true, message: 'Database seeded successfully with premium events', count: seedEvents.length });
  } catch (error: any) {
    console.error('Error seeding database:', error);
    res.status(500).json({ error: 'Failed to seed database', details: error.message });
  }
});

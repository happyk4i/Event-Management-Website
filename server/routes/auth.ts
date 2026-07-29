import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { verifyToken } from '../auth.middleware.js';

export const authRouter = Router();

// Generate unique referral code
async function genRefCode(name: string): Promise<string> {
  let code = '';
  let ok = false;
  while (!ok) {
    const sfx = Math.floor(1000 + Math.random() * 9000);
    const cln = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
    code = `REF-${cln}-${sfx}`;
    const exists = await prisma.user.findUnique({ where: { referralCode: code } });
    if (!exists) ok = true;
  }
  return code;
}

// Register
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, referredBy } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ error: 'Name, email, password, and role are required.' });
    if (!['Customer', 'Organizer'].includes(role))
      return res.status(400).json({ error: 'Invalid role.' });

    if (await prisma.user.findUnique({ where: { email: email.toLowerCase() } }))
      return res.status(400).json({ error: 'Email already exists.' });

    const hashedPw = await bcrypt.hash(password, 10);
    const refCode = await genRefCode(name);
    const referrer = referredBy?.trim()
      ? await prisma.user.findUnique({ where: { referralCode: referredBy.trim().toUpperCase() } })
      : null;

    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password: hashedPw,
          role,
          pointsBalance: 0,
          referralCode: refCode,
        }
      });
      if (referrer) {
        await tx.pointRecord.create({ data: { userId: referrer.id, points: 10000, type: 'EARNED', description: `Referral bonus for ${u.name}` } });
        await tx.user.update({ where: { id: referrer.id }, data: { pointsBalance: { increment: 10000 } } });
      }
      return u;
    });

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name, email: user.email, pointsBalance: user.pointsBalance, referralCode: user.referralCode },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'Registration successful!',
      user: { id: user.id, name: user.name, email: user.email, role: user.role, pointsBalance: user.pointsBalance },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name, email: user.email, pointsBalance: user.pointsBalance, referralCode: user.referralCode },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Login successful!',
      user: { id: user.id, name: user.name, email: user.email, role: user.role, pointsBalance: user.pointsBalance },
      token
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Profile
authRouter.get('/profile/:userId', verifyToken, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.userId },
    select: { id: true, name: true, email: true, role: true, pointsBalance: true, referralCode: true, pointRecords: { orderBy: { createdAt: 'desc' }, take: 10 } }
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// Referral stats
authRouter.get('/referral-stats', verifyToken, async (req: Request, res: Response) => {
  const uid = req.user?.id;
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });

  const sent = await prisma.userInvitation.findMany({ where: { inviterId: uid }, select: { status: true } });
  const accepted = sent.filter(i => i.status === 'accepted' || i.status === 'completed').length;
  const completed = await prisma.booking.count({ where: { userId: uid, status: 'confirmed' } });
  const pts = await prisma.pointRecord.aggregate({ where: { userId: uid, type: 'EARNED' }, _sum: { points: true } });

  res.json({
    invitationsSent: sent.length,
    invitationsAccepted: accepted,
    invitationsPending: sent.filter(i => i.status === 'pending').length,
    completedBookings: completed,
    totalPointsEarned: pts._sum.points || 0
  });
});

// User bookings
authRouter.get('/bookings', verifyToken, async (req: Request, res: Response) => {
  const uid = req.user?.id;
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });
  const bookings = await prisma.booking.findMany({
    where: { userId: uid },
    include: { event: true, bookingItems: { include: { ticketType: true } }, voucher: true },
    orderBy: { bookedAt: 'desc' }
  });
  res.json(bookings);
});

// Points balance & history
authRouter.get('/points', verifyToken, async (req: Request, res: Response) => {
  const uid = req.user?.id;
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });
  const user = await prisma.user.findUnique({ where: { id: uid }, select: { pointsBalance: true } });
  const records = await prisma.pointRecord.findMany({ where: { userId: uid }, orderBy: { createdAt: 'desc' }, take: 20 });
  res.json({ balance: user?.pointsBalance || 0, history: records });
});

// Use points
authRouter.post('/use-points', verifyToken, async (req: Request, res: Response) => {
  const uid = req.user?.id;
  const { points, bookingId } = req.body;
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });
  if (!points || !bookingId) return res.status(400).json({ error: 'Points and booking ID required' });

  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user || user.pointsBalance < points)
    return res.status(400).json({ error: 'Insufficient points' });

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: uid }, data: { pointsBalance: { decrement: points } } });
    await tx.pointRecord.create({ data: { userId: uid, points: -points, type: 'USED', description: `Used for booking #${bookingId}` } });
  });

  res.json({ message: 'Points applied' });
});
import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';

export const authRouter = Router();

// Helper to calculate date 3 months from now (YYYY-MM-DD)
function getThreeMonthsFromNow(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 3);
  return date.toISOString().split('T')[0];
}

// Register Route
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, referredBy } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ error: 'Name, email, password, and role are required fields.' });
      return;
    }

    if (role !== 'Customer' && role !== 'Organizer') {
      res.status(400).json({ error: 'Invalid user role specified.' });
      return;
    }

    // Check email uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      res.status(400).json({ error: 'An account with this email already exists.' });
      return;
    }

    // Generate unique referral code
    let referralCode = '';
    let isCodeUnique = false;
    while (!isCodeUnique) {
      const randSuffix = Math.floor(1000 + Math.random() * 9000);
      const cleanName = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
      referralCode = `REF-${cleanName}-${randSuffix}`;
      
      const collision = await prisma.user.findUnique({ where: { referralCode } });
      if (!collision) isCodeUnique = true;
    }

    // Process Referral Code if provided
    let referrerId: string | null = null;
    let referrerName = '';
    let hasValidReferral = false;

    if (referredBy && referredBy.trim()) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: referredBy.trim().toUpperCase() }
      });

      if (referrer) {
        referrerId = referrer.id;
        referrerName = referrer.name;
        hasValidReferral = true;
      } else {
        res.status(400).json({ error: 'Invalid referral code provided.' });
        return;
      }
    }

    // Create User
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password, // In-memory/plain text for simplified preview and reliability
        role,
        referralCode,
        pointsBalance: 0
      }
    });

    // If registered with valid referral:
    if (hasValidReferral && referrerId) {
      // 1. Give referrer 10,000 points expiring in 3 months
      const expiryDate = getThreeMonthsFromNow();
      await prisma.pointRecord.create({
        data: {
          userId: referrerId,
          amount: 10000,
          source: `Referral Signup of ${newUser.name}`,
          expiryDate,
          isUsed: false
        }
      });

      // Update referrer's pointsBalance
      await prisma.user.update({
        where: { id: referrerId },
        data: {
          pointsBalance: {
            increment: 10000
          }
        }
      });

      // 2. Give new user a 10% discount coupon expiring in 3 months
      const couponCode = `WELCOME-${newUser.name.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4)}-${Math.floor(10 + Math.random() * 90)}`;
      await prisma.coupon.create({
        data: {
          userId: newUser.id,
          code: couponCode,
          discount: 0.10, // 10% discount
          expiryDate,
          isUsed: false
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully!',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        referralCode: newUser.referralCode,
        pointsBalance: newUser.pointsBalance
      }
    });
  } catch (error: any) {
    console.error('Error in register:', error);
    res.status(500).json({ error: 'Internal registration error', details: error.message });
  }
});

// Login Route
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required fields.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user || user.password !== password) {
      res.status(401).json({ error: 'Invalid email or password combination.' });
      return;
    }

    // Refresh and clean up expired points and coupons before returning balance
    const todayStr = new Date().toISOString().split('T')[0];

    // Get active (not expired, not used) points
    const activePoints = await prisma.pointRecord.findMany({
      where: {
        userId: user.id,
        isUsed: false,
        expiryDate: { gte: todayStr }
      }
    });

    const activePointsSum = activePoints.reduce((sum: any, record: { amount: any; }) => sum + record.amount, 0);

    // Sync points balance in user record
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { pointsBalance: activePointsSum }
    });

    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        referralCode: updatedUser.referralCode,
        pointsBalance: updatedUser.pointsBalance
      }
    });
  } catch (error: any) {
    console.error('Error in login:', error);
    res.status(500).json({ error: 'Internal server login error', details: error.message });
  }
});

// Get User Profile with Coupons and Points Details
authRouter.get('/profile/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    // Use a Date at midnight for comparisons
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Fetch active points records
    const pointRecords = await prisma.pointRecord.findMany({
      where: { userId }
    });

    // Check which ones are valid vs expired
    const activePoints = pointRecords.filter((r: typeof pointRecords[number]) => {
      // expiryDate is stored as a string
      return !r.isUsed && new Date(r.expiryDate) >= todayStart;
    });
    const activePointsSum = activePoints.reduce((sum: number, r: { amount: number }) => sum + r.amount, 0);

    // Sync point record balance
    if (activePointsSum !== user.pointsBalance) {
      await prisma.user.update({
        where: { id: userId },
        data: { pointsBalance: activePointsSum }
      });
      user.pointsBalance = activePointsSum;
    }

    // Fetch coupons (unexpired and unused)
    const coupons = await prisma.coupon.findMany({
      where: {
        userId,
        isUsed: false,
        // compare string date format
        expiryDate: { gte: todayStart.toISOString().split('T')[0] }
      }
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        referralCode: user.referralCode,
        pointsBalance: user.pointsBalance
      },
      pointRecords,
      coupons
    });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to retrieve profile data.' });
  }
});

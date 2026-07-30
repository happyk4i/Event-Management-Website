import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedUser {
  id: string;
  role: string;
  name: string;
  email: string;
  pointsBalance: number;
  referralCode?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required: No token provided or format is invalid.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key';

  try {
    const decoded = jwt.verify(token, jwtSecret) as AuthenticatedUser;
    
    if (!decoded.id || !decoded.role) {
      res.status(403).json({ error: 'Invalid token payload: User ID or role missing.' });
      return;
    }
    
    req.user = decoded; 
    next();
  } catch (error: any) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Authentication required: Token has expired.' });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(403).json({ error: 'Authentication failed: Invalid token.' });
    } else {
      console.error('Unexpected token verification error:', error);
      res.status(500).json({ error: 'Authentication failed: An unexpected error occurred.' });
    }
  }
};

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const currentUser = req.user;

    if (!currentUser) {
      res.status(401).json({ error: 'Authorization required: User not authenticated.' });
      return;
    }

    if (!allowedRoles.includes(currentUser.role)) {
      res.status(403).json({ error: `Access denied: Your role (${currentUser.role}) is not permitted.` });
      return;
    }

    next();
  };
};
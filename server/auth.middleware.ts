import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedUser {
  id: string;
  role: string;
}

// ─── KUNCI UTAMA: PASANG INI AGAR EXPRESS DI FILE ROUTE TAHU REQ.USER ───
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
    res.status(401).json({ error: 'Akses ditolak. Token tidak ditemukan atau format salah.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key';
    const decoded = jwt.verify(token, jwtSecret) as AuthenticatedUser;
    
    // Sekarang Anda bisa mengisi properti ini secara legal
    req.user = decoded; 
    
    next();
  } catch (error) {
    res.status(403).json({ error: 'Token tidak valid atau sudah kedaluwarsa.' });
  }
};


// Middleware Pembatas Peran (Customer / Organizer)
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const currentUser = (req as any).user;

    if (!currentUser) {
      res.status(401).json({ error: 'Tidak ada otorisasi. Silakan login terlebih dahulu.' });
      return;
    }

    if (!allowedRoles.includes(currentUser.role)) {
      res.status(403).json({ error: 'Akses terlarang. Anda tidak memiliki izin untuk rute ini.' });
      return;
    }

    next();
  };
};

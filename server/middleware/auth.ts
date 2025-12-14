import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';

export const authenticateToken = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Try to decode without verification first to check token structure
    const decoded = jwt.decode(token) as any;

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    // Handle Supabase JWT tokens (no verification of signature needed for now)
    // Supabase tokens have a 'sub' field which contains the user ID
    if (decoded.sub) {
      req.userId = decoded.sub;
      next();
      return;
    }

    // Handle custom JWT tokens with userId
    if (decoded.userId) {
      req.userId = decoded.userId;
      next();
      return;
    }

    return res.status(401).json({ error: 'Invalid token structure' });
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const authenticateAdmin = async (req: any, res: any, next: any) => {
  try {
    await authenticateToken(req, res, async () => {
      // Check admin permissions from database
      // For now, allow all authenticated users admin access
      req.adminRole = 'admin';
      req.adminPermissions = ['all'];
      next();
    });
  } catch (error) {
    logger.error('Admin authentication error:', error);
    return res.status(403).json({ error: 'Admin access denied' });
  }
};

export const requireAuth = authenticateToken;

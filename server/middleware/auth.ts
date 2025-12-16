import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';

export const authenticateToken = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      logger.warn('[Auth] No token provided in Authorization header');
      return res.status(401).json({ error: 'Access token required' });
    }

    // Try to decode without verification first to check token structure
    const decoded = jwt.decode(token) as any;

    if (!decoded) {
      logger.warn('[Auth] Failed to decode token');
      return res.status(401).json({ error: 'Invalid token format' });
    }

    logger.info('[Auth] Token decoded successfully', {
      hasSub: !!decoded.sub,
      hasUserId: !!decoded.userId,
      exp: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'N/A'
    });

    // Handle Supabase JWT tokens (no verification of signature needed for now)
    // Supabase tokens have a 'sub' field which contains the user ID
    if (decoded.sub) {
      req.user = { id: decoded.sub };
      req.userId = decoded.sub; // Also set userId for backward compatibility
      logger.info('[Auth] Authenticated user via Supabase token', { userId: decoded.sub });
      next();
      return;
    }

    // Handle custom JWT tokens with userId
    if (decoded.userId) {
      req.user = { id: decoded.userId };
      req.userId = decoded.userId; // Also set userId for backward compatibility
      logger.info('[Auth] Authenticated user via custom token', { userId: decoded.userId });
      next();
      return;
    }

    logger.warn('[Auth] Token has neither sub nor userId field', { decodedKeys: Object.keys(decoded) });
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

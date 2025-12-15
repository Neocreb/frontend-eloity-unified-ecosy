import express, { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { authenticateToken } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import { db } from '../enhanced-index.js';
import { profiles } from '../../shared/enhanced-schema.js';

const router = express.Router();

/**
 * GET /api/delivery/providers/profile
 * Get current user's delivery provider profile
 */
router.get('/providers/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has delivery provider profile
    const profileResult = await db
      .select()
      .from(profiles)
      .where(eq(profiles.user_id, userId));

    if (!profileResult || profileResult.length === 0) {
      return res.status(404).json({ error: 'Delivery provider profile not found' });
    }

    const profile = profileResult[0];
    
    // Return delivery provider information
    return res.json({
      id: profile.user_id,
      userId: profile.user_id,
      username: profile.username,
      displayName: profile.full_name,
      avatar: profile.avatar_url,
      verificationStatus: profile.is_verified ? 'verified' : 'pending',
      isDeliveryProvider: true,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at
    });
  } catch (error) {
    logger.error('Error fetching delivery provider profile:', error);
    res.status(500).json({ error: 'Failed to fetch delivery provider profile' });
  }
});

/**
 * GET /api/delivery/providers/:providerId
 * Get delivery provider profile by ID
 */
router.get('/providers/:providerId', async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;
    
    const profileResult = await db
      .select()
      .from(profiles)
      .where(eq(profiles.user_id, providerId));

    if (!profileResult || profileResult.length === 0) {
      return res.status(404).json({ error: 'Delivery provider not found' });
    }

    const profile = profileResult[0];
    
    return res.json({
      id: profile.user_id,
      userId: profile.user_id,
      username: profile.username,
      displayName: profile.full_name,
      avatar: profile.avatar_url,
      verificationStatus: profile.is_verified ? 'verified' : 'pending',
      isDeliveryProvider: true,
      location: profile.location,
      createdAt: profile.created_at
    });
  } catch (error) {
    logger.error('Error fetching delivery provider:', error);
    res.status(500).json({ error: 'Failed to fetch delivery provider' });
  }
});

/**
 * POST /api/delivery/register
 * Register user as delivery provider
 */
router.post('/register', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user already exists
    const existingProfile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.user_id, userId));

    if (existingProfile && existingProfile.length > 0) {
      return res.json({
        id: existingProfile[0].user_id,
        isDeliveryProvider: true,
        verificationStatus: existingProfile[0].is_verified ? 'verified' : 'pending'
      });
    }

    return res.status(201).json({
      message: 'Delivery provider registration initiated',
      userId,
      verificationStatus: 'pending'
    });
  } catch (error) {
    logger.error('Error registering delivery provider:', error);
    res.status(500).json({ error: 'Failed to register as delivery provider' });
  }
});

export default router;

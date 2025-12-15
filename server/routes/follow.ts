import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import { db } from '../enhanced-index.js';
import { followers, profiles } from '../../shared/enhanced-schema.js';
import { eq, and } from 'drizzle-orm';

const router = express.Router();

// Follow a user
router.post('/users/:id/follow', authenticateToken, async (req, res) => {
  try {
    const { id: targetUserId } = req.params;
    const followerId = req.userId;

    if (followerId === targetUserId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    // Check if already following
    const existingFollow = await db.select().from(followers)
      .where(and(
        eq(followers.follower_id, followerId),
        eq(followers.following_id, targetUserId)
      ))
      .execute();

    if (existingFollow && existingFollow.length > 0) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    // Insert follow relationship into database
    await db.insert(followers)
      .values({
        follower_id: followerId,
        following_id: targetUserId,
      })
      .execute();

    // Get updated follower count
    const followerCountResult = await db.select().from(followers)
      .where(eq(followers.following_id, targetUserId))
      .execute();

    logger.info('User followed', { followerId, targetUserId });
    res.status(201).json({
      following: true,
      follower_count: followerCountResult?.length || 0
    });
  } catch (error) {
    logger.error('Error following user:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

// Unfollow a user
router.delete('/users/:id/follow', authenticateToken, async (req, res) => {
  try {
    const { id: targetUserId } = req.params;
    const followerId = req.userId;

    // Remove follow relationship from database
    await db.delete(followers)
      .where(and(
        eq(followers.follower_id, followerId),
        eq(followers.following_id, targetUserId)
      ))
      .execute();

    // Get updated follower count
    const followerCountResult = await db.select().from(followers)
      .where(eq(followers.following_id, targetUserId))
      .execute();

    logger.info('User unfollowed', { followerId, targetUserId });
    res.json({
      following: false,
      follower_count: followerCountResult?.length || 0
    });
  } catch (error) {
    logger.error('Error unfollowing user:', error);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
});

// Check if following a user
router.get('/users/:id/following-status', authenticateToken, async (req, res) => {
  try {
    const { id: targetUserId } = req.params;
    const followerId = req.userId;

    const followRecord = await db.select().from(followers)
      .where(and(
        eq(followers.follower_id, followerId),
        eq(followers.following_id, targetUserId)
      ))
      .execute();

    const isFollowing = followRecord && followRecord.length > 0;

    logger.info('Follow status checked', { followerId, targetUserId, isFollowing });
    res.json({ isFollowing });
  } catch (error) {
    logger.error('Error checking follow status:', error);
    res.status(500).json({ error: 'Failed to check follow status' });
  }
});

// Simple follow/unfollow endpoints (POST/DELETE /follow)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { followerId, followingId } = req.body;
    const userId = req.userId;

    // Use userId from auth if not provided
    const actualFollowerId = followerId || userId;

    if (!actualFollowerId || !followingId) {
      return res.status(400).json({ error: 'followerId and followingId are required' });
    }

    if (actualFollowerId === followingId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    // Check if already following
    const existingFollow = await db.select().from(followers)
      .where(and(
        eq(followers.follower_id, actualFollowerId),
        eq(followers.following_id, followingId)
      ))
      .execute();

    if (existingFollow && existingFollow.length > 0) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    // Insert follow relationship
    await db.insert(followers)
      .values({
        follower_id: actualFollowerId,
        following_id: followingId,
      })
      .execute();

    logger.info('User followed', { actualFollowerId, followingId });
    res.status(201).json({
      following: true,
      message: 'Successfully followed user'
    });
  } catch (error) {
    logger.error('Error following user:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

router.delete('/', authenticateToken, async (req, res) => {
  try {
    const { followerId, followingId } = req.body;
    const userId = req.userId;

    // Use userId from auth if not provided
    const actualFollowerId = followerId || userId;

    if (!actualFollowerId || !followingId) {
      return res.status(400).json({ error: 'followerId and followingId are required' });
    }

    // Remove follow relationship
    await db.delete(followers)
      .where(and(
        eq(followers.follower_id, actualFollowerId),
        eq(followers.following_id, followingId)
      ))
      .execute();

    logger.info('User unfollowed', { actualFollowerId, followingId });
    res.json({
      following: false,
      message: 'Successfully unfollowed user'
    });
  } catch (error) {
    logger.error('Error unfollowing user:', error);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
});

// Check follow status (GET /follow/check/:followerId/:followingId)
router.get('/check/:followerId/:followingId', authenticateToken, async (req, res) => {
  try {
    const { followerId, followingId } = req.params;

    const followRecord = await db.select().from(followers)
      .where(and(
        eq(followers.follower_id, followerId),
        eq(followers.following_id, followingId)
      ))
      .execute();

    const isFollowing = followRecord && followRecord.length > 0;

    res.json({ isFollowing });
  } catch (error) {
    logger.error('Error checking follow status:', error);
    res.status(500).json({ error: 'Failed to check follow status' });
  }
});

// Get user's followers
router.get('/users/:id/followers', async (req, res) => {
  try {
    const { id: userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // TODO: Replace with real database query
    const followers = {
      data: [
        {
          id: 'follower_1',
          username: 'follower_user',
          displayName: 'Follower User',
          avatar: '/placeholder.svg',
          bio: 'Active user on the platform',
          verified: false,
          mutual_followers: 5,
          followed_at: new Date().toISOString()
        }
      ],
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: 1,
        totalPages: 1
      }
    };

    logger.info('Followers fetched', { userId, count: followers.data.length });
    res.json(followers);
  } catch (error) {
    logger.error('Error fetching followers:', error);
    res.status(500).json({ error: 'Failed to fetch followers' });
  }
});

// Get user's following
router.get('/users/:id/following', async (req, res) => {
  try {
    const { id: userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // TODO: Replace with real database query
    const following = {
      data: [
        {
          id: 'following_1',
          username: 'followed_user',
          displayName: 'Followed User',
          avatar: '/placeholder.svg',
          bio: 'Content creator and influencer',
          verified: true,
          mutual_followers: 12,
          followed_at: new Date().toISOString()
        }
      ],
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: 1,
        totalPages: 1
      }
    };

    logger.info('Following fetched', { userId, count: following.data.length });
    res.json(following);
  } catch (error) {
    logger.error('Error fetching following:', error);
    res.status(500).json({ error: 'Failed to fetch following' });
  }
});

// Get mutual followers
router.get('/users/:id/mutual-followers', authenticateToken, async (req, res) => {
  try {
    const { id: targetUserId } = req.params;
    const currentUserId = req.userId;

    // TODO: Replace with real database query for mutual followers
    const mutualFollowers = {
      data: [
        {
          id: 'mutual_1',
          username: 'mutual_friend',
          displayName: 'Mutual Friend',
          avatar: '/placeholder.svg',
          verified: false
        }
      ],
      count: 1
    };

    logger.info('Mutual followers fetched', { currentUserId, targetUserId, count: mutualFollowers.count });
    res.json(mutualFollowers);
  } catch (error) {
    logger.error('Error fetching mutual followers:', error);
    res.status(500).json({ error: 'Failed to fetch mutual followers' });
  }
});

// Get suggested users to follow
router.get('/suggestions', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 10 } = req.query;

    // TODO: Replace with real database query based on user interests, mutual connections, etc.
    const suggestions = {
      data: [
        {
          id: 'suggested_1',
          username: 'suggested_user',
          displayName: 'Suggested User',
          avatar: '/placeholder.svg',
          bio: 'Tech enthusiast and content creator',
          verified: false,
          followers_count: 1250,
          mutual_followers: 3,
          reason: 'Followed by people you follow',
          category: 'technology'
        },
        {
          id: 'suggested_2',
          username: 'popular_creator',
          displayName: 'Popular Creator',
          avatar: '/placeholder.svg',
          bio: 'Digital artist and designer',
          verified: true,
          followers_count: 5680,
          mutual_followers: 8,
          reason: 'Popular in your area',
          category: 'design'
        }
      ],
      total: 2
    };

    logger.info('Follow suggestions fetched', { userId, count: suggestions.data.length });
    res.json(suggestions);
  } catch (error) {
    logger.error('Error fetching follow suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch follow suggestions' });
  }
});

// Block a user
router.post('/users/:id/block', authenticateToken, async (req, res) => {
  try {
    const { id: targetUserId } = req.params;
    const blockerId = req.userId;

    if (blockerId === targetUserId) {
      return res.status(400).json({ error: 'Cannot block yourself' });
    }

    // TODO: Insert block relationship into database
    // TODO: Remove any existing follow relationships
    
    const blockRecord = {
      id: `block_${Date.now()}`,
      blocker_id: blockerId,
      blocked_id: targetUserId,
      created_at: new Date().toISOString()
    };

    logger.info('User blocked', { blockerId, targetUserId });
    res.status(201).json({ blocked: true });
  } catch (error) {
    logger.error('Error blocking user:', error);
    res.status(500).json({ error: 'Failed to block user' });
  }
});

// Unblock a user
router.delete('/users/:id/block', authenticateToken, async (req, res) => {
  try {
    const { id: targetUserId } = req.params;
    const blockerId = req.userId;

    // TODO: Remove block relationship from database
    
    logger.info('User unblocked', { blockerId, targetUserId });
    res.json({ blocked: false });
  } catch (error) {
    logger.error('Error unblocking user:', error);
    res.status(500).json({ error: 'Failed to unblock user' });
  }
});

// Get blocked users
router.get('/blocked', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20 } = req.query;

    // TODO: Replace with real database query
    const blockedUsers = {
      data: [
        {
          id: 'blocked_1',
          username: 'blocked_user',
          displayName: 'Blocked User',
          avatar: '/placeholder.svg',
          blocked_at: new Date().toISOString()
        }
      ],
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: 1,
        totalPages: 1
      }
    };

    logger.info('Blocked users fetched', { userId, count: blockedUsers.data.length });
    res.json(blockedUsers);
  } catch (error) {
    logger.error('Error fetching blocked users:', error);
    res.status(500).json({ error: 'Failed to fetch blocked users' });
  }
});

// Report a user
router.post('/users/:id/report', authenticateToken, async (req, res) => {
  try {
    const { id: reportedUserId } = req.params;
    const { reason, description, evidence = [] } = req.body;
    const reporterId = req.userId;

    if (!reason) {
      return res.status(400).json({ error: 'Report reason is required' });
    }

    // TODO: Insert report into database
    const report = {
      id: `report_${Date.now()}`,
      reporter_id: reporterId,
      reported_user_id: reportedUserId,
      reason,
      description,
      evidence,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    logger.info('User reported', { reporterId, reportedUserId, reason });
    res.status(201).json({ 
      message: 'Report submitted successfully',
      report_id: report.id 
    });
  } catch (error) {
    logger.error('Error reporting user:', error);
    res.status(500).json({ error: 'Failed to report user' });
  }
});

export default router;

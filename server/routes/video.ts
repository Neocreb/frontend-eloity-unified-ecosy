import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth.js';
import { 
  createLiveStream,
  endLiveStream,
  updateStreamStatus,
  processVideoUpload,
  generateVideoThumbnail,
  trackVideoView,
  processAdView,
  calculateWatchReward,
  getVideoAnalytics,
  moderateLiveChat
} from '../services/videoService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Search endpoint for global search
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 20, offset = 0 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchQuery = `%${q}%`;

    // Search videos from database
    // This is a placeholder - adjust based on your actual video table structure
    const videos = [];

    res.json({ videos });
  } catch (error) {
    logger.error('Error searching videos:', error);
    res.status(500).json({ error: 'Failed to search videos' });
  }
});

// Configure video upload
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/videos/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = file.originalname.split('.').pop();
    cb(null, `video-${uniqueSuffix}.${extension}`);
  }
});

const videoUpload = multer({
  storage: videoStorage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|avi|mov|wmv|flv|webm|mkv/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid video file type'));
    }
  }
});

// =============================================================================
// VIDEO UPLOAD AND PROCESSING
// =============================================================================

// Upload video content
router.post('/upload', authenticateToken, videoUpload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const { title, description, tags, category, privacy, monetization } = req.body;
    const userId = req.userId;

    const videoData = {
      userId,
      title: title || 'Untitled Video',
      description: description || '',
      tags: tags ? JSON.parse(tags) : [],
      category: category || 'general',
      privacy: privacy || 'public', // public, private, unlisted
      monetization: monetization === 'true',
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      mimetype: req.file.mimetype
    };

    const result = await processVideoUpload(videoData);

    if (result.success) {
      logger.info('Video uploaded successfully', { userId, videoId: result.videoId });
      res.status(201).json({
        success: true,
        videoId: result.videoId,
        status: 'processing',
        message: 'Video uploaded and processing started',
        video: {
          id: result.videoId,
          title: videoData.title,
          description: videoData.description,
          status: 'processing',
          thumbnail: result.thumbnailUrl,
          uploadedAt: new Date().toISOString()
        }
      });
    } else {
      res.status(400).json({ 
        error: 'Video upload failed', 
        details: result.error 
      });
    }
  } catch (error) {
    logger.error('Video upload error:', error);
    res.status(500).json({ error: 'Video upload failed' });
  }
});

// Get video details
router.get('/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const viewerId = req.query.userId || req.userId;

    const video = await getVideoById(videoId);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Check if user has access to private videos
    if (video.privacy === 'private' && video.userId !== viewerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get video analytics and ad configuration
    const analytics = await getVideoAnalytics(videoId);
    const adConfig = await getVideoAdConfiguration(videoId);

    res.json({
      ...video,
      analytics: {
        views: analytics.views,
        likes: analytics.likes,
        comments: analytics.comments,
        shares: analytics.shares,
        watchTime: analytics.averageWatchTime
      },
      adConfiguration: adConfig,
      isLive: video.isLiveStream,
      streamStatus: video.streamStatus
    });
  } catch (error) {
    logger.error('Video fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch video' });
  }
});

// Update video details
router.put('/:videoId', authenticateToken, async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.userId;
    const updates = req.body;

    // Check if user owns the video
    const video = await getVideoById(videoId);
    if (!video || video.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedVideo = await updateVideo(videoId, updates);

    if (updatedVideo) {
      logger.info('Video updated', { videoId, userId });
      res.json(updatedVideo);
    } else {
      res.status(404).json({ error: 'Video not found' });
    }
  } catch (error) {
    logger.error('Video update error:', error);
    res.status(500).json({ error: 'Failed to update video' });
  }
});

// Delete video
router.delete('/:videoId', authenticateToken, async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.userId;

    // Check if user owns the video
    const video = await getVideoById(videoId);
    if (!video || video.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const deleted = await deleteVideo(videoId);

    if (deleted) {
      logger.info('Video deleted', { videoId, userId });
      res.json({ success: true, message: 'Video deleted successfully' });
    } else {
      res.status(404).json({ error: 'Video not found' });
    }
  } catch (error) {
    logger.error('Video deletion error:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

// =============================================================================
// LIVE STREAMING ENDPOINTS
// =============================================================================

// Start live stream
router.post('/live/start', authenticateToken, async (req, res) => {
  try {
    const { title, description, category, quality, isPrivate } = req.body;
    const userId = req.userId;

    if (!title) {
      return res.status(400).json({ error: 'Stream title is required' });
    }

    const streamData = {
      userId,
      title,
      description: description || '',
      category: category || 'general',
      quality: quality || '1080p', // 720p, 1080p, 4k
      isPrivate: isPrivate || false,
      bitrate: getBitrateForQuality(quality || '1080p'),
      framerate: 30
    };

    const result = await createLiveStream(streamData);

    if (result.success) {
      logger.info('Live stream started', { userId, streamId: result.streamId });
      res.json({
        success: true,
        streamId: result.streamId,
        streamKey: result.streamKey,
        rtmpUrl: result.rtmpUrl,
        watchUrl: result.watchUrl,
        chatRoomId: result.chatRoomId,
        status: 'live'
      });
    } else {
      res.status(400).json({ 
        error: 'Failed to start live stream', 
        details: result.error 
      });
    }
  } catch (error) {
    logger.error('Live stream start error:', error);
    res.status(500).json({ error: 'Failed to start live stream' });
  }
});

// End live stream
router.post('/live/:streamId/end', authenticateToken, async (req, res) => {
  try {
    const { streamId } = req.params;
    const userId = req.userId;

    // Check if user owns the stream
    const stream = await getStreamById(streamId);
    if (!stream || stream.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await endLiveStream(streamId);

    if (result.success) {
      logger.info('Live stream ended', { streamId, userId });
      res.json({
        success: true,
        message: 'Live stream ended',
        streamDuration: result.duration,
        totalViewers: result.totalViewers,
        peakViewers: result.peakViewers,
        recordingUrl: result.recordingUrl
      });
    } else {
      res.status(400).json({ 
        error: 'Failed to end live stream', 
        details: result.error 
      });
    }
  } catch (error) {
    logger.error('Live stream end error:', error);
    res.status(500).json({ error: 'Failed to end live stream' });
  }
});

// Update stream status/settings
router.put('/live/:streamId', authenticateToken, async (req, res) => {
  try {
    const { streamId } = req.params;
    const userId = req.userId;
    const updates = req.body;

    // Check if user owns the stream
    const stream = await getStreamById(streamId);
    if (!stream || stream.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await updateStreamStatus(streamId, updates);

    if (result.success) {
      res.json(result.stream);
    } else {
      res.status(400).json({ 
        error: 'Failed to update stream', 
        details: result.error 
      });
    }
  } catch (error) {
    logger.error('Stream update error:', error);
    res.status(500).json({ error: 'Failed to update stream' });
  }
});

// Get live stream details
router.get('/live/:streamId', async (req, res) => {
  try {
    const { streamId } = req.params;
    const viewerId = req.query.userId;

    const stream = await getStreamById(streamId);
    
    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    // Check privacy settings
    if (stream.isPrivate && stream.userId !== viewerId) {
      return res.status(403).json({ error: 'Private stream' });
    }

    const analytics = await getStreamAnalytics(streamId);

    res.json({
      ...stream,
      analytics: {
        currentViewers: analytics.currentViewers,
        totalViewers: analytics.totalViewers,
        peakViewers: analytics.peakViewers,
        duration: analytics.duration,
        chatMessages: analytics.chatMessages
      }
    });
  } catch (error) {
    logger.error('Stream fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch stream' });
  }
});

// =============================================================================
// VIDEO ANALYTICS AND TRACKING
// =============================================================================

// Track video view
router.post('/:videoId/view', async (req, res) => {
  try {
    const { videoId } = req.params;
    const { userId, watchTime, quality, device } = req.body;

    const viewData = {
      videoId,
      userId: userId || null,
      watchTime: parseInt(watchTime) || 0,
      quality: quality || '720p',
      device: device || 'unknown',
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };

    const result = await trackVideoView(viewData);

    if (result.success) {
      // Check if user earned watch reward
      if (userId && result.rewardEarned) {
        const reward = await calculateWatchReward(userId, videoId, watchTime);
        
        if (reward.amount > 0) {
          res.json({
            success: true,
            viewTracked: true,
            rewardEarned: {
              amount: reward.amount,
              currency: reward.currency,
              reason: reward.reason
            }
          });
        } else {
          res.json({ success: true, viewTracked: true });
        }
      } else {
        res.json({ success: true, viewTracked: true });
      }
    } else {
      res.status(400).json({ 
        error: 'Failed to track view', 
        details: result.error 
      });
    }
  } catch (error) {
    logger.error('Video view tracking error:', error);
    res.status(500).json({ error: 'Failed to track view' });
  }
});

// Process ad view completion
router.post('/:videoId/ad-view', authenticateToken, async (req, res) => {
  try {
    const { videoId } = req.params;
    const { adId, adType, duration, completed } = req.body;
    const userId = req.userId;

    if (!adId || !adType) {
      return res.status(400).json({ error: 'Ad ID and type are required' });
    }

    const adViewData = {
      videoId,
      userId,
      adId,
      adType, // pre_roll, mid_roll, post_roll, banner
      duration: parseInt(duration) || 0,
      completed: completed === true,
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };

    const result = await processAdView(adViewData);

    if (result.success) {
      // Calculate ad view reward
      const reward = await calculateAdViewReward(userId, adViewData);
      
      logger.info('Ad view processed', { userId, videoId, adId, completed });
      
      res.json({
        success: true,
        adViewTracked: true,
        rewardEarned: reward.amount > 0 ? {
          amount: reward.amount,
          currency: reward.currency,
          reason: 'Ad view completion'
        } : null
      });
    } else {
      res.status(400).json({ 
        error: 'Failed to process ad view', 
        details: result.error 
      });
    }
  } catch (error) {
    logger.error('Ad view processing error:', error);
    res.status(500).json({ error: 'Failed to process ad view' });
  }
});

// Get video analytics for creator
router.get('/:videoId/analytics', authenticateToken, async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.userId;
    const { timeframe = '7d' } = req.query;

    // Check if user owns the video
    const video = await getVideoById(videoId);
    if (!video || video.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const analytics = await getDetailedVideoAnalytics(videoId, timeframe);

    res.json({
      videoId,
      timeframe,
      analytics: {
        views: analytics.views,
        uniqueViewers: analytics.uniqueViewers,
        watchTime: analytics.watchTime,
        averageViewDuration: analytics.averageViewDuration,
        engagement: {
          likes: analytics.likes,
          comments: analytics.comments,
          shares: analytics.shares,
          saves: analytics.saves
        },
        demographics: analytics.demographics,
        traffic: analytics.traffic,
        devices: analytics.devices,
        quality: analytics.quality,
        adRevenue: analytics.adRevenue,
        watchTimeRewards: analytics.watchTimeRewards
      }
    });
  } catch (error) {
    logger.error('Video analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// =============================================================================
// LIVE CHAT MODERATION
// =============================================================================

// Moderate live chat message
router.post('/live/:streamId/chat/moderate', authenticateToken, async (req, res) => {
  try {
    const { streamId } = req.params;
    const { messageId, action, reason } = req.body;
    const moderatorId = req.userId;

    if (!messageId || !action) {
      return res.status(400).json({ error: 'Message ID and action are required' });
    }

    // Check if user is stream owner or has moderation permissions
    const stream = await getStreamById(streamId);
    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    const canModerate = stream.userId === moderatorId || 
                       await hasModeratorPermissions(moderatorId, streamId);

    if (!canModerate) {
      return res.status(403).json({ error: 'Moderation access denied' });
    }

    const moderationData = {
      streamId,
      messageId,
      action, // delete, timeout, ban
      reason: reason || 'Violation of community guidelines',
      moderatorId,
      timestamp: new Date()
    };

    const result = await moderateLiveChat(moderationData);

    if (result.success) {
      logger.info('Chat message moderated', { streamId, messageId, action, moderatorId });
      res.json({
        success: true,
        action: action,
        message: 'Moderation action completed'
      });
    } else {
      res.status(400).json({ 
        error: 'Moderation failed', 
        details: result.error 
      });
    }
  } catch (error) {
    logger.error('Chat moderation error:', error);
    res.status(500).json({ error: 'Failed to moderate chat' });
  }
});

// =============================================================================
// VIDEO DISCOVERY AND RECOMMENDATIONS
// =============================================================================

// Get trending videos
router.get('/trending', async (req, res) => {
  try {
    const { category, country, timeframe = '24h', limit = 50 } = req.query;

    const trendingVideos = await getTrendingVideos({
      category,
      country,
      timeframe,
      limit: parseInt(limit)
    });

    res.json({
      trending: trendingVideos,
      timeframe,
      category: category || 'all',
      country: country || 'global',
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Trending videos error:', error);
    res.status(500).json({ error: 'Failed to fetch trending videos' });
  }
});

// Get personalized recommendations
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 20, category } = req.query;

    const recommendations = await getPersonalizedRecommendations(userId, {
      limit: parseInt(limit),
      category
    });

    res.json({
      recommendations,
      algorithm: 'collaborative_filtering',
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Video recommendations error:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getBitrateForQuality(quality: string): number {
  const bitrateMap = {
    '720p': 2500,
    '1080p': 4500,
    '4k': 15000
  };
  return bitrateMap[quality] || 2500;
}

async function calculateAdViewReward(userId: string, adViewData: any) {
  try {
    // Calculate reward based on ad type and completion
    const baseRewards = {
      'pre_roll': 0.02,   // $0.02 per completed pre-roll ad
      'mid_roll': 0.03,   // $0.03 per completed mid-roll ad
      'post_roll': 0.01,  // $0.01 per completed post-roll ad
      'banner': 0.005     // $0.005 per banner ad view
    };

    const baseReward = baseRewards[adViewData.adType] || 0;
    const completionMultiplier = adViewData.completed ? 1 : 0.5;
    
    const rewardAmount = baseReward * completionMultiplier;

    // Save reward to user's account
    if (rewardAmount > 0) {
      await creditAdReward(userId, rewardAmount, 'USD', adViewData);
    }

    return {
      amount: rewardAmount,
      currency: 'USD',
      adType: adViewData.adType,
      completed: adViewData.completed
    };
  } catch (error) {
    logger.error('Ad reward calculation error:', error);
    return { amount: 0, currency: 'USD' };
  }
}

// Mock database functions - replace with actual database implementation
async function getVideoById(videoId: string) {
  // Mock video data
  return {
    id: videoId,
    userId: 'user123',
    title: 'Sample Video',
    description: 'Sample description',
    privacy: 'public',
    isLiveStream: false,
    streamStatus: 'offline'
  };
}

async function updateVideo(videoId: string, updates: any) {
  // Mock video update
  return { id: videoId, ...updates };
}

async function deleteVideo(videoId: string) {
  // Mock video deletion
  return true;
}

async function getStreamById(streamId: string) {
  // Mock stream data
  return {
    id: streamId,
    userId: 'user123',
    title: 'Live Stream',
    isPrivate: false
  };
}

async function getVideoAdConfiguration(videoId: string) {
  // Mock ad configuration
  return {
    monetized: true,
    adTypes: ['pre_roll', 'mid_roll'],
    adFrequency: 'medium'
  };
}

async function getStreamAnalytics(streamId: string) {
  // Mock stream analytics
  return {
    currentViewers: 150,
    totalViewers: 1250,
    peakViewers: 300,
    duration: 3600,
    chatMessages: 450
  };
}

async function getDetailedVideoAnalytics(videoId: string, timeframe: string) {
  // Mock detailed analytics
  return {
    views: 1000,
    uniqueViewers: 750,
    watchTime: 5400,
    averageViewDuration: 120,
    likes: 85,
    comments: 23,
    shares: 12,
    saves: 45,
    demographics: {},
    traffic: {},
    devices: {},
    quality: {},
    adRevenue: 15.50,
    watchTimeRewards: 8.25
  };
}

async function getTrendingVideos(options: any) {
  // Mock trending videos
  return [];
}

async function getPersonalizedRecommendations(userId: string, options: any) {
  // Mock recommendations
  return [];
}

async function hasModeratorPermissions(userId: string, streamId: string) {
  // Mock moderation check
  return false;
}

async function creditAdReward(userId: string, amount: number, currency: string, metadata: any) {
  // Mock reward crediting
  logger.info('Ad reward credited', { userId, amount, currency });
}

export default router;

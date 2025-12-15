import { createClient } from '@supabase/supabase-js';
import logger from '../utils/logger';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Server-side task to cleanup expired stories
 * Runs on a scheduled interval to remove stories older than 24 hours
 */
export function startStoryCleanupTask(intervalMs: number = 60 * 60 * 1000) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });

  const cleanup = async () => {
    try {
      const now = new Date();
      logger.info(`[StoryCleanup] Starting cleanup at ${now.toISOString()}`);

      // Delete all stories where expires_at is in the past
      const { data, error, count } = await supabase
        .from('user_stories')
        .delete()
        .lt('expires_at', now.toISOString())
        .select('id', { count: 'exact' });

      if (error) {
        logger.error('[StoryCleanup] Error deleting expired stories:', error);
        return;
      }

      logger.info(`[StoryCleanup] Successfully cleaned up ${count || 0} expired stories`);

      // Also cleanup associated views for deleted stories
      // This is handled by CASCADE delete in the database schema
    } catch (error) {
      logger.error('[StoryCleanup] Unexpected error during cleanup:', error);
    }
  };

  // Run cleanup immediately on startup
  cleanup().catch((err) => {
    logger.error('[StoryCleanup] Initial cleanup failed:', err);
  });

  // Schedule recurring cleanup task
  const cleanupInterval = setInterval(() => {
    cleanup().catch((err) => {
      logger.error('[StoryCleanup] Scheduled cleanup failed:', err);
    });
  }, intervalMs);

  logger.info(`[StoryCleanup] Story cleanup task started with interval: ${intervalMs}ms`);

  // Return cleanup function for graceful shutdown
  return () => {
    clearInterval(cleanupInterval);
    logger.info('[StoryCleanup] Story cleanup task stopped');
  };
}

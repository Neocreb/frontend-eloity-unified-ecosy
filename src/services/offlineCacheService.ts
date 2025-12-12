/**
 * Offline Cache Service
 * Enables offline viewing and caching of videos using IndexedDB and Service Workers
 */

export interface CachedVideo {
  id: string;
  url: string;
  title: string;
  thumbnail?: string;
  duration: number;
  size: number;
  quality: 'low' | 'medium' | 'high';
  cachedAt: number;
  expiresAt: number;
  blob?: Blob;
}

export interface CacheStats {
  totalSize: number;
  videoCount: number;
  oldestVideo: CachedVideo | null;
  newestVideo: CachedVideo | null;
}

const DB_NAME = 'EloityOfflineDB';
const STORE_NAME = 'videos';
const METADATA_STORE = 'videoMetadata';
const DB_VERSION = 1;
const MAX_CACHE_SIZE = 500 * 1024 * 1024; // 500MB
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

class OfflineCacheService {
  private db: IDBDatabase | null = null;
  private isInitialized = false;

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isInitialized && this.db) {
        resolve();
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('quality', 'quality', { unique: false });
          store.createIndex('cachedAt', 'cachedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains(METADATA_STORE)) {
          db.createObjectStore(METADATA_STORE, { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Cache a video for offline viewing
   */
  async cacheVideo(
    videoUrl: string,
    videoId: string,
    metadata: {
      title: string;
      thumbnail?: string;
      duration: number;
      quality: 'low' | 'medium' | 'high';
    }
  ): Promise<boolean> {
    if (!navigator.onLine) {
      console.warn('Cannot cache video while offline');
      return false;
    }

    try {
      await this.init();

      // Download video
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
      }

      const blob = await response.blob();
      const size = blob.size;

      // Check cache space
      const stats = await this.getCacheStats();
      if (stats.totalSize + size > MAX_CACHE_SIZE) {
        // Remove oldest video if needed
        await this.removeOldestVideo();
      }

      // Store in IndexedDB
      const cachedVideo: CachedVideo = {
        id: videoId,
        url: videoUrl,
        title: metadata.title,
        thumbnail: metadata.thumbnail,
        duration: metadata.duration,
        size,
        quality: metadata.quality,
        cachedAt: Date.now(),
        expiresAt: Date.now() + CACHE_EXPIRY,
        blob,
      };

      return new Promise((resolve, reject) => {
        if (!this.db) {
          reject(new Error('Database not initialized'));
          return;
        }

        const transaction = this.db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(cachedVideo);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(true);
      });
    } catch (error) {
      console.error('Error caching video:', error);
      return false;
    }
  }

  /**
   * Get cached video
   */
  async getCachedVideo(videoId: string): Promise<CachedVideo | null> {
    try {
      await this.init();

      return new Promise((resolve, reject) => {
        if (!this.db) {
          reject(new Error('Database not initialized'));
          return;
        }

        const transaction = this.db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(videoId);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const video = request.result;
          
          if (video && video.expiresAt > Date.now()) {
            resolve(video);
          } else if (video) {
            // Delete expired video
            this.removeVideo(videoId);
            resolve(null);
          } else {
            resolve(null);
          }
        };
      });
    } catch (error) {
      console.error('Error getting cached video:', error);
      return null;
    }
  }

  /**
   * Check if video is cached
   */
  async isVideoCached(videoId: string): Promise<boolean> {
    const video = await this.getCachedVideo(videoId);
    return !!video;
  }

  /**
   * Remove cached video
   */
  async removeVideo(videoId: string): Promise<void> {
    try {
      await this.init();

      return new Promise((resolve, reject) => {
        if (!this.db) {
          reject(new Error('Database not initialized'));
          return;
        }

        const transaction = this.db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(videoId);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.error('Error removing video:', error);
    }
  }

  /**
   * Get all cached videos
   */
  async getAllCachedVideos(): Promise<CachedVideo[]> {
    try {
      await this.init();

      return new Promise((resolve, reject) => {
        if (!this.db) {
          reject(new Error('Database not initialized'));
          return;
        }

        const transaction = this.db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const videos = request.result.filter(v => v.expiresAt > Date.now());
          resolve(videos);
        };
      });
    } catch (error) {
      console.error('Error getting cached videos:', error);
      return [];
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheStats> {
    const videos = await this.getAllCachedVideos();

    let totalSize = 0;
    let oldestVideo: CachedVideo | null = null;
    let newestVideo: CachedVideo | null = null;

    videos.forEach(video => {
      totalSize += video.size;

      if (!oldestVideo || video.cachedAt < oldestVideo.cachedAt) {
        oldestVideo = video;
      }

      if (!newestVideo || video.cachedAt > newestVideo.cachedAt) {
        newestVideo = video;
      }
    });

    return {
      totalSize,
      videoCount: videos.length,
      oldestVideo,
      newestVideo,
    };
  }

  /**
   * Clear all cached videos
   */
  async clearCache(): Promise<void> {
    try {
      await this.init();

      return new Promise((resolve, reject) => {
        if (!this.db) {
          reject(new Error('Database not initialized'));
          return;
        }

        const transaction = this.db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Remove oldest video when cache is full
   */
  private async removeOldestVideo(): Promise<void> {
    const stats = await this.getCacheStats();
    if (stats.oldestVideo) {
      await this.removeVideo(stats.oldestVideo.id);
    }
  }

  /**
   * Get cache size percentage
   */
  async getCachePercentage(): Promise<number> {
    const stats = await this.getCacheStats();
    return (stats.totalSize / MAX_CACHE_SIZE) * 100;
  }

  /**
   * Check if offline
   */
  isOffline(): boolean {
    return !navigator.onLine;
  }

  /**
   * Register offline event listeners
   */
  registerOfflineListener(callback: (isOffline: boolean) => void): () => void {
    const handleOnline = () => callback(false);
    const handleOffline = () => callback(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  /**
   * Get cached video blob URL for playback
   */
  async getVideoBlobUrl(videoId: string): Promise<string | null> {
    const video = await this.getCachedVideo(videoId);
    if (!video || !video.blob) return null;

    return URL.createObjectURL(video.blob);
  }

  /**
   * Clean up expired videos
   */
  async cleanupExpiredVideos(): Promise<number> {
    const videos = await this.getAllCachedVideos();
    let removed = 0;

    for (const video of videos) {
      if (video.expiresAt <= Date.now()) {
        await this.removeVideo(video.id);
        removed++;
      }
    }

    return removed;
  }
}

export const offlineCacheService = new OfflineCacheService();

export default offlineCacheService;

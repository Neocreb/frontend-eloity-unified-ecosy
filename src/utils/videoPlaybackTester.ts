/**
 * Video Playback Tester - Ensures cross-device video playback reliability
 */

export interface PlaybackTestResult {
  canPlay: boolean;
  format: string;
  quality: 'high' | 'medium' | 'low' | 'unknown';
  supported: boolean;
  error?: string;
  duration?: number;
  buffered?: number;
}

export interface DeviceCapabilities {
  supportsWebGL: boolean;
  supportsMediaSource: boolean;
  supportsHTML5Video: boolean;
  maxVideoWidth: number;
  maxVideoHeight: number;
  supportedFormats: string[];
  hasHardwareAcceleration: boolean;
  isLowBandwidth: boolean;
  connection?: string;
}

export class VideoPlaybackTester {
  /**
   * Get device capabilities
   */
  static getDeviceCapabilities(): DeviceCapabilities {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');

    // Check connection type
    const connection = (navigator as any).connection;
    const effectiveType = connection?.effectiveType || 'unknown';
    const isLowBandwidth = ['slow-2g', '2g', '3g'].includes(effectiveType);

    return {
      supportsWebGL: !!gl,
      supportsMediaSource: !!(window as any).MediaSource,
      supportsHTML5Video: !!video.play,
      maxVideoWidth: Math.max(screen.width, screen.height),
      maxVideoHeight: Math.max(screen.width, screen.height),
      supportedFormats: this.getSupportedFormats(),
      hasHardwareAcceleration: this.checkHardwareAcceleration(),
      isLowBandwidth,
      connection: effectiveType,
    };
  }

  /**
   * Get supported video formats
   */
  static getSupportedFormats(): string[] {
    const video = document.createElement('video');
    const formats: string[] = [];

    const mimeTypes = [
      'video/mp4; codecs="avc1.42E01E"',
      'video/webm; codecs="vp8, vorbis"',
      'video/webm; codecs="vp9"',
      'video/ogg; codecs="theora"',
    ];

    mimeTypes.forEach(mimeType => {
      if (video.canPlayType(mimeType)) {
        formats.push(mimeType);
      }
    });

    return formats;
  }

  /**
   * Check for hardware acceleration
   */
  static checkHardwareAcceleration(): boolean {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    if (!gl) return false;

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return false;

    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    return !renderer.toLowerCase().includes('angle') &&
           !renderer.toLowerCase().includes('software');
  }

  /**
   * Test video playback on a specific URL
   */
  static async testVideoPlayback(
    url: string,
    timeoutMs: number = 10000
  ): Promise<PlaybackTestResult> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      let hasResolved = false;

      const timeout = setTimeout(() => {
        if (!hasResolved) {
          hasResolved = true;
          cleanup();
          resolve({
            canPlay: false,
            format: 'unknown',
            quality: 'unknown',
            supported: false,
            error: 'Timeout - could not determine playback capability',
          });
        }
      }, timeoutMs);

      const cleanup = () => {
        clearTimeout(timeout);
        video.pause();
        video.src = '';
        video.load();
      };

      video.addEventListener('canplay', () => {
        if (!hasResolved) {
          hasResolved = true;
          cleanup();
          resolve({
            canPlay: true,
            format: this.detectFormat(url),
            quality: this.detectQuality(url),
            supported: true,
            duration: video.duration,
            buffered: video.buffered.length > 0 ? video.buffered.end(0) : 0,
          });
        }
      });

      video.addEventListener('error', (e: any) => {
        if (!hasResolved) {
          hasResolved = true;
          cleanup();
          const error = e.target?.error?.message || 'Unknown playback error';
          resolve({
            canPlay: false,
            format: this.detectFormat(url),
            quality: 'unknown',
            supported: false,
            error,
          });
        }
      });

      video.addEventListener('abort', () => {
        if (!hasResolved) {
          hasResolved = true;
          cleanup();
          resolve({
            canPlay: false,
            format: this.detectFormat(url),
            quality: 'unknown',
            supported: false,
            error: 'Playback aborted',
          });
        }
      });

      video.src = url;
      video.load();
    });
  }

  /**
   * Detect video format from URL
   */
  static detectFormat(url: string): string {
    const ext = url.split('.').pop()?.toLowerCase() || 'unknown';
    const formatMap: Record<string, string> = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      ogv: 'video/ogg',
      mov: 'video/quicktime',
      m3u8: 'application/x-mpegURL',
    };
    return formatMap[ext] || ext;
  }

  /**
   * Detect video quality from URL
   */
  static detectQuality(url: string): 'high' | 'medium' | 'low' | 'unknown' {
    const urlLower = url.toLowerCase();
    if (urlLower.includes('1080') || urlLower.includes('4k')) return 'high';
    if (urlLower.includes('720') || urlLower.includes('hd')) return 'high';
    if (urlLower.includes('480') || urlLower.includes('sd')) return 'medium';
    if (urlLower.includes('240') || urlLower.includes('low')) return 'low';
    return 'unknown';
  }

  /**
   * Test multiple video sources and return the best one
   */
  static async testMultipleSources(
    sources: string[]
  ): Promise<{ url: string; result: PlaybackTestResult } | null> {
    const results = await Promise.all(
      sources.map(async (url) => ({
        url,
        result: await this.testVideoPlayback(url),
      }))
    );

    const working = results.filter(r => r.result.canPlay);
    if (working.length === 0) return null;

    // Prefer high quality
    working.sort((a, b) => {
      const qualityScore = { high: 3, medium: 2, low: 1, unknown: 0 };
      return (qualityScore[b.result.quality] || 0) - (qualityScore[a.result.quality] || 0);
    });

    return working[0];
  }

  /**
   * Get optimal video settings based on device
   */
  static getOptimalSettings(): {
    quality: 'high' | 'medium' | 'low';
    autoplay: boolean;
    preload: 'auto' | 'metadata' | 'none';
    muted: boolean;
  } {
    const capabilities = this.getDeviceCapabilities();

    let quality: 'high' | 'medium' | 'low' = 'medium';
    let preload: 'auto' | 'metadata' | 'none' = 'metadata';
    let autoplay = true;

    if (capabilities.isLowBandwidth) {
      quality = 'low';
      preload = 'none';
      autoplay = false;
    } else if (capabilities.maxVideoWidth < 768) {
      quality = 'medium';
      preload = 'metadata';
    }

    return {
      quality,
      autoplay,
      preload,
      muted: capabilities.isLowBandwidth, // Mute by default on low bandwidth
    };
  }

  /**
   * Test audio playback capability
   */
  static testAudioPlayback(): boolean {
    const audio = document.createElement('audio');
    return !!(
      audio.canPlayType('audio/mpeg') ||
      audio.canPlayType('audio/ogg') ||
      audio.canPlayType('audio/wav')
    );
  }

  /**
   * Get network quality
   */
  static getNetworkQuality(): 'excellent' | 'good' | 'fair' | 'poor' | 'unknown' {
    const connection = (navigator as any).connection;
    if (!connection) return 'unknown';

    const effectiveType = connection.effectiveType;
    const downlink = connection.downlink || 0;

    if (effectiveType === '4g' || downlink > 4) return 'excellent';
    if (effectiveType === '3g' || downlink > 2) return 'good';
    if (effectiveType === '2g' || downlink > 0) return 'fair';
    return 'poor';
  }

  /**
   * Handle playback error gracefully
   */
  static handlePlaybackError(error: any, videoUrl: string): void {
    console.error('Video playback error:', {
      url: videoUrl,
      error: error?.message || error,
      timestamp: new Date().toISOString(),
    });

    // Log to analytics or error tracking service
    this.reportPlaybackError({
      url: videoUrl,
      error: error?.message || String(error),
      userAgent: navigator.userAgent,
      networkQuality: this.getNetworkQuality(),
    });
  }

  /**
   * Report playback error (stub for integration with error tracking)
   */
  private static reportPlaybackError(details: any): void {
    // This would typically send to an error tracking service
    // like Sentry, LogRocket, etc.
    if (typeof window !== 'undefined' && (window as any).reportError) {
      (window as any).reportError(details);
    }
  }
}

export default VideoPlaybackTester;

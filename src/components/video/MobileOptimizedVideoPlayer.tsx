import React, { useState, useRef, useEffect, useCallback } from 'react';
import ResponsiveVideoControls from './ResponsiveVideoControls';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/utils/utils';

interface MobileOptimizedVideoPlayerProps {
  src: string;
  thumbnail?: string;
  title?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  onLoadStart?: () => void;
  onLoadedMetadata?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: any) => void;
  onTimeUpdate?: (currentTime: number) => void;
  className?: string;
  hideControls?: boolean;
  hideControlsDelay?: number;
}

const MobileOptimizedVideoPlayer: React.FC<MobileOptimizedVideoPlayerProps> = ({
  src,
  thumbnail,
  title,
  autoplay = false,
  loop = false,
  muted = false,
  onLoadStart,
  onLoadedMetadata,
  onPlay,
  onPause,
  onEnded,
  onError,
  onTimeUpdate,
  className,
  hideControls = true,
  hideControlsDelay = 3000,
}) => {
  const isMobile = useIsMobile();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(!hideControls);
  const [isLoading, setIsLoading] = useState(false);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Gesture tracking for mobile
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const [lastTapTime, setLastTapTime] = useState(0);
  const [doubleTapTimeout, setDoubleTapTimeout] = useState<NodeJS.Timeout>();

  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
        if (onPause) onPause();
      } else {
        videoRef.current.play().catch(err => {
          console.error('Play error:', err);
          if (onError) onError(err);
        });
        setIsPlaying(true);
        if (onPlay) onPlay();
      }
    }
  }, [isPlaying, onPlay, onPause, onError]);

  const handleMuteToggle = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const handleFullscreenToggle = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if ((document as any).webkitExitFullscreen) {
            await (document as any).webkitExitFullscreen();
          }
        }
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }, [isFullscreen]);

  const handleSeek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const handleVolumeChange = useCallback((newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
    }
  }, []);

  const handleSkipForward = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, duration);
    }
  }, [duration]);

  const handleSkipBackward = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0);
    }
  }, []);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    if (hideControls && isPlaying) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, hideControlsDelay);
    }
  }, [hideControls, isPlaying, hideControlsDelay]);

  // Handle double-tap for play/pause on mobile
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const now = Date.now();
    if (now - lastTapTime < 300) {
      e.preventDefault();
      handlePlayPause();
      if (doubleTapTimeout) clearTimeout(doubleTapTimeout);
    } else {
      setLastTapTime(now);
      const timeout = setTimeout(() => {
        setLastTapTime(0);
      }, 300);
      setDoubleTapTimeout(timeout);
    }
    showControlsTemporarily();
  }, [lastTapTime, doubleTapTimeout, handlePlayPause, showControlsTemporarily]);

  const handleMouseMove = useCallback(() => {
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (onTimeUpdate) {
        onTimeUpdate(videoRef.current.currentTime);
      }
    }
  }, [onTimeUpdate]);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setVolume(videoRef.current.volume);
      setIsMuted(videoRef.current.muted);
      if (onLoadedMetadata) onLoadedMetadata();
    }
  }, [onLoadedMetadata]);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    if (onLoadStart) onLoadStart();
  }, [onLoadStart]);

  const handleCanPlay = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleEnded = useCallback(() => {
    if (!loop) {
      setIsPlaying(false);
    }
    if (onEnded) onEnded();
  }, [loop, onEnded]);

  useEffect(() => {
    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full bg-black overflow-hidden',
        isFullscreen ? 'fixed inset-0 z-50' : 'rounded-lg',
        className
      )}
      style={{
        aspectRatio: '16 / 9',
      }}
      onMouseMove={handleMouseMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        src={src}
        poster={thumbnail}
        autoPlay={autoplay}
        loop={loop}
        muted={muted}
        playsInline // Important for iOS
        onLoadStart={handleLoadStart}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={handleEnded}
        onCanPlay={handleCanPlay}
        onError={(e) => {
          if (onError) onError(e);
        }}
      />

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Controls */}
      {showControls && (
        <ResponsiveVideoControls
          isPlaying={isPlaying}
          isMuted={isMuted}
          isFullscreen={isFullscreen}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          onPlayPause={handlePlayPause}
          onMuteToggle={handleMuteToggle}
          onFullscreenToggle={handleFullscreenToggle}
          onSeek={handleSeek}
          onVolumeChange={handleVolumeChange}
          onSkipForward={handleSkipForward}
          onSkipBackward={handleSkipBackward}
          isMobile={isMobile}
          showControls={showControls}
        />
      )}

      {/* Title Overlay */}
      {title && !isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <h3 className="text-white text-center text-lg sm:text-2xl max-w-xs px-4">
            {title}
          </h3>
        </div>
      )}
    </div>
  );
};

export default MobileOptimizedVideoPlayer;

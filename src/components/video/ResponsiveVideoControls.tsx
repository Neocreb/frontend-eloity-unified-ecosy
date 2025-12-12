import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/utils';

interface ResponsiveVideoControlsProps {
  isPlaying: boolean;
  isMuted: boolean;
  isFullscreen: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  onPlayPause: () => void;
  onMuteToggle: () => void;
  onFullscreenToggle: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onSkipForward?: () => void;
  onSkipBackward?: () => void;
  isMobile?: boolean;
  className?: string;
  showControls?: boolean;
}

const ResponsiveVideoControls: React.FC<ResponsiveVideoControlsProps> = ({
  isPlaying,
  isMuted,
  isFullscreen,
  currentTime,
  duration,
  volume,
  onPlayPause,
  onMuteToggle,
  onFullscreenToggle,
  onSeek,
  onVolumeChange,
  onSkipForward,
  onSkipBackward,
  isMobile = false,
  className,
  showControls = true,
}) => {
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    onSeek(percent * duration);
  };

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!volumeRef.current) return;
    const rect = volumeRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    onVolumeChange(Math.max(0, Math.min(1, percent)));
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  if (!showControls) {
    return null;
  }

  return (
    <div
      className={cn(
        'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 sm:p-3 text-white',
        className
      )}
    >
      {/* Progress Bar */}
      <div
        ref={progressRef}
        className="relative h-1 sm:h-1.5 bg-white/30 rounded-full mb-2 cursor-pointer hover:h-2 sm:hover:h-2 transition-all group"
        onClick={handleProgressClick}
      >
        <div
          className="h-full bg-red-500 rounded-full transition-all"
          style={{ width: `${progressPercent}%` }}
        />
        {/* Scrubber knob - only show on non-mobile or on hover */}
        <div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full shadow-lg transition-all',
            isMobile ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
          )}
          style={{ left: `calc(${progressPercent}% - 0.375rem)` }}
        />
      </div>

      {/* Time Display */}
      <div className="text-xs sm:text-sm text-white/80 mb-2">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between gap-1 sm:gap-2">
        {/* Left Controls */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {/* Play/Pause */}
          <Button
            size={isMobile ? 'sm' : 'default'}
            variant="ghost"
            className="text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10 p-0"
            onClick={onPlayPause}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <Play className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </Button>

          {/* Skip Controls - only on mobile with custom handler */}
          {isMobile && onSkipBackward && (
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              onClick={onSkipBackward}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
          )}

          {isMobile && onSkipForward && (
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              onClick={onSkipForward}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          )}

          {/* Volume Control - hidden on very small screens, show inline on larger */}
          {!isMobile && (
            <div className="hidden sm:flex items-center gap-1 ml-2">
              <Button
                size="default"
                variant="ghost"
                className="text-white hover:bg-white/20 h-10 w-10 p-0"
                onClick={onMuteToggle}
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
              <div
                ref={volumeRef}
                className="w-16 h-1 bg-white/30 rounded-full cursor-pointer hover:bg-white/40 transition-colors relative group"
                onClick={handleVolumeClick}
              >
                <div
                  className="h-full bg-white rounded-full"
                  style={{ width: `${volume * 100}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: `calc(${volume * 100}% - 0.375rem)` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {/* Volume Toggle (mobile) */}
          {isMobile && (
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              onClick={onMuteToggle}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* Fullscreen */}
          <Button
            size={isMobile ? 'sm' : 'default'}
            variant="ghost"
            className="text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10 p-0"
            onClick={onFullscreenToggle}
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <Maximize className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveVideoControls;

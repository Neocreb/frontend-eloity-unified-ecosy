import React, { useState, useEffect, useRef } from 'react';
import { X, Heart, MessageCircle, Share2, MoreHorizontal, ChevronLeft, ChevronRight, Volume2, VolumeX, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useStories } from '@/hooks/useStories';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface StoryViewerProps {
  stories: any[];
  initialIndex?: number;
  onClose: () => void;
  onStoryChange?: (index: number) => void;
}

interface FloatingHeart {
  id: string;
  x: number;
  y: number;
}

const StoryViewer = ({ stories, initialIndex = 0, onClose, onStoryChange }: StoryViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [showNavChevrons, setShowNavChevrons] = useState(true);

  const { user } = useAuth();
  const { likeStory, viewStory } = useStories();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const storyContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentStory = stories[currentIndex];

  // Calculate time remaining until expiration
  const getTimeRemaining = () => {
    if (!currentStory?.expires_at) return null;
    const now = new Date();
    const expiresAt = new Date(currentStory.expires_at);
    const diff = expiresAt.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `Expires in ${hours}h`;
    if (minutes > 0) return `Expires in ${minutes}m`;
    return 'Expires soon';
  };

  // Format view count
  const formatViewCount = (count: number | undefined) => {
    if (!count) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  // Auto-advance story
  useEffect(() => {
    if (!currentStory) return;

    // Mark story as viewed with validation
    if (currentStory.id && currentStory.id !== 'create' && typeof currentStory.id === 'string' && currentStory.id.length >= 36) {
      viewStory(currentStory.id).catch(err => {
        console.error('Failed to mark story as viewed:', err);
      });
    }

    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          return 0;
        }
        return prev + 2;
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentStory, isPaused, viewStory]);

  // Reset progress when story changes
  useEffect(() => {
    setProgress(0);
  }, [currentIndex]);

  // Handle auto-advance to next story when progress completes
  useEffect(() => {
    if (progress >= 100) {
      if (currentIndex < stories.length - 1) {
        // Move to next story
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        onStoryChange?.(nextIndex);
      } else {
        // End of stories
        onClose();
      }
    }
  }, [progress, currentIndex, stories.length, onStoryChange, onClose]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        goToNextStory();
      } else if (e.key === 'ArrowLeft') {
        goToPreviousStory();
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPaused(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, stories.length, onClose]);

  // Handle like action
  const handleLike = async () => {
    if (currentStory?.id) {
      try {
        await likeStory(currentStory.id);
      } catch (error) {
        console.error('Error liking story:', error);
      }
    }
  };

  // Double-tap to like handler
  const handleStoryTap = () => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime;

    if (timeSinceLastTap < 300) {
      // Double tap detected
      if (storyContainerRef.current) {
        const rect = storyContainerRef.current.getBoundingClientRect();
        const x = ((now - lastTapTime) % 1000) / 1000 * (Math.random() > 0.5 ? 1 : -1) * 30 + rect.width / 2;
        const y = rect.height / 2 + (Math.random() > 0.5 ? -1 : 1) * (Math.random() * 60);

        createFloatingHeart(x, y);
        handleLike();
      }
      setLastTapTime(0);
    } else {
      setLastTapTime(now);
    }
  };

  // Create floating heart animation
  const createFloatingHeart = (x: number, y: number) => {
    const id = `heart-${Date.now()}-${Math.random()}`;
    const heart: FloatingHeart = { id, x, y };
    setFloatingHearts(prev => [...prev, heart]);

    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== id));
    }, 1000);
  };

  // Toggle pause/resume
  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

  // Navigate to previous story
  const goToPreviousStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      onStoryChange?.(currentIndex - 1);
    } else {
      onClose();
    }
  };

  // Navigate to next story
  const goToNextStory = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      onStoryChange?.(currentIndex + 1);
    } else {
      onClose();
    }
  };

  // Handle swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;

    const minSwipeDistance = 50;
    const minVerticalDistance = 100;

    // Swipe up to close (or could open replies)
    if (Math.abs(diffY) > minVerticalDistance && diffY > 0) {
      onClose();
    }
    // Swipe left to next
    else if (diffX > minSwipeDistance) {
      goToNextStory();
    }
    // Swipe right to previous
    else if (diffX < -minSwipeDistance) {
      goToPreviousStory();
    }
  };

  // Navigate to user profile
  const handleProfileClick = () => {
    if (currentStory?.user?.id) {
      navigate(`/app/profile/${currentStory.user.id}`);
    } else if (currentStory?.user_id) {
      navigate(`/app/profile/${currentStory.user_id}`);
    }
  };

  // Handle video loading
  const handleVideoLoadStart = () => setIsVideoLoading(true);
  const handleVideoCanPlay = () => setIsVideoLoading(false);

  if (!currentStory) {
    return null;
  }

  const isVideo = currentStory.media_type === 'video' || currentStory.type === 'video';
  const timeRemaining = getTimeRemaining();

  return (
    <div
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 text-white p-2 rounded-full hover:bg-white/20 transition-colors"
        aria-label="Close story"
      >
        <X size={24} />
      </button>

      {/* Progress bar */}
      <div className="absolute top-4 left-4 right-4 h-1 bg-white/30 rounded-full overflow-hidden z-10">
        <div
          className="h-full bg-white transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* User info and stats */}
      <div className="absolute top-8 left-4 z-10 flex items-center justify-between right-16">
        <div className="flex items-center gap-3 cursor-pointer" onClick={handleProfileClick}>
          <Avatar className="h-8 w-8 border-2 border-white hover:opacity-80 transition-opacity">
            <AvatarImage src={currentStory.user?.avatar || currentStory.profiles?.avatar_url} alt={currentStory.user?.name || currentStory.profiles?.full_name} />
            <AvatarFallback>{(currentStory.user?.name || currentStory.profiles?.username || "U").substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="text-white">
            <div className="font-semibold text-sm hover:underline">{currentStory.user?.name || currentStory.profiles?.full_name || "Unknown"}</div>
            {currentStory.created_at && (
              <div className="text-xs opacity-75">
                {new Date(currentStory.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
        </div>

        {/* Stats container */}
        <div className="flex items-center gap-4 text-white text-xs">
          {currentStory.views !== undefined && (
            <div className="flex items-center gap-1">
              <span>{formatViewCount(currentStory.views)} views</span>
            </div>
          )}
          {timeRemaining && (
            <div className="text-white/70 text-xs">
              {timeRemaining}
            </div>
          )}
        </div>
      </div>

      {/* Navigation - Previous (invisible large area) */}
      <button
        onClick={goToPreviousStory}
        className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
        aria-label="Previous story"
      />

      {/* Navigation - Next (invisible large area) */}
      <button
        onClick={goToNextStory}
        className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
        aria-label="Next story"
      />

      {/* Visible navigation chevrons - show on hover */}
      {showNavChevrons && (
        <>
          {currentIndex > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 text-white opacity-70 hover:opacity-100 transition-opacity"
              onClick={goToPreviousStory}
              onFocus={() => setShowNavChevrons(true)}
              onBlur={() => setShowNavChevrons(false)}
              aria-label="Previous story"
            >
              <ChevronLeft size={32} />
            </button>
          )}
          {currentIndex < stories.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-white opacity-70 hover:opacity-100 transition-opacity"
              onClick={goToNextStory}
              onFocus={() => setShowNavChevrons(true)}
              onBlur={() => setShowNavChevrons(false)}
              aria-label="Next story"
            >
              <ChevronRight size={32} />
            </button>
          )}
        </>
      )}

      {/* Story content */}
      <div
        ref={storyContainerRef}
        className="relative w-full h-full max-w-md mx-auto cursor-pointer"
        onClick={handleStoryTap}
        onMouseEnter={() => setShowNavChevrons(true)}
        onMouseLeave={() => setShowNavChevrons(false)}
      >
        {isVideo ? (
          <video
            ref={videoRef}
            src={currentStory.media_url}
            autoPlay={!isPaused}
            loop
            muted={isMuted}
            onLoadStart={handleVideoLoadStart}
            onCanPlay={handleVideoCanPlay}
            className="w-full h-full object-contain"
          />
        ) : (
          <img
            src={currentStory.media_url}
            alt={currentStory.caption || currentStory.content || 'Story'}
            className="w-full h-full object-contain"
          />
        )}

        {/* Video loading spinner */}
        {isVideoLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Loader className="animate-spin text-white" size={40} />
          </div>
        )}

        {/* Pause indicator */}
        {isPaused && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/60 px-4 py-2 rounded-lg text-white text-sm">
            Paused
          </div>
        )}

        {/* Floating hearts animation */}
        {floatingHearts.map(heart => (
          <div
            key={heart.id}
            className="absolute pointer-events-none animate-pulse"
            style={{
              left: `${(heart.x / window.innerWidth) * 100}%`,
              top: `${(heart.y / window.innerHeight) * 100}%`,
              animation: `floatUp 1s ease-out forwards`,
            }}
          >
            <Heart
              size={48}
              className="text-red-500 fill-red-500 drop-shadow-lg"
              style={{
                filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.5))',
              }}
            />
          </div>
        ))}

        {/* Story caption */}
        {(currentStory.caption || currentStory.content) && (
          <div className="absolute bottom-20 left-4 right-4 text-white text-sm bg-black/50 p-3 rounded-lg backdrop-blur-sm">
            {currentStory.caption || (typeof currentStory.content === 'string' ? currentStory.content : JSON.stringify(currentStory.content))}
          </div>
        )}

        {/* Action buttons */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:text-red-500 hover:bg-white/20 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleLike();
              }}
              aria-label="Like story"
            >
              <Heart size={24} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:text-white hover:bg-white/20"
              onClick={(e) => e.stopPropagation()}
              aria-label="Reply to story"
            >
              <MessageCircle size={24} />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {isVideo && (
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
                aria-label={isMuted ? 'Unmute video' : 'Mute video'}
              >
                {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:text-white hover:bg-white/20"
              onClick={(e) => e.stopPropagation()}
              aria-label="Share story"
            >
              <Share2 size={24} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:text-white hover:bg-white/20"
              onClick={(e) => e.stopPropagation()}
              aria-label="More options"
            >
              <MoreHorizontal size={24} />
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes floatUp {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(0, -80px) scale(0.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default StoryViewer;

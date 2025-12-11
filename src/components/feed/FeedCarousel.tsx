import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import PostContentRenderer from './PostContentRenderer';
import { formatNumber, formatTimeAgo } from '@/utils/feedUtils';
import { PostService } from '@/services/postService';

interface CarouselPost {
  id: string;
  type: 'post' | 'product' | 'job' | 'freelancer_skill' | 'sponsored_post' | 'ad';
  timestamp: Date;
  author?: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    verified: boolean;
  };
  content: any;
  interactions: {
    likes: number;
    comments: number;
    shares: number;
    saves?: number;
  };
  userInteracted: {
    liked: boolean;
    saved: boolean;
  };
}

interface FeedCarouselProps {
  posts: CarouselPost[];
  onPostClick?: (postId: string) => void;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onSave?: (postId: string) => void;
  className?: string;
}

const FeedCarousel: React.FC<FeedCarouselProps> = ({
  posts,
  onPostClick,
  onLike,
  onComment,
  onShare,
  onSave,
  className,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(posts.length > 1);
  const [postInteractions, setPostInteractions] = useState<Record<string, any>>({});

  // Track current index based on scroll position
  const updateCurrentIndex = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const cardWidth = 320 + 16; // w-80 (320px) + gap-4 (16px)
      const newIndex = Math.round(scrollLeft / cardWidth);
      setCurrentIndex(Math.min(newIndex, posts.length - 1));
    }
  };

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
    updateCurrentIndex();
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth;
      const newScrollLeft =
        scrollContainerRef.current.scrollLeft +
        (direction === 'left' ? -scrollAmount : scrollAmount);

      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      });

      setTimeout(checkScroll, 300);
    }
  };

  const handlePostClick = (post: CarouselPost) => {
    if (onPostClick) {
      onPostClick(post.id);
    } else {
      navigateToPost(post);
    }
  };

  const handleLikeClick = (e: React.MouseEvent, post: CarouselPost) => {
    e.stopPropagation();
    if (onLike) {
      onLike(post.id);
    }
    // Update local interaction state
    setPostInteractions(prev => ({
      ...prev,
      [post.id]: {
        ...prev[post.id],
        liked: !prev[post.id]?.liked
      }
    }));
    toast({
      title: !postInteractions[post.id]?.liked ? 'Liked!' : 'Unliked',
      description: !postInteractions[post.id]?.liked ? 'Thanks for the love!' : 'Post removed from likes',
    });
  };

  const handleCommentClick = (e: React.MouseEvent, post: CarouselPost) => {
    e.stopPropagation();
    if (onComment) {
      onComment(post.id);
    }
    navigate(`/app/post/${post.id}#comments`);
  };

  const handleShareClick = (e: React.MouseEvent, post: CarouselPost) => {
    e.stopPropagation();
    if (onShare) {
      onShare(post.id);
    }
    if (navigator.share) {
      navigator.share({
        title: 'Check out this post!',
        text: post.content.text || post.content.title || 'Check this out',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link copied!',
        description: 'Post link copied to clipboard.',
      });
    }
  };

  const handleSaveClick = (e: React.MouseEvent, post: CarouselPost) => {
    e.stopPropagation();
    if (onSave) {
      onSave(post.id);
    }
    // Update local interaction state
    setPostInteractions(prev => ({
      ...prev,
      [post.id]: {
        ...prev[post.id],
        saved: !prev[post.id]?.saved
      }
    }));
    toast({
      title: !postInteractions[post.id]?.saved ? 'Saved!' : 'Removed from Saved',
      description: !postInteractions[post.id]?.saved ? 'Post added to your saved items.' : 'Post removed from saved items.',
    });
  };

  const navigateToPost = (post: CarouselPost) => {
    switch (post.type) {
      case 'product':
        navigate(`/app/marketplace/product/${post.id}`);
        break;
      case 'job':
        navigate(`/app/freelance/job/${post.id}`);
        break;
      case 'freelancer_skill':
        navigate(`/app/freelance/find-freelancers?search=${post.author?.username}`);
        break;
      case 'sponsored_post':
        if (post.content.ctaUrl) {
          if (post.content.ctaUrl.startsWith('http')) {
            window.open(post.content.ctaUrl, '_blank');
          } else {
            navigate(post.content.ctaUrl);
          }
        }
        break;
      case 'post':
      default:
        navigate(`/app/post/${post.id}`);
        break;
    }
  };

  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <div className={cn('mb-6 px-2 sm:px-0', className)}>
      <div className="mb-3">
        <h3 className="text-lg font-semibold">Discover More</h3>
        <p className="text-sm text-gray-500">Swipe through posts from your network</p>
      </div>

      <div className="relative group">
        {/* Carousel Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto scroll-smooth pb-2 snap-x snap-mandatory"
          style={{ scrollBehavior: 'smooth', scrollPaddingLeft: '8px' }}
          onScroll={checkScroll}
        >
          {posts.map((post) => (
            <div key={post.id} className="flex-shrink-0 w-full sm:w-80 snap-start" style={{ minWidth: 'min(100%, 320px)' }}>
              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow h-full"
                onClick={() => handlePostClick(post)}
              >
                <CardContent className="p-0 flex flex-col h-full">
                  {/* Header */}
                  <div className="p-3 border-b">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={post.author?.avatar} />
                        <AvatarFallback>
                          {post.author?.name.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-sm truncate">
                            {post.author?.name || 'Unknown'}
                          </span>
                          {post.author?.verified && (
                            <Badge
                              variant="secondary"
                              className="h-4 w-4 p-0 rounded-full bg-blue-500 flex-shrink-0"
                            >
                              <span className="text-white text-xs">✓</span>
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {formatTimeAgo(post.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-3 flex-1 overflow-hidden">
                    {post.type === 'post' && post.content.text && (
                      <PostContentRenderer
                        content={post.content.text}
                        maxLines={3}
                        className="mb-2"
                      />
                    )}

                    {post.type === 'product' && (
                      <div>
                        <h4 className="font-semibold text-sm mb-1 line-clamp-2">
                          {post.content.title}
                        </h4>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {post.content.description}
                        </p>
                        <p className="text-base font-bold text-green-600">
                          ${post.content.price}
                        </p>
                      </div>
                    )}

                    {post.type === 'job' && (
                      <div>
                        <h4 className="font-semibold text-sm mb-1 line-clamp-2">
                          {post.content.title}
                        </h4>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {post.content.description}
                        </p>
                        <p className="text-sm font-bold text-blue-600">
                          ${post.content.budget.min}-${post.content.budget.max}
                        </p>
                      </div>
                    )}

                    {post.type === 'sponsored_post' && (
                      <div>
                        <h4 className="font-semibold text-sm mb-1 line-clamp-2">
                          {post.content.title}
                        </h4>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {post.content.description}
                        </p>
                        <Badge variant="outline" className="text-xs text-blue-600">
                          Sponsored
                        </Badge>
                      </div>
                    )}

                    {/* Media thumbnail */}
                    {post.content.media && post.content.media.length > 0 && (
                      <img
                        src={post.content.media[0].url}
                        alt="Post media"
                        className="w-full h-40 object-cover rounded-lg mt-2"
                      />
                    )}

                    {post.content.images && post.content.images.length > 0 && (
                      <img
                        src={post.content.images[0]}
                        alt="Post media"
                        className="w-full h-40 object-cover rounded-lg mt-2"
                      />
                    )}
                  </div>

                  {/* Footer - Interactions */}
                  <div className="p-2 sm:p-3 border-t bg-gray-50 dark:bg-gray-900">
                    <div className="flex items-center justify-between gap-1 sm:gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleLikeClick(e, post)}
                        className={cn(
                          'flex-1 h-8 text-xs gap-1 hover:bg-red-50 dark:hover:bg-red-950 transition-colors',
                          postInteractions[post.id]?.liked || post.userInteracted.liked ? 'text-red-500' : 'text-gray-600'
                        )}
                      >
                        <Heart
                          className={cn(
                            'w-3 h-3',
                            postInteractions[post.id]?.liked || post.userInteracted.liked ? 'fill-current' : ''
                          )}
                        />
                        <span className="hidden xs:inline">{formatNumber(post.interactions.likes)}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleCommentClick(e, post)}
                        className="flex-1 h-8 text-xs gap-1 text-gray-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span className="hidden xs:inline">{formatNumber(post.interactions.comments)}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleShareClick(e, post)}
                        className="flex-1 h-8 text-xs gap-1 text-gray-600 hover:bg-green-50 dark:hover:bg-green-950 transition-colors"
                      >
                        <Share2 className="w-3 h-3" />
                        <span className="hidden xs:inline">{formatNumber(post.interactions.shares)}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleSaveClick(e, post)}
                        className={cn(
                          'h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors',
                          postInteractions[post.id]?.saved || post.userInteracted.saved ? 'text-blue-500' : 'text-gray-600'
                        )}
                      >
                        <Bookmark
                          className={cn(
                            'w-3 h-3',
                            postInteractions[post.id]?.saved || post.userInteracted.saved ? 'fill-current' : ''
                          )}
                        />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Navigation Buttons - Hidden on mobile, visible on larger screens */}
        {canScrollLeft && (
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 h-9 w-9 sm:h-10 sm:w-10 rounded-full shadow-lg z-20 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 -ml-4 sm:-ml-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => scroll('left')}
            aria-label="Scroll carousel left"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        )}

        {canScrollRight && (
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 h-9 w-9 sm:h-10 sm:w-10 rounded-full shadow-lg z-20 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 -mr-4 sm:-mr-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => scroll('right')}
            aria-label="Scroll carousel right"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        )}
      </div>

      {/* Scroll indicator - Hidden on mobile when there are many items */}
      {posts.length > 1 && posts.length <= 5 && (
        <div className="flex justify-center gap-1 mt-3">
          {posts.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (scrollContainerRef.current) {
                  const cardWidth = 320 + 16; // w-80 + gap
                  scrollContainerRef.current.scrollTo({
                    left: idx * cardWidth,
                    behavior: 'smooth',
                  });
                }
              }}
              className={cn(
                'h-1.5 rounded-full transition-all cursor-pointer hover:bg-gray-400',
                idx === currentIndex ? 'w-6 bg-blue-600' : 'w-1.5 bg-gray-300'
              )}
              aria-label={`Go to post ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Simple counter for many items */}
      {posts.length > 5 && (
        <div className="text-center mt-3 text-sm text-gray-500">
          Post {currentIndex + 1} of {posts.length}
        </div>
      )}
    </div>
  );
};

export default FeedCarousel;

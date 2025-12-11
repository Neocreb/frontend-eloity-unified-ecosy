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
  className?: string;
}

const FeedCarousel: React.FC<FeedCarouselProps> = ({
  posts,
  onPostClick,
  className,
}) => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(posts.length > 1);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
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

      <div className="relative">
        {/* Carousel Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-2"
          style={{ scrollBehavior: 'smooth' }}
          onScroll={checkScroll}
        >
          {posts.map((post) => (
            <div key={post.id} className="flex-shrink-0 w-80">
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
                  <div className="p-3 border-t bg-gray-50 dark:bg-gray-900">
                    <div className="flex items-center justify-between gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          'flex-1 h-8 text-xs gap-1',
                          post.userInteracted.liked && 'text-red-500'
                        )}
                      >
                        <Heart
                          className={cn(
                            'w-3 h-3',
                            post.userInteracted.liked && 'fill-current'
                          )}
                        />
                        <span>{formatNumber(post.interactions.likes)}</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs gap-1">
                        <MessageCircle className="w-3 h-3" />
                        <span>{formatNumber(post.interactions.comments)}</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs gap-1">
                        <Share2 className="w-3 h-3" />
                        <span>{formatNumber(post.interactions.shares)}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          'h-8 w-8 p-0',
                          post.userInteracted.saved && 'text-blue-500'
                        )}
                      >
                        <Bookmark
                          className={cn(
                            'w-3 h-3',
                            post.userInteracted.saved && 'fill-current'
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

        {/* Navigation Buttons */}
        {canScrollLeft && (
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 h-10 w-10 rounded-full shadow-lg z-10"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}

        {canScrollRight && (
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 h-10 w-10 rounded-full shadow-lg z-10"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Scroll indicator */}
      {posts.length > 1 && (
        <div className="flex justify-center gap-1 mt-3">
          {posts.slice(0, Math.min(5, posts.length)).map((_, idx) => (
            <div
              key={idx}
              className={cn(
                'h-1.5 rounded-full transition-all',
                idx === currentIndex ? 'w-6 bg-blue-600' : 'w-1.5 bg-gray-300'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedCarousel;

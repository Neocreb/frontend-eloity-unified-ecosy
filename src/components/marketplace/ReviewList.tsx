import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ReviewService } from '@/services/reviewService';
import type { Review } from '@/types/marketplace';
import { cn } from '@/lib/utils';

type SortOption = 'helpful' | 'recent' | 'highest-rated' | 'lowest-rated';
type FilterRating = 'all' | '5' | '4' | '3' | '2' | '1';

interface ReviewListProps {
  productId: string;
  onLoadComplete?: (reviews: Review[]) => void;
  showCreateReview?: boolean;
  onCreateReviewClick?: () => void;
}

const REVIEWS_PER_PAGE = 10;

export default function ReviewList({
  productId,
  onLoadComplete,
  showCreateReview = true,
  onCreateReviewClick,
}: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('helpful');
  const [filterRating, setFilterRating] = useState<FilterRating>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, boolean>>({});

  // Load reviews on component mount
  useEffect(() => {
    const loadReviews = async () => {
      try {
        setLoading(true);
        const fetchedReviews = await ReviewService.getProductReviews(productId);
        setReviews(fetchedReviews);
        if (onLoadComplete) {
          onLoadComplete(fetchedReviews);
        }
      } catch (error) {
        console.error('Error loading reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [productId, onLoadComplete]);

  // Filter reviews
  const filteredReviews = reviews.filter((review) => {
    if (filterRating === 'all') return true;
    return review.rating === parseInt(filterRating);
  });

  // Sort reviews
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch (sortBy) {
      case 'helpful':
        return (b.helpfulCount || 0) - (a.helpfulCount || 0);
      case 'recent':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'highest-rated':
        return b.rating - a.rating;
      case 'lowest-rated':
        return a.rating - b.rating;
      default:
        return 0;
    }
  });

  // Paginate reviews
  const totalPages = Math.ceil(sortedReviews.length / REVIEWS_PER_PAGE);
  const startIndex = (currentPage - 1) * REVIEWS_PER_PAGE;
  const paginatedReviews = sortedReviews.slice(
    startIndex,
    startIndex + REVIEWS_PER_PAGE
  );

  // Calculate rating distribution
  const ratingDistribution = {
    5: reviews.filter((r) => r.rating === 5).length,
    4: reviews.filter((r) => r.rating === 4).length,
    3: reviews.filter((r) => r.rating === 3).length,
    2: reviews.filter((r) => r.rating === 2).length,
    1: reviews.filter((r) => r.rating === 1).length,
  };

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? (
          reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        ).toFixed(1)
      : 0;

  const handleHelpful = (reviewId: string) => {
    setHelpfulVotes((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy, filterRating]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-48 bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
          <CardDescription>
            Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Average Rating */}
            <div className="flex items-start gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-4xl font-bold">{averageRating}</span>
                  <div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            'h-4 w-4',
                            star <= Math.round(parseFloat(averageRating as string))
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground'
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {totalReviews} review{totalReviews !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-sm font-medium min-w-[40px]">
                    {rating} ⭐
                  </span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400"
                      style={{
                        width: `${
                          totalReviews > 0
                            ? (ratingDistribution[rating as keyof typeof ratingDistribution] /
                                totalReviews) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground min-w-[30px] text-right">
                    {ratingDistribution[rating as keyof typeof ratingDistribution]}
                  </span>
                </div>
              ))}
            </div>

            {/* Create Review Button */}
            {showCreateReview && (
              <div className="flex items-center justify-center">
                <Button onClick={onCreateReviewClick} className="w-full">
                  Write a Review
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters and Sorting */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="helpful">Most Helpful</SelectItem>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="highest-rated">Highest Rated</SelectItem>
            <SelectItem value="lowest-rated">Lowest Rated</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filterRating}
          onValueChange={(value) => setFilterRating(value as FilterRating)}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by rating..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
            <SelectItem value="4">4 Stars</SelectItem>
            <SelectItem value="3">3 Stars</SelectItem>
            <SelectItem value="2">2 Stars</SelectItem>
            <SelectItem value="1">1 Star</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reviews List */}
      {paginatedReviews.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {totalReviews === 0
              ? 'No reviews yet. Be the first to review this product!'
              : 'No reviews match the selected filters.'}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {paginatedReviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                {/* Review Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={review.userAvatar} />
                      <AvatarFallback>{review.userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{review.userName}</p>
                        {review.isVerifiedPurchase && (
                          <Badge variant="secondary" className="text-xs">
                            Verified Purchase
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={cn(
                                'h-3 w-3',
                                star <= review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-muted-foreground'
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review Content */}
                <div className="mb-4">
                  {review.title && (
                    <h4 className="font-semibold text-base mb-2">{review.title}</h4>
                  )}
                  <p className="text-sm text-foreground leading-relaxed">
                    {review.content}
                  </p>
                </div>

                {/* Review Images */}
                {review.images && review.images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    {review.images.slice(0, 4).map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Review image ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    ))}
                    {review.images.length > 4 && (
                      <div className="relative w-full h-24 bg-muted rounded-lg flex items-center justify-center">
                        <span className="text-sm font-semibold text-muted-foreground">
                          +{review.images.length - 4} more
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Review Actions */}
                <div className="flex items-center gap-4 pt-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleHelpful(review.id)}
                    className={cn(
                      'gap-2',
                      helpfulVotes[review.id] && 'text-primary'
                    )}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span className="text-xs">
                      Helpful{' '}
                      {(helpfulVotes[review.id]
                        ? (review.helpfulCount || 0) + 1
                        : review.helpfulCount || 0) > 0 &&
                        `(${
                          helpfulVotes[review.id]
                            ? (review.helpfulCount || 0) + 1
                            : review.helpfulCount || 0
                        })`}
                    </span>
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <ThumbsDown className="h-4 w-4" />
                    <span className="text-xs">Not Helpful</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(startIndex + REVIEWS_PER_PAGE, sortedReviews.length)} of{' '}
            {sortedReviews.length} reviews
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="min-w-[36px]"
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

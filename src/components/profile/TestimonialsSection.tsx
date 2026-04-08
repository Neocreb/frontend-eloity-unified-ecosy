import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, MessageCircle, ChevronLeft, ChevronRight, Pin, Trash2, ExternalLink } from 'lucide-react';
import { cn } from '@/utils/utils';

export interface Testimonial {
  id: string;
  authorName: string;
  authorRole?: string;
  authorCompany?: string;
  authorAvatar?: string;
  rating: number;
  title?: string;
  content: string;
  createdAt: string;
  isPinned?: boolean;
  helpfulCount?: number;
  source?: 'marketplace' | 'freelance' | 'trading' | 'direct';
  relatedService?: {
    id: string;
    name: string;
  };
}

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
  isOwner?: boolean;
  onPin?: (testimonialId: string) => void;
  onRemove?: (testimonialId: string) => void;
  showAllLink?: string;
}

const ratingConfig = {
  5: { label: 'Excellent', color: 'text-yellow-400', bgColor: 'bg-yellow-50' },
  4: { label: 'Very Good', color: 'text-yellow-300', bgColor: 'bg-yellow-50' },
  3: { label: 'Good', color: 'text-gray-300', bgColor: 'bg-gray-50' },
  2: { label: 'Fair', color: 'text-gray-400', bgColor: 'bg-gray-50' },
  1: { label: 'Poor', color: 'text-gray-400', bgColor: 'bg-gray-50' },
};

const renderStars = (rating: number) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={cn(
            'h-4 w-4 transition-colors',
            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          )}
        />
      ))}
    </div>
  );
};

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({
  testimonials = [],
  isOwner = false,
  onPin,
  onRemove,
  showAllLink,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 2;

  if (testimonials.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            Testimonials
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="mb-2">No testimonials yet</p>
            <p className="text-sm">{isOwner ? 'When clients leave reviews, they\'ll appear here' : 'This user hasn\'t received testimonials yet'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pinnedTestimonials = testimonials.filter(t => t.isPinned).slice(0, 1);
  const otherTestimonials = testimonials.filter(t => !t.isPinned);
  const paginated = otherTestimonials.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  const totalPages = Math.ceil(otherTestimonials.length / itemsPerPage);

  const averageRating = (testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            Testimonials ({testimonials.length})
          </CardTitle>
          {testimonials.length > 0 && (
            <div className="flex items-center gap-2">
              {renderStars(Math.round(parseFloat(averageRating)))}
              <span className="text-sm font-medium text-gray-700">{averageRating}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pinned Testimonial */}
        {pinnedTestimonials.length > 0 && (
          <div className="border-l-4 border-blue-600 bg-blue-50 p-4 rounded-lg mb-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3 flex-1">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={pinnedTestimonials[0].authorAvatar} />
                  <AvatarFallback>{pinnedTestimonials[0].authorName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900">{pinnedTestimonials[0].authorName}</p>
                    {pinnedTestimonials[0].authorRole && (
                      <p className="text-xs text-gray-600">{pinnedTestimonials[0].authorRole}</p>
                    )}
                  </div>
                  {pinnedTestimonials[0].authorCompany && (
                    <p className="text-xs text-gray-600">{pinnedTestimonials[0].authorCompany}</p>
                  )}
                </div>
              </div>
              {isOwner && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove?.(pinnedTestimonials[0].id)}
                  className="h-8 w-8 p-0 text-gray-600 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="mb-3">
              {renderStars(pinnedTestimonials[0].rating)}
            </div>
            {pinnedTestimonials[0].title && (
              <p className="font-medium text-gray-900 mb-2">{pinnedTestimonials[0].title}</p>
            )}
            <p className="text-gray-700 text-sm mb-3">{pinnedTestimonials[0].content}</p>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Badge variant="outline" className="text-xs">
                <Pin className="h-3 w-3 mr-1" />
                Featured
              </Badge>
              <span>{new Date(pinnedTestimonials[0].createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        )}

        {/* Other Testimonials */}
        <div className="space-y-3">
          {paginated.map(testimonial => (
            <div
              key={testimonial.id}
              className="border rounded-lg p-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    <AvatarImage src={testimonial.authorAvatar} />
                    <AvatarFallback>{testimonial.authorName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{testimonial.authorName}</p>
                    {testimonial.authorRole && (
                      <p className="text-xs text-gray-600">{testimonial.authorRole}</p>
                    )}
                  </div>
                </div>
                {isOwner && (
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onPin?.(testimonial.id)}
                      className="h-8 w-8 p-0 text-gray-600 hover:text-blue-600"
                      title="Pin testimonial"
                    >
                      <Pin className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove?.(testimonial.id)}
                      className="h-8 w-8 p-0 text-gray-600 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mb-2">
                {renderStars(testimonial.rating)}
                <span className="text-xs font-medium text-gray-600">
                  {ratingConfig[testimonial.rating as keyof typeof ratingConfig]?.label}
                </span>
              </div>

              {testimonial.title && (
                <p className="font-medium text-gray-900 text-sm mb-1">{testimonial.title}</p>
              )}
              <p className="text-gray-700 text-sm mb-3 line-clamp-3">{testimonial.content}</p>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{new Date(testimonial.createdAt).toLocaleDateString()}</span>
                {testimonial.relatedService && (
                  <span className="text-blue-600 font-medium">{testimonial.relatedService.name}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {otherTestimonials.length > itemsPerPage && (
          <div className="flex items-center justify-between pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-xs text-gray-600">
              Page {currentPage + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
              className="gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* View All Link */}
        {showAllLink && testimonials.length > itemsPerPage && (
          <div className="flex justify-center pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-blue-600 hover:text-blue-700"
              onClick={() => window.location.href = showAllLink}
            >
              View all testimonials
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TestimonialsSection;

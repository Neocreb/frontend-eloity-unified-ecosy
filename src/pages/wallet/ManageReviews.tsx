import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Star, Trash2, Edit2, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useServiceReviews } from '@/hooks/useServiceReviews';
import { serviceReviewService } from '@/services/serviceReviewService';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

// Service names mapping
const SERVICE_NAMES: Record<string, string> = {
  'deposit': 'Deposit',
  'send-money': 'Send Money',
  'withdraw': 'Withdraw',
  'airtime': 'Buy Airtime',
  'data': 'Buy Data',
  'electricity': 'Pay Electricity Bills',
  'tv': 'Pay TV Bills',
  'top-up': 'Top Up Services',
  'pay-bills': 'Pay Bills',
  'buy-gift-cards': 'Buy Gift Cards',
  'sell-gift-cards': 'Sell Gift Cards',
  'transfer': 'Transfer Money',
  'crypto': 'Crypto Trading',
  'marketplace': 'Marketplace',
  'freelance': 'Freelance Platform',
  'gifts': 'Send Gifts',
  'safebox': 'Safe Box',
  'request': 'Request Money',
  'referral': 'Referral Program',
  'investments': 'Investments',
  'virtual-card': 'Virtual Card',
  'physical-card': 'Physical Card',
  'travel': 'Travel Services',
};

// Service icons mapping
const SERVICE_ICONS: Record<string, string> = {
  'deposit': '💰',
  'send-money': '📤',
  'withdraw': '💸',
  'airtime': '📱',
  'data': '📶',
  'electricity': '⚡',
  'tv': '📺',
  'top-up': '⬆️',
  'pay-bills': '📋',
  'buy-gift-cards': '🎁',
  'sell-gift-cards': '💳',
  'transfer': '↔️',
  'crypto': '🪙',
  'marketplace': '🛍️',
  'freelance': '👨‍💼',
  'gifts': '🎉',
  'safebox': '🔒',
  'request': '🙏',
  'referral': '👥',
  'investments': '📈',
  'virtual-card': '💳',
  'physical-card': '🏦',
  'travel': '✈️',
};

interface UserReviewWithService {
  id: string;
  serviceId: string;
  serviceName: string;
  serviceIcon: string;
  rating: number;
  reviewText?: string;
  isHelpful: number;
  createdAt: string;
  updatedAt: string;
}

const ManageReviewsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [userReviews, setUserReviews] = useState<UserReviewWithService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editText, setEditText] = useState('');

  // Load user's reviews across all services
  useEffect(() => {
    const loadUserReviews = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        const allReviews = await serviceReviewService.getUserReviewsForAllServices(user.id);
        
        // Transform reviews to include service information
        const reviewsWithServices: UserReviewWithService[] = allReviews.map(review => ({
          ...review,
          serviceName: SERVICE_NAMES[review.serviceId] || review.serviceId,
          serviceIcon: SERVICE_ICONS[review.serviceId] || '🔧',
        }));

        setUserReviews(reviewsWithServices.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      } catch (error) {
        console.error('Error loading user reviews:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your reviews',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadUserReviews();
  }, [user?.id, toast]);

  // Handle review deletion
  const handleDeleteReview = async (reviewId: string, serviceId: string) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    try {
      setIsDeleting(reviewId);
      await serviceReviewService.deleteReview(reviewId);
      
      setUserReviews(prev => prev.filter(r => r.id !== reviewId));
      
      toast({
        title: 'Success',
        description: 'Review deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting review:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete review',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  // Handle review edit submit
  const handleEditSubmit = async (review: UserReviewWithService) => {
    if (!user?.id) return;

    try {
      setIsDeleting(review.id); // Reuse loading state
      
      await serviceReviewService.submitReview(user.id, {
        serviceId: review.serviceId,
        rating: editRating,
        reviewText: editText,
      });

      // Update local state
      setUserReviews(prev => prev.map(r =>
        r.id === review.id
          ? { ...r, rating: editRating, reviewText: editText, updatedAt: new Date().toISOString() }
          : r
      ));

      setEditingId(null);
      
      toast({
        title: 'Success',
        description: 'Review updated successfully',
      });
    } catch (error) {
      console.error('Error updating review:', error);
      toast({
        title: 'Error',
        description: 'Failed to update review',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  // Render star rating
  const renderStars = (rating: number, onClick?: (rate: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => onClick?.(star)}
            disabled={!onClick}
            className={`transition-colors ${
              star <= rating
                ? 'text-yellow-400'
                : 'text-gray-300'
            } ${onClick ? 'cursor-pointer hover:text-yellow-300' : ''}`}
          >
            <Star className="h-5 w-5 fill-current" />
          </button>
        ))}
      </div>
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-10 w-10"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Reviews</h1>
            <p className="text-sm text-gray-600">Manage your service reviews and ratings</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 pb-20">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader className="h-8 w-8 text-purple-600 animate-spin mb-4" />
            <p className="text-gray-600">Loading your reviews...</p>
          </div>
        ) : userReviews.length === 0 ? (
          <div className="text-center py-12 px-6 bg-white rounded-2xl border border-gray-200">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reviews Yet</h3>
            <p className="text-gray-600 mb-6">
              You haven't left any reviews on our services yet. Start reviewing to help other users make informed decisions!
            </p>
            <Button
              onClick={() => navigate('/app/wallet')}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Browse Services
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {userReviews.map(review => (
              <div key={review.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                {/* Review Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="text-3xl">{review.serviceIcon}</div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{review.serviceName}</h3>
                        <div className="flex items-center gap-3 mt-2">
                          {editingId === review.id ? (
                            renderStars(editRating, setEditRating)
                          ) : (
                            <div className="flex items-center gap-1">
                              {renderStars(review.rating)}
                              <span className="text-sm text-gray-600 ml-2">
                                {review.rating}/5
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {editingId === review.id ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                            className="text-gray-600"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleEditSubmit(review)}
                            disabled={isDeleting === review.id}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            {isDeleting === review.id ? 'Saving...' : 'Save'}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingId(review.id);
                              setEditRating(review.rating);
                              setEditText(review.reviewText || '');
                            }}
                            className="text-blue-600 hover:bg-blue-50"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteReview(review.id, review.serviceId)}
                            disabled={isDeleting === review.id}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Review Content */}
                <div className="p-6">
                  {editingId === review.id ? (
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      placeholder="Share your experience with this service..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                      rows={4}
                      maxLength={500}
                    />
                  ) : review.reviewText ? (
                    <p className="text-gray-700 leading-relaxed">{review.reviewText}</p>
                  ) : (
                    <p className="text-gray-500 italic">No review text provided</p>
                  )}

                  {/* Review Footer */}
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {review.isHelpful > 0 && (
                        <>
                          {review.isHelpful} {review.isHelpful === 1 ? 'person found' : 'people found'} this helpful
                        </>
                      )}
                    </span>
                    <span className="text-gray-400">
                      {formatDate(review.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageReviewsPage;

import { ReviewService, ReviewCreateInput } from '@/services/reviewService';
import { supabase } from '@/integrations/supabase/client';
import type { Review } from '@/types/marketplace';

// Mock supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('ReviewService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockReview = {
    id: '1',
    product_id: 'prod-1',
    user_id: 'user-1',
    order_id: 'order-1',
    rating: 5,
    title: 'Great product!',
    content: 'This product is amazing',
    images: ['https://example.com/image.jpg'],
    verified_purchase: true,
    helpful_count: 10,
    is_featured: true,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  };

  // Product Reviews Retrieval Tests
  describe('getProductReviews', () => {
    it('should fetch all reviews for a product', async () => {
      const mockData = [mockReview];
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockData, error: null }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await ReviewService.getProductReviews('prod-1');

      expect(result).toHaveLength(1);
      expect(result[0].productId).toBe('prod-1');
      expect(result[0].rating).toBe(5);
    });

    it('should return empty array if no reviews found', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await ReviewService.getProductReviews('prod-1');

      expect(result).toEqual([]);
    });

    it('should handle Supabase errors gracefully', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await ReviewService.getProductReviews('prod-1');

      expect(result).toEqual([]);
    });

    it('should order reviews by creation date descending', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      await ReviewService.getProductReviews('prod-1');

      const orderCall = mockSelect.mock.results[0].value.eq.mock.results[0].value.order.mock.calls[0];
      expect(orderCall[0]).toBe('created_at');
      expect(orderCall[1].ascending).toBe(false);
    });
  });

  // Single Review Retrieval Tests
  describe('getReviewById', () => {
    it('should fetch a single review by ID', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockReview, error: null }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await ReviewService.getReviewById('1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('1');
      expect(result?.rating).toBe(5);
    });

    it('should return null if review not found', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await ReviewService.getReviewById('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await ReviewService.getReviewById('1');

      expect(result).toBeNull();
    });
  });

  // Review Creation Tests
  describe('createReview', () => {
    it('should create a new review successfully', async () => {
      const reviewInput: ReviewCreateInput = {
        productId: 'prod-1',
        userId: 'user-1',
        rating: 5,
        title: 'Great!',
        content: 'Amazing product',
      };

      const mockSelect = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: mockReview,
          error: null,
        }),
      });

      const mockInsert = jest.fn().mockReturnValue({
        select: mockSelect,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const result = await ReviewService.createReview(reviewInput);

      expect(result).not.toBeNull();
      expect(result?.productId).toBe('prod-1');
      expect(result?.rating).toBe(5);
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should handle missing optional fields', async () => {
      const reviewInput: ReviewCreateInput = {
        productId: 'prod-1',
        userId: 'user-1',
        rating: 3,
      };

      const mockSelect = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { ...mockReview, title: null, content: null },
          error: null,
        }),
      });

      const mockInsert = jest.fn().mockReturnValue({
        select: mockSelect,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const result = await ReviewService.createReview(reviewInput);

      expect(result?.title).toBe('');
      expect(result?.content).toBe('');
    });

    it('should handle creation errors', async () => {
      const reviewInput: ReviewCreateInput = {
        productId: 'prod-1',
        userId: 'user-1',
        rating: 5,
      };

      const mockSelect = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Creation failed' },
        }),
      });

      const mockInsert = jest.fn().mockReturnValue({
        select: mockSelect,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const result = await ReviewService.createReview(reviewInput);

      expect(result).toBeNull();
    });
  });

  // Review Update Tests
  describe('updateReview', () => {
    it('should update review rating', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { ...mockReview, rating: 4 },
          error: null,
        }),
      });

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: mockSelect,
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await ReviewService.updateReview('1', { rating: 4 });

      expect(result?.rating).toBe(4);
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should update review content', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { ...mockReview, content: 'Updated content' },
          error: null,
        }),
      });

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: mockSelect,
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await ReviewService.updateReview('1', { content: 'Updated content' });

      expect(result?.content).toBe('Updated content');
    });

    it('should handle update errors', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Update failed' },
        }),
      });

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: mockSelect,
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await ReviewService.updateReview('1', { rating: 3 });

      expect(result).toBeNull();
    });
  });

  // Review Deletion Tests
  describe('deleteReview', () => {
    it('should delete a review successfully', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        delete: mockDelete,
      });

      const result = await ReviewService.deleteReview('1');

      expect(result).toBe(true);
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should handle deletion errors', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: { message: 'Deletion failed' },
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        delete: mockDelete,
      });

      const result = await ReviewService.deleteReview('1');

      expect(result).toBe(false);
    });
  });

  // Rating Calculation Tests
  describe('getProductAverageRating', () => {
    it('should calculate average rating for a product', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [{ rating: 5 }, { rating: 4 }, { rating: 3 }],
          error: null,
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await ReviewService.getProductAverageRating('prod-1');

      expect(result.averageRating).toBe(4);
      expect(result.reviewCount).toBe(3);
    });

    it('should return 0 rating if no reviews found', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await ReviewService.getProductAverageRating('prod-1');

      expect(result.averageRating).toBe(0);
      expect(result.reviewCount).toBe(0);
    });

    it('should handle database errors in rating calculation', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await ReviewService.getProductAverageRating('prod-1');

      expect(result.averageRating).toBe(0);
      expect(result.reviewCount).toBe(0);
    });
  });

  // Helpful Voting Tests
  describe('markReviewAsHelpful', () => {
    it('should increment helpful count', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { helpful_count: 10 },
            error: null,
          }),
        }),
      });

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({ select: mockSelect })
        .mockReturnValueOnce({ update: mockUpdate });

      const result = await ReviewService.markReviewAsHelpful('1');

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({ helpful_count: 11 });
    });

    it('should handle helpful marking errors', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Error' },
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await ReviewService.markReviewAsHelpful('1');

      expect(result).toBe(false);
    });
  });

  // Moderation Tests
  describe('approveReview', () => {
    it('should approve a review', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await ReviewService.approveReview('1');

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should handle approval errors', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: { message: 'Approval failed' },
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await ReviewService.approveReview('1');

      expect(result).toBe(false);
    });
  });

  describe('rejectReview', () => {
    it('should reject a review', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await ReviewService.rejectReview('1', 'Spam');

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should handle rejection errors', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: { message: 'Rejection failed' },
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await ReviewService.rejectReview('1');

      expect(result).toBe(false);
    });
  });

  describe('addSellerResponse', () => {
    it('should add a seller response to a review', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await ReviewService.addSellerResponse('1', 'seller-1', 'Thank you!');

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should handle seller response errors', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: { message: 'Response failed' },
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await ReviewService.addSellerResponse('1', 'seller-1', 'Thank you!');

      expect(result).toBe(false);
    });
  });

  // Pending Reviews Tests
  describe('getPendingReviews', () => {
    it('should fetch pending reviews for moderation', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [mockReview],
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await ReviewService.getPendingReviews();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should return empty array if no pending reviews', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await ReviewService.getPendingReviews();

      expect(result).toEqual([]);
    });
  });

  // Analytics Tests
  describe('getReviewCategories', () => {
    it('should get review categories', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [mockReview, { ...mockReview, id: '2' }],
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await ReviewService.getReviewCategories('prod-1');

      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array if no reviews for categories', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await ReviewService.getReviewCategories('prod-1');

      expect(result).toEqual([]);
    });
  });

  describe('getReviewSentiment', () => {
    it('should analyze review sentiment', async () => {
      const reviews = [
        { ...mockReview, rating: 5 },
        { ...mockReview, id: '2', rating: 3 },
        { ...mockReview, id: '3', rating: 2 },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: reviews,
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await ReviewService.getReviewSentiment('prod-1');

      expect(result.positive).toBe(1);
      expect(result.neutral).toBe(1);
      expect(result.negative).toBe(1);
    });

    it('should return zero sentiment if no reviews', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await ReviewService.getReviewSentiment('prod-1');

      expect(result.positive).toBe(0);
      expect(result.neutral).toBe(0);
      expect(result.negative).toBe(0);
    });
  });
});

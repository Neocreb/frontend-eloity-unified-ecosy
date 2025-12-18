import { supabase } from "@/integrations/supabase/client";
import type { Review } from "@/types/marketplace";

export interface ReviewCreateInput {
  productId: string;
  userId: string;
  orderId?: string;
  rating: number;
  title?: string;
  content?: string;
  images?: string[];
  verifiedPurchase?: boolean;
}

export class ReviewService {
  /**
   * Get reviews for a product
   * Uses the canonical 'product_reviews' table
   */
  static async getProductReviews(productId: string): Promise<Review[]> {
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select(`
          id,
          product_id,
          user_id,
          order_id,
          rating,
          title,
          content,
          images,
          verified_purchase,
          helpful_count,
          is_featured,
          created_at,
          updated_at,
          user:users(full_name, avatar_url)
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching product reviews:", error);
        return [];
      }

      if (!data) return [];

      return data.map((review: any) => ({
        id: review.id,
        productId: review.product_id,
        userId: review.user_id,
        orderId: review.order_id,
        rating: review.rating,
        title: review.title || "",
        content: review.content || "",
        images: review.images || [],
        verifiedPurchase: review.verified_purchase || false,
        helpfulCount: review.helpful_count || 0,
        isFeatured: review.is_featured || false,
        userName: review.user?.full_name || "Anonymous",
        userAvatar: review.user?.avatar_url || "",
        createdAt: new Date(review.created_at).toISOString(),
        updatedAt: new Date(review.updated_at).toISOString()
      }));
    } catch (error) {
      console.error("Error in getProductReviews:", error);
      return [];
    }
  }

  /**
   * Get a single review by ID
   */
  static async getReviewById(reviewId: string): Promise<Review | null> {
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select(`
          *,
          user:users(full_name, avatar_url)
        `)
        .eq('id', reviewId)
        .single();

      if (error) {
        console.error("Error fetching review:", error);
        return null;
      }

      if (!data) return null;

      return {
        id: data.id,
        productId: data.product_id,
        userId: data.user_id,
        orderId: data.order_id,
        rating: data.rating,
        title: data.title || "",
        content: data.content || "",
        images: data.images || [],
        verifiedPurchase: data.verified_purchase || false,
        helpfulCount: data.helpful_count || 0,
        isFeatured: data.is_featured || false,
        userName: data.user?.full_name || "Anonymous",
        userAvatar: data.user?.avatar_url || "",
        createdAt: new Date(data.created_at).toISOString(),
        updatedAt: new Date(data.updated_at).toISOString()
      };
    } catch (error) {
      console.error("Error in getReviewById:", error);
      return null;
    }
  }

  /**
   * Create a new review
   */
  static async createReview(input: ReviewCreateInput): Promise<Review | null> {
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .insert([{
          product_id: input.productId,
          user_id: input.userId,
          order_id: input.orderId || null,
          rating: input.rating,
          title: input.title || null,
          content: input.content || null,
          images: input.images || null,
          verified_purchase: input.verifiedPurchase || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select(`
          *,
          user:users(full_name, avatar_url)
        `)
        .single();

      if (error) {
        console.error("Error creating review:", error);
        return null;
      }

      return {
        id: data.id,
        productId: data.product_id,
        userId: data.user_id,
        orderId: data.order_id,
        rating: data.rating,
        title: data.title || "",
        content: data.content || "",
        images: data.images || [],
        verifiedPurchase: data.verified_purchase || false,
        helpfulCount: data.helpful_count || 0,
        isFeatured: data.is_featured || false,
        userName: data.user?.full_name || "Anonymous",
        userAvatar: data.user?.avatar_url || "",
        createdAt: new Date(data.created_at).toISOString(),
        updatedAt: new Date(data.updated_at).toISOString()
      };
    } catch (error) {
      console.error("Error in createReview:", error);
      return null;
    }
  }

  /**
   * Update an existing review
   */
  static async updateReview(reviewId: string, input: Partial<ReviewCreateInput>): Promise<Review | null> {
    try {
      const updateData: any = { updated_at: new Date().toISOString() };
      
      if (input.rating !== undefined) updateData.rating = input.rating;
      if (input.title !== undefined) updateData.title = input.title;
      if (input.content !== undefined) updateData.content = input.content;
      if (input.images !== undefined) updateData.images = input.images;

      const { data, error } = await supabase
        .from('product_reviews')
        .update(updateData)
        .eq('id', reviewId)
        .select(`
          *,
          user:users(full_name, avatar_url)
        `)
        .single();

      if (error) {
        console.error("Error updating review:", error);
        return null;
      }

      return {
        id: data.id,
        productId: data.product_id,
        userId: data.user_id,
        orderId: data.order_id,
        rating: data.rating,
        title: data.title || "",
        content: data.content || "",
        images: data.images || [],
        verifiedPurchase: data.verified_purchase || false,
        helpfulCount: data.helpful_count || 0,
        isFeatured: data.is_featured || false,
        userName: data.user?.full_name || "Anonymous",
        userAvatar: data.user?.avatar_url || "",
        createdAt: new Date(data.created_at).toISOString(),
        updatedAt: new Date(data.updated_at).toISOString()
      };
    } catch (error) {
      console.error("Error in updateReview:", error);
      return null;
    }
  }

  /**
   * Delete a review
   */
  static async deleteReview(reviewId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('product_reviews')
        .delete()
        .eq('id', reviewId);

      if (error) {
        console.error("Error deleting review:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in deleteReview:", error);
      return false;
    }
  }

  /**
   * Get average rating for a product
   */
  static async getProductAverageRating(productId: string): Promise<{ averageRating: number; reviewCount: number }> {
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('rating', { count: 'exact' })
        .eq('product_id', productId);

      if (error) {
        console.error("Error getting average rating:", error);
        return { averageRating: 0, reviewCount: 0 };
      }

      if (!data || data.length === 0) {
        return { averageRating: 0, reviewCount: 0 };
      }

      const average = data.reduce((sum, item) => sum + (item.rating || 0), 0) / data.length;
      return {
        averageRating: Math.round(average * 100) / 100,
        reviewCount: data.length
      };
    } catch (error) {
      console.error("Error in getProductAverageRating:", error);
      return { averageRating: 0, reviewCount: 0 };
    }
  }

  /**
   * Mark review as helpful
   */
  static async markReviewAsHelpful(reviewId: string): Promise<boolean> {
    try {
      const { data: currentData } = await supabase
        .from('product_reviews')
        .select('helpful_count')
        .eq('id', reviewId)
        .single();

      const newCount = (currentData?.helpful_count || 0) + 1;

      const { error } = await supabase
        .from('product_reviews')
        .update({ helpful_count: newCount })
        .eq('id', reviewId);

      if (error) {
        console.error("Error marking review as helpful:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in markReviewAsHelpful:", error);
      return false;
    }
  }
}

export const reviewService = new ReviewService();

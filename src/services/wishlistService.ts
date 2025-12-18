import { supabase } from "@/integrations/supabase/client";
import type { WishlistItem } from "@/types/enhanced-marketplace";

export interface Wishlist {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
}

export class WishlistService {
  /**
   * Get all wishlist items for a user
   * Uses the canonical 'wishlist' table (one row per product)
   */
  static async getUserWishlist(userId: string): Promise<WishlistItem[]> {
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          id,
          user_id,
          product_id,
          created_at,
          products(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching user wishlist:", error);
        return [];
      }

      if (!data) return [];

      return data.map((item: any) => ({
        id: item.id,
        productId: item.product_id,
        product: item.products ? {
          id: item.products.id,
          name: item.products.name || item.products.title,
          description: item.products.description || "",
          price: item.products.price,
          discountPrice: item.products.discount_price,
          image: item.products.image || item.products.image_url || "",
          category: item.products.category || "",
          rating: item.products.rating || 0,
          reviewCount: item.products.review_count || item.products.reviews_count || 0,
          inStock: item.products.in_stock || false,
          stockQuantity: item.products.stock_quantity || 0,
          sellerName: item.products.seller_name || "Unknown Seller",
          sellerVerified: item.products.seller_verified || false,
          createdAt: new Date(item.products.created_at).toISOString(),
          updatedAt: new Date(item.products.updated_at).toISOString()
        } : undefined,
        addedAt: new Date(item.created_at).toISOString()
      }));
    } catch (error) {
      console.error("Error in getUserWishlist:", error);
      return [];
    }
  }

  /**
   * Add product to user's wishlist
   */
  static async addToWishlist(userId: string, productId: string): Promise<Wishlist | null> {
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .insert([{
          user_id: userId,
          product_id: productId,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        // If it's a unique constraint error, it's already in wishlist
        if (error.code === '23505') {
          console.info("Product already in wishlist");
          return null;
        }
        console.error("Error adding to wishlist:", error);
        return null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        productId: data.product_id,
        createdAt: new Date(data.created_at).toISOString()
      };
    } catch (error) {
      console.error("Error in addToWishlist:", error);
      return null;
    }
  }

  /**
   * Remove product from user's wishlist
   */
  static async removeFromWishlist(userId: string, productId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);

      if (error) {
        console.error("Error removing from wishlist:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in removeFromWishlist:", error);
      return false;
    }
  }

  /**
   * Check if product is in user's wishlist
   */
  static async isInWishlist(userId: string, productId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .maybeSingle();

      if (error) {
        console.error("Error checking wishlist:", error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error("Error in isInWishlist:", error);
      return false;
    }
  }

  /**
   * Clear entire wishlist for a user
   */
  static async clearWishlist(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error("Error clearing wishlist:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in clearWishlist:", error);
      return false;
    }
  }

  /**
   * Get wishlist count for a user
   */
  static async getWishlistCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('wishlist')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        console.error("Error getting wishlist count:", error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error("Error in getWishlistCount:", error);
      return 0;
    }
  }
}

export const wishlistService = new WishlistService();

import { supabase } from "@/integrations/supabase/client";
import type { WishlistItem } from "@/types/enhanced-marketplace";

export interface Wishlist {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
}

export interface WishlistCollection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
}

export interface PriceAlert {
  id: string;
  userId: string;
  productId: string;
  targetPrice: number;
  currentPrice: number;
  isActive: boolean;
  createdAt: string;
  triggeredAt?: string;
}

export interface BackInStockAlert {
  id: string;
  userId: string;
  productId: string;
  isActive: boolean;
  createdAt: string;
  triggeredAt?: string;
}

export interface WishlistShare {
  id: string;
  collectionId: string;
  sharedWith: string; // user email or id
  shareToken?: string;
  expiresAt?: string;
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

  // Wishlist Collections Methods

  /**
   * Create a new wishlist collection
   */
  static async createCollection(
    userId: string,
    name: string,
    description?: string,
    isPublic: boolean = false
  ): Promise<WishlistCollection | null> {
    try {
      const { data, error } = await supabase
        .from('wishlist_collections')
        .insert([{
          user_id: userId,
          name,
          description: description || null,
          is_public: isPublic,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error("Error creating collection:", error);
        return null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        description: data.description,
        isPublic: data.is_public,
        createdAt: new Date(data.created_at).toISOString()
      };
    } catch (error) {
      console.error("Error in createCollection:", error);
      return null;
    }
  }

  /**
   * Get all collections for a user
   */
  static async getUserCollections(userId: string): Promise<WishlistCollection[]> {
    try {
      const { data, error } = await supabase
        .from('wishlist_collections')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching collections:", error);
        return [];
      }

      if (!data) return [];

      return data.map((col: any) => ({
        id: col.id,
        userId: col.user_id,
        name: col.name,
        description: col.description,
        isPublic: col.is_public,
        createdAt: new Date(col.created_at).toISOString()
      }));
    } catch (error) {
      console.error("Error in getUserCollections:", error);
      return [];
    }
  }

  /**
   * Update a collection
   */
  static async updateCollection(
    collectionId: string,
    updates: {
      name?: string;
      description?: string;
      isPublic?: boolean;
    }
  ): Promise<WishlistCollection | null> {
    try {
      const { data, error } = await supabase
        .from('wishlist_collections')
        .update({
          ...(updates.name && { name: updates.name }),
          ...(updates.description !== undefined && { description: updates.description || null }),
          ...(updates.isPublic !== undefined && { is_public: updates.isPublic })
        })
        .eq('id', collectionId)
        .select()
        .single();

      if (error) {
        console.error("Error updating collection:", error);
        return null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        description: data.description,
        isPublic: data.is_public,
        createdAt: new Date(data.created_at).toISOString()
      };
    } catch (error) {
      console.error("Error in updateCollection:", error);
      return null;
    }
  }

  /**
   * Delete a collection
   */
  static async deleteCollection(collectionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('wishlist_collections')
        .delete()
        .eq('id', collectionId);

      if (error) {
        console.error("Error deleting collection:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in deleteCollection:", error);
      return false;
    }
  }

  /**
   * Add product to a collection
   */
  static async addToCollection(
    collectionId: string,
    productId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('wishlist_collection_items')
        .insert([{
          collection_id: collectionId,
          product_id: productId,
          added_at: new Date().toISOString()
        }]);

      if (error) {
        // If unique constraint error, already in collection
        if (error.code === '23505') {
          console.info("Product already in collection");
          return true;
        }
        console.error("Error adding to collection:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in addToCollection:", error);
      return false;
    }
  }

  /**
   * Remove product from a collection
   */
  static async removeFromCollection(
    collectionId: string,
    productId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('wishlist_collection_items')
        .delete()
        .eq('collection_id', collectionId)
        .eq('product_id', productId);

      if (error) {
        console.error("Error removing from collection:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in removeFromCollection:", error);
      return false;
    }
  }

  /**
   * Get items in a collection
   */
  static async getCollectionItems(collectionId: string): Promise<WishlistItem[]> {
    try {
      const { data, error } = await supabase
        .from('wishlist_collection_items')
        .select(`
          product_id,
          added_at,
          products(*)
        `)
        .eq('collection_id', collectionId)
        .order('added_at', { ascending: false });

      if (error) {
        console.error("Error fetching collection items:", error);
        return [];
      }

      if (!data) return [];

      return data.map((item: any) => ({
        id: `${collectionId}-${item.product_id}`,
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
        addedAt: new Date(item.added_at).toISOString()
      }));
    } catch (error) {
      console.error("Error in getCollectionItems:", error);
      return [];
    }
  }

  // Price Alert Methods

  /**
   * Create a price alert for a product
   */
  static async createPriceAlert(
    userId: string,
    productId: string,
    targetPrice: number,
    currentPrice: number
  ): Promise<PriceAlert | null> {
    try {
      const { data, error } = await supabase
        .from('price_alerts')
        .insert([{
          user_id: userId,
          product_id: productId,
          target_price: targetPrice,
          current_price: currentPrice,
          is_active: true,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error("Error creating price alert:", error);
        return null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        productId: data.product_id,
        targetPrice: data.target_price,
        currentPrice: data.current_price,
        isActive: data.is_active,
        createdAt: new Date(data.created_at).toISOString(),
        triggeredAt: data.triggered_at ? new Date(data.triggered_at).toISOString() : undefined
      };
    } catch (error) {
      console.error("Error in createPriceAlert:", error);
      return null;
    }
  }

  /**
   * Get active price alerts for a user
   */
  static async getUserPriceAlerts(userId: string): Promise<PriceAlert[]> {
    try {
      const { data, error } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching price alerts:", error);
        return [];
      }

      if (!data) return [];

      return data.map((alert: any) => ({
        id: alert.id,
        userId: alert.user_id,
        productId: alert.product_id,
        targetPrice: alert.target_price,
        currentPrice: alert.current_price,
        isActive: alert.is_active,
        createdAt: new Date(alert.created_at).toISOString(),
        triggeredAt: alert.triggered_at ? new Date(alert.triggered_at).toISOString() : undefined
      }));
    } catch (error) {
      console.error("Error in getUserPriceAlerts:", error);
      return [];
    }
  }

  /**
   * Delete a price alert
   */
  static async deletePriceAlert(alertId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('price_alerts')
        .delete()
        .eq('id', alertId);

      if (error) {
        console.error("Error deleting price alert:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in deletePriceAlert:", error);
      return false;
    }
  }

  /**
   * Disable a price alert (instead of deleting)
   */
  static async disablePriceAlert(alertId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('price_alerts')
        .update({ is_active: false })
        .eq('id', alertId);

      if (error) {
        console.error("Error disabling price alert:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in disablePriceAlert:", error);
      return false;
    }
  }

  // Back in Stock Alert Methods

  /**
   * Create a back-in-stock alert
   */
  static async createBackInStockAlert(
    userId: string,
    productId: string
  ): Promise<BackInStockAlert | null> {
    try {
      const { data, error } = await supabase
        .from('back_in_stock_alerts')
        .insert([{
          user_id: userId,
          product_id: productId,
          is_active: true,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        // If unique constraint error, already has alert
        if (error.code === '23505') {
          console.info("Alert already exists for this product");
          return null;
        }
        console.error("Error creating back-in-stock alert:", error);
        return null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        productId: data.product_id,
        isActive: data.is_active,
        createdAt: new Date(data.created_at).toISOString(),
        triggeredAt: data.triggered_at ? new Date(data.triggered_at).toISOString() : undefined
      };
    } catch (error) {
      console.error("Error in createBackInStockAlert:", error);
      return null;
    }
  }

  /**
   * Get active back-in-stock alerts for a user
   */
  static async getUserBackInStockAlerts(userId: string): Promise<BackInStockAlert[]> {
    try {
      const { data, error } = await supabase
        .from('back_in_stock_alerts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching back-in-stock alerts:", error);
        return [];
      }

      if (!data) return [];

      return data.map((alert: any) => ({
        id: alert.id,
        userId: alert.user_id,
        productId: alert.product_id,
        isActive: alert.is_active,
        createdAt: new Date(alert.created_at).toISOString(),
        triggeredAt: alert.triggered_at ? new Date(alert.triggered_at).toISOString() : undefined
      }));
    } catch (error) {
      console.error("Error in getUserBackInStockAlerts:", error);
      return [];
    }
  }

  /**
   * Delete a back-in-stock alert
   */
  static async deleteBackInStockAlert(alertId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('back_in_stock_alerts')
        .delete()
        .eq('id', alertId);

      if (error) {
        console.error("Error deleting back-in-stock alert:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in deleteBackInStockAlert:", error);
      return false;
    }
  }

  /**
   * Disable a back-in-stock alert (instead of deleting)
   */
  static async disableBackInStockAlert(alertId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('back_in_stock_alerts')
        .update({ is_active: false })
        .eq('id', alertId);

      if (error) {
        console.error("Error disabling back-in-stock alert:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in disableBackInStockAlert:", error);
      return false;
    }
  }

  // Wishlist Share Methods

  /**
   * Share a wishlist collection with another user
   */
  static async shareCollection(
    collectionId: string,
    sharedWith: string // user email
  ): Promise<WishlistShare | null> {
    try {
      const shareToken = this.generateShareToken();

      const { data, error } = await supabase
        .from('wishlist_shares')
        .insert([{
          collection_id: collectionId,
          shared_with: sharedWith,
          share_token: shareToken,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error("Error sharing collection:", error);
        return null;
      }

      return {
        id: data.id,
        collectionId: data.collection_id,
        sharedWith: data.shared_with,
        shareToken: data.share_token,
        expiresAt: data.expires_at ? new Date(data.expires_at).toISOString() : undefined,
        createdAt: new Date(data.created_at).toISOString()
      };
    } catch (error) {
      console.error("Error in shareCollection:", error);
      return null;
    }
  }

  /**
   * Get shared collections for a user
   */
  static async getSharedWithMe(userId: string): Promise<(WishlistCollection & { sharedBy: string })[]> {
    try {
      const { data, error } = await supabase
        .from('wishlist_shares')
        .select(`
          *,
          wishlist_collections(*)
        `)
        .eq('shared_with', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching shared collections:", error);
        return [];
      }

      if (!data) return [];

      return data.map((share: any) => ({
        id: share.wishlist_collections.id,
        userId: share.wishlist_collections.user_id,
        name: share.wishlist_collections.name,
        description: share.wishlist_collections.description,
        isPublic: share.wishlist_collections.is_public,
        createdAt: new Date(share.wishlist_collections.created_at).toISOString(),
        sharedBy: share.wishlist_collections.user_id
      }));
    } catch (error) {
      console.error("Error in getSharedWithMe:", error);
      return [];
    }
  }

  /**
   * Revoke share access
   */
  static async revokeShare(shareId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('wishlist_shares')
        .delete()
        .eq('id', shareId);

      if (error) {
        console.error("Error revoking share:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in revokeShare:", error);
      return false;
    }
  }

  /**
   * Get shared collections from a user
   */
  static async getSharedByMe(userId: string): Promise<WishlistShare[]> {
    try {
      const { data, error } = await supabase
        .from('wishlist_shares')
        .select(`
          id,
          collection_id,
          shared_with,
          share_token,
          expires_at,
          created_at,
          wishlist_collections(user_id)
        `)
        .eq('wishlist_collections.user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching shares by me:", error);
        return [];
      }

      if (!data) return [];

      return data.map((share: any) => ({
        id: share.id,
        collectionId: share.collection_id,
        sharedWith: share.shared_with,
        shareToken: share.share_token,
        expiresAt: share.expires_at ? new Date(share.expires_at).toISOString() : undefined,
        createdAt: new Date(share.created_at).toISOString()
      }));
    } catch (error) {
      console.error("Error in getSharedByMe:", error);
      return [];
    }
  }

  /**
   * Generate a random share token
   */
  private static generateShareToken(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }
}

export const wishlistService = new WishlistService();

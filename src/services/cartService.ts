import { supabase } from "@/integrations/supabase/client";
import type { CartItem } from "@/types/marketplace";

export interface CartItemDatabase {
  id: string;
  user_id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  price: number;
  product_name: string;
  product_image: string;
  seller_id: string;
  seller_name: string;
  created_at: string;
  updated_at: string;
}

export interface CartSummary {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  lastUpdated: string;
}

export class CartService {
  /**
   * Sync local cart to database
   */
  static async syncCartToDatabase(userId: string, items: CartItem[]): Promise<boolean> {
    try {
      if (!userId) return false;

      // Clear existing cart for this user
      const { error: deleteError } = await supabase
        .from('shopping_cart')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        const errorMsg = deleteError instanceof Error ? deleteError.message : JSON.stringify(deleteError);
        console.error("Error clearing cart:", errorMsg);
        return false;
      }

      if (items.length === 0) {
        return true; // Cart is now empty
      }

      // Insert new cart items
      const cartItems = items.map(item => ({
        user_id: userId,
        product_id: item.productId,
        variant_id: item.variantId || null,
        quantity: item.quantity,
        price: item.price,
        product_name: item.productName,
        product_image: item.productImage,
        seller_id: item.sellerId,
        seller_name: item.sellerName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from('shopping_cart')
        .insert(cartItems);

      if (insertError) {
        const errorMsg = insertError instanceof Error ? insertError.message : JSON.stringify(insertError);
        console.error("Error syncing cart to database:", errorMsg);
        return false;
      }

      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      console.error("Error in syncCartToDatabase:", errorMsg);
      return false;
    }
  }

  /**
   * Fetch cart from database
   */
  static async getUserCart(userId: string): Promise<CartItem[]> {
    try {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('shopping_cart')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        const errorMsg = error instanceof Error ? error.message : (error?.message || JSON.stringify(error));
        console.error("Error fetching user cart:", errorMsg);
        return [];
      }

      if (!data) return [];

      return data.map((item: CartItemDatabase) => ({
        productId: item.product_id,
        variantId: item.variant_id || undefined,
        productName: item.product_name,
        productImage: item.product_image,
        sellerId: item.seller_id,
        sellerName: item.seller_name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity
      }));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      console.error("Error in getUserCart:", errorMsg);
      return [];
    }
  }

  /**
   * Add item to cart (database)
   */
  static async addToCartDatabase(
    userId: string,
    productId: string,
    quantity: number,
    variantId?: string,
    productData?: {
      name: string;
      image: string;
      price: number;
      sellerId: string;
      sellerName: string;
    }
  ): Promise<boolean> {
    try {
      if (!userId) return false;

      // Check if item already exists in cart
      const { data: existing } = await supabase
        .from('shopping_cart')
        .select('id, quantity')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .eq('variant_id', variantId || null)
        .single();

      if (existing) {
        // Update quantity
        return this.updateCartItemQuantity(
          existing.id,
          existing.quantity + quantity
        );
      }

      // Get product data if not provided
      let itemData = productData;
      if (!itemData) {
        const { data: product } = await supabase
          .from('products')
          .select('name, image, price, seller_id, seller_name')
          .eq('id', productId)
          .single();

        if (!product) {
          console.error("Product not found:", productId);
          return false;
        }

        itemData = {
          name: product.name,
          image: product.image,
          price: product.price,
          sellerId: product.seller_id,
          sellerName: product.seller_name
        };
      }

      const { error } = await supabase
        .from('shopping_cart')
        .insert({
          user_id: userId,
          product_id: productId,
          variant_id: variantId || null,
          quantity,
          price: itemData.price,
          product_name: itemData.name,
          product_image: itemData.image,
          seller_id: itemData.sellerId,
          seller_name: itemData.sellerName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error("Error adding to cart:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in addToCartDatabase:", error);
      return false;
    }
  }

  /**
   * Remove item from cart
   */
  static async removeFromCartDatabase(cartItemId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('shopping_cart')
        .delete()
        .eq('id', cartItemId);

      if (error) {
        console.error("Error removing from cart:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in removeFromCartDatabase:", error);
      return false;
    }
  }

  /**
   * Update cart item quantity
   */
  static async updateCartItemQuantity(cartItemId: string, quantity: number): Promise<boolean> {
    try {
      if (quantity <= 0) {
        return this.removeFromCartDatabase(cartItemId);
      }

      const { error } = await supabase
        .from('shopping_cart')
        .update({
          quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', cartItemId);

      if (error) {
        console.error("Error updating cart item quantity:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in updateCartItemQuantity:", error);
      return false;
    }
  }

  /**
   * Clear entire cart
   */
  static async clearCartDatabase(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('shopping_cart')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error("Error clearing cart:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in clearCartDatabase:", error);
      return false;
    }
  }

  /**
   * Get cart summary with totals
   */
  static async getCartSummary(userId: string): Promise<CartSummary | null> {
    try {
      const items = await this.getUserCart(userId);
      
      if (items.length === 0) {
        return {
          items: [],
          subtotal: 0,
          itemCount: 0,
          lastUpdated: new Date().toISOString()
        };
      }

      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

      return {
        items,
        subtotal,
        itemCount,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error("Error in getCartSummary:", error);
      return null;
    }
  }

  /**
   * Check if product is in cart
   */
  static async isProductInCart(
    userId: string,
    productId: string,
    variantId?: string
  ): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('shopping_cart')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .eq('variant_id', variantId || null)
        .single();

      return !!data;
    } catch (error) {
      console.error("Error checking if product in cart:", error);
      return false;
    }
  }

  /**
   * Get cart item count
   */
  static async getCartItemCount(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('shopping_cart')
        .select('quantity')
        .eq('user_id', userId);

      if (error || !data) return 0;

      return data.reduce((sum, item) => sum + item.quantity, 0);
    } catch (error) {
      console.error("Error getting cart item count:", error);
      return 0;
    }
  }

  /**
   * Validate cart stock availability
   */
  static async validateCartStock(cartItems: CartItem[]): Promise<{
    valid: boolean;
    issues: Array<{
      productId: string;
      productName: string;
      issue: string;
    }>;
  }> {
    try {
      const issues: Array<{
        productId: string;
        productName: string;
        issue: string;
      }> = [];

      for (const item of cartItems) {
        const { data: product, error } = await supabase
          .from('products')
          .select('stock_quantity, in_stock')
          .eq('id', item.productId)
          .single();

        if (error || !product) {
          issues.push({
            productId: item.productId,
            productName: item.productName,
            issue: 'Product not found'
          });
          continue;
        }

        if (!product.in_stock) {
          issues.push({
            productId: item.productId,
            productName: item.productName,
            issue: 'Product is out of stock'
          });
        } else if (product.stock_quantity < item.quantity) {
          issues.push({
            productId: item.productId,
            productName: item.productName,
            issue: `Only ${product.stock_quantity} available`
          });
        }
      }

      return {
        valid: issues.length === 0,
        issues
      };
    } catch (error) {
      console.error("Error validating cart stock:", error);
      return {
        valid: false,
        issues: [{ productId: '', productName: '', issue: 'Error validating stock' }]
      };
    }
  }

  /**
   * Apply promotional code to cart
   */
  static async applyPromoCode(code: string, cartTotal: number): Promise<{
    valid: boolean;
    discountAmount?: number;
    discountPercentage?: number;
    finalTotal?: number;
    message: string;
  }> {
    try {
      const { data: promo, error } = await supabase
        .from('promotional_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('active', true)
        .single();

      if (error || !promo) {
        return {
          valid: false,
          message: 'Invalid promotional code'
        };
      }

      // Check expiry
      if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
        return {
          valid: false,
          message: 'Promotional code has expired'
        };
      }

      // Check minimum purchase
      if (promo.minimum_purchase && cartTotal < promo.minimum_purchase) {
        return {
          valid: false,
          message: `Minimum purchase of $${promo.minimum_purchase} required`
        };
      }

      let discountAmount = 0;
      if (promo.discount_type === 'percentage') {
        discountAmount = (cartTotal * promo.discount_value) / 100;
      } else {
        discountAmount = promo.discount_value;
      }

      const finalTotal = Math.max(0, cartTotal - discountAmount);

      return {
        valid: true,
        discountAmount,
        discountPercentage: promo.discount_type === 'percentage' ? promo.discount_value : undefined,
        finalTotal,
        message: 'Promotional code applied successfully'
      };
    } catch (error) {
      console.error("Error applying promo code:", error);
      return {
        valid: false,
        message: 'Error validating promotional code'
      };
    }
  }
}

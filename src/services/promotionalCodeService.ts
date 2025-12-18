import { supabase } from "@/integrations/supabase/client";

export interface PromotionalCode {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  description?: string;
  maxUses?: number;
  usedCount?: number;
  minimumPurchase?: number;
  expiresAt?: string;
  active: boolean;
}

export interface Discount {
  discountAmount: number;
  discountPercentage?: number;
  finalTotal: number;
  message: string;
  code?: string;
}

export class PromotionalCodeService {
  /**
   * Validate promotional code
   */
  static async validatePromoCode(code: string, cartTotal: number): Promise<Discount | null> {
    try {
      const { data: promo, error } = await supabase
        .from('promotional_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('active', true)
        .single();

      if (error || !promo) {
        return null;
      }

      // Check expiry
      if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
        return null;
      }

      // Check max uses
      if (promo.max_uses && promo.used_count && promo.used_count >= promo.max_uses) {
        return null;
      }

      // Check minimum purchase
      if (promo.minimum_purchase && cartTotal < promo.minimum_purchase) {
        return null;
      }

      let discountAmount = 0;
      if (promo.discount_type === 'percentage') {
        discountAmount = (cartTotal * promo.discount_value) / 100;
      } else {
        discountAmount = promo.discount_value;
      }

      const finalTotal = Math.max(0, cartTotal - discountAmount);

      return {
        discountAmount,
        discountPercentage: promo.discount_type === 'percentage' ? promo.discount_value : undefined,
        finalTotal,
        message: `Discount of $${discountAmount.toFixed(2)} applied`,
        code: code.toUpperCase()
      };
    } catch (error) {
      console.error("Error validating promo code:", error);
      return null;
    }
  }

  /**
   * Apply discount to cart (records the use)
   */
  static async applyDiscount(code: string, cartId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('promotional_codes')
        .update({
          used_count: supabase.rpc('increment', { x: 1 })
        })
        .eq('code', code.toUpperCase());

      if (error) {
        console.error("Error applying discount:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in applyDiscount:", error);
      return false;
    }
  }

  /**
   * Get available store coupons for seller
   */
  static async getStoreCoupons(sellerId: string, minPurchaseAmount?: number): Promise<PromotionalCode[]> {
    try {
      let query = supabase
        .from('store_coupons')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('active', true)
        .lte('expires_at', new Date().toISOString());

      if (minPurchaseAmount) {
        query = query.gte('minimum_purchase', minPurchaseAmount);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching store coupons:", error);
        return [];
      }

      return (data || []).map(coupon => ({
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discount_type as 'percentage' | 'fixed',
        discountValue: coupon.discount_value,
        description: coupon.description,
        maxUses: coupon.max_uses,
        usedCount: coupon.used_count,
        minimumPurchase: coupon.minimum_purchase,
        expiresAt: coupon.expires_at,
        active: coupon.active
      }));
    } catch (error) {
      console.error("Error in getStoreCoupons:", error);
      return [];
    }
  }

  /**
   * Validate coupon code
   */
  static async validateCoupon(couponCode: string): Promise<Discount | null> {
    try {
      const { data: coupon, error } = await supabase
        .from('store_coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('active', true)
        .single();

      if (error || !coupon) {
        return null;
      }

      // Check expiry
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return null;
      }

      // Check max uses
      if (coupon.max_uses && coupon.used_count && coupon.used_count >= coupon.max_uses) {
        return null;
      }

      return {
        discountAmount: coupon.discount_type === 'percentage' ? 0 : coupon.discount_value,
        discountPercentage: coupon.discount_type === 'percentage' ? coupon.discount_value : undefined,
        finalTotal: 0, // Will be calculated by cart
        message: coupon.description || `${coupon.discount_value}% off with coupon ${couponCode}`,
        code: couponCode.toUpperCase()
      };
    } catch (error) {
      console.error("Error validating coupon:", error);
      return null;
    }
  }

  /**
   * Get all active promotional codes
   */
  static async getAllActivePromoCodes(): Promise<PromotionalCode[]> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('promotional_codes')
        .select('*')
        .eq('active', true)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching promo codes:", error);
        return [];
      }

      return (data || []).map(promo => ({
        id: promo.id,
        code: promo.code,
        discountType: promo.discount_type as 'percentage' | 'fixed',
        discountValue: promo.discount_value,
        description: promo.description,
        maxUses: promo.max_uses,
        usedCount: promo.used_count,
        minimumPurchase: promo.minimum_purchase,
        expiresAt: promo.expires_at,
        active: promo.active
      }));
    } catch (error) {
      console.error("Error in getAllActivePromoCodes:", error);
      return [];
    }
  }

  /**
   * Create promotional code (admin only)
   */
  static async createPromoCode(promo: Omit<PromotionalCode, 'id' | 'usedCount'>): Promise<PromotionalCode | null> {
    try {
      const { data, error } = await supabase
        .from('promotional_codes')
        .insert({
          code: promo.code.toUpperCase(),
          discount_type: promo.discountType,
          discount_value: promo.discountValue,
          description: promo.description,
          max_uses: promo.maxUses,
          minimum_purchase: promo.minimumPurchase,
          expires_at: promo.expiresAt,
          active: promo.active
        })
        .select()
        .single();

      if (error || !data) {
        console.error("Error creating promo code:", error);
        return null;
      }

      return {
        id: data.id,
        code: data.code,
        discountType: data.discount_type as 'percentage' | 'fixed',
        discountValue: data.discount_value,
        description: data.description,
        maxUses: data.max_uses,
        usedCount: data.used_count,
        minimumPurchase: data.minimum_purchase,
        expiresAt: data.expires_at,
        active: data.active
      };
    } catch (error) {
      console.error("Error in createPromoCode:", error);
      return null;
    }
  }

  /**
   * Deactivate promotional code
   */
  static async deactivatePromoCode(codeId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('promotional_codes')
        .update({ active: false })
        .eq('id', codeId);

      if (error) {
        console.error("Error deactivating promo code:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in deactivatePromoCode:", error);
      return false;
    }
  }

  /**
   * Get promo code statistics
   */
  static async getPromoCodeStats(codeId: string): Promise<{
    timesUsed: number;
    totalDiscount: number;
    averageOrderValue: number;
  } | null> {
    try {
      const { data, error } = await supabase
        .from('promotional_codes')
        .select('used_count')
        .eq('id', codeId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        timesUsed: data.used_count || 0,
        totalDiscount: 0, // Would need to calculate from orders
        averageOrderValue: 0 // Would need to calculate from orders
      };
    } catch (error) {
      console.error("Error getting promo code stats:", error);
      return null;
    }
  }
}

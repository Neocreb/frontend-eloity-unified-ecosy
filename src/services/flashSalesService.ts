import { supabase } from "@/integrations/supabase/client";

export interface FlashSale {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: 'scheduled' | 'active' | 'ended' | 'paused';
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  applicableCategories?: string[];
  applicableProducts?: string[];
  maxUsagePerUser?: number;
  totalBudget?: number;
  currentSpent?: number;
  createdAt: string;
  updatedAt: string;
}

export interface FlashSaleWithCountdown extends FlashSale {
  timeRemaining: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    totalSeconds: number;
    isActive: boolean;
  };
  savings: {
    minSavings: number;
    maxSavings: number;
  };
}

export interface BundleDeal {
  id: string;
  title: string;
  description?: string;
  productIds: string[];
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minQuantity: number;
  maxQuantity?: number;
  bundlePrice?: number;
  active: boolean;
  validFrom: string;
  validUntil: string;
  createdAt: string;
}

export interface TieredDiscount {
  id: string;
  productId: string;
  tiers: Array<{
    minQuantity: number;
    maxQuantity?: number;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
  }>;
  active: boolean;
  validFrom: string;
  validUntil: string;
  createdAt: string;
}

export interface StoreCoupon {
  id: string;
  code: string;
  title: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  maxUsagePerUser?: number;
  totalUsageLimit?: number;
  currentUsage?: number;
  validFrom: string;
  validUntil: string;
  active: boolean;
  applicableCategories?: string[];
  applicableProducts?: string[];
  createdAt: string;
  updatedAt: string;
}

export class FlashSalesService {
  /**
   * Create a new flash sale
   */
  static async createFlashSale(data: Omit<FlashSale, 'id' | 'createdAt' | 'updatedAt' | 'currentSpent'>): Promise<FlashSale | null> {
    try {
      const { data: sale, error } = await supabase
        .from('flash_sales')
        .insert([{
          title: data.title,
          description: data.description,
          start_date: data.startDate,
          end_date: data.endDate,
          status: data.status || 'scheduled',
          discount_type: data.discountType,
          discount_value: data.discountValue,
          max_discount: data.maxDiscount,
          min_order_amount: data.minOrderAmount,
          applicable_categories: data.applicableCategories,
          applicable_products: data.applicableProducts,
          max_usage_per_user: data.maxUsagePerUser,
          total_budget: data.totalBudget,
          current_spent: 0,
        }])
        .select()
        .single();

      if (error) throw error;
      return this.mapFlashSaleFromDB(sale);
    } catch (error) {
      console.error('Error creating flash sale:', error);
      return null;
    }
  }

  /**
   * Get all flash sales with filtering
   */
  static async getAllFlashSales(status?: FlashSale['status']): Promise<FlashSaleWithCountdown[]> {
    try {
      let query = supabase.from('flash_sales').select('*');
      
      if (status) {
        query = query.eq('status', status);
      }

      const { data: sales, error } = await query.order('start_date', { ascending: false });
      
      if (error) throw error;
      
      return (sales || []).map(sale => ({
        ...this.mapFlashSaleFromDB(sale),
        timeRemaining: this.calculateTimeRemaining(sale.end_date),
        savings: this.calculateSavings(sale.discount_type, sale.discount_value, sale.min_order_amount),
      }));
    } catch (error) {
      console.error('Error fetching flash sales:', error);
      return [];
    }
  }

  /**
   * Get active flash sales
   */
  static async getActiveFlashSales(): Promise<FlashSaleWithCountdown[]> {
    try {
      const now = new Date().toISOString();
      
      const { data: sales, error } = await supabase
        .from('flash_sales')
        .select('*')
        .eq('status', 'active')
        .lte('start_date', now)
        .gte('end_date', now)
        .order('end_date', { ascending: true });

      if (error) throw error;

      return (sales || []).map(sale => ({
        ...this.mapFlashSaleFromDB(sale),
        timeRemaining: this.calculateTimeRemaining(sale.end_date),
        savings: this.calculateSavings(sale.discount_type, sale.discount_value, sale.min_order_amount),
      }));
    } catch (error) {
      console.error('Error fetching active flash sales:', error);
      return [];
    }
  }

  /**
   * Get flash sale by ID
   */
  static async getFlashSaleById(id: string): Promise<FlashSaleWithCountdown | null> {
    try {
      const { data: sale, error } = await supabase
        .from('flash_sales')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !sale) return null;

      return {
        ...this.mapFlashSaleFromDB(sale),
        timeRemaining: this.calculateTimeRemaining(sale.end_date),
        savings: this.calculateSavings(sale.discount_type, sale.discount_value, sale.min_order_amount),
      };
    } catch (error) {
      console.error('Error fetching flash sale:', error);
      return null;
    }
  }

  /**
   * Update flash sale
   */
  static async updateFlashSale(id: string, data: Partial<FlashSale>): Promise<FlashSale | null> {
    try {
      const updateData: any = {};
      
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.startDate !== undefined) updateData.start_date = data.startDate;
      if (data.endDate !== undefined) updateData.end_date = data.endDate;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.discountType !== undefined) updateData.discount_type = data.discountType;
      if (data.discountValue !== undefined) updateData.discount_value = data.discountValue;
      if (data.maxDiscount !== undefined) updateData.max_discount = data.maxDiscount;
      if (data.minOrderAmount !== undefined) updateData.min_order_amount = data.minOrderAmount;
      if (data.applicableCategories !== undefined) updateData.applicable_categories = data.applicableCategories;
      if (data.applicableProducts !== undefined) updateData.applicable_products = data.applicableProducts;
      if (data.maxUsagePerUser !== undefined) updateData.max_usage_per_user = data.maxUsagePerUser;
      if (data.totalBudget !== undefined) updateData.total_budget = data.totalBudget;

      const { data: sale, error } = await supabase
        .from('flash_sales')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return this.mapFlashSaleFromDB(sale);
    } catch (error) {
      console.error('Error updating flash sale:', error);
      return null;
    }
  }

  /**
   * Delete flash sale
   */
  static async deleteFlashSale(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('flash_sales')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting flash sale:', error);
      return false;
    }
  }

  /**
   * Create bundle deal
   */
  static async createBundleDeal(data: Omit<BundleDeal, 'id' | 'createdAt'>): Promise<BundleDeal | null> {
    try {
      const { data: bundle, error } = await supabase
        .from('bundle_deals')
        .insert([{
          title: data.title,
          description: data.description,
          product_ids: data.productIds,
          discount_type: data.discountType,
          discount_value: data.discountValue,
          min_quantity: data.minQuantity,
          max_quantity: data.maxQuantity,
          bundle_price: data.bundlePrice,
          active: data.active,
          valid_from: data.validFrom,
          valid_until: data.validUntil,
        }])
        .select()
        .single();

      if (error) throw error;
      return this.mapBundleDealFromDB(bundle);
    } catch (error) {
      console.error('Error creating bundle deal:', error);
      return null;
    }
  }

  /**
   * Get all bundle deals
   */
  static async getAllBundleDeals(activeOnly = false): Promise<BundleDeal[]> {
    try {
      let query = supabase.from('bundle_deals').select('*');
      
      if (activeOnly) {
        const now = new Date().toISOString();
        query = query.eq('active', true)
          .lte('valid_from', now)
          .gte('valid_until', now);
      }

      const { data: bundles, error } = await query.order('valid_from', { ascending: false });
      
      if (error) throw error;
      return (bundles || []).map(bundle => this.mapBundleDealFromDB(bundle));
    } catch (error) {
      console.error('Error fetching bundle deals:', error);
      return [];
    }
  }

  /**
   * Update bundle deal
   */
  static async updateBundleDeal(id: string, data: Partial<BundleDeal>): Promise<BundleDeal | null> {
    try {
      const updateData: any = {};
      
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.productIds !== undefined) updateData.product_ids = data.productIds;
      if (data.discountType !== undefined) updateData.discount_type = data.discountType;
      if (data.discountValue !== undefined) updateData.discount_value = data.discountValue;
      if (data.minQuantity !== undefined) updateData.min_quantity = data.minQuantity;
      if (data.maxQuantity !== undefined) updateData.max_quantity = data.maxQuantity;
      if (data.bundlePrice !== undefined) updateData.bundle_price = data.bundlePrice;
      if (data.active !== undefined) updateData.active = data.active;
      if (data.validFrom !== undefined) updateData.valid_from = data.validFrom;
      if (data.validUntil !== undefined) updateData.valid_until = data.validUntil;

      const { data: bundle, error } = await supabase
        .from('bundle_deals')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return this.mapBundleDealFromDB(bundle);
    } catch (error) {
      console.error('Error updating bundle deal:', error);
      return null;
    }
  }

  /**
   * Delete bundle deal
   */
  static async deleteBundleDeal(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('bundle_deals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting bundle deal:', error);
      return false;
    }
  }

  /**
   * Create tiered discount
   */
  static async createTieredDiscount(data: Omit<TieredDiscount, 'id' | 'createdAt'>): Promise<TieredDiscount | null> {
    try {
      const { data: tiered, error } = await supabase
        .from('tiered_discounts')
        .insert([{
          product_id: data.productId,
          tiers: data.tiers,
          active: data.active,
          valid_from: data.validFrom,
          valid_until: data.validUntil,
        }])
        .select()
        .single();

      if (error) throw error;
      return this.mapTieredDiscountFromDB(tiered);
    } catch (error) {
      console.error('Error creating tiered discount:', error);
      return null;
    }
  }

  /**
   * Get tiered discount for product
   */
  static async getTieredDiscount(productId: string): Promise<TieredDiscount | null> {
    try {
      const now = new Date().toISOString();
      
      const { data: tiered, error } = await supabase
        .from('tiered_discounts')
        .select('*')
        .eq('product_id', productId)
        .eq('active', true)
        .lte('valid_from', now)
        .gte('valid_until', now)
        .single();

      if (error) return null;
      return this.mapTieredDiscountFromDB(tiered);
    } catch (error) {
      console.error('Error fetching tiered discount:', error);
      return null;
    }
  }

  /**
   * Calculate discount for quantity
   */
  static calculateTieredDiscount(tieredDiscount: TieredDiscount, quantity: number, basePrice: number): number {
    const applicableTier = tieredDiscount.tiers.find(tier => {
      const meetsMin = quantity >= tier.minQuantity;
      const meetsMax = !tier.maxQuantity || quantity <= tier.maxQuantity;
      return meetsMin && meetsMax;
    });

    if (!applicableTier) return basePrice;

    if (applicableTier.discountType === 'percentage') {
      return basePrice * (1 - applicableTier.discountValue / 100);
    } else {
      return Math.max(0, basePrice - applicableTier.discountValue);
    }
  }

  /**
   * Create store coupon
   */
  static async createStoreCoupon(data: Omit<StoreCoupon, 'id' | 'createdAt' | 'updatedAt' | 'currentUsage'>): Promise<StoreCoupon | null> {
    try {
      const { data: coupon, error } = await supabase
        .from('store_coupons')
        .insert([{
          code: data.code.toUpperCase(),
          title: data.title,
          description: data.description,
          discount_type: data.discountType,
          discount_value: data.discountValue,
          max_discount: data.maxDiscount,
          min_order_amount: data.minOrderAmount,
          max_usage_per_user: data.maxUsagePerUser,
          total_usage_limit: data.totalUsageLimit,
          current_usage: 0,
          valid_from: data.validFrom,
          valid_until: data.validUntil,
          active: data.active,
          applicable_categories: data.applicableCategories,
          applicable_products: data.applicableProducts,
        }])
        .select()
        .single();

      if (error) throw error;
      return this.mapStoreCouponFromDB(coupon);
    } catch (error) {
      console.error('Error creating store coupon:', error);
      return null;
    }
  }

  /**
   * Validate store coupon
   */
  static async validateStoreCoupon(code: string, cartTotal: number, userId: string): Promise<{ valid: boolean; discount?: number; message: string }> {
    try {
      const now = new Date().toISOString();
      
      const { data: coupon, error } = await supabase
        .from('store_coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('active', true)
        .lte('valid_from', now)
        .gte('valid_until', now)
        .single();

      if (error || !coupon) {
        return { valid: false, message: 'Coupon code not found or expired' };
      }

      // Check usage limit
      if (coupon.total_usage_limit && coupon.current_usage >= coupon.total_usage_limit) {
        return { valid: false, message: 'Coupon usage limit reached' };
      }

      // Check user usage limit
      if (coupon.max_usage_per_user) {
        const { data: userUsage, error: usageError } = await supabase
          .from('coupon_usage')
          .select('count')
          .eq('coupon_id', coupon.id)
          .eq('user_id', userId);

        if (!usageError && userUsage && userUsage[0]?.count >= coupon.max_usage_per_user) {
          return { valid: false, message: 'You have reached the maximum uses for this coupon' };
        }
      }

      // Check minimum order amount
      if (coupon.min_order_amount && cartTotal < coupon.min_order_amount) {
        return { 
          valid: false, 
          message: `Minimum order amount of $${coupon.min_order_amount} required` 
        };
      }

      // Calculate discount
      let discount = 0;
      if (coupon.discount_type === 'percentage') {
        discount = cartTotal * (coupon.discount_value / 100);
        if (coupon.max_discount) {
          discount = Math.min(discount, coupon.max_discount);
        }
      } else {
        discount = coupon.discount_value;
      }

      return { valid: true, discount, message: 'Coupon applied successfully' };
    } catch (error) {
      console.error('Error validating coupon:', error);
      return { valid: false, message: 'Error validating coupon' };
    }
  }

  /**
   * Get all store coupons
   */
  static async getAllStoreCoupons(activeOnly = false): Promise<StoreCoupon[]> {
    try {
      let query = supabase.from('store_coupons').select('*');
      
      if (activeOnly) {
        const now = new Date().toISOString();
        query = query.eq('active', true)
          .lte('valid_from', now)
          .gte('valid_until', now);
      }

      const { data: coupons, error } = await query.order('valid_from', { ascending: false });
      
      if (error) throw error;
      return (coupons || []).map(coupon => this.mapStoreCouponFromDB(coupon));
    } catch (error) {
      console.error('Error fetching store coupons:', error);
      return [];
    }
  }

  /**
   * Update store coupon
   */
  static async updateStoreCoupon(id: string, data: Partial<StoreCoupon>): Promise<StoreCoupon | null> {
    try {
      const updateData: any = {};
      
      if (data.code !== undefined) updateData.code = data.code.toUpperCase();
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.discountType !== undefined) updateData.discount_type = data.discountType;
      if (data.discountValue !== undefined) updateData.discount_value = data.discountValue;
      if (data.maxDiscount !== undefined) updateData.max_discount = data.maxDiscount;
      if (data.minOrderAmount !== undefined) updateData.min_order_amount = data.minOrderAmount;
      if (data.maxUsagePerUser !== undefined) updateData.max_usage_per_user = data.maxUsagePerUser;
      if (data.totalUsageLimit !== undefined) updateData.total_usage_limit = data.totalUsageLimit;
      if (data.validFrom !== undefined) updateData.valid_from = data.validFrom;
      if (data.validUntil !== undefined) updateData.valid_until = data.validUntil;
      if (data.active !== undefined) updateData.active = data.active;
      if (data.applicableCategories !== undefined) updateData.applicable_categories = data.applicableCategories;
      if (data.applicableProducts !== undefined) updateData.applicable_products = data.applicableProducts;

      const { data: coupon, error } = await supabase
        .from('store_coupons')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return this.mapStoreCouponFromDB(coupon);
    } catch (error) {
      console.error('Error updating store coupon:', error);
      return null;
    }
  }

  /**
   * Delete store coupon
   */
  static async deleteStoreCoupon(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('store_coupons')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting store coupon:', error);
      return false;
    }
  }

  /**
   * Private helper methods
   */

  private static mapFlashSaleFromDB(sale: any): FlashSale {
    return {
      id: sale.id,
      title: sale.title,
      description: sale.description,
      startDate: sale.start_date,
      endDate: sale.end_date,
      status: sale.status,
      discountType: sale.discount_type,
      discountValue: sale.discount_value,
      maxDiscount: sale.max_discount,
      minOrderAmount: sale.min_order_amount,
      applicableCategories: sale.applicable_categories,
      applicableProducts: sale.applicable_products,
      maxUsagePerUser: sale.max_usage_per_user,
      totalBudget: sale.total_budget,
      currentSpent: sale.current_spent,
      createdAt: sale.created_at,
      updatedAt: sale.updated_at,
    };
  }

  private static mapBundleDealFromDB(bundle: any): BundleDeal {
    return {
      id: bundle.id,
      title: bundle.title,
      description: bundle.description,
      productIds: bundle.product_ids,
      discountType: bundle.discount_type,
      discountValue: bundle.discount_value,
      minQuantity: bundle.min_quantity,
      maxQuantity: bundle.max_quantity,
      bundlePrice: bundle.bundle_price,
      active: bundle.active,
      validFrom: bundle.valid_from,
      validUntil: bundle.valid_until,
      createdAt: bundle.created_at,
    };
  }

  private static mapTieredDiscountFromDB(tiered: any): TieredDiscount {
    return {
      id: tiered.id,
      productId: tiered.product_id,
      tiers: tiered.tiers,
      active: tiered.active,
      validFrom: tiered.valid_from,
      validUntil: tiered.valid_until,
      createdAt: tiered.created_at,
    };
  }

  private static mapStoreCouponFromDB(coupon: any): StoreCoupon {
    return {
      id: coupon.id,
      code: coupon.code,
      title: coupon.title,
      description: coupon.description,
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value,
      maxDiscount: coupon.max_discount,
      minOrderAmount: coupon.min_order_amount,
      maxUsagePerUser: coupon.max_usage_per_user,
      totalUsageLimit: coupon.total_usage_limit,
      currentUsage: coupon.current_usage,
      validFrom: coupon.valid_from,
      validUntil: coupon.valid_until,
      active: coupon.active,
      applicableCategories: coupon.applicable_categories,
      applicableProducts: coupon.applicable_products,
      createdAt: coupon.created_at,
      updatedAt: coupon.updated_at,
    };
  }

  private static calculateTimeRemaining(endDate: string) {
    const now = new Date();
    const end = new Date(endDate);
    const diff = Math.max(0, end.getTime() - now.getTime());
    const totalSeconds = Math.floor(diff / 1000);

    return {
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
      totalSeconds,
      isActive: totalSeconds > 0,
    };
  }

  private static calculateSavings(discountType: 'percentage' | 'fixed', discountValue: number, minOrderAmount?: number) {
    const baseAmount = minOrderAmount || 0;
    let minSavings = 0;
    let maxSavings = 0;

    if (discountType === 'percentage') {
      minSavings = baseAmount * (discountValue / 100);
      maxSavings = baseAmount * 2 * (discountValue / 100); // Assume max 2x base amount
    } else {
      minSavings = discountValue;
      maxSavings = discountValue * 2;
    }

    return { minSavings, maxSavings };
  }
}

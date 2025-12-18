import { supabase } from "@/integrations/supabase/client";

export interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  baseRate: number;
  perKgRate: number;
  estimatedDays: number;
  freeShippingThreshold?: number;
}

export interface ShippingCost {
  baseRate: number;
  weightRate: number;
  totalCost: number;
  estimatedDeliveryDays: number;
  estimatedDeliveryDate: string;
  discount?: number;
  discountReason?: string;
  finalCost: number;
}

export interface ShippingMethod {
  id: string;
  name: string;
  description?: string;
  cost: number;
  estimatedDays: number;
  carrier?: string;
}

export class ShippingService {
  /**
   * Calculate shipping cost based on seller, zone, weight, and cart value
   */
  static async getShippingCost(
    sellerId: string,
    shippingZone: string,
    cartWeight: number = 0,
    cartValue: number = 0
  ): Promise<ShippingCost | null> {
    try {
      const { data: zone, error: zoneError } = await supabase
        .from('shipping_zones')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('name', shippingZone)
        .single();

      if (zoneError || !zone) {
        console.error("Error fetching shipping zone:", zoneError);
        return null;
      }

      const baseRate = zone.base_rate || 0;
      const weightRate = (cartWeight || 0) * (zone.per_kg_rate || 0);
      let totalCost = baseRate + weightRate;
      let discount = 0;
      let discountReason: string | undefined;

      // Check for free shipping threshold
      if (zone.free_shipping_threshold && cartValue >= zone.free_shipping_threshold) {
        discount = totalCost;
        discountReason = 'Free shipping - order qualifies';
        totalCost = 0;
      }

      // Estimate delivery date
      const estimatedDays = zone.estimated_days || 5;
      const estimatedDate = new Date();
      estimatedDate.setDate(estimatedDate.getDate() + estimatedDays);

      return {
        baseRate,
        weightRate,
        totalCost: Math.max(0, totalCost),
        estimatedDeliveryDays: estimatedDays,
        estimatedDeliveryDate: estimatedDate.toISOString(),
        discount,
        discountReason,
        finalCost: Math.max(0, totalCost - discount)
      };
    } catch (error) {
      console.error("Error in getShippingCost:", error);
      return null;
    }
  }

  /**
   * Get all shipping zones for a seller
   */
  static async getShippingZones(sellerId: string): Promise<ShippingZone[]> {
    try {
      const { data, error } = await supabase
        .from('shipping_zones')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('active', true)
        .order('name');

      if (error) {
        console.error("Error fetching shipping zones:", error);
        return [];
      }

      return (data || []).map(zone => ({
        id: zone.id,
        name: zone.name,
        countries: zone.countries || [],
        baseRate: zone.base_rate || 0,
        perKgRate: zone.per_kg_rate || 0,
        estimatedDays: zone.estimated_days || 5,
        freeShippingThreshold: zone.free_shipping_threshold
      }));
    } catch (error) {
      console.error("Error in getShippingZones:", error);
      return [];
    }
  }

  /**
   * Get shipping zone for a country
   */
  static async getShippingZoneForCountry(
    sellerId: string,
    country: string
  ): Promise<ShippingZone | null> {
    try {
      const zones = await this.getShippingZones(sellerId);
      
      const matchedZone = zones.find(zone =>
        zone.countries.some(c => c.toLowerCase() === country.toLowerCase())
      );

      return matchedZone || null;
    } catch (error) {
      console.error("Error in getShippingZoneForCountry:", error);
      return null;
    }
  }

  /**
   * Create shipping zone for seller
   */
  static async createShippingZone(
    sellerId: string,
    zone: Omit<ShippingZone, 'id'>
  ): Promise<ShippingZone | null> {
    try {
      const { data, error } = await supabase
        .from('shipping_zones')
        .insert({
          seller_id: sellerId,
          name: zone.name,
          countries: zone.countries,
          base_rate: zone.baseRate,
          per_kg_rate: zone.perKgRate,
          estimated_days: zone.estimatedDays,
          free_shipping_threshold: zone.freeShippingThreshold,
          active: true
        })
        .select()
        .single();

      if (error || !data) {
        console.error("Error creating shipping zone:", error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        countries: data.countries || [],
        baseRate: data.base_rate || 0,
        perKgRate: data.per_kg_rate || 0,
        estimatedDays: data.estimated_days || 5,
        freeShippingThreshold: data.free_shipping_threshold
      };
    } catch (error) {
      console.error("Error in createShippingZone:", error);
      return null;
    }
  }

  /**
   * Update shipping zone
   */
  static async updateShippingZone(
    zoneId: string,
    updates: Partial<Omit<ShippingZone, 'id'>>
  ): Promise<boolean> {
    try {
      const updateData: Record<string, any> = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.countries) updateData.countries = updates.countries;
      if (updates.baseRate !== undefined) updateData.base_rate = updates.baseRate;
      if (updates.perKgRate !== undefined) updateData.per_kg_rate = updates.perKgRate;
      if (updates.estimatedDays !== undefined) updateData.estimated_days = updates.estimatedDays;
      if (updates.freeShippingThreshold !== undefined) updateData.free_shipping_threshold = updates.freeShippingThreshold;

      const { error } = await supabase
        .from('shipping_zones')
        .update(updateData)
        .eq('id', zoneId);

      if (error) {
        console.error("Error updating shipping zone:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in updateShippingZone:", error);
      return false;
    }
  }

  /**
   * Delete shipping zone
   */
  static async deleteShippingZone(zoneId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('shipping_zones')
        .delete()
        .eq('id', zoneId);

      if (error) {
        console.error("Error deleting shipping zone:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in deleteShippingZone:", error);
      return false;
    }
  }

  /**
   * Get available shipping methods for a product from a seller
   */
  static async getShippingMethods(
    sellerId: string,
    productWeight?: number
  ): Promise<ShippingMethod[]> {
    try {
      const { data: methods, error } = await supabase
        .from('shipping_methods')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('active', true)
        .order('cost');

      if (error) {
        console.error("Error fetching shipping methods:", error);
        return this.getDefaultShippingMethods();
      }

      return (data || []).map(method => ({
        id: method.id,
        name: method.name,
        description: method.description,
        cost: method.cost || 0,
        estimatedDays: method.estimated_days || 5,
        carrier: method.carrier
      }));
    } catch (error) {
      console.error("Error in getShippingMethods:", error);
      return this.getDefaultShippingMethods();
    }
  }

  /**
   * Get default shipping methods
   */
  private static getDefaultShippingMethods(): ShippingMethod[] {
    return [
      {
        id: 'standard',
        name: 'Standard Shipping',
        description: '5-7 business days',
        cost: 5.99,
        estimatedDays: 6,
        carrier: 'USPS'
      },
      {
        id: 'expedited',
        name: 'Expedited Shipping',
        description: '2-3 business days',
        cost: 12.99,
        estimatedDays: 2,
        carrier: 'UPS'
      },
      {
        id: 'overnight',
        name: 'Overnight Shipping',
        description: 'Next business day',
        cost: 24.99,
        estimatedDays: 1,
        carrier: 'FedEx'
      }
    ];
  }

  /**
   * Calculate estimated delivery date
   */
  static calculateEstimatedDelivery(estimatedDays: number): Date {
    const date = new Date();
    let businessDaysAdded = 0;
    
    while (businessDaysAdded < estimatedDays) {
      date.setDate(date.getDate() + 1);
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        businessDaysAdded++;
      }
    }
    
    return date;
  }

  /**
   * Track shipment
   */
  static async trackShipment(trackingNumber: string): Promise<{
    status: string;
    location: string;
    lastUpdate: string;
    estimatedDelivery: string;
  } | null> {
    try {
      // This would integrate with carrier APIs in production
      const { data, error } = await supabase
        .from('orders')
        .select('status, estimated_delivery, shipping_address')
        .eq('tracking_number', trackingNumber)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        status: data.status,
        location: data.shipping_address?.city || 'In Transit',
        lastUpdate: new Date().toISOString(),
        estimatedDelivery: data.estimated_delivery || ''
      };
    } catch (error) {
      console.error("Error tracking shipment:", error);
      return null;
    }
  }

  /**
   * Generate tracking number
   */
  static generateTrackingNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `ELY${timestamp}${random}`;
  }
}

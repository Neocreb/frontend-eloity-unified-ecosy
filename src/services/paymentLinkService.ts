import { supabase } from "@/integrations/supabase/client";

export interface PaymentLink {
  id: string;
  code: string;
  userId: string;
  amount?: number;
  description?: string;
  expiresAt?: string;
  maxUses?: number;
  currentUses: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  shareUrl: string;
}

export interface CreatePaymentLinkInput {
  amount?: number;
  description?: string;
  expiresAt?: Date;
  maxUses?: number;
}

class PaymentLinkService {
  private baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  /**
   * Create a new payment link
   */
  async createPaymentLink(userId: string, input: CreatePaymentLinkInput): Promise<PaymentLink> {
    try {
      const code = this.generateLinkCode();
      const shareUrl = `${this.baseUrl}/pay/${code}`;

      const { data, error } = await supabase
        .from('payment_links')
        .insert([
          {
            user_id: userId,
            code,
            amount: input.amount,
            description: input.description,
            expires_at: input.expiresAt?.toISOString(),
            max_uses: input.maxUses,
            current_uses: 0,
            is_active: true,
            share_url: shareUrl,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return this.mapFromDatabase(data);
    } catch (error) {
      console.error('Error creating payment link:', error);
      throw new Error('Failed to create payment link');
    }
  }

  /**
   * Get payment link by code
   */
  async getPaymentLinkByCode(code: string): Promise<PaymentLink | null> {
    try {
      const { data, error } = await supabase
        .from('payment_links')
        .select('*')
        .eq('code', code)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;

      return this.mapFromDatabase(data);
    } catch (error) {
      console.error('Error fetching payment link:', error);
      return null;
    }
  }

  /**
   * Get all payment links for a user
   */
  async getUserPaymentLinks(userId: string): Promise<PaymentLink[]> {
    try {
      const { data, error } = await supabase
        .from('payment_links')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(link => this.mapFromDatabase(link));
    } catch (error) {
      console.error('Error fetching user payment links:', error);
      return [];
    }
  }

  /**
   * Update payment link
   */
  async updatePaymentLink(linkId: string, updates: Partial<CreatePaymentLinkInput>): Promise<PaymentLink> {
    try {
      const updateData: any = {};
      
      if (updates.amount !== undefined) updateData.amount = updates.amount;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.expiresAt !== undefined) updateData.expires_at = updates.expiresAt.toISOString();
      if (updates.maxUses !== undefined) updateData.max_uses = updates.maxUses;

      const { data, error } = await supabase
        .from('payment_links')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', linkId)
        .select()
        .single();

      if (error) throw error;

      return this.mapFromDatabase(data);
    } catch (error) {
      console.error('Error updating payment link:', error);
      throw new Error('Failed to update payment link');
    }
  }

  /**
   * Deactivate payment link
   */
  async deactivatePaymentLink(linkId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('payment_links')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', linkId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deactivating payment link:', error);
      return false;
    }
  }

  /**
   * Delete payment link
   */
  async deletePaymentLink(linkId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('payment_links').delete().eq('id', linkId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting payment link:', error);
      return false;
    }
  }

  /**
   * Record payment link usage
   */
  async recordPaymentLinkUsage(linkCode: string): Promise<PaymentLink | null> {
    try {
      const link = await this.getPaymentLinkByCode(linkCode);
      if (!link) return null;

      // Check if link has expired
      if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
        return null;
      }

      // Check if max uses reached
      if (link.maxUses && link.currentUses >= link.maxUses) {
        return null;
      }

      // Increment usage
      const { data, error } = await supabase
        .from('payment_links')
        .update({
          current_uses: link.currentUses + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', link.id)
        .select()
        .single();

      if (error) throw error;

      return this.mapFromDatabase(data);
    } catch (error) {
      console.error('Error recording payment link usage:', error);
      return null;
    }
  }

  /**
   * Check if payment link is valid
   */
  async isPaymentLinkValid(code: string): Promise<boolean> {
    try {
      const link = await this.getPaymentLinkByCode(code);
      
      if (!link || !link.isActive) return false;
      
      // Check expiration
      if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
        return false;
      }

      // Check max uses
      if (link.maxUses && link.currentUses >= link.maxUses) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking payment link validity:', error);
      return false;
    }
  }

  /**
   * Generate unique link code
   */
  private generateLinkCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Map database response to PaymentLink interface
   */
  private mapFromDatabase(data: any): PaymentLink {
    return {
      id: data.id,
      code: data.code,
      userId: data.user_id,
      amount: data.amount,
      description: data.description,
      expiresAt: data.expires_at,
      maxUses: data.max_uses,
      currentUses: data.current_uses || 0,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      shareUrl: data.share_url,
    };
  }
}

export const paymentLinkService = new PaymentLinkService();

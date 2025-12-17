import { supabase } from "@/integrations/supabase/client";

export interface InvoiceCustomization {
  id?: string;
  userId: string;
  companyName: string;
  companyLogo?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  companyWebsite?: string;
  taxId?: string;
  invoicePrefix: string;
  currency: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  includeNotes: boolean;
  includeTerms: boolean;
  customNotes?: string;
  customTerms?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReceiptCustomization {
  id?: string;
  userId: string;
  companyName: string;
  companyLogo?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  receiptPrefix: string;
  currency: string;
  primaryColor: string;
  includeQRCode: boolean;
  includeSignature: boolean;
  customFooter?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentLinkCustomization {
  id?: string;
  userId: string;
  companyName: string;
  companyLogo?: string;
  bannerImage?: string;
  bannerText?: string;
  primaryColor: string;
  secondaryColor: string;
  successMessage?: string;
  customCSS?: string;
  createdAt?: string;
  updatedAt?: string;
}

class InvoiceTemplateService {
  /**
   * Get user's invoice customization
   */
  async getInvoiceCustomization(userId: string): Promise<InvoiceCustomization | null> {
    try {
      const { data, error } = await supabase
        .from('invoice_customizations')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data ? this.mapInvoiceCustomization(data) : this.getDefaultInvoiceCustomization(userId);
    } catch (error) {
      console.error('Error fetching invoice customization:', error);
      return this.getDefaultInvoiceCustomization(userId);
    }
  }

  /**
   * Update user's invoice customization
   */
  async updateInvoiceCustomization(
    userId: string,
    customization: Partial<InvoiceCustomization>
  ): Promise<InvoiceCustomization> {
    try {
      const { data, error } = await supabase
        .from('invoice_customizations')
        .upsert(
          {
            user_id: userId,
            ...customization,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return this.mapInvoiceCustomization(data);
    } catch (error) {
      console.error('Error updating invoice customization:', error);
      throw new Error('Failed to update invoice customization');
    }
  }

  /**
   * Get user's receipt customization
   */
  async getReceiptCustomization(userId: string): Promise<ReceiptCustomization | null> {
    try {
      const { data, error } = await supabase
        .from('receipt_customizations')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data ? this.mapReceiptCustomization(data) : this.getDefaultReceiptCustomization(userId);
    } catch (error) {
      console.error('Error fetching receipt customization:', error);
      return this.getDefaultReceiptCustomization(userId);
    }
  }

  /**
   * Update user's receipt customization
   */
  async updateReceiptCustomization(
    userId: string,
    customization: Partial<ReceiptCustomization>
  ): Promise<ReceiptCustomization> {
    try {
      const { data, error } = await supabase
        .from('receipt_customizations')
        .upsert(
          {
            user_id: userId,
            ...customization,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return this.mapReceiptCustomization(data);
    } catch (error) {
      console.error('Error updating receipt customization:', error);
      throw new Error('Failed to update receipt customization');
    }
  }

  /**
   * Get user's payment link customization
   */
  async getPaymentLinkCustomization(userId: string): Promise<PaymentLinkCustomization | null> {
    try {
      const { data, error } = await supabase
        .from('payment_link_customizations')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data ? this.mapPaymentLinkCustomization(data) : this.getDefaultPaymentLinkCustomization(userId);
    } catch (error) {
      console.error('Error fetching payment link customization:', error);
      return this.getDefaultPaymentLinkCustomization(userId);
    }
  }

  /**
   * Update user's payment link customization
   */
  async updatePaymentLinkCustomization(
    userId: string,
    customization: Partial<PaymentLinkCustomization>
  ): Promise<PaymentLinkCustomization> {
    try {
      const { data, error } = await supabase
        .from('payment_link_customizations')
        .upsert(
          {
            user_id: userId,
            ...customization,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return this.mapPaymentLinkCustomization(data);
    } catch (error) {
      console.error('Error updating payment link customization:', error);
      throw new Error('Failed to update payment link customization');
    }
  }

  /**
   * Get default invoice customization
   */
  private getDefaultInvoiceCustomization(userId: string): InvoiceCustomization {
    return {
      userId,
      companyName: 'My Company',
      invoicePrefix: 'INV',
      currency: 'USD',
      primaryColor: '#2563eb',
      secondaryColor: '#64748b',
      fontFamily: 'Inter',
      includeNotes: true,
      includeTerms: true,
    };
  }

  /**
   * Get default receipt customization
   */
  private getDefaultReceiptCustomization(userId: string): ReceiptCustomization {
    return {
      userId,
      companyName: 'My Company',
      receiptPrefix: 'RCP',
      currency: 'USD',
      primaryColor: '#2563eb',
      includeQRCode: true,
      includeSignature: false,
    };
  }

  /**
   * Get default payment link customization
   */
  private getDefaultPaymentLinkCustomization(userId: string): PaymentLinkCustomization {
    return {
      userId,
      companyName: 'My Company',
      primaryColor: '#2563eb',
      secondaryColor: '#64748b',
    };
  }

  /**
   * Map database response to InvoiceCustomization
   */
  private mapInvoiceCustomization(data: any): InvoiceCustomization {
    return {
      id: data.id,
      userId: data.user_id,
      companyName: data.company_name,
      companyLogo: data.company_logo,
      companyEmail: data.company_email,
      companyPhone: data.company_phone,
      companyAddress: data.company_address,
      companyWebsite: data.company_website,
      taxId: data.tax_id,
      invoicePrefix: data.invoice_prefix,
      currency: data.currency,
      primaryColor: data.primary_color,
      secondaryColor: data.secondary_color,
      fontFamily: data.font_family,
      includeNotes: data.include_notes,
      includeTerms: data.include_terms,
      customNotes: data.custom_notes,
      customTerms: data.custom_terms,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Map database response to ReceiptCustomization
   */
  private mapReceiptCustomization(data: any): ReceiptCustomization {
    return {
      id: data.id,
      userId: data.user_id,
      companyName: data.company_name,
      companyLogo: data.company_logo,
      companyEmail: data.company_email,
      companyPhone: data.company_phone,
      companyAddress: data.company_address,
      receiptPrefix: data.receipt_prefix,
      currency: data.currency,
      primaryColor: data.primary_color,
      includeQRCode: data.include_qr_code,
      includeSignature: data.include_signature,
      customFooter: data.custom_footer,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Map database response to PaymentLinkCustomization
   */
  private mapPaymentLinkCustomization(data: any): PaymentLinkCustomization {
    return {
      id: data.id,
      userId: data.user_id,
      companyName: data.company_name,
      companyLogo: data.company_logo,
      bannerImage: data.banner_image,
      bannerText: data.banner_text,
      primaryColor: data.primary_color,
      secondaryColor: data.secondary_color,
      successMessage: data.success_message,
      customCSS: data.custom_css,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

export const invoiceTemplateService = new InvoiceTemplateService();

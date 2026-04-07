// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";

export interface Invoice {
  id: string;
  projectId: string;
  freelancerId: string;
  clientId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: "draft" | "sent" | "viewed" | "partial" | "paid" | "overdue" | "cancelled";
  issueDate: Date;
  dueDate: Date;
  lineItems: InvoiceLineItem[];
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  notes?: string;
  termsAndConditions?: string;
  paymentTerms?: string;
  viewedAt?: Date;
  paidAt?: Date;
  metadata?: Record<string, any>;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export class FreelanceInvoiceService {
  // ============================================================================
  // INVOICE CREATION AND MANAGEMENT
  // ============================================================================

  static async createInvoice(
    projectId: string,
    freelancerId: string,
    clientId: string,
    amount: number,
    dueDate: Date,
    lineItems: Omit<InvoiceLineItem, "id">[] = [],
    options?: {
      taxRate?: number;
      discount?: number;
      notes?: string;
      terms?: string;
    }
  ): Promise<Invoice | null> {
    try {
      const invoiceNumber = await this.generateInvoiceNumber(freelancerId);
      const taxAmount = amount * ((options?.taxRate || 0) / 100);
      const discountAmount = options?.discount || 0;

      const { data, error } = await supabase
        .from("freelance_invoices")
        .insert([
          {
            project_id: projectId,
            freelancer_id: freelancerId,
            client_id: clientId,
            invoice_number: invoiceNumber,
            amount,
            currency: "USD",
            status: "draft",
            issue_date: new Date().toISOString(),
            due_date: dueDate.toISOString(),
            tax_rate: options?.taxRate || 0,
            tax_amount: taxAmount,
            discount_amount: discountAmount,
            notes: options?.notes,
            terms_and_conditions: options?.terms,
            line_items:
              lineItems.map((item) => ({
                ...item,
                id: Math.random().toString(36).substr(2, 9),
              })) || [],
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      await this.logInvoiceActivity(
        freelancerId,
        "invoice_created",
        data.id,
        invoiceNumber
      );

      return this.mapInvoiceData(data);
    } catch (error) {
      console.error("Error creating invoice:", error);
      return null;
    }
  }

  static async updateInvoice(
    invoiceId: string,
    updates: Partial<Omit<Invoice, "id" | "invoiceNumber" | "createdAt">>
  ): Promise<Invoice | null> {
    try {
      const updateData: any = {};

      if (updates.amount !== undefined) updateData.amount = updates.amount;
      if (updates.dueDate !== undefined)
        updateData.due_date = updates.dueDate.toISOString();
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.taxRate !== undefined) updateData.tax_rate = updates.taxRate;
      if (updates.taxAmount !== undefined) updateData.tax_amount = updates.taxAmount;
      if (updates.discountAmount !== undefined)
        updateData.discount_amount = updates.discountAmount;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.termsAndConditions !== undefined)
        updateData.terms_and_conditions = updates.termsAndConditions;
      if (updates.lineItems !== undefined) {
        updateData.line_items = updates.lineItems.map((item) => ({
          ...item,
          id: item.id || Math.random().toString(36).substr(2, 9),
        }));
      }

      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from("freelance_invoices")
        .update(updateData)
        .eq("id", invoiceId)
        .select()
        .single();

      if (error) throw error;

      await this.logInvoiceActivity(
        updates.freelancerId || "",
        "invoice_updated",
        invoiceId,
        data.invoice_number
      );

      return this.mapInvoiceData(data);
    } catch (error) {
      console.error("Error updating invoice:", error);
      return null;
    }
  }

  static async sendInvoice(invoiceId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("freelance_invoices")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", invoiceId);

      if (error) throw error;

      const invoice = await this.getInvoice(invoiceId);
      if (invoice) {
        await this.logInvoiceActivity(
          invoice.freelancerId,
          "invoice_sent",
          invoiceId,
          invoice.invoiceNumber
        );
      }

      return true;
    } catch (error) {
      console.error("Error sending invoice:", error);
      return false;
    }
  }

  static async markInvoiceAsViewed(invoiceId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("freelance_invoices")
        .update({
          status: "viewed",
          viewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", invoiceId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error marking invoice as viewed:", error);
      return false;
    }
  }

  static async markInvoiceAsPaid(
    invoiceId: string,
    paidAmount?: number
  ): Promise<boolean> {
    try {
      const invoice = await this.getInvoice(invoiceId);
      if (!invoice) return false;

      const status =
        paidAmount && paidAmount < invoice.amount ? "partial" : "paid";

      const { error } = await supabase
        .from("freelance_invoices")
        .update({
          status,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", invoiceId);

      if (error) throw error;

      // Log the payment
      if (status === "paid") {
        await this.logInvoiceActivity(
          invoice.freelancerId,
          "invoice_paid",
          invoiceId,
          invoice.invoiceNumber
        );
      }

      return true;
    } catch (error) {
      console.error("Error marking invoice as paid:", error);
      return false;
    }
  }

  static async cancelInvoice(invoiceId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("freelance_invoices")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", invoiceId);

      if (error) throw error;

      const invoice = await this.getInvoice(invoiceId);
      if (invoice) {
        await this.logInvoiceActivity(
          invoice.freelancerId,
          "invoice_cancelled",
          invoiceId,
          invoice.invoiceNumber
        );
      }

      return true;
    } catch (error) {
      console.error("Error cancelling invoice:", error);
      return false;
    }
  }

  // ============================================================================
  // INVOICE RETRIEVAL
  // ============================================================================

  static async getInvoice(invoiceId: string): Promise<Invoice | null> {
    try {
      const { data, error } = await supabase
        .from("freelance_invoices")
        .select("*")
        .eq("id", invoiceId)
        .single();

      if (error) return null;

      return this.mapInvoiceData(data);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      return null;
    }
  }

  static async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | null> {
    try {
      const { data, error } = await supabase
        .from("freelance_invoices")
        .select("*")
        .eq("invoice_number", invoiceNumber)
        .single();

      if (error) return null;

      return this.mapInvoiceData(data);
    } catch (error) {
      console.error("Error fetching invoice by number:", error);
      return null;
    }
  }

  static async getFreelancerInvoices(
    freelancerId: string,
    status?: Invoice["status"]
  ): Promise<Invoice[]> {
    try {
      let query = supabase
        .from("freelance_invoices")
        .select("*")
        .eq("freelancer_id", freelancerId);

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query.order("issue_date", {
        ascending: false,
      });

      if (error) throw error;

      return (data || []).map((inv) => this.mapInvoiceData(inv));
    } catch (error) {
      console.error("Error fetching invoices:", error);
      return [];
    }
  }

  static async getProjectInvoices(projectId: string): Promise<Invoice[]> {
    try {
      const { data, error } = await supabase
        .from("freelance_invoices")
        .select("*")
        .eq("project_id", projectId)
        .order("issue_date", { ascending: false });

      if (error) throw error;

      return (data || []).map((inv) => this.mapInvoiceData(inv));
    } catch (error) {
      console.error("Error fetching project invoices:", error);
      return [];
    }
  }

  static async getClientInvoices(clientId: string): Promise<Invoice[]> {
    try {
      const { data, error } = await supabase
        .from("freelance_invoices")
        .select("*")
        .eq("client_id", clientId)
        .order("issue_date", { ascending: false });

      if (error) throw error;

      return (data || []).map((inv) => this.mapInvoiceData(inv));
    } catch (error) {
      console.error("Error fetching client invoices:", error);
      return [];
    }
  }

  // ============================================================================
  // INVOICE STATISTICS AND REPORTING
  // ============================================================================

  static async getInvoiceStats(
    freelancerId: string
  ): Promise<{
    totalIssued: number;
    totalPaid: number;
    totalOutstanding: number;
    totalOverdue: number;
    averageInvoiceAmount: number;
  } | null> {
    try {
      const { data, error } = await supabase
        .from("freelance_invoices")
        .select("amount, status")
        .eq("freelancer_id", freelancerId);

      if (error) throw error;

      const invoices = data || [];
      const paidInvoices = invoices.filter((i: any) => i.status === "paid");
      const outstandingInvoices = invoices.filter(
        (i: any) => i.status === "sent" || i.status === "viewed" || i.status === "partial"
      );
      const overdueInvoices = invoices.filter((i: any) => i.status === "overdue");

      const totalIssued = invoices.reduce(
        (sum: number, i: any) => sum + (i.amount || 0),
        0
      );
      const totalPaid = paidInvoices.reduce(
        (sum: number, i: any) => sum + (i.amount || 0),
        0
      );
      const totalOutstanding = outstandingInvoices.reduce(
        (sum: number, i: any) => sum + (i.amount || 0),
        0
      );
      const totalOverdue = overdueInvoices.reduce(
        (sum: number, i: any) => sum + (i.amount || 0),
        0
      );
      const averageAmount = invoices.length > 0 ? totalIssued / invoices.length : 0;

      return {
        totalIssued,
        totalPaid,
        totalOutstanding,
        totalOverdue,
        averageInvoiceAmount: averageAmount,
      };
    } catch (error) {
      console.error("Error fetching invoice stats:", error);
      return null;
    }
  }

  static async getMonthlyInvoiceStats(
    freelancerId: string,
    year: number,
    month: number
  ): Promise<{
    totalIssued: number;
    totalPaid: number;
    invoiceCount: number;
    averageAmount: number;
  } | null> {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const { data, error } = await supabase
        .from("freelance_invoices")
        .select("amount, status")
        .eq("freelancer_id", freelancerId)
        .gte("issue_date", startDate.toISOString())
        .lte("issue_date", endDate.toISOString());

      if (error) throw error;

      const invoices = data || [];
      const paidInvoices = invoices.filter((i: any) => i.status === "paid");

      const totalIssued = invoices.reduce(
        (sum: number, i: any) => sum + (i.amount || 0),
        0
      );
      const totalPaid = paidInvoices.reduce(
        (sum: number, i: any) => sum + (i.amount || 0),
        0
      );
      const averageAmount = invoices.length > 0 ? totalIssued / invoices.length : 0;

      return {
        totalIssued,
        totalPaid,
        invoiceCount: invoices.length,
        averageAmount,
      };
    } catch (error) {
      console.error("Error fetching monthly invoice stats:", error);
      return null;
    }
  }

  static async getOverdueInvoices(freelancerId: string): Promise<Invoice[]> {
    try {
      const now = new Date();
      const { data, error } = await supabase
        .from("freelance_invoices")
        .select("*")
        .eq("freelancer_id", freelancerId)
        .in("status", ["sent", "viewed", "partial"])
        .lt("due_date", now.toISOString())
        .order("due_date", { ascending: true });

      if (error) throw error;

      return (data || []).map((inv) => this.mapInvoiceData(inv));
    } catch (error) {
      console.error("Error fetching overdue invoices:", error);
      return [];
    }
  }

  // ============================================================================
  // INVOICE GENERATION AND EXPORT
  // ============================================================================

  static async generateInvoicePDF(invoiceId: string): Promise<Blob | null> {
    try {
      const invoice = await this.getInvoice(invoiceId);
      if (!invoice) return null;

      // This would integrate with a PDF generation service
      // For now, return a placeholder
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`, {
        method: "GET",
      });

      if (response.ok) {
        return await response.blob();
      }
      return null;
    } catch (error) {
      console.error("Error generating PDF:", error);
      return null;
    }
  }

  static async downloadInvoice(invoiceId: string): Promise<void> {
    try {
      const pdf = await this.generateInvoicePDF(invoiceId);
      if (!pdf) throw new Error("Failed to generate PDF");

      const url = window.URL.createObjectURL(pdf);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading invoice:", error);
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private static async generateInvoiceNumber(freelancerId: string): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const randomSuffix = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");

    return `INV-${freelancerId.substring(0, 6)}-${year}${month}-${randomSuffix}`;
  }

  private static mapInvoiceData(data: any): Invoice {
    return {
      id: data.id,
      projectId: data.project_id,
      freelancerId: data.freelancer_id,
      clientId: data.client_id,
      invoiceNumber: data.invoice_number,
      amount: data.amount,
      currency: data.currency || "USD",
      status: data.status || "draft",
      issueDate: new Date(data.issue_date),
      dueDate: new Date(data.due_date),
      lineItems: Array.isArray(data.line_items)
        ? data.line_items.map((item: any) => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            amount: item.amount,
          }))
        : [],
      taxRate: data.tax_rate || 0,
      taxAmount: data.tax_amount || 0,
      discountAmount: data.discount_amount || 0,
      notes: data.notes,
      termsAndConditions: data.terms_and_conditions,
      paymentTerms: data.payment_terms,
      viewedAt: data.viewed_at ? new Date(data.viewed_at) : undefined,
      paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
      metadata: data.metadata || {},
    };
  }

  private static async logInvoiceActivity(
    freelancerId: string,
    activityType: string,
    invoiceId: string,
    invoiceNumber: string
  ): Promise<void> {
    try {
      await supabase.from("freelance_activity_logs").insert([
        {
          user_id: freelancerId,
          activity_type: activityType,
          entity_type: "invoice",
          entity_id: invoiceId,
          description: `${activityType.replace(/_/g, " ")}: ${invoiceNumber}`,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error("Error logging invoice activity:", error);
    }
  }
}

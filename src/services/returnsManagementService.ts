import { supabase } from "@/integrations/supabase/client";

export type ReturnStatus = "pending" | "approved" | "rejected" | "returned_received" | "refunded" | "cancelled";
export type ReturnReason = "defective" | "not_as_described" | "wrong_item" | "damage_shipping" | "changed_mind" | "other";

export interface ReturnRequest {
  id: string;
  orderId: string;
  productId: string;
  sellerId: string;
  customerId: string;
  reason: ReturnReason;
  description: string;
  status: ReturnStatus;
  refundAmount: number;
  returnedAmount: number;
  originalPrice: number;
  shippingCost: number;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  refundedAt?: string;
  notes?: string;
  evidenceImages?: string[];
  trackingNumber?: string;
  sellerResponse?: string;
}

export interface RefundTransaction {
  id: string;
  returnRequestId: string;
  orderId: string;
  customerId: string;
  amount: number;
  status: "pending" | "processing" | "completed" | "failed";
  method: "original_payment" | "wallet_credit" | "bank_transfer";
  processedAt?: string;
  notes?: string;
  failureReason?: string;
}

export interface ReturnAnalytics {
  totalReturns: number;
  totalReturnValue: number;
  approvedReturns: number;
  rejectedReturns: number;
  pendingReturns: number;
  returnRate: number;
  averageRefundAmount: number;
  returnReasons: Record<ReturnReason, number>;
  reasonTrends: Array<{ reason: ReturnReason; count: number }>;
  returnsByMonth: Array<{ month: string; count: number; value: number }>;
  topReturnedProducts: Array<{ productId: string; productName: string; returnCount: number }>;
  customerReturnPatterns: {
    returningCustomers: number;
    repeatReturnCustomers: number;
  };
}

export class ReturnsManagementService {
  // Create return request
  static async createReturnRequest(
    orderId: string,
    productId: string,
    sellerId: string,
    customerId: string,
    reason: ReturnReason,
    description: string,
    evidence?: string[]
  ): Promise<ReturnRequest | null> {
    try {
      // Get order details
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("total_amount, shipping_cost")
        .eq("id", orderId)
        .single();

      if (orderError) {
        console.error("Error fetching order:", orderError);
        return null;
      }

      const returnData = {
        order_id: orderId,
        product_id: productId,
        seller_id: sellerId,
        customer_id: customerId,
        reason,
        description,
        status: "pending" as ReturnStatus,
        refund_amount: (order?.total_amount || 0) * 0.9, // 90% refund as default
        original_price: order?.total_amount || 0,
        shipping_cost: order?.shipping_cost || 0,
        evidence_images: evidence || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("return_requests")
        .insert([returnData])
        .select()
        .single();

      if (error) {
        console.error("Error creating return request:", error);
        return null;
      }

      return this.mapReturnData(data);
    } catch (error) {
      console.error("Error in createReturnRequest:", error);
      return null;
    }
  }

  // Get seller's return requests
  static async getSellerReturns(
    sellerId: string,
    status?: ReturnStatus,
    limit: number = 20
  ): Promise<ReturnRequest[]> {
    try {
      let query = supabase.from("return_requests").select("*").eq("seller_id", sellerId);

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching returns:", error);
        return [];
      }

      return (data || []).map((d) => this.mapReturnData(d));
    } catch (error) {
      console.error("Error in getSellerReturns:", error);
      return [];
    }
  }

  // Approve return request
  static async approveReturn(returnId: string, notes?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("return_requests")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          seller_response: notes,
        })
        .eq("id", returnId);

      if (error) {
        console.error("Error approving return:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in approveReturn:", error);
      return false;
    }
  }

  // Reject return request
  static async rejectReturn(returnId: string, reason: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("return_requests")
        .update({
          status: "rejected",
          updated_at: new Date().toISOString(),
          seller_response: reason,
        })
        .eq("id", returnId);

      if (error) {
        console.error("Error rejecting return:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in rejectReturn:", error);
      return false;
    }
  }

  // Process refund
  static async processRefund(
    returnId: string,
    method: "original_payment" | "wallet_credit" | "bank_transfer" = "original_payment"
  ): Promise<RefundTransaction | null> {
    try {
      // Get return request details
      const { data: returnRequest, error: returnError } = await supabase
        .from("return_requests")
        .select("*")
        .eq("id", returnId)
        .single();

      if (returnError) {
        console.error("Error fetching return request:", returnError);
        return null;
      }

      // Create refund transaction
      const refundData = {
        return_request_id: returnId,
        order_id: returnRequest.order_id,
        customer_id: returnRequest.customer_id,
        amount: returnRequest.refund_amount,
        status: "processing" as const,
        method,
        created_at: new Date().toISOString(),
      };

      const { data: refund, error: refundError } = await supabase
        .from("refund_transactions")
        .insert([refundData])
        .select()
        .single();

      if (refundError) {
        console.error("Error creating refund transaction:", refundError);
        return null;
      }

      // Update return request status
      await supabase
        .from("return_requests")
        .update({
          status: "refunded",
          refunded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", returnId);

      return this.mapRefundData(refund);
    } catch (error) {
      console.error("Error in processRefund:", error);
      return null;
    }
  }

  // Get return analytics
  static async getReturnAnalytics(sellerId: string, days: number = 90): Promise<ReturnAnalytics> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get all returns for seller
      const { data: returns, error: returnsError } = await supabase
        .from("return_requests")
        .select("*")
        .eq("seller_id", sellerId)
        .gte("created_at", startDate.toISOString());

      if (returnsError) {
        console.error("Error fetching returns:", returnsError);
      }

      const returnsList = returns || [];
      const totalReturns = returnsList.length;
      const totalReturnValue = returnsList.reduce((sum, r) => sum + (r.refund_amount || 0), 0);
      const approvedReturns = returnsList.filter((r) => r.status === "approved").length;
      const rejectedReturns = returnsList.filter((r) => r.status === "rejected").length;
      const pendingReturns = returnsList.filter((r) => r.status === "pending").length;

      // Get total orders to calculate return rate
      const { count: totalOrders } = await supabase
        .from("orders")
        .select("*", { count: "exact" })
        .eq("seller_id", sellerId)
        .gte("created_at", startDate.toISOString());

      const returnRate =
        (totalOrders && totalOrders > 0 ? (totalReturns / totalOrders) * 100 : 0);

      // Group by reason
      const returnReasons: Record<ReturnReason, number> = {
        defective: 0,
        not_as_described: 0,
        wrong_item: 0,
        damage_shipping: 0,
        changed_mind: 0,
        other: 0,
      };

      returnsList.forEach((r) => {
        if (returnReasons.hasOwnProperty(r.reason)) {
          returnReasons[r.reason as ReturnReason]++;
        }
      });

      // Get reason trends
      const reasonTrends = Object.entries(returnReasons)
        .map(([reason, count]) => ({ reason: reason as ReturnReason, count }))
        .sort((a, b) => b.count - a.count);

      // Group by month
      const returnsByMonth: Array<{ month: string; count: number; value: number }> = [];
      const monthMap: Record<string, { count: number; value: number }> = {};

      returnsList.forEach((r) => {
        const month = new Date(r.created_at).toISOString().substring(0, 7);
        if (!monthMap[month]) {
          monthMap[month] = { count: 0, value: 0 };
        }
        monthMap[month].count++;
        monthMap[month].value += r.refund_amount || 0;
      });

      Object.entries(monthMap).forEach(([month, data]) => {
        returnsByMonth.push({ month, ...data });
      });

      // Get top returned products
      const productReturns: Record<string, { productName: string; count: number }> = {};
      returnsList.forEach((r) => {
        if (!productReturns[r.product_id]) {
          productReturns[r.product_id] = { productName: "Product " + r.product_id, count: 0 };
        }
        productReturns[r.product_id].count++;
      });

      const topReturnedProducts = Object.entries(productReturns)
        .map(([productId, data]) => ({
          productId,
          productName: data.productName,
          returnCount: data.count,
        }))
        .sort((a, b) => b.returnCount - a.returnCount)
        .slice(0, 5);

      // Get customer patterns
      const customerReturnMap: Record<string, number> = {};
      returnsList.forEach((r) => {
        customerReturnMap[r.customer_id] = (customerReturnMap[r.customer_id] || 0) + 1;
      });

      const returningCustomers = Object.keys(customerReturnMap).length;
      const repeatReturnCustomers = Object.values(customerReturnMap).filter((c) => c > 1).length;

      return {
        totalReturns,
        totalReturnValue: Math.round(totalReturnValue * 100) / 100,
        approvedReturns,
        rejectedReturns,
        pendingReturns,
        returnRate: Math.round(returnRate * 100) / 100,
        averageRefundAmount:
          totalReturns > 0 ? Math.round((totalReturnValue / totalReturns) * 100) / 100 : 0,
        returnReasons,
        reasonTrends,
        returnsByMonth: returnsByMonth.sort((a, b) => a.month.localeCompare(b.month)),
        topReturnedProducts,
        customerReturnPatterns: {
          returningCustomers,
          repeatReturnCustomers,
        },
      };
    } catch (error) {
      console.error("Error in getReturnAnalytics:", error);
      return {
        totalReturns: 0,
        totalReturnValue: 0,
        approvedReturns: 0,
        rejectedReturns: 0,
        pendingReturns: 0,
        returnRate: 0,
        averageRefundAmount: 0,
        returnReasons: { defective: 0, not_as_described: 0, wrong_item: 0, damage_shipping: 0, changed_mind: 0, other: 0 },
        reasonTrends: [],
        returnsByMonth: [],
        topReturnedProducts: [],
        customerReturnPatterns: { returningCustomers: 0, repeatReturnCustomers: 0 },
      };
    }
  }

  // Get return details
  static async getReturnDetails(returnId: string): Promise<ReturnRequest | null> {
    try {
      const { data, error } = await supabase
        .from("return_requests")
        .select("*")
        .eq("id", returnId)
        .single();

      if (error) {
        console.error("Error fetching return details:", error);
        return null;
      }

      return this.mapReturnData(data);
    } catch (error) {
      console.error("Error in getReturnDetails:", error);
      return null;
    }
  }

  // Update return tracking number
  static async updateReturnTracking(
    returnId: string,
    trackingNumber: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("return_requests")
        .update({
          tracking_number: trackingNumber,
          updated_at: new Date().toISOString(),
        })
        .eq("id", returnId);

      if (error) {
        console.error("Error updating tracking:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in updateReturnTracking:", error);
      return false;
    }
  }

  // Mark return as received
  static async markReturnReceived(returnId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("return_requests")
        .update({
          status: "returned_received",
          updated_at: new Date().toISOString(),
        })
        .eq("id", returnId);

      if (error) {
        console.error("Error marking return received:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in markReturnReceived:", error);
      return false;
    }
  }

  // Helper functions
  private static mapReturnData(data: any): ReturnRequest {
    return {
      id: data.id,
      orderId: data.order_id,
      productId: data.product_id,
      sellerId: data.seller_id,
      customerId: data.customer_id,
      reason: data.reason,
      description: data.description,
      status: data.status,
      refundAmount: data.refund_amount,
      returnedAmount: data.returned_amount || 0,
      originalPrice: data.original_price,
      shippingCost: data.shipping_cost,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      approvedAt: data.approved_at,
      refundedAt: data.refunded_at,
      notes: data.notes,
      evidenceImages: data.evidence_images || [],
      trackingNumber: data.tracking_number,
      sellerResponse: data.seller_response,
    };
  }

  private static mapRefundData(data: any): RefundTransaction {
    return {
      id: data.id,
      returnRequestId: data.return_request_id,
      orderId: data.order_id,
      customerId: data.customer_id,
      amount: data.amount,
      status: data.status,
      method: data.method,
      processedAt: data.processed_at,
      notes: data.notes,
      failureReason: data.failure_reason,
    };
  }
}

export const returnsManagementService = new ReturnsManagementService();

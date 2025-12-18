import { supabase } from '@/integrations/supabase/client';

export type ReturnStatus = 'requested' | 'approved' | 'denied' | 'returned' | 'refunded';
export type ReturnReason =
  | 'defective'
  | 'damaged_in_shipping'
  | 'not_as_described'
  | 'changed_mind'
  | 'better_price_found'
  | 'unwanted_item'
  | 'other';

export interface ReturnItem {
  orderItemId: string;
  productId: string;
  quantity: number;
  reason: ReturnReason;
  comments?: string;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  orderNumber: string;
  userId: string;
  sellerId: string;
  status: ReturnStatus;
  items: ReturnItem[];
  reason: string;
  comments?: string;
  returnTrackingNumber?: string;
  returnLabel?: string;
  refundAmount: number;
  refundStatus: 'pending' | 'processed' | 'failed';
  refundTransactionId?: string;
  returnedDate?: string;
  refundedDate?: string;
  proofOfReturn?: string; // URL or file path
  sellerResponse?: string;
  sellerResponseDate?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnPolicy {
  sellerId: string;
  returnWindowDays: number;
  restockingFeePercentage: number;
  shippingCost: 'seller_paid' | 'buyer_paid' | 'free';
  conditions: string;
  exceptions: string[];
}

class ReturnsService {
  /**
   * Create a return request for an order
   */
  static async createReturnRequest(
    orderId: string,
    userId: string,
    items: ReturnItem[],
    reason: string,
    comments?: string
  ): Promise<ReturnRequest | null> {
    try {
      // Fetch order details to calculate refund amount
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        console.error('Error fetching order:', orderError);
        return null;
      }

      // Validate return request is within return window (30 days)
      const createdDate = new Date(order.created_at);
      const daysSinceOrder = Math.floor(
        (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceOrder > 30) {
        console.error('Return request is outside the 30-day return window');
        return null;
      }

      // Calculate refund amount based on items
      let refundAmount = 0;
      const orderItems = Array.isArray(order.items) ? order.items : [];

      items.forEach((returnItem) => {
        const orderItem = orderItems.find(
          (item: any) => item.product_id === returnItem.productId
        );
        if (orderItem) {
          refundAmount += orderItem.unit_price * returnItem.quantity;
        }
      });

      // Apply restocking fee if applicable
      const restockingFee = refundAmount * 0.05; // 5% restocking fee
      const finalRefundAmount = Math.max(0, refundAmount - restockingFee);

      // Create return request record
      const { data: returnRequest, error: createError } = await supabase
        .from('returns')
        .insert([
          {
            order_id: orderId,
            order_number: order.order_number,
            user_id: userId,
            seller_id: order.seller_id,
            status: 'requested',
            items: items,
            reason: reason,
            comments: comments || null,
            refund_amount: finalRefundAmount,
            refund_status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (createError) {
        console.error('Error creating return request:', createError);
        return null;
      }

      return this.mapDatabaseReturnToReturn(returnRequest);
    } catch (error) {
      console.error('Error in createReturnRequest:', error);
      return null;
    }
  }

  /**
   * Get return request details
   */
  static async getReturnRequest(returnId: string): Promise<ReturnRequest | null> {
    try {
      const { data: returnRequest, error } = await supabase
        .from('returns')
        .select('*')
        .eq('id', returnId)
        .single();

      if (error || !returnRequest) {
        console.error('Error fetching return request:', error);
        return null;
      }

      return this.mapDatabaseReturnToReturn(returnRequest);
    } catch (error) {
      console.error('Error in getReturnRequest:', error);
      return null;
    }
  }

  /**
   * Update return request status
   */
  static async updateReturnStatus(
    returnId: string,
    status: ReturnStatus,
    sellerResponse?: string
  ): Promise<ReturnRequest | null> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (sellerResponse) {
        updateData.seller_response = sellerResponse;
        updateData.seller_response_date = new Date().toISOString();
      }

      const { data: returnRequest, error } = await supabase
        .from('returns')
        .update(updateData)
        .eq('id', returnId)
        .select()
        .single();

      if (error) {
        console.error('Error updating return status:', error);
        return null;
      }

      return this.mapDatabaseReturnToReturn(returnRequest);
    } catch (error) {
      console.error('Error in updateReturnStatus:', error);
      return null;
    }
  }

  /**
   * Process refund for a return request
   */
  static async processRefund(
    returnId: string,
    amount: number
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      // Get return request details
      const { data: returnRequest, error: fetchError } = await supabase
        .from('returns')
        .select('*')
        .eq('id', returnId)
        .single();

      if (fetchError || !returnRequest) {
        return {
          success: false,
          error: 'Return request not found',
        };
      }

      // Generate transaction ID
      const transactionId = `refund_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Update return request with refund info
      const { error: updateError } = await supabase
        .from('returns')
        .update({
          refund_status: 'processed',
          refund_amount: amount,
          refund_transaction_id: transactionId,
          refunded_date: new Date().toISOString(),
          status: 'refunded',
          updated_at: new Date().toISOString(),
        })
        .eq('id', returnId);

      if (updateError) {
        console.error('Error processing refund:', updateError);
        return {
          success: false,
          error: 'Failed to process refund',
        };
      }

      // Update order with return information
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          return_status: 'refunded',
          refund_amount: amount,
          refunded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', returnRequest.order_id);

      if (orderError) {
        console.error('Error updating order:', orderError);
        return {
          success: false,
          error: 'Failed to update order',
        };
      }

      return {
        success: true,
        transactionId,
      };
    } catch (error) {
      console.error('Error in processRefund:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Refund processing failed',
      };
    }
  }

  /**
   * Get return history for a user
   */
  static async getUserReturns(userId: string): Promise<ReturnRequest[]> {
    try {
      const { data: returns, error } = await supabase
        .from('returns')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user returns:', error);
        return [];
      }

      return returns.map((r) => this.mapDatabaseReturnToReturn(r));
    } catch (error) {
      console.error('Error in getUserReturns:', error);
      return [];
    }
  }

  /**
   * Get return history for a seller
   */
  static async getSellerReturns(sellerId: string): Promise<ReturnRequest[]> {
    try {
      const { data: returns, error } = await supabase
        .from('returns')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching seller returns:', error);
        return [];
      }

      return returns.map((r) => this.mapDatabaseReturnToReturn(r));
    } catch (error) {
      console.error('Error in getSellerReturns:', error);
      return [];
    }
  }

  /**
   * Get return requests for an order
   */
  static async getOrderReturns(orderId: string): Promise<ReturnRequest[]> {
    try {
      const { data: returns, error } = await supabase
        .from('returns')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching order returns:', error);
        return [];
      }

      return returns.map((r) => this.mapDatabaseReturnToReturn(r));
    } catch (error) {
      console.error('Error in getOrderReturns:', error);
      return [];
    }
  }

  /**
   * Get return policy for a seller
   */
  static async getSellerReturnPolicy(sellerId: string): Promise<ReturnPolicy | null> {
    try {
      const { data: policy, error } = await supabase
        .from('return_policies')
        .select('*')
        .eq('seller_id', sellerId)
        .single();

      if (error) {
        console.error('Error fetching return policy:', error);
        // Return default policy
        return {
          sellerId,
          returnWindowDays: 30,
          restockingFeePercentage: 5,
          shippingCost: 'buyer_paid',
          conditions: 'Items must be unused and in original packaging',
          exceptions: ['Digital products', 'Customized items'],
        };
      }

      return {
        sellerId: policy.seller_id,
        returnWindowDays: policy.return_window_days || 30,
        restockingFeePercentage: policy.restocking_fee_percentage || 5,
        shippingCost: policy.shipping_cost || 'buyer_paid',
        conditions: policy.conditions || '',
        exceptions: policy.exceptions || [],
      };
    } catch (error) {
      console.error('Error in getSellerReturnPolicy:', error);
      return null;
    }
  }

  /**
   * Validate return request eligibility
   */
  static async validateReturnEligibility(
    orderId: string,
    userId: string
  ): Promise<{
    eligible: boolean;
    reason?: string;
    returnWindowDays?: number;
    daysRemaining?: number;
  }> {
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('buyer_id', userId)
        .single();

      if (orderError || !order) {
        return {
          eligible: false,
          reason: 'Order not found',
        };
      }

      // Check if order is eligible for return
      if (
        order.status === 'cancelled' ||
        order.status === 'refunded' ||
        order.fulfillment_status === 'cancelled'
      ) {
        return {
          eligible: false,
          reason: 'Order cannot be returned',
        };
      }

      // Check return window
      const createdDate = new Date(order.created_at);
      const daysSinceOrder = Math.floor(
        (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const returnWindowDays = 30;
      const daysRemaining = Math.max(0, returnWindowDays - daysSinceOrder);

      if (daysSinceOrder > returnWindowDays) {
        return {
          eligible: false,
          reason: `Return window has expired. You have 30 days from order date.`,
          returnWindowDays,
          daysRemaining: 0,
        };
      }

      return {
        eligible: true,
        returnWindowDays,
        daysRemaining,
      };
    } catch (error) {
      console.error('Error in validateReturnEligibility:', error);
      return {
        eligible: false,
        reason: 'Error validating return eligibility',
      };
    }
  }

  // Helper methods

  private static mapDatabaseReturnToReturn(dbReturn: any): ReturnRequest {
    return {
      id: dbReturn.id,
      orderId: dbReturn.order_id,
      orderNumber: dbReturn.order_number,
      userId: dbReturn.user_id,
      sellerId: dbReturn.seller_id,
      status: dbReturn.status,
      items: dbReturn.items || [],
      reason: dbReturn.reason,
      comments: dbReturn.comments,
      returnTrackingNumber: dbReturn.return_tracking_number,
      returnLabel: dbReturn.return_label,
      refundAmount: dbReturn.refund_amount,
      refundStatus: dbReturn.refund_status,
      refundTransactionId: dbReturn.refund_transaction_id,
      returnedDate: dbReturn.returned_date,
      refundedDate: dbReturn.refunded_date,
      proofOfReturn: dbReturn.proof_of_return,
      sellerResponse: dbReturn.seller_response,
      sellerResponseDate: dbReturn.seller_response_date,
      adminNotes: dbReturn.admin_notes,
      createdAt: dbReturn.created_at,
      updatedAt: dbReturn.updated_at,
    };
  }
}

export default ReturnsService;

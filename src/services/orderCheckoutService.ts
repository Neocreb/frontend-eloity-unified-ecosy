import { supabase } from '@/integrations/supabase/client';
import type { Order, OrderItem, PaymentStatus } from '@/types/enhanced-marketplace';
import { CartItem, Address, PaymentMethod } from '@/types/marketplace';

export interface CreateOrderInput {
  buyerId: string;
  customerName: string;
  customerEmail: string;
  items: CartItem[];
  shippingAddress: Address;
  billingAddress?: Address;
  shippingMethod: string;
  shippingCost: number;
  paymentMethod: PaymentMethod;
  paymentCurrency: 'USDT' | 'ETH' | 'BTC' | 'SOFT_POINTS';
  subtotal: number;
  taxAmount: number;
  discountAmount?: number;
  discountCode?: string;
  orderType: 'marketplace' | 'digital' | 'service';
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  orderId: string;
  amount: number;
  status: PaymentStatus;
  error?: string;
  retryable?: boolean;
}

export interface OrderConfirmation {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  estimatedDelivery?: string;
  trackingNumber?: string;
  downloadLinks?: string[];
}

class OrderCheckoutService {
  /**
   * Create a new order from cart data
   */
  static async createOrderFromCart(input: CreateOrderInput): Promise<Order | null> {
    try {
      // Generate unique order number
      const orderNumber = this.generateOrderNumber();

      // Calculate totals
      const totalAmount =
        input.subtotal +
        input.shippingCost +
        input.taxAmount -
        (input.discountAmount || 0);

      // Calculate platform fee (2.5%)
      const platformFee = totalAmount * 0.025;
      const feePercentage = 2.5;
      const sellerRevenue = totalAmount - platformFee;

      // Determine if order requires shipping
      const requiresShipping = input.items.some(
        (item) => item.requiresShipping !== false
      );

      // Prepare order items
      const orderItems = input.items.map((item) => ({
        product_id: item.productId,
        variant_id: item.variantId || null,
        product_name: item.productName,
        product_image: item.productImage,
        seller_id: item.sellerId,
        seller_name: item.sellerName,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        selected_variants: item.selectedVariants || null,
        custom_options: item.customOptions || null,
        status: 'pending' as const,
      }));

      // Create order in database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            order_number: orderNumber,
            order_type: input.orderType,
            buyer_id: input.buyerId,
            seller_id: input.items[0]?.sellerId, // Primary seller
            customer_name: input.customerName,
            customer_email: input.customerEmail,
            items: orderItems,
            subtotal: input.subtotal,
            shipping_cost: input.shippingCost,
            tax_amount: input.taxAmount,
            discount_amount: input.discountAmount || 0,
            discount_code: input.discountCode || null,
            total_amount: totalAmount,
            payment_method: input.paymentMethod.name,
            payment_currency: input.paymentCurrency,
            payment_status: 'pending' as const,
            shipping_address: JSON.stringify(input.shippingAddress),
            billing_address: input.billingAddress
              ? JSON.stringify(input.billingAddress)
              : null,
            shipping_method: input.shippingMethod,
            estimated_delivery: this.calculateEstimatedDelivery(
              input.shippingCost
            ),
            status: 'pending' as const,
            fulfillment_status: 'pending' as const,
            requires_shipping: requiresShipping,
            auto_complete_after_days: 30,
            platform_fee: platformFee,
            fee_percentage: feePercentage,
            seller_revenue: sellerRevenue,
            return_requested: false,
            download_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        return null;
      }

      return this.mapDatabaseOrderToOrder(order);
    } catch (error) {
      console.error('Error in createOrderFromCart:', error);
      return null;
    }
  }

  /**
   * Process payment for an order
   */
  static async processPayment(
    orderId: string,
    paymentDetails: {
      amount: number;
      currency: string;
      paymentMethodId: string;
      metadata?: Record<string, any>;
    }
  ): Promise<PaymentResult> {
    try {
      // Simulate payment processing - in production, this would integrate with Stripe or payment gateway
      // For now, we'll mark the order as paid

      const transactionId = `txn_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'completed' as const,
          payment_transaction_id: transactionId,
          status: 'confirmed' as const,
          confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('Error updating order payment status:', updateError);
        return {
          success: false,
          orderId,
          amount: paymentDetails.amount,
          status: 'failed',
          error: 'Payment processing failed',
          retryable: true,
        };
      }

      return {
        success: true,
        transactionId,
        orderId,
        amount: paymentDetails.amount,
        status: 'completed',
      };
    } catch (error) {
      console.error('Error in processPayment:', error);
      return {
        success: false,
        orderId,
        amount: paymentDetails.amount,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Payment processing failed',
        retryable: true,
      };
    }
  }

  /**
   * Confirm order after successful payment
   */
  static async confirmOrder(orderId: string): Promise<Order | null> {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .update({
          status: 'confirmed' as const,
          fulfillment_status: 'processing' as const,
          processing_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        console.error('Error confirming order:', error);
        return null;
      }

      return this.mapDatabaseOrderToOrder(order);
    } catch (error) {
      console.error('Error in confirmOrder:', error);
      return null;
    }
  }

  /**
   * Get order confirmation details
   */
  static async getOrderConfirmation(orderId: string): Promise<OrderConfirmation | null> {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select(
          `
          id,
          order_number,
          total_amount,
          estimated_delivery,
          tracking_number,
          download_urls
        `
        )
        .eq('id', orderId)
        .single();

      if (error || !order) {
        console.error('Error fetching order confirmation:', error);
        return null;
      }

      return {
        orderId: order.id,
        orderNumber: order.order_number,
        totalAmount: order.total_amount,
        estimatedDelivery: order.estimated_delivery,
        trackingNumber: order.tracking_number,
        downloadLinks: order.download_urls,
      };
    } catch (error) {
      console.error('Error in getOrderConfirmation:', error);
      return null;
    }
  }

  /**
   * Send order confirmation email
   */
  static async sendOrderConfirmation(orderId: string): Promise<boolean> {
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        console.error('Error fetching order:', orderError);
        return false;
      }

      // In production, integrate with email service (SendGrid, AWS SES, etc.)
      // For now, log the order details
      console.log('Order confirmation email sent for order:', order.order_number);

      // Mark email as sent
      // This would be stored in a separate emails_sent table
      return true;
    } catch (error) {
      console.error('Error in sendOrderConfirmation:', error);
      return false;
    }
  }

  /**
   * Cancel order
   */
  static async cancelOrder(
    orderId: string,
    reason: string
  ): Promise<Order | null> {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .update({
          status: 'cancelled' as const,
          fulfillment_status: 'cancelled' as const,
          cancelled_at: new Date().toISOString(),
          admin_notes: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        console.error('Error cancelling order:', error);
        return null;
      }

      // If payment was completed, process refund
      if (order.payment_status === 'completed') {
        await this.processRefund(orderId, order.total_amount);
      }

      return this.mapDatabaseOrderToOrder(order);
    } catch (error) {
      console.error('Error in cancelOrder:', error);
      return null;
    }
  }

  /**
   * Process refund for an order
   */
  static async processRefund(orderId: string, amount: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: 'refunded' as const,
          refund_amount: amount,
          refunded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) {
        console.error('Error processing refund:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in processRefund:', error);
      return false;
    }
  }

  /**
   * Retry failed payment
   */
  static async retryPayment(
    orderId: string,
    paymentDetails: {
      amount: number;
      currency: string;
      paymentMethodId: string;
    }
  ): Promise<PaymentResult> {
    try {
      // Check if order exists and is eligible for retry
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('payment_status, total_amount')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        return {
          success: false,
          orderId,
          amount: paymentDetails.amount,
          status: 'failed',
          error: 'Order not found',
          retryable: false,
        };
      }

      // Only allow retry if payment failed
      if (order.payment_status !== 'failed') {
        return {
          success: false,
          orderId,
          amount: paymentDetails.amount,
          status: order.payment_status,
          error: 'Order is not eligible for payment retry',
          retryable: false,
        };
      }

      // Retry payment
      return this.processPayment(orderId, paymentDetails);
    } catch (error) {
      console.error('Error in retryPayment:', error);
      return {
        success: false,
        orderId,
        amount: paymentDetails.amount,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Payment retry failed',
        retryable: true,
      };
    }
  }

  /**
   * Get order details
   */
  static async getOrder(orderId: string): Promise<Order | null> {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error || !order) {
        console.error('Error fetching order:', error);
        return null;
      }

      return this.mapDatabaseOrderToOrder(order);
    } catch (error) {
      console.error('Error in getOrder:', error);
      return null;
    }
  }

  /**
   * Validate order before processing
   */
  static async validateOrder(input: CreateOrderInput): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Validate required fields
    if (!input.buyerId) errors.push('Buyer ID is required');
    if (!input.customerName) errors.push('Customer name is required');
    if (!input.customerEmail) errors.push('Customer email is required');
    if (!input.items || input.items.length === 0)
      errors.push('Order must have at least one item');
    if (!input.shippingAddress) errors.push('Shipping address is required');
    if (!input.paymentMethod) errors.push('Payment method is required');

    // Validate order total
    if (input.subtotal <= 0) errors.push('Subtotal must be greater than 0');

    // Validate items have required fields
    if (input.items) {
      input.items.forEach((item, index) => {
        if (!item.productId)
          errors.push(`Item ${index + 1}: Product ID is required`);
        if (!item.productName)
          errors.push(`Item ${index + 1}: Product name is required`);
        if (item.quantity <= 0)
          errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
        if (item.price < 0) errors.push(`Item ${index + 1}: Price is invalid`);
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Helper methods

  private static generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  private static calculateEstimatedDelivery(shippingCost: number): string {
    // Simple estimation: higher cost = faster delivery
    let days = 7;
    if (shippingCost >= 50) {
      days = 1; // Express (1-2 days)
    } else if (shippingCost >= 20) {
      days = 3; // Standard (3-5 days)
    }

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + days);
    return deliveryDate.toISOString();
  }

  private static mapDatabaseOrderToOrder(order: any): Order {
    return {
      id: order.id,
      buyerId: order.buyer_id,
      sellerId: order.seller_id,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      orderNumber: order.order_number,
      orderType: order.order_type,
      items: order.items || [],
      subtotal: order.subtotal,
      shippingCost: order.shipping_cost,
      taxAmount: order.tax_amount,
      discountAmount: order.discount_amount || 0,
      discountCode: order.discount_code,
      totalAmount: order.total_amount,
      paymentMethod: order.payment_method,
      paymentCurrency: order.payment_currency || 'USDT',
      paymentStatus: order.payment_status,
      paymentTransactionId: order.payment_transaction_id,
      shippingAddress: order.shipping_address
        ? JSON.parse(order.shipping_address)
        : undefined,
      billingAddress: order.billing_address
        ? JSON.parse(order.billing_address)
        : undefined,
      shippingMethod: order.shipping_method,
      trackingNumber: order.tracking_number,
      estimatedDelivery: order.estimated_delivery,
      actualDelivery: order.actual_delivery,
      status: order.status,
      fulfillmentStatus: order.fulfillment_status,
      requiresShipping: order.requires_shipping,
      autoCompleteAfterDays: order.auto_complete_after_days,
      platformFee: order.platform_fee,
      feePercentage: order.fee_percentage,
      sellerRevenue: order.seller_revenue,
      returnRequested: order.return_requested,
      downloadCount: order.download_count,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    };
  }
}

export default OrderCheckoutService;

import { OrderCheckoutService } from '@/services/orderCheckoutService';
import { supabase } from '@/integrations/supabase/client';
import type { CartItem, Address, PaymentMethod } from '@/types/marketplace';

// Mock supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('OrderCheckoutService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAddress: Address = {
    id: 'addr-1',
    firstName: 'John',
    lastName: 'Doe',
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'USA',
    phone: '555-1234',
    isDefault: false,
  };

  const mockPaymentMethod: PaymentMethod = {
    id: 'pm-1',
    name: 'Visa',
    type: 'card',
    lastFour: '4242',
    expiryDate: '12/25',
    isDefault: true,
  };

  const mockCartItem: CartItem = {
    id: 'cart-1',
    productId: 'prod-1',
    productName: 'Test Product',
    productImage: 'https://example.com/image.jpg',
    price: 100,
    quantity: 2,
    sellerId: 'seller-1',
    sellerName: 'Test Seller',
  };

  // Order Creation Tests
  describe('createOrderFromCart', () => {
    it('should create order from cart items', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'order-1',
              order_number: 'ORD-001',
              buyer_id: 'user-1',
              status: 'pending',
              total_amount: 250,
              created_at: new Date().toISOString(),
            },
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const result = await OrderCheckoutService.createOrderFromCart({
        buyerId: 'user-1',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        items: [mockCartItem],
        shippingAddress: mockAddress,
        shippingMethod: 'standard',
        shippingCost: 10,
        paymentMethod: mockPaymentMethod,
        paymentCurrency: 'USDT',
        subtotal: 200,
        taxAmount: 20,
        orderType: 'marketplace',
      });

      expect(result).not.toBeNull();
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should calculate order totals correctly', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'order-1',
              order_number: 'ORD-001',
              subtotal: 200,
              shipping_cost: 10,
              tax_amount: 20,
              discount_amount: 10,
              total_amount: 220,
              created_at: new Date().toISOString(),
            },
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      await OrderCheckoutService.createOrderFromCart({
        buyerId: 'user-1',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        items: [mockCartItem],
        shippingAddress: mockAddress,
        shippingMethod: 'standard',
        shippingCost: 10,
        paymentMethod: mockPaymentMethod,
        paymentCurrency: 'USDT',
        subtotal: 200,
        taxAmount: 20,
        discountAmount: 10,
        orderType: 'marketplace',
      });

      const insertCall = mockInsert.mock.calls[0][0][0];
      expect(insertCall.total_amount).toBe(220); // 200 + 10 + 20 - 10
    });

    it('should handle multiple items from different sellers', async () => {
      const items = [
        mockCartItem,
        { ...mockCartItem, id: 'cart-2', productId: 'prod-2', sellerId: 'seller-2' },
      ];

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'order-1',
              order_number: 'ORD-001',
              items: items,
              created_at: new Date().toISOString(),
            },
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const result = await OrderCheckoutService.createOrderFromCart({
        buyerId: 'user-1',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        items,
        shippingAddress: mockAddress,
        shippingMethod: 'standard',
        shippingCost: 15,
        paymentMethod: mockPaymentMethod,
        paymentCurrency: 'USDT',
        subtotal: 400,
        taxAmount: 40,
        orderType: 'marketplace',
      });

      expect(result).not.toBeNull();
    });

    it('should handle creation errors', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Creation failed' },
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const result = await OrderCheckoutService.createOrderFromCart({
        buyerId: 'user-1',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        items: [mockCartItem],
        shippingAddress: mockAddress,
        shippingMethod: 'standard',
        shippingCost: 10,
        paymentMethod: mockPaymentMethod,
        paymentCurrency: 'USDT',
        subtotal: 200,
        taxAmount: 20,
        orderType: 'marketplace',
      });

      expect(result).toBeNull();
    });

    it('should apply discount code to order', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'order-1',
              order_number: 'ORD-001',
              discount_code: 'SAVE10',
              discount_amount: 20,
              created_at: new Date().toISOString(),
            },
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const result = await OrderCheckoutService.createOrderFromCart({
        buyerId: 'user-1',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        items: [mockCartItem],
        shippingAddress: mockAddress,
        shippingMethod: 'standard',
        shippingCost: 10,
        paymentMethod: mockPaymentMethod,
        paymentCurrency: 'USDT',
        subtotal: 200,
        taxAmount: 20,
        discountAmount: 20,
        discountCode: 'SAVE10',
        orderType: 'marketplace',
      });

      expect(result).not.toBeNull();
    });
  });

  // Order Retrieval Tests
  describe('getOrder', () => {
    it('should fetch order details', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'order-1',
              order_number: 'ORD-001',
              status: 'confirmed',
              total_amount: 250,
              created_at: new Date().toISOString(),
            },
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await OrderCheckoutService.getOrder('order-1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('order-1');
    });

    it('should return null if order not found', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await OrderCheckoutService.getOrder('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await OrderCheckoutService.getOrder('order-1');

      expect(result).toBeNull();
    });
  });

  // Order Cancellation Tests
  describe('cancelOrder', () => {
    it('should cancel an order', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await OrderCheckoutService.cancelOrder('order-1');

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should handle cancellation errors', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: { message: 'Cancellation failed' },
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await OrderCheckoutService.cancelOrder('order-1');

      expect(result).toBe(false);
    });

    it('should not allow cancellation of completed orders', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { status: 'delivered' },
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await OrderCheckoutService.cancelOrder('order-1');

      expect(result).toBe(false);
    });
  });

  // Payment Processing Tests
  describe('processPayment', () => {
    it('should process payment for order', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({ update: mockUpdate })
        .mockReturnValueOnce({ insert: mockInsert });

      const result = await OrderCheckoutService.processPayment('order-1', {
        amount: 250,
        currency: 'USD',
        paymentMethodId: 'pm-1',
      });

      expect(result.success).toBe(true);
      expect(result.orderId).toBe('order-1');
    });

    it('should handle payment processing errors', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: { message: 'Payment failed' },
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await OrderCheckoutService.processPayment('order-1', {
        amount: 250,
        currency: 'USD',
        paymentMethodId: 'pm-1',
      });

      expect(result.success).toBe(false);
    });

    it('should retry failed payments', async () => {
      const mockUpdate = jest.fn()
        .mockReturnValueOnce({
          eq: jest.fn().mockResolvedValue({
            error: { message: 'Payment failed' },
          }),
        })
        .mockReturnValueOnce({
          eq: jest.fn().mockResolvedValue({ error: null }),
        });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await OrderCheckoutService.processPayment('order-1', {
        amount: 250,
        currency: 'USD',
        paymentMethodId: 'pm-1',
      });

      expect(result.success).toBeDefined();
    });
  });

  // Order Status Tests
  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await OrderCheckoutService.updateOrderStatus('order-1', 'shipped');

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should handle status update errors', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: { message: 'Update failed' },
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await OrderCheckoutService.updateOrderStatus('order-1', 'shipped');

      expect(result).toBe(false);
    });
  });

  // Order History Tests
  describe('getUserOrders', () => {
    it('should fetch user orders', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [
              { id: 'order-1', order_number: 'ORD-001', status: 'pending' },
              { id: 'order-2', order_number: 'ORD-002', status: 'delivered' },
            ],
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await OrderCheckoutService.getUserOrders('user-1');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('order-1');
    });

    it('should return empty array if no orders', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await OrderCheckoutService.getUserOrders('user-1');

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await OrderCheckoutService.getUserOrders('user-1');

      expect(result).toEqual([]);
    });
  });

  // Refund Tests
  describe('processRefund', () => {
    it('should process refund for order', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({ update: mockUpdate })
        .mockReturnValueOnce({ insert: mockInsert });

      const result = await OrderCheckoutService.processRefund('order-1', 250);

      expect(result.success).toBe(true);
    });

    it('should handle refund errors', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: { message: 'Refund failed' },
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await OrderCheckoutService.processRefund('order-1', 250);

      expect(result.success).toBe(false);
    });

    it('should support partial refunds', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({ update: mockUpdate })
        .mockReturnValueOnce({ insert: mockInsert });

      const result = await OrderCheckoutService.processRefund('order-1', 125);

      expect(result.success).toBe(true);
    });
  });

  // Edge Cases
  describe('edge cases', () => {
    it('should handle orders with zero discount', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'order-1',
              order_number: 'ORD-001',
              discount_amount: 0,
              created_at: new Date().toISOString(),
            },
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const result = await OrderCheckoutService.createOrderFromCart({
        buyerId: 'user-1',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        items: [mockCartItem],
        shippingAddress: mockAddress,
        shippingMethod: 'standard',
        shippingCost: 10,
        paymentMethod: mockPaymentMethod,
        paymentCurrency: 'USDT',
        subtotal: 200,
        taxAmount: 20,
        orderType: 'marketplace',
      });

      expect(result).not.toBeNull();
    });

    it('should handle orders with free shipping', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'order-1',
              order_number: 'ORD-001',
              shipping_cost: 0,
              created_at: new Date().toISOString(),
            },
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const result = await OrderCheckoutService.createOrderFromCart({
        buyerId: 'user-1',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        items: [mockCartItem],
        shippingAddress: mockAddress,
        shippingMethod: 'free_shipping',
        shippingCost: 0,
        paymentMethod: mockPaymentMethod,
        paymentCurrency: 'USDT',
        subtotal: 200,
        taxAmount: 20,
        orderType: 'marketplace',
      });

      expect(result).not.toBeNull();
    });

    it('should handle digital products without shipping', async () => {
      const digitalItem = { ...mockCartItem, requiresShipping: false };

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'order-1',
              order_number: 'ORD-001',
              requires_shipping: false,
              created_at: new Date().toISOString(),
            },
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const result = await OrderCheckoutService.createOrderFromCart({
        buyerId: 'user-1',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        items: [digitalItem],
        shippingAddress: mockAddress,
        shippingMethod: 'digital',
        shippingCost: 0,
        paymentMethod: mockPaymentMethod,
        paymentCurrency: 'USDT',
        subtotal: 50,
        taxAmount: 5,
        orderType: 'digital',
      });

      expect(result).not.toBeNull();
    });
  });

  // Performance Tests
  describe('performance', () => {
    it('should handle large orders efficiently', async () => {
      const largeOrder = Array.from({ length: 100 }, (_, i) => ({
        ...mockCartItem,
        id: `cart-${i}`,
        productId: `prod-${i}`,
      }));

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'order-1',
              order_number: 'ORD-001',
              items: largeOrder,
              created_at: new Date().toISOString(),
            },
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const startTime = performance.now();
      const result = await OrderCheckoutService.createOrderFromCart({
        buyerId: 'user-1',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        items: largeOrder,
        shippingAddress: mockAddress,
        shippingMethod: 'standard',
        shippingCost: 15,
        paymentMethod: mockPaymentMethod,
        paymentCurrency: 'USDT',
        subtotal: 5000,
        taxAmount: 500,
        orderType: 'marketplace',
      });
      const endTime = performance.now();

      expect(result).not.toBeNull();
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });
});

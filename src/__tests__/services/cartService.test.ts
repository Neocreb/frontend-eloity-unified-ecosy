import { CartService } from '@/services/cartService';
import { supabase } from '@/integrations/supabase/client';
import type { CartItem } from '@/types/marketplace';

// Mock supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('CartService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockCartItem: CartItem = {
    id: 'cart-1',
    productId: 'prod-1',
    variantId: 'var-1',
    productName: 'Test Product',
    productImage: 'https://example.com/image.jpg',
    price: 100,
    quantity: 1,
    sellerId: 'seller-1',
    sellerName: 'Test Seller',
  };

  // Cart Sync Tests
  describe('syncCartToDatabase', () => {
    it('should sync cart items to database', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({ delete: mockDelete })
        .mockReturnValueOnce({ insert: mockInsert });

      const result = await CartService.syncCartToDatabase('user-1', [mockCartItem]);

      expect(result).toBe(true);
      expect(mockDelete).toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should handle empty cart', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        delete: mockDelete,
      });

      const result = await CartService.syncCartToDatabase('user-1', []);

      expect(result).toBe(true);
    });

    it('should return false if user ID is missing', async () => {
      const result = await CartService.syncCartToDatabase('', [mockCartItem]);

      expect(result).toBe(false);
    });

    it('should handle delete errors', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: { message: 'Delete failed' },
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        delete: mockDelete,
      });

      const result = await CartService.syncCartToDatabase('user-1', [mockCartItem]);

      expect(result).toBe(false);
    });

    it('should handle insert errors', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockInsert = jest.fn().mockResolvedValue({
        error: { message: 'Insert failed' },
      });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({ delete: mockDelete })
        .mockReturnValueOnce({ insert: mockInsert });

      const result = await CartService.syncCartToDatabase('user-1', [mockCartItem]);

      expect(result).toBe(false);
    });

    it('should sync multiple cart items', async () => {
      const items = [
        mockCartItem,
        { ...mockCartItem, id: 'cart-2', productId: 'prod-2', quantity: 2 },
        { ...mockCartItem, id: 'cart-3', productId: 'prod-3', quantity: 3 },
      ];

      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({ delete: mockDelete })
        .mockReturnValueOnce({ insert: mockInsert });

      const result = await CartService.syncCartToDatabase('user-1', items);

      expect(result).toBe(true);
      const insertedItems = mockInsert.mock.calls[0][0];
      expect(insertedItems).toHaveLength(3);
    });
  });

  // Load Cart Tests
  describe('loadUserCart', () => {
    it('should load user cart from database', async () => {
      const mockData = [
        {
          id: 'cart-1',
          product_id: 'prod-1',
          variant_id: 'var-1',
          quantity: 1,
          price: 100,
          product_name: 'Test Product',
          product_image: 'https://example.com/image.jpg',
          seller_id: 'seller-1',
          seller_name: 'Test Seller',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await CartService.loadUserCart('user-1');

      expect(result.items).toHaveLength(1);
      expect(result.itemCount).toBe(1);
      expect(result.subtotal).toBe(100);
    });

    it('should return empty cart if no items found', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await CartService.loadUserCart('user-1');

      expect(result.items).toEqual([]);
      expect(result.itemCount).toBe(0);
      expect(result.subtotal).toBe(0);
    });

    it('should calculate correct subtotal', async () => {
      const mockData = [
        {
          id: 'cart-1',
          product_id: 'prod-1',
          quantity: 2,
          price: 50,
          product_name: 'Product 1',
          product_image: 'image1.jpg',
          seller_id: 'seller-1',
          seller_name: 'Seller 1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'cart-2',
          product_id: 'prod-2',
          quantity: 3,
          price: 100,
          product_name: 'Product 2',
          product_image: 'image2.jpg',
          seller_id: 'seller-2',
          seller_name: 'Seller 2',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await CartService.loadUserCart('user-1');

      expect(result.itemCount).toBe(5);
      expect(result.subtotal).toBe(400); // (2 * 50) + (3 * 100)
    });

    it('should handle database errors', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await CartService.loadUserCart('user-1');

      expect(result.items).toEqual([]);
      expect(result.itemCount).toBe(0);
      expect(result.subtotal).toBe(0);
    });
  });

  // Add Cart Item Tests
  describe('addCartItem', () => {
    it('should add item to cart', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const result = await CartService.addCartItem('user-1', mockCartItem);

      expect(result).toBe(true);
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should handle add errors', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        error: { message: 'Insert failed' },
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const result = await CartService.addCartItem('user-1', mockCartItem);

      expect(result).toBe(false);
    });

    it('should increment quantity if item already in cart', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [{ id: 'cart-1', quantity: 1 }],
            error: null,
          }),
        }),
      });

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({ select: mockSelect })
        .mockReturnValueOnce({ update: mockUpdate });

      const result = await CartService.addCartItem('user-1', mockCartItem);

      expect(result).toBe(true);
    });
  });

  // Update Cart Item Tests
  describe('updateCartItem', () => {
    it('should update cart item quantity', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await CartService.updateCartItem('user-1', 'cart-1', 5);

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should handle update errors', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: { message: 'Update failed' },
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await CartService.updateCartItem('user-1', 'cart-1', 5);

      expect(result).toBe(false);
    });

    it('should validate quantity before update', async () => {
      const result = await CartService.updateCartItem('user-1', 'cart-1', 0);

      expect(result).toBe(false);
    });

    it('should reject negative quantities', async () => {
      const result = await CartService.updateCartItem('user-1', 'cart-1', -1);

      expect(result).toBe(false);
    });
  });

  // Remove Cart Item Tests
  describe('removeCartItem', () => {
    it('should remove item from cart', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        delete: mockDelete,
      });

      const result = await CartService.removeCartItem('user-1', 'cart-1');

      expect(result).toBe(true);
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should handle remove errors', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: { message: 'Delete failed' },
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        delete: mockDelete,
      });

      const result = await CartService.removeCartItem('user-1', 'cart-1');

      expect(result).toBe(false);
    });
  });

  // Clear Cart Tests
  describe('clearUserCart', () => {
    it('should clear all cart items for user', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        delete: mockDelete,
      });

      const result = await CartService.clearUserCart('user-1');

      expect(result).toBe(true);
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should handle clear errors', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: { message: 'Delete failed' },
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        delete: mockDelete,
      });

      const result = await CartService.clearUserCart('user-1');

      expect(result).toBe(false);
    });
  });

  // Stock Validation Tests
  describe('validateCartStock', () => {
    it('should validate that all items have sufficient stock', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        in: jest.fn().mockResolvedValue({
          data: [
            { id: 'prod-1', stock_quantity: 100 },
            { id: 'prod-2', stock_quantity: 50 },
          ],
          error: null,
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const items = [
        { ...mockCartItem, productId: 'prod-1', quantity: 10 },
        { ...mockCartItem, productId: 'prod-2', quantity: 5 },
      ];

      const result = await CartService.validateCartStock(items);

      expect(result.isValid).toBe(true);
      expect(result.outOfStockItems).toEqual([]);
    });

    it('should detect out of stock items', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        in: jest.fn().mockResolvedValue({
          data: [
            { id: 'prod-1', stock_quantity: 5 },
            { id: 'prod-2', stock_quantity: 0 },
          ],
          error: null,
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const items = [
        { ...mockCartItem, productId: 'prod-1', quantity: 10 },
        { ...mockCartItem, productId: 'prod-2', quantity: 5 },
      ];

      const result = await CartService.validateCartStock(items);

      expect(result.isValid).toBe(false);
      expect(result.outOfStockItems).toContain('prod-1');
      expect(result.outOfStockItems).toContain('prod-2');
    });

    it('should handle empty cart validation', async () => {
      const result = await CartService.validateCartStock([]);

      expect(result.isValid).toBe(true);
      expect(result.outOfStockItems).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        in: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const items = [{ ...mockCartItem, quantity: 10 }];

      const result = await CartService.validateCartStock(items);

      expect(result.isValid).toBe(false);
    });
  });

  // Cart Item Count Tests
  describe('getCartItemCount', () => {
    it('should return total item count in cart', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [
            { quantity: 2 },
            { quantity: 3 },
            { quantity: 1 },
          ],
          error: null,
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await CartService.getCartItemCount('user-1');

      expect(result).toBe(6);
    });

    it('should return 0 if no items in cart', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await CartService.getCartItemCount('user-1');

      expect(result).toBe(0);
    });

    it('should handle database errors', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Error' },
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await CartService.getCartItemCount('user-1');

      expect(result).toBe(0);
    });
  });

  // Performance Tests
  describe('performance', () => {
    it('should handle large cart efficiently', async () => {
      const largeCart = Array.from({ length: 100 }, (_, i) => ({
        ...mockCartItem,
        id: `cart-${i}`,
        productId: `prod-${i}`,
      }));

      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({ delete: mockDelete })
        .mockReturnValueOnce({ insert: mockInsert });

      const startTime = performance.now();
      const result = await CartService.syncCartToDatabase('user-1', largeCart);
      const endTime = performance.now();

      expect(result).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in less than 5 seconds
    });
  });

  // Edge Cases
  describe('edge cases', () => {
    it('should handle items with special characters in names', async () => {
      const itemWithSpecialChars = {
        ...mockCartItem,
        productName: 'Product with "quotes" & special <chars>',
      };

      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({ delete: mockDelete })
        .mockReturnValueOnce({ insert: mockInsert });

      const result = await CartService.syncCartToDatabase('user-1', [itemWithSpecialChars]);

      expect(result).toBe(true);
    });

    it('should handle very large quantities', async () => {
      const item = { ...mockCartItem, quantity: 999999 };

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({ select: mockSelect })
        .mockReturnValueOnce({ insert: mockInsert });

      const result = await CartService.addCartItem('user-1', item);

      expect(result).toBe(true);
    });

    it('should handle very small prices', async () => {
      const item = { ...mockCartItem, price: 0.01 };

      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({ delete: mockDelete })
        .mockReturnValueOnce({ insert: mockInsert });

      const result = await CartService.syncCartToDatabase('user-1', [item]);

      expect(result).toBe(true);
    });
  });
});

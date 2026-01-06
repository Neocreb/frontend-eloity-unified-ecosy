import { ReturnsManagementService } from '@/services/returnsManagementService';
import { supabase } from '@/integrations/supabase/client';

// Mock supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('ReturnsManagementService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockReturnRequest = {
    id: 'return-1',
    order_id: 'order-1',
    order_item_id: 'item-1',
    return_reason: 'defective',
    return_status: 'pending',
    refund_amount: 100,
    return_tracking_number: null,
    images: [],
    admin_notes: null,
    requested_at: new Date().toISOString(),
    approved_at: null,
    completed_at: null,
    created_at: new Date().toISOString(),
  };

  // Return Request Creation Tests
  describe('createReturnRequest', () => {
    it('should create a return request', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: mockReturnRequest,
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const result = await ReturnsManagementService.createReturnRequest({
        orderId: 'order-1',
        orderItemId: 'item-1',
        reason: 'defective',
        refundAmount: 100,
        images: [],
      });

      expect(result).toBe(true);
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should handle return request creation errors', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Creation failed' },
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const result = await ReturnsManagementService.createReturnRequest({
        orderId: 'order-1',
        orderItemId: 'item-1',
        reason: 'defective',
        refundAmount: 100,
        images: [],
      });

      expect(result).toBe(false);
    });

    it('should validate return reason', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: mockReturnRequest,
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const validReasons = [
        'defective',
        'not_as_described',
        'wrong_item',
        'damage_shipping',
        'changed_mind',
      ];

      for (const reason of validReasons) {
        await ReturnsManagementService.createReturnRequest({
          orderId: 'order-1',
          orderItemId: 'item-1',
          reason,
          refundAmount: 100,
          images: [],
        });
      }

      expect(mockInsert).toHaveBeenCalledTimes(5);
    });

    it('should accept return images', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: { ...mockReturnRequest, images: ['img1.jpg', 'img2.jpg'] },
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const result = await ReturnsManagementService.createReturnRequest({
        orderId: 'order-1',
        orderItemId: 'item-1',
        reason: 'defective',
        refundAmount: 100,
        images: ['img1.jpg', 'img2.jpg'],
      });

      expect(result).toBe(true);
    });
  });

  // Return Request Retrieval Tests
  describe('getSellerReturnRequests', () => {
    it('should fetch return requests for seller', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [mockReturnRequest],
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await ReturnsManagementService.getSellerReturnRequests('seller-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('return-1');
    });

    it('should filter return requests by status', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [mockReturnRequest],
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await ReturnsManagementService.getSellerReturnRequests('seller-1', 'pending');

      expect(result).toHaveLength(1);
    });

    it('should return empty array if no returns found', async () => {
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

      const result = await ReturnsManagementService.getSellerReturnRequests('seller-1');

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

      const result = await ReturnsManagementService.getSellerReturnRequests('seller-1');

      expect(result).toEqual([]);
    });
  });

  // Return Approval Tests
  describe('approveReturnRequest', () => {
    it('should approve a return request', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await ReturnsManagementService.approveReturnRequest('return-1');

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should handle approval errors', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: { message: 'Approval failed' },
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await ReturnsManagementService.approveReturnRequest('return-1');

      expect(result).toBe(false);
    });

    it('should set approval timestamp', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      await ReturnsManagementService.approveReturnRequest('return-1');

      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.return_status).toBe('approved');
      expect(updateCall.approved_at).toBeDefined();
    });
  });

  // Return Rejection Tests
  describe('rejectReturnRequest', () => {
    it('should reject a return request', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await ReturnsManagementService.rejectReturnRequest(
        'return-1',
        'Does not meet return criteria'
      );

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should store rejection reason', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const reason = 'Does not meet return criteria';
      await ReturnsManagementService.rejectReturnRequest('return-1', reason);

      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.return_status).toBe('rejected');
      expect(updateCall.admin_notes).toBe(reason);
    });

    it('should handle rejection errors', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: { message: 'Rejection failed' },
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await ReturnsManagementService.rejectReturnRequest('return-1', 'Reason');

      expect(result).toBe(false);
    });
  });

  // Refund Processing Tests
  describe('processRefund', () => {
    it('should process refund for approved return', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockReturnRequest,
            error: null,
          }),
        }),
      });

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({ select: mockSelect })
        .mockReturnValueOnce({ update: mockUpdate })
        .mockReturnValueOnce({ insert: mockInsert });

      const result = await ReturnsManagementService.processRefund(
        'return-1',
        'original_payment',
        100
      );

      expect(result).toBe(true);
    });

    it('should support multiple refund methods', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockReturnRequest,
            error: null,
          }),
        }),
      });

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({ select: mockSelect })
        .mockReturnValueOnce({ update: mockUpdate })
        .mockReturnValueOnce({ insert: mockInsert });

      const methods = ['original_payment', 'wallet_credit', 'bank_transfer'];

      for (const method of methods) {
        await ReturnsManagementService.processRefund('return-1', method as any, 100);
      }

      expect(mockUpdate).toHaveBeenCalledTimes(3);
    });

    it('should handle refund processing errors', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Not found' },
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await ReturnsManagementService.processRefund(
        'return-1',
        'original_payment',
        100
      );

      expect(result).toBe(false);
    });

    it('should support partial refunds', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { ...mockReturnRequest, refund_amount: 100 },
            error: null,
          }),
        }),
      });

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({ select: mockSelect })
        .mockReturnValueOnce({ update: mockUpdate })
        .mockReturnValueOnce({ insert: mockInsert });

      const result = await ReturnsManagementService.processRefund('return-1', 'original_payment', 50);

      expect(result).toBe(true);
    });
  });

  // Return Tracking Tests
  describe('updateReturnTracking', () => {
    it('should update return tracking number', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await ReturnsManagementService.updateReturnTracking(
        'return-1',
        'TRACK123'
      );

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should handle tracking update errors', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: { message: 'Update failed' },
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await ReturnsManagementService.updateReturnTracking(
        'return-1',
        'TRACK123'
      );

      expect(result).toBe(false);
    });
  });

  // Return Completion Tests
  describe('markReturnAsReceived', () => {
    it('should mark return as received', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await ReturnsManagementService.markReturnAsReceived('return-1');

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should set received timestamp', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      await ReturnsManagementService.markReturnAsReceived('return-1');

      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.return_status).toBe('completed');
      expect(updateCall.completed_at).toBeDefined();
    });

    it('should handle receive errors', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: { message: 'Update failed' },
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await ReturnsManagementService.markReturnAsReceived('return-1');

      expect(result).toBe(false);
    });
  });

  // Return Analytics Tests
  describe('getReturnAnalytics', () => {
    it('should calculate return analytics', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [
            { ...mockReturnRequest, return_reason: 'defective' },
            { ...mockReturnRequest, id: 'return-2', return_reason: 'not_as_described' },
            { ...mockReturnRequest, id: 'return-3', return_reason: 'defective' },
          ],
          error: null,
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await ReturnsManagementService.getReturnAnalytics('seller-1');

      expect(result.totalReturns).toBe(3);
      expect(result.returnsByReason).toBeDefined();
    });

    it('should calculate return rate', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [mockReturnRequest, { ...mockReturnRequest, id: 'return-2' }],
          error: null,
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await ReturnsManagementService.getReturnAnalytics('seller-1');

      expect(result.returnRate).toBeGreaterThanOrEqual(0);
      expect(result.returnRate).toBeLessThanOrEqual(100);
    });

    it('should handle analytics calculation errors', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Error' },
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await ReturnsManagementService.getReturnAnalytics('seller-1');

      expect(result.totalReturns).toBe(0);
    });
  });

  // Return Policy Tests
  describe('evaluateReturnEligibility', () => {
    it('should check return window (30 days)', async () => {
      const now = new Date();
      const orderedDate = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000); // 20 days ago

      const result = ReturnsManagementService.evaluateReturnEligibility({
        orderId: 'order-1',
        orderDate: orderedDate.toISOString(),
        orderStatus: 'delivered',
        itemStatus: 'new',
      });

      expect(result.eligible).toBe(true);
    });

    it('should reject returns after 30 days', async () => {
      const now = new Date();
      const orderedDate = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000); // 31 days ago

      const result = ReturnsManagementService.evaluateReturnEligibility({
        orderId: 'order-1',
        orderDate: orderedDate.toISOString(),
        orderStatus: 'delivered',
        itemStatus: 'new',
      });

      expect(result.eligible).toBe(false);
    });

    it('should reject returns for non-delivered orders', async () => {
      const now = new Date();
      const orderedDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

      const result = ReturnsManagementService.evaluateReturnEligibility({
        orderId: 'order-1',
        orderDate: orderedDate.toISOString(),
        orderStatus: 'pending',
        itemStatus: 'new',
      });

      expect(result.eligible).toBe(false);
    });

    it('should provide reason for ineligibility', async () => {
      const now = new Date();
      const orderedDate = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);

      const result = ReturnsManagementService.evaluateReturnEligibility({
        orderId: 'order-1',
        orderDate: orderedDate.toISOString(),
        orderStatus: 'delivered',
        itemStatus: 'new',
      });

      expect(result.reason).toBeDefined();
      expect(result.reason?.length).toBeGreaterThan(0);
    });
  });

  // Edge Cases
  describe('edge cases', () => {
    it('should handle returns with zero refund amount', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: { ...mockReturnRequest, refund_amount: 0 },
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const result = await ReturnsManagementService.createReturnRequest({
        orderId: 'order-1',
        orderItemId: 'item-1',
        reason: 'changed_mind',
        refundAmount: 0,
        images: [],
      });

      expect(result).toBe(true);
    });

    it('should handle returns with multiple images', async () => {
      const images = ['img1.jpg', 'img2.jpg', 'img3.jpg', 'img4.jpg', 'img5.jpg'];

      const mockInsert = jest.fn().mockResolvedValue({
        data: { ...mockReturnRequest, images },
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const result = await ReturnsManagementService.createReturnRequest({
        orderId: 'order-1',
        orderItemId: 'item-1',
        reason: 'defective',
        refundAmount: 100,
        images,
      });

      expect(result).toBe(true);
    });

    it('should handle very large refund amounts', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { ...mockReturnRequest, refund_amount: 999999.99 },
            error: null,
          }),
        }),
      });

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({ select: mockSelect })
        .mockReturnValueOnce({ update: mockUpdate })
        .mockReturnValueOnce({ insert: mockInsert });

      const result = await ReturnsManagementService.processRefund(
        'return-1',
        'original_payment',
        999999.99
      );

      expect(result).toBe(true);
    });
  });

  // Performance Tests
  describe('performance', () => {
    it('should handle bulk return requests efficiently', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: Array.from({ length: 100 }, (_, i) => ({
              ...mockReturnRequest,
              id: `return-${i}`,
            })),
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const startTime = performance.now();
      const result = await ReturnsManagementService.getSellerReturnRequests('seller-1');
      const endTime = performance.now();

      expect(result).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });
});

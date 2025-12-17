import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Loader,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePaymentLinks } from '@/hooks/usePaymentLinks';
import { useToast } from '@/components/ui/use-toast';
import { CreatePaymentLinkInput } from '@/services/paymentLinkService';

const CreatePaymentLink: React.FC = () => {
  const navigate = useNavigate();
  const { isCreating, createPaymentLink } = usePaymentLinks();
  const { toast } = useToast();

  const [formData, setFormData] = useState<CreatePaymentLinkInput>({
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description && !formData.amount) {
      toast({
        title: 'Error',
        description: 'Please fill in at least one field',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const link = await createPaymentLink(formData);
      if (link) {
        toast({
          title: 'Success',
          description: 'Payment link created successfully',
        });
        navigate('/app/wallet/payment-links');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create payment link',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/app/wallet/payment-links')}
              className="h-10 w-10"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Payment Link</h1>
              <p className="text-sm text-gray-600">Generate a shareable payment request link</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 pb-20">
        <Card className="border-purple-200 bg-white">
          <CardHeader>
            <CardTitle>Payment Link Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateLink} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (Optional)
                  </label>
                  <input
                    type="number"
                    placeholder="Leave empty for flexible amount"
                    value={formData.amount || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Uses (Optional)
                  </label>
                  <input
                    type="number"
                    placeholder="Leave empty for unlimited"
                    value={formData.maxUses || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxUses: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Invoice #123, Service payment"
                  value={formData.description || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiration Date (Optional)
                </label>
                <input
                  type="date"
                  value={
                    formData.expiresAt
                      ? new Date(formData.expiresAt).toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expiresAt: e.target.value ? new Date(e.target.value) : undefined,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isSubmitting || isCreating}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Payment Link'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/app/wallet/payment-links')}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreatePaymentLink;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Loader,
  Heart,
  Users,
  Gift,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePaymentLinks } from '@/hooks/usePaymentLinks';
import { useInvoicePaymentSync } from '@/hooks/useInvoicePaymentSync';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { CreatePaymentLinkInput } from '@/services/paymentLinkService';

const linkTypeOptions = [
  {
    id: 'standard',
    label: 'Payment',
    description: 'Simple payment for goods or services',
    icon: DollarSign,
  },
  {
    id: 'donation',
    label: 'Donation',
    description: 'Collect donations with flexible amounts',
    icon: Heart,
  },
  {
    id: 'registration',
    label: 'Registration',
    description: 'Charge for event registration or membership',
    icon: Users,
  },
  {
    id: 'subscription',
    label: 'Subscription',
    description: 'Recurring monthly or annual charges',
    icon: TrendingUp,
  },
  {
    id: 'fundraising',
    label: 'Fundraising',
    description: 'Collect funds for a cause',
    icon: Gift,
  },
  {
    id: 'product',
    label: 'Product Sale',
    description: 'Sell products or services',
    icon: ShoppingCart,
  },
];

interface EnhancedPaymentLinkInput extends CreatePaymentLinkInput {
  linkCategory?: string;
  recurringInterval?: string;
  recurringActive?: boolean;
  minAmount?: number;
  maxAmount?: number;
  successRedirectUrl?: string;
  webhookUrl?: string;
  customFields?: any;
}

const CreatePaymentLinkEnhanced: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isCreating, createPaymentLink } = usePaymentLinks();
  const { recordPaymentLinkCreated } = useInvoicePaymentSync();
  const { toast } = useToast();

  const [selectedType, setSelectedType] = useState<string>('standard');
  const [formData, setFormData] = useState<EnhancedPaymentLinkInput>({
    description: '',
    linkCategory: 'standard',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description && !formData.amount && selectedType === 'standard') {
      toast({
        title: 'Error',
        description: 'Please fill in at least one field',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const link = await createPaymentLink(formData as CreatePaymentLinkInput);
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

  const currentTypeOption = linkTypeOptions.find(t => t.id === selectedType);
  const IconComponent = currentTypeOption?.icon || DollarSign;

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
        {/* Step 1: Select Payment Type */}
        {!selectedType ? (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Select Payment Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {linkTypeOptions.map(type => (
                <Card
                  key={type.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-gray-200 hover:border-purple-400"
                  onClick={() => setSelectedType(type.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <type.icon className="h-8 w-8 text-purple-600 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-bold text-gray-900">{type.label}</h3>
                        <p className="text-sm text-gray-600">{type.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <Card className="border-purple-200 bg-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <IconComponent className="h-6 w-6 text-purple-600" />
                  <div>
                    <CardTitle>{currentTypeOption?.label} Link Details</CardTitle>
                    <p className="text-sm text-gray-600">{currentTypeOption?.description}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedType('')}
                >
                  Change Type
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateLink} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Basic Information</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title / Description *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={`e.g., ${
                        selectedType === 'donation'
                          ? 'Help Us Build Schools'
                          : selectedType === 'registration'
                          ? 'Annual Conference Registration 2024'
                          : 'Service Payment'
                      }`}
                      value={formData.description || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Amount Fields */}
                  {selectedType !== 'donation' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {selectedType === 'subscription' ? 'Monthly Amount' : 'Amount (Optional)'}
                        </label>
                        <input
                          type="number"
                          placeholder="0.00"
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
                          placeholder="Unlimited"
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
                  )}

                  {/* Donation Specific */}
                  {selectedType === 'donation' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Minimum Amount (Optional)
                        </label>
                        <input
                          type="number"
                          placeholder="No minimum"
                          value={formData.minAmount || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              minAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                            })
                          }
                          step="0.01"
                          min="0"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Maximum Amount (Optional)
                        </label>
                        <input
                          type="number"
                          placeholder="No limit"
                          value={formData.maxAmount || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              maxAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                            })
                          }
                          step="0.01"
                          min="0"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Subscription Settings */}
                {selectedType === 'subscription' && (
                  <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" /> Subscription Settings
                    </h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Billing Interval
                      </label>
                      <select
                        value={formData.recurringInterval || 'monthly'}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            recurringInterval: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="annual">Annual</option>
                      </select>
                    </div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.recurringActive || false}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            recurringActive: e.target.checked,
                          })
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Enable automatic recurring charges</span>
                    </label>
                  </div>
                )}

                {/* Additional Settings */}
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Info className="h-4 w-4" /> Additional Settings
                  </h4>

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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Success Redirect URL (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com/thank-you"
                      value={formData.successRedirectUrl || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          successRedirectUrl: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Redirect customers to this page after successful payment
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Webhook URL (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://your-server.com/webhook"
                      value={formData.webhookUrl || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          webhookUrl: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Receive payment notifications at your webhook endpoint
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
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
        )}
      </div>
    </div>
  );
};

export default CreatePaymentLinkEnhanced;

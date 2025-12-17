import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Plus,
  Copy,
  Share2,
  Trash2,
  Edit2,
  AlertCircle,
  Loader,
  Eye,
  EyeOff,
  MoreHorizontal,
  Calendar,
  Target,
  Heart,
  Users,
  Gift,
  ShoppingCart,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePaymentLinks } from '@/hooks/usePaymentLinks';
import { useToast } from '@/components/ui/use-toast';

interface PaymentLinkWithType extends any {
  linkCategory?: string;
  recurringActive?: boolean;
}

const categoryConfig = {
  standard: { icon: DollarSign, label: 'Standard', color: 'bg-blue-50 border-blue-200' },
  donation: { icon: Heart, label: 'Donation', color: 'bg-red-50 border-red-200' },
  registration: { icon: Users, label: 'Registration', color: 'bg-green-50 border-green-200' },
  subscription: { icon: TrendingUp, label: 'Subscription', color: 'bg-purple-50 border-purple-200' },
  fundraising: { icon: Gift, label: 'Fundraising', color: 'bg-orange-50 border-orange-200' },
  product: { icon: ShoppingCart, label: 'Product', color: 'bg-cyan-50 border-cyan-200' },
};

const PaymentLinksEnhanced: React.FC = () => {
  const navigate = useNavigate();
  const {
    paymentLinks,
    isLoading,
    isCreating,
    createPaymentLink,
    deactivatePaymentLink,
    deletePaymentLink,
    copyLinkToClipboard,
  } = usePaymentLinks();
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const handleCopyLink = async (shareUrl: string) => {
    await copyLinkToClipboard(shareUrl);
    toast({
      title: 'Success',
      description: 'Link copied to clipboard',
    });
  };

  const handleDeactivate = async (linkId: string) => {
    if (!window.confirm('Are you sure you want to deactivate this link?')) return;

    try {
      const success = await deactivatePaymentLink(linkId);
      if (success) {
        toast({
          title: 'Success',
          description: 'Payment link deactivated',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to deactivate link',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (linkId: string) => {
    if (!window.confirm('Are you sure you want to delete this link?')) return;

    try {
      const success = await deletePaymentLink(linkId);
      if (success) {
        toast({
          title: 'Success',
          description: 'Payment link deleted',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete link',
        variant: 'destructive',
      });
    }
  };

  const filteredLinks = activeCategory === 'all'
    ? paymentLinks
    : paymentLinks.filter(link => (link as PaymentLinkWithType).linkCategory === activeCategory);

  const stats = {
    total: paymentLinks.length,
    active: paymentLinks.filter(l => l.isActive).length,
    totalAmount: paymentLinks.reduce((sum, l) => sum + (l.amount || 0), 0),
    totalUsed: paymentLinks.reduce((sum, l) => sum + l.currentUses, 0),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Fixed Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="h-10 w-10 flex-shrink-0"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 truncate">Payment Links</h1>
                <p className="text-sm text-gray-600">Create shareable payment request links</p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/app/wallet/payment-links/create')}
              className="bg-purple-600 hover:bg-purple-700 flex-shrink-0 whitespace-nowrap"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Link
            </Button>
          </div>

          {/* Stats Bar */}
          {paymentLinks.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t">
              <div className="text-center">
                <p className="text-xs text-gray-600 font-medium">Total Links</p>
                <p className="text-lg font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600 font-medium">Active</p>
                <p className="text-lg font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600 font-medium">Total Amount</p>
                <p className="text-lg font-bold text-gray-900">${stats.totalAmount.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600 font-medium">Used</p>
                <p className="text-lg font-bold text-blue-600">{stats.totalUsed}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 pb-20">
        {/* Category Tabs */}
        {paymentLinks.length > 0 && (
          <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory} className="mb-6">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-7">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="standard">Standard</TabsTrigger>
              <TabsTrigger value="donation">Donation</TabsTrigger>
              <TabsTrigger value="registration">Registration</TabsTrigger>
              <TabsTrigger value="subscription">Subscription</TabsTrigger>
              <TabsTrigger value="fundraising">Fundraising</TabsTrigger>
              <TabsTrigger value="product">Product</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* Payment Links List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader className="h-8 w-8 text-purple-600 animate-spin mb-4" />
            <p className="text-gray-600">Loading payment links...</p>
          </div>
        ) : filteredLinks.length === 0 && paymentLinks.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Share2 className="h-12 w-12 text-gray-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payment Links Yet</h3>
              <p className="text-gray-600 mb-6">
                Create a payment link to share with customers for quick payments.
              </p>
              <Button
                onClick={() => navigate('/app/wallet/payment-links/create')}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Link
              </Button>
            </CardContent>
          </Card>
        ) : filteredLinks.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Links in This Category</h3>
              <p className="text-gray-600">Try selecting a different category or create a new link.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredLinks.map(link => {
              const category = (link as PaymentLinkWithType).linkCategory || 'standard';
              const config = categoryConfig[category as keyof typeof categoryConfig] || categoryConfig.standard;
              const IconComponent = config.icon;

              return (
                <Card key={link.id} className={`${config.color} border hover:shadow-md transition-shadow`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="mt-1 flex-shrink-0">
                          <IconComponent className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {link.description || `${config.label} Link`}
                            </h3>
                            <span className={`px-2 py-1 text-xs font-semibold rounded whitespace-nowrap ${
                              link.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {link.isActive ? 'Active' : 'Inactive'}
                            </span>
                            {(link as PaymentLinkWithType).recurringActive && (
                              <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800 whitespace-nowrap">
                                Recurring
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 font-mono">{link.code}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="flex-shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {link.isActive && (
                            <DropdownMenuItem onClick={() => handleDeactivate(link.id)}>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Deactivate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDelete(link.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 p-3 bg-white bg-opacity-60 rounded-lg">
                      {link.amount && (
                        <div>
                          <p className="text-xs text-gray-600 font-medium">Amount</p>
                          <p className="font-semibold text-gray-900">${link.amount.toFixed(2)}</p>
                        </div>
                      )}
                      {link.maxUses && (
                        <div>
                          <p className="text-xs text-gray-600 font-medium flex items-center gap-1">
                            <Target className="h-3 w-3" /> Uses
                          </p>
                          <p className="font-semibold text-gray-900">
                            {link.currentUses}/{link.maxUses}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Status</p>
                        <p className={`font-semibold ${link.isActive ? 'text-green-600' : 'text-red-600'}`}>
                          {link.isActive ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                      {link.expiresAt && (
                        <div>
                          <p className="text-xs text-gray-600 font-medium flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Expires
                          </p>
                          <p className="font-semibold text-gray-900 text-sm">
                            {new Date(link.expiresAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        onClick={() => handleCopyLink(link.shareUrl)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy Link
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          window.open(link.shareUrl, '_blank');
                        }}
                      >
                        <Share2 className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/app/wallet/payment-links/${link.id}/edit`)}
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentLinksEnhanced;

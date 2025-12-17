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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePaymentLinks } from '@/hooks/usePaymentLinks';
import { useToast } from '@/components/ui/use-toast';

const PaymentLinks: React.FC = () => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-10 w-10"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Payment Links</h1>
              <p className="text-sm text-gray-600">Create shareable payment request links</p>
            </div>
          </div>
          <Button
            onClick={() => navigate('/app/wallet/payment-links/create')}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Link
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 pb-20">

        {/* Payment Links List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader className="h-8 w-8 text-purple-600 animate-spin mb-4" />
            <p className="text-gray-600">Loading payment links...</p>
          </div>
        ) : paymentLinks.length === 0 ? (
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
        ) : (
          <div className="space-y-4">
            {paymentLinks.map(link => (
              <Card key={link.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {link.description || `Payment Link ${link.code}`}
                        </h3>
                        {!link.isActive && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 font-mono">{link.code}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                    {link.amount && (
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Amount</p>
                        <p className="font-semibold text-gray-900">${link.amount.toFixed(2)}</p>
                      </div>
                    )}
                    {link.maxUses && (
                      <div>
                        <p className="text-xs text-gray-600 font-medium flex items-center gap-1">
                          <Target className="h-3 w-3" /> Max Uses
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
                        <p className="font-semibold text-gray-900">
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentLinks;

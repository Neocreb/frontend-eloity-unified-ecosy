import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Download, Printer, Mail, AlertCircle, Loader, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WalletProvider, useWalletContext } from '@/contexts/WalletContext';
import { useReceipts } from '@/hooks/useReceipts';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { invoiceTemplateService } from '@/services/invoiceTemplateService';
import ProfessionalReceiptTemplate from '@/components/receipt/ProfessionalReceiptTemplate';

const ReceiptsInner: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { transactions } = useWalletContext();
  const { receipts, isLoading, generateReceipt, downloadReceiptPDF, emailReceipt } = useReceipts();
  const { formatCurrency } = useCurrency();
  const { toast } = useToast();
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [emailingId, setEmailingId] = useState<string | null>(null);
  const [customization, setCustomization] = useState<any>(null);
  const [showCustomization, setShowCustomization] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewReceipt, setPreviewReceipt] = useState<any>(null);

  // Load customization on mount
  useEffect(() => {
    if (user?.id) {
      invoiceTemplateService.getReceiptCustomization(user.id).then(setCustomization);
    }
  }, [user?.id]);

  const handleGenerateReceipt = async (transactionId: string) => {
    const transaction = transactions.find(tx => tx.id === transactionId);
    if (!transaction) return;

    try {
      setGeneratingId(transactionId);
      const receipt = await generateReceipt(transaction);
      if (receipt) {
        toast({
          title: 'Success',
          description: `Receipt generated: ${receipt.receiptNumber}`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate receipt',
        variant: 'destructive',
      });
    } finally {
      setGeneratingId(null);
    }
  };

  const handleDownloadReceipt = async (receiptId: string) => {
    const receipt = receipts.find(r => r.id === receiptId);
    const transaction = transactions.find(tx => tx.id === receipt?.transactionId);
    
    if (!receipt || !transaction) return;

    try {
      await downloadReceiptPDF(transaction as any, receipt.receiptNumber);
      toast({
        title: 'Success',
        description: 'Receipt opened for printing/download',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download receipt',
        variant: 'destructive',
      });
    }
  };

  const handleEmailReceipt = async (receiptId: string) => {
    try {
      setEmailingId(receiptId);
      const receipt = receipts.find(r => r.id === receiptId);
      if (!receipt) return;

      const success = await emailReceipt(receipt.transactionId, 'user@example.com');
      if (success) {
        toast({
          title: 'Success',
          description: 'Receipt emailed successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to email receipt',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to email receipt',
        variant: 'destructive',
      });
    } finally {
      setEmailingId(null);
    }
  };

  const handleSaveCustomization = async (customizationData: any) => {
    if (!user?.id) return;
    try {
      const updated = await invoiceTemplateService.updateReceiptCustomization(
        user.id,
        customizationData
      );
      setCustomization(updated);
      setShowCustomization(false);
      toast({
        title: 'Success',
        description: 'Receipt template customization saved',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save customization',
        variant: 'destructive',
      });
    }
  };

  const handlePreviewReceipt = (receiptData: any) => {
    setPreviewReceipt({
      id: receiptData.id,
      receiptNumber: receiptData.receipt_number || receiptData.receiptNumber || 'RCP-001',
      timestamp: receiptData.created_at || receiptData.timestamp || new Date().toISOString(),
      amount: receiptData.amount || 0,
      currency: customization?.currency || 'USD',
      description: receiptData.description || 'Transaction Receipt',
      status: 'completed',
    });
    setShowPreview(true);
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
              <h1 className="text-2xl font-bold text-gray-900">Transaction Receipts</h1>
              <p className="text-sm text-gray-600">Generate and manage transaction receipts</p>
            </div>
          </div>
          <Button
            onClick={() => setShowCustomization(!showCustomization)}
            variant="outline"
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Template
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 pb-20">
        {/* Preview Modal */}
        {showPreview && previewReceipt && customization && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 max-h-screen overflow-y-auto">
            <div className="bg-white rounded-lg max-w-2xl w-full my-8">
              <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-lg font-bold">Receipt Preview</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPreview(false)}
                >
                  ✕
                </Button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[70vh]">
                <ProfessionalReceiptTemplate
                  receipt={previewReceipt}
                  customization={customization}
                />
              </div>
            </div>
          </div>
        )}

        {/* Customization Form */}
        {showCustomization && (
          <Card className="mb-6 border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle>Customize Receipt Template</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveCustomization(customization);
                }}
                className="space-y-6"
              >
                {/* Company Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Company Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        value={customization?.companyName || ''}
                        onChange={(e) => setCustomization({ ...customization, companyName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={customization?.companyEmail || ''}
                        onChange={(e) => setCustomization({ ...customization, companyEmail: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={customization?.companyPhone || ''}
                        onChange={(e) => setCustomization({ ...customization, companyPhone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Receipt Prefix
                      </label>
                      <input
                        type="text"
                        value={customization?.receiptPrefix || 'RCP'}
                        onChange={(e) => setCustomization({ ...customization, receiptPrefix: e.target.value })}
                        placeholder="e.g., RCP"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <textarea
                        value={customization?.companyAddress || ''}
                        onChange={(e) => setCustomization({ ...customization, companyAddress: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Design Settings */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-semibold text-gray-900">Design Settings</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Primary Color
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={customization?.primaryColor || '#10b981'}
                          onChange={(e) => setCustomization({ ...customization, primaryColor: e.target.value })}
                          className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={customization?.primaryColor || '#10b981'}
                          onChange={(e) => setCustomization({ ...customization, primaryColor: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Currency
                      </label>
                      <input
                        type="text"
                        value={customization?.currency || 'USD'}
                        onChange={(e) => setCustomization({ ...customization, currency: e.target.value })}
                        placeholder="USD"
                        maxLength={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Receipt Options */}
                <div className="space-y-3 pt-4 border-t">
                  <h4 className="font-semibold text-gray-900">Receipt Options</h4>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={customization?.includeQRCode || false}
                      onChange={(e) => setCustomization({ ...customization, includeQRCode: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Include QR Code</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={customization?.includeSignature || false}
                      onChange={(e) => setCustomization({ ...customization, includeSignature: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Include Signature Line</span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    Save Customization
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCustomization(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader className="h-8 w-8 text-purple-600 animate-spin mb-4" />
            <p className="text-gray-600">Loading receipts...</p>
          </div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-2">Error Loading Receipts</h3>
                  <p className="text-sm text-red-800 mb-3">{error}</p>
                  <Button
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : receipts.length === 0 && transactions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transactions Yet</h3>
              <p className="text-gray-600 mb-6">You don't have any transactions to generate receipts for.</p>
              <Button
                onClick={() => navigate('/app/wallet')}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Go to Wallet
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Transactions needing receipts */}
            {transactions.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Transactions</h2>
                <div className="space-y-3">
                  {transactions.slice(0, 10).map(tx => {
                    const receipt = receipts.find(r => r.transactionId === tx.id);
                    return (
                      <Card key={tx.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{tx.description || 'Transaction'}</h3>
                              <div className="mt-1 flex items-center gap-4 text-sm text-gray-600">
                                <span>{new Date(tx.timestamp || tx.createdAt || '').toLocaleDateString()}</span>
                                <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                                  {tx.type || 'transfer'}
                                </span>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    tx.status === 'completed'
                                      ? 'bg-green-100 text-green-800'
                                      : tx.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {tx.status || 'unknown'}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-gray-900">
                                {typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount > 0 ? '+' : ''}
                                {formatCurrency(
                                  typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount
                                )}
                              </div>
                              {receipt && (
                                <div className="text-xs text-gray-500 mt-1">{receipt.receiptNumber}</div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="mt-4 flex gap-2 flex-wrap">
                            {!receipt ? (
                              <Button
                                size="sm"
                                onClick={() => handleGenerateReceipt(tx.id)}
                                disabled={generatingId === tx.id}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                {generatingId === tx.id ? (
                                  <>
                                    <Loader className="h-3 w-3 mr-1 animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Generate Receipt
                                  </>
                                )}
                              </Button>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleDownloadReceipt(receipt.id)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  Download
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownloadReceipt(receipt.id)}
                                >
                                  <Printer className="h-3 w-3 mr-1" />
                                  Print
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEmailReceipt(receipt.id)}
                                  disabled={emailingId === receipt.id}
                                >
                                  {emailingId === receipt.id ? (
                                    <>
                                      <Loader className="h-3 w-3 mr-1 animate-spin" />
                                      Sending...
                                    </>
                                  ) : (
                                    <>
                                      <Mail className="h-3 w-3 mr-1" />
                                      Email
                                    </>
                                  )}
                                </Button>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Generated Receipts Summary */}
            {receipts.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Generated Receipts ({receipts.length})</h2>
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="text-left py-3 px-4 font-semibold text-gray-900">Receipt Number</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-900">Generated</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-900">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {receipts.map(receipt => (
                            <tr key={receipt.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4 font-mono text-purple-600">{receipt.receiptNumber}</td>
                              <td className="py-3 px-4 text-gray-600">
                                {new Date(receipt.generatedAt).toLocaleDateString()}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDownloadReceipt(receipt.id)}
                                  className="text-purple-600 hover:bg-purple-50"
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Receipts = () => (
  <WalletProvider>
    <ReceiptsInner />
  </WalletProvider>
);

export default Receipts;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Download, Printer, Mail, AlertCircle, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WalletProvider, useWalletContext } from '@/contexts/WalletContext';
import { useReceipts } from '@/hooks/useReceipts';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useToast } from '@/components/ui/use-toast';

const ReceiptsInner: React.FC = () => {
  const navigate = useNavigate();
  const { transactions } = useWalletContext();
  const { receipts, isLoading, generateReceipt, downloadReceiptPDF, emailReceipt } = useReceipts();
  const { formatCurrency } = useCurrency();
  const { toast } = useToast();
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [emailingId, setEmailingId] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
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
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 pb-20">
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

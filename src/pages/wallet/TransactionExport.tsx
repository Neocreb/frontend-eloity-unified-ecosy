import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Download, FileJson, FileText, Eye, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WalletProvider, useWalletContext } from '@/contexts/WalletContext';
import { useTransactionExport } from '@/hooks/useTransactionExport';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useToast } from '@/components/ui/use-toast';

const TransactionExportInner: React.FC = () => {
  const navigate = useNavigate();
  const { transactions } = useWalletContext();
  const { exportCSV, exportJSON, exportPDF, getSummaryStats, filterByDateRange, isExporting, error } =
    useTransactionExport();
  const { formatCurrency } = useCurrency();
  const { toast } = useToast();

  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const filteredTransactions = useMemo(() => {
    return filterByDateRange(transactions, new Date(startDate), new Date(endDate));
  }, [transactions, startDate, endDate, filterByDateRange]);

  const summary = useMemo(() => {
    return getSummaryStats(filteredTransactions);
  }, [filteredTransactions, getSummaryStats]);

  const handleExportCSV = () => {
    try {
      exportCSV(filteredTransactions, `transactions_${startDate}_to_${endDate}.csv`);
      toast({ title: 'Success', description: 'CSV export downloaded' });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to export CSV',
        variant: 'destructive',
      });
    }
  };

  const handleExportJSON = () => {
    try {
      exportJSON(filteredTransactions, `transactions_${startDate}_to_${endDate}.json`);
      toast({ title: 'Success', description: 'JSON export downloaded' });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to export JSON',
        variant: 'destructive',
      });
    }
  };

  const handleExportPDF = async () => {
    try {
      await exportPDF(filteredTransactions, `transactions_${startDate}_to_${endDate}.pdf`);
      toast({ title: 'Success', description: 'PDF export opened for printing' });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to export PDF',
        variant: 'destructive',
      });
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
            <h1 className="text-2xl font-bold text-gray-900">Export Transactions</h1>
            <p className="text-sm text-gray-600">Download your transaction history in multiple formats</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 pb-20">
        {/* Date Range Selector */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Select Date Range
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 mb-2">Total Transactions</p>
              <p className="text-3xl font-bold text-gray-900">{summary.totalCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 mb-2">Total Amount</p>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(summary.totalAmount)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 mb-2">Average Amount</p>
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(summary.averageAmount)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-green-600 font-medium">Completed</p>
              <p className="text-2xl font-bold text-green-700 mt-2">{summary.successCount}</p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-yellow-600 font-medium">Pending</p>
              <p className="text-2xl font-bold text-yellow-700 mt-2">{summary.pendingCount}</p>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-red-600 font-medium">Failed</p>
              <p className="text-2xl font-bold text-red-700 mt-2">{summary.failedCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Options
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="csv" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="csv">CSV</TabsTrigger>
                <TabsTrigger value="json">JSON</TabsTrigger>
                <TabsTrigger value="pdf">PDF</TabsTrigger>
              </TabsList>

              <TabsContent value="csv" className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">CSV Format</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Export your transactions as a CSV file. Perfect for spreadsheets and data analysis.
                  </p>
                  <div className="bg-white rounded border border-gray-300 p-3 mb-4 font-mono text-xs text-gray-600 overflow-x-auto">
                    Date, Time, Description, Type, Amount, Status, Source, Destination, Reference ID
                  </div>
                  <Button
                    onClick={handleExportCSV}
                    disabled={isExporting}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {isExporting ? 'Exporting...' : 'Download CSV'}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="json" className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">JSON Format</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Export as JSON for programmatic access and integration with other applications.
                  </p>
                  <div className="bg-white rounded border border-gray-300 p-3 mb-4 font-mono text-xs text-gray-600 overflow-x-auto">
                    {'{'}
                    <br />
                    &nbsp;&nbsp;"transactions": [<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;{'{'}
                    "id": "...", "amount": ..., ..{'}'}
                    <br />
                    &nbsp;&nbsp;]<br />
                    {'}'}
                  </div>
                  <Button
                    onClick={handleExportJSON}
                    disabled={isExporting}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    <FileJson className="h-4 w-4 mr-2" />
                    {isExporting ? 'Exporting...' : 'Download JSON'}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="pdf" className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">PDF Report</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Export as a formatted PDF report with summary statistics and detailed transaction list.
                  </p>
                  <div className="bg-white rounded border border-gray-300 p-3 mb-4">
                    <Eye className="h-4 w-4 text-gray-400 mb-2" />
                    <p className="text-xs text-gray-600">Professional PDF report with header, summary, and all transaction details</p>
                  </div>
                  <Button
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isExporting ? 'Exporting...' : 'Download PDF'}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Transaction Preview */}
        {filteredTransactions.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Transaction Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-4 font-semibold text-gray-900">Date</th>
                      <th className="text-left py-2 px-4 font-semibold text-gray-900">Description</th>
                      <th className="text-left py-2 px-4 font-semibold text-gray-900">Type</th>
                      <th className="text-right py-2 px-4 font-semibold text-gray-900">Amount</th>
                      <th className="text-center py-2 px-4 font-semibold text-gray-900">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.slice(0, 10).map((tx, idx) => (
                      <tr key={tx.id || idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(tx.timestamp || tx.createdAt || '').toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-gray-900">{tx.description || '-'}</td>
                        <td className="py-3 px-4 text-gray-600">{tx.type || '-'}</td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900">
                          {typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount > 0 ? '+' : ''}
                          {formatCurrency(typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredTransactions.length > 10 && (
                  <p className="text-sm text-gray-600 mt-4 text-center">
                    Showing 10 of {filteredTransactions.length} transactions
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {filteredTransactions.length === 0 && (
          <Card className="mt-6">
            <CardContent className="p-12 text-center">
              <p className="text-gray-600">No transactions found for the selected date range</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

const TransactionExport = () => (
  <WalletProvider>
    <TransactionExportInner />
  </WalletProvider>
);

export default TransactionExport;

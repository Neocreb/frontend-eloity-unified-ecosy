import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { invoicePaymentSyncService, InvoicePaymentRecord } from '@/services/invoicePaymentSyncService';
import { useAuth } from '@/contexts/AuthContext';
import {
  FileText,
  Share2,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  Loader,
  Heart,
  Users,
  Gift,
  ShoppingCart,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];
const typeIcons = {
  invoice_received: FileText,
  invoice_paid: CheckCircle,
  payment_link_created: Share2,
  payment_link_used: DollarSign,
};

interface ActivitySummary {
  totalInvoicesCreated: number;
  totalInvoicesPaid: number;
  totalPaymentLinksCreated: number;
  totalPaymentLinksUsed: number;
  totalAmountFromInvoices: number;
  totalAmountFromPaymentLinks: number;
}

const InvoicePaymentAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<InvoicePaymentRecord[]>([]);
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30');

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      try {
        const userRecords = await invoicePaymentSyncService.getUserRecords(user.id);
        const activitySummary = await invoicePaymentSyncService.getActivitySummary(
          user.id,
          parseInt(selectedPeriod)
        );

        setRecords(userRecords);
        setSummary(activitySummary);
      } catch (error) {
        console.error('Error loading invoice payment analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.id, selectedPeriod]);

  const chartData = useMemo(() => {
    if (!summary) return [];

    return [
      { name: 'Invoices', created: summary.totalInvoicesCreated, paid: summary.totalInvoicesPaid },
      { name: 'Payment Links', created: summary.totalPaymentLinksCreated, used: summary.totalPaymentLinksUsed },
    ];
  }, [summary]);

  const typeDistribution = useMemo(() => {
    if (!summary) return [];

    return [
      { name: 'Invoices Created', value: summary.totalInvoicesCreated, color: '#8884d8' },
      { name: 'Invoices Paid', value: summary.totalInvoicesPaid, color: '#82ca9d' },
      { name: 'Links Created', value: summary.totalPaymentLinksCreated, color: '#ffc658' },
      { name: 'Links Used', value: summary.totalPaymentLinksUsed, color: '#ff7300' },
    ].filter(item => item.value > 0);
  }, [summary]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center min-h-40">
          <Loader className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (!summary || (summary.totalInvoicesCreated === 0 && summary.totalPaymentLinksCreated === 0)) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Invoice or Payment Link Activity</h3>
          <p className="text-gray-600">Create invoices or payment links to see analytics here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice & Payment Link Analytics
            </CardTitle>
          </div>
          <div className="flex gap-2">
            {['7', '30', '90'].map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  selectedPeriod === period
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {period}d
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="charts">Analytics</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600 font-medium">Invoices Created</p>
                <p className="text-2xl font-bold text-blue-600">{summary.totalInvoicesCreated}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600 font-medium">Invoices Paid</p>
                <p className="text-2xl font-bold text-green-600">${summary.totalAmountFromInvoices.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm text-gray-600 font-medium">Payment Links</p>
                <p className="text-2xl font-bold text-purple-600">{summary.totalPaymentLinksCreated}</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm text-gray-600 font-medium">Links Used</p>
                <p className="text-2xl font-bold text-orange-600">${summary.totalAmountFromPaymentLinks.toFixed(2)}</p>
              </div>
            </div>
          </TabsContent>

          {/* Charts Tab */}
          <TabsContent value="charts" className="space-y-6">
            {/* Activity Chart */}
            {chartData.length > 0 && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-4">Activity Comparison</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="created" fill="#8884d8" name="Created" />
                    <Bar dataKey="paid" fill="#82ca9d" name="Paid/Used" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Distribution Chart */}
            {typeDistribution.length > 0 && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-4">Distribution</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={typeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {typeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-3">
            {records.length === 0 ? (
              <p className="text-center text-gray-600 py-8">No recent activity</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {records.slice(0, 10).map(record => {
                  const TypeIcon = typeIcons[record.transactionType] || FileText;
                  const typeLabel = {
                    invoice_received: 'Invoice Created',
                    invoice_paid: 'Invoice Paid',
                    payment_link_created: 'Link Created',
                    payment_link_used: 'Link Used',
                  }[record.transactionType];

                  return (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-full border border-gray-200">
                          <TypeIcon className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{typeLabel}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(record.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {record.amount && (
                        <Badge variant="outline" className="ml-auto">
                          ${record.amount.toFixed(2)}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default InvoicePaymentAnalytics;

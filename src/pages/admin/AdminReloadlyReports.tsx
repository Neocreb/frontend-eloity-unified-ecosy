import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import {
  BarChart3,
  RefreshCw,
  Download,
  TrendingUp,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface CommissionStats {
  total_transactions: number;
  total_amount: number;
  total_commission: number;
  average_commission_rate: number;
  success_rate: number;
  by_service_type?: Record<string, {
    count: number;
    amount: number;
    commission: number;
    rate: number;
  }>;
  by_status?: Record<string, number>;
}

const AdminReloadlyReports = () => {
  const { toast } = useToast();
  const { session } = useAuth();
  const [stats, setStats] = useState<CommissionStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterService, setFilterService] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const serviceTypes = ['airtime', 'data', 'utilities', 'gift_cards'];
  const statuses = ['pending', 'processing', 'success', 'failed', 'refunded'];

  // Fetch statistics
  const fetchStats = async () => {
    if (!session?.access_token) return;

    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (filterService !== 'all') params.append('serviceType', filterService);
      if (filterStatus !== 'all') params.append('status', filterStatus);

      const response = await fetch(`/api/commission/stats?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        setStats(data.data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch statistics',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch statistics',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load stats on mount and filter changes
  useEffect(() => {
    if (session?.access_token) {
      fetchStats();
    }
  }, [session?.access_token]);

  // Export report
  const handleExport = () => {
    if (!stats) {
      toast({
        title: 'Error',
        description: 'No data to export',
        variant: 'destructive'
      });
      return;
    }

    const reportData = {
      generatedAt: new Date().toLocaleString(),
      dateRange: `${startDate} to ${endDate}`,
      summary: {
        totalTransactions: stats.total_transactions,
        totalVolume: `₦${stats.total_amount.toFixed(2)}`,
        totalCommission: `₦${stats.total_commission.toFixed(2)}`,
        averageCommissionRate: `${stats.average_commission_rate.toFixed(2)}%`,
        successRate: `${stats.success_rate.toFixed(2)}%`,
      },
      byServiceType: stats.by_service_type || {},
      byStatus: stats.by_status || {}
    };

    const csvContent = [
      ['Commission Report'],
      ['Generated:', reportData.generatedAt],
      ['Date Range:', reportData.dateRange],
      [],
      ['SUMMARY'],
      ['Total Transactions', reportData.summary.totalTransactions],
      ['Total Volume', reportData.summary.totalVolume],
      ['Total Commission', reportData.summary.totalCommission],
      ['Average Commission Rate', reportData.summary.averageCommissionRate],
      ['Success Rate', reportData.summary.successRate],
      [],
      ['BY SERVICE TYPE'],
      ['Service Type', 'Count', 'Volume', 'Commission', 'Rate'],
      ...Object.entries(stats.by_service_type || {}).map(([service, data]: any) => [
        service,
        data.count,
        `₦${data.amount.toFixed(2)}`,
        `₦${data.commission.toFixed(2)}`,
        `${data.rate.toFixed(2)}%`
      ]),
      [],
      ['BY STATUS'],
      ['Status', 'Count'],
      ...Object.entries(stats.by_status || {}).map(([status, count]) => [
        status,
        count
      ])
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commission-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: 'Report exported successfully',
      variant: 'default'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(value);
  };

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="w-8 h-8" />
              Revenue Reports
            </h1>
            <p className="text-gray-600 mt-1">Commission and transaction analytics</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Date Range & Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Service Type</label>
                <Select value={filterService} onValueChange={setFilterService}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    {serviceTypes.map(type => (
                      <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {statuses.map(status => (
                      <SelectItem key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={fetchStats} disabled={isLoading} className="w-full gap-2">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Loading...' : 'Generate Report'}
            </Button>
          </CardContent>
        </Card>

        <Alert>
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>Loading report data...</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="w-8 h-8" />
            Revenue Reports
          </h1>
          <p className="text-gray-600 mt-1">Commission and transaction analytics</p>
        </div>
        <Button onClick={handleExport} className="gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Date Range & Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Date Range & Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Service Type</label>
              <Select value={filterService} onValueChange={setFilterService}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  {serviceTypes.map(type => (
                    <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={fetchStats} disabled={isLoading} className="w-full gap-2">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Generate Report'}
          </Button>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Total Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total_transactions.toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-2">Transactions processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{formatCurrency(stats.total_amount)}</div>
            <p className="text-xs text-gray-600 mt-2">User payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{formatCurrency(stats.total_commission)}</div>
            <p className="text-xs text-gray-600 mt-2">Platform revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Average Commission Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.average_commission_rate.toFixed(2)}%</div>
            <p className="text-xs text-gray-600 mt-2">Average rate across all transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.success_rate.toFixed(2)}%</div>
            <p className="text-xs text-gray-600 mt-2">Transaction success rate</p>
          </CardContent>
        </Card>
      </div>

      {/* By Service Type */}
      {stats.by_service_type && Object.keys(stats.by_service_type).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance by Service Type</CardTitle>
            <CardDescription>Commission breakdown by RELOADLY service</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium">Service Type</th>
                    <th className="text-left py-3 px-4 font-medium">Transactions</th>
                    <th className="text-left py-3 px-4 font-medium">Volume</th>
                    <th className="text-left py-3 px-4 font-medium">Commission</th>
                    <th className="text-left py-3 px-4 font-medium">Avg. Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stats.by_service_type).map(([serviceType, data]: any) => (
                    <tr key={serviceType} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Badge variant="outline">{serviceType}</Badge>
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold">{data.count.toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-green-600 font-semibold">{formatCurrency(data.amount)}</td>
                      <td className="py-3 px-4 text-sm text-blue-600 font-semibold">{formatCurrency(data.commission)}</td>
                      <td className="py-3 px-4 text-sm text-purple-600 font-semibold">{data.rate.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* By Status */}
      {stats.by_status && Object.keys(stats.by_status).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Transactions by Status</CardTitle>
            <CardDescription>Transaction count by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(stats.by_status).map(([status, count]: any) => {
                const getStatusColor = (status: string) => {
                  switch (status) {
                    case 'success':
                      return 'bg-green-50 text-green-700 border-green-200';
                    case 'pending':
                      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
                    case 'processing':
                      return 'bg-blue-50 text-blue-700 border-blue-200';
                    case 'failed':
                      return 'bg-red-50 text-red-700 border-red-200';
                    case 'refunded':
                      return 'bg-orange-50 text-orange-700 border-orange-200';
                    default:
                      return 'bg-gray-50 text-gray-700 border-gray-200';
                  }
                };

                return (
                  <div
                    key={status}
                    className={`border rounded-lg p-4 text-center ${getStatusColor(status)}`}
                  >
                    <div className="text-2xl font-bold">{count.toLocaleString()}</div>
                    <div className="text-xs mt-1 font-medium">{status.charAt(0).toUpperCase() + status.slice(1)}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Box */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg">Report Summary</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            <span className="font-semibold">Period:</span> {startDate} to {endDate}
          </p>
          <p>
            <span className="font-semibold">Total Transactions:</span> {stats.total_transactions.toLocaleString()}
          </p>
          <p>
            <span className="font-semibold">Total Volume:</span> {formatCurrency(stats.total_amount)}
          </p>
          <p>
            <span className="font-semibold">Platform Revenue:</span> {formatCurrency(stats.total_commission)}
          </p>
          <p>
            <span className="font-semibold">Success Rate:</span> {stats.success_rate.toFixed(2)}%
          </p>
          <p className="text-xs text-gray-600 mt-4">
            Report generated on {new Date().toLocaleString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReloadlyReports;

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import {
  FileText,
  Search,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Transaction {
  id: string;
  user_id: string;
  service_type: string;
  operator_id: number;
  operator_name: string;
  recipient: string;
  amount: number;
  reloadly_amount: number;
  commission_earned: number;
  commission_rate: number;
  commission_type: string;
  status: string;
  reloadly_transaction_id?: string;
  created_at: string;
  updated_at: string;
}

interface Pagination {
  limit: number;
  offset: number;
  total: number;
}

const AdminReloadlyTransactions = () => {
  const { toast } = useToast();
  const { session } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ limit: 20, offset: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterService, setFilterService] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const serviceTypes = ['airtime', 'data', 'utilities', 'gift_cards'];
  const statuses = ['pending', 'processing', 'success', 'failed', 'refunded'];

  // Fetch transactions
  const fetchTransactions = async (offset = 0) => {
    if (!session?.access_token) return;

    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append('limit', pagination.limit.toString());
      params.append('offset', offset.toString());
      if (filterService !== 'all') params.append('serviceType', filterService);
      if (filterStatus !== 'all') params.append('status', filterStatus);

      const response = await fetch(`/api/commission/transactions?${params.toString()}`, {
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
        setTransactions(data.data.transactions || []);
        if (data.data.pagination) {
          setPagination(data.data.pagination);
        }
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch transactions',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch transactions',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load transactions on mount and filter changes
  useEffect(() => {
    if (session?.access_token) {
      fetchTransactions(0);
    }
  }, [session?.access_token, filterService, filterStatus]);

  // Filter transactions by search term
  const filteredTransactions = transactions.filter(tx => {
    const searchLower = searchTerm.toLowerCase();
    return (
      tx.operator_name.toLowerCase().includes(searchLower) ||
      tx.recipient.toLowerCase().includes(searchLower) ||
      tx.user_id.toLowerCase().includes(searchLower) ||
      tx.id.toLowerCase().includes(searchLower)
    );
  });

  // Export transactions to CSV
  const handleExport = () => {
    if (transactions.length === 0) {
      toast({
        title: 'Error',
        description: 'No transactions to export',
        variant: 'destructive'
      });
      return;
    }

    const csv = [
      ['ID', 'User ID', 'Service', 'Operator', 'Recipient', 'Amount', 'Commission', 'Status', 'Date'],
      ...transactions.map(tx => [
        tx.id,
        tx.user_id,
        tx.service_type,
        tx.operator_name,
        tx.recipient,
        tx.amount.toFixed(2),
        tx.commission_earned.toFixed(2),
        tx.status,
        new Date(tx.created_at).toLocaleString()
      ])
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: 'Transactions exported successfully',
      variant: 'default'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'refunded':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case 'refunded':
        return <Badge className="bg-orange-100 text-orange-800">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="w-8 h-8" />
            Transaction Audit
          </h1>
          <p className="text-gray-600 mt-1">View and audit all RELOADLY transactions</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button
            onClick={() => fetchTransactions(0)}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by operator, recipient, user ID, or transaction ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
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
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            Showing {filteredTransactions.length} of {pagination.total} transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>No transactions found matching your criteria.</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              {filteredTransactions.map(tx => (
                <div key={tx.id} className="border rounded-lg hover:bg-gray-50">
                  {/* Transaction Row */}
                  <div
                    className="p-4 flex items-center gap-4 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === tx.id ? null : tx.id)}
                  >
                    <div className="flex-shrink-0">
                      {getStatusIcon(tx.status)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{tx.operator_name}</h3>
                        <Badge variant="outline">{tx.service_type}</Badge>
                        {getStatusBadge(tx.status)}
                      </div>
                      <p className="text-sm text-gray-600">{tx.recipient}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(tx.created_at)}</p>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <div className="font-semibold text-green-600">{formatCurrency(tx.amount)}</div>
                      <div className="text-sm text-gray-600">
                        Commission: {formatCurrency(tx.commission_earned)}
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {expandedId === tx.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedId === tx.id && (
                    <div className="bg-gray-50 p-4 border-t space-y-2 text-sm">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-gray-600">Transaction ID</p>
                          <p className="font-mono text-xs break-all">{tx.id}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">User ID</p>
                          <p className="font-mono text-xs break-all">{tx.user_id}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Operator ID</p>
                          <p className="font-semibold">{tx.operator_id}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Amount (User Pays)</p>
                          <p className="font-semibold text-green-600">{formatCurrency(tx.amount)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Amount (To RELOADLY)</p>
                          <p className="font-semibold">{formatCurrency(tx.reloadly_amount)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Commission Earned</p>
                          <p className="font-semibold text-blue-600">{formatCurrency(tx.commission_earned)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Commission Type</p>
                          <p className="font-semibold">{tx.commission_type}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Commission Rate</p>
                          <p className="font-semibold">{tx.commission_rate}%</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Status</p>
                          {getStatusBadge(tx.status)}
                        </div>
                        {tx.reloadly_transaction_id && (
                          <div className="col-span-2 md:col-span-3">
                            <p className="text-gray-600">RELOADLY Transaction ID</p>
                            <p className="font-mono text-xs break-all">{tx.reloadly_transaction_id}</p>
                          </div>
                        )}
                        <div className="col-span-2 md:col-span-3">
                          <p className="text-gray-600">Recipient</p>
                          <p className="font-semibold">{tx.recipient}</p>
                        </div>
                        <div className="col-span-2 md:col-span-3">
                          <p className="text-gray-600">Updated At</p>
                          <p className="text-xs">{formatDate(tx.updated_at)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {Math.floor(pagination.offset / pagination.limit) + 1} of{' '}
                {Math.ceil(pagination.total / pagination.limit)}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={pagination.offset === 0 || isLoading}
                  onClick={() => fetchTransactions(Math.max(0, pagination.offset - pagination.limit))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={pagination.offset + pagination.limit >= pagination.total || isLoading}
                  onClick={() => fetchTransactions(pagination.offset + pagination.limit)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pagination.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(transactions.reduce((sum, tx) => sum + tx.amount, 0))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(transactions.reduce((sum, tx) => sum + tx.commission_earned, 0))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {transactions.length > 0
                  ? (
                    (transactions.filter(tx => tx.status === 'success').length /
                      transactions.length) *
                    100
                  ).toFixed(1)
                  : '0'}
                %
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminReloadlyTransactions;

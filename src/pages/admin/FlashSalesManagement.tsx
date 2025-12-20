import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Clock, TrendingUp, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { FlashSalesService, FlashSale, FlashSaleWithCountdown } from '@/services/flashSalesService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface FormData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscount: number;
  minOrderAmount: number;
  maxUsagePerUser: number;
  totalBudget: number;
}

export default function FlashSalesManagement() {
  const [flashSales, setFlashSales] = useState<FlashSaleWithCountdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'scheduled' | 'ended'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    discountType: 'percentage',
    discountValue: 0,
    maxDiscount: 0,
    minOrderAmount: 0,
    maxUsagePerUser: 0,
    totalBudget: 0,
  });

  useEffect(() => {
    loadFlashSales();
    const interval = setInterval(loadFlashSales, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadFlashSales = async () => {
    try {
      setLoading(true);
      const sales = await FlashSalesService.getAllFlashSales();
      setFlashSales(sales);
    } catch (error) {
      console.error('Error loading flash sales:', error);
      toast.error('Failed to load flash sales');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (sale?: FlashSaleWithCountdown) => {
    if (sale) {
      setEditingId(sale.id);
      setFormData({
        title: sale.title,
        description: sale.description || '',
        startDate: sale.startDate.split('T')[0],
        endDate: sale.endDate.split('T')[0],
        discountType: sale.discountType,
        discountValue: sale.discountValue,
        maxDiscount: sale.maxDiscount || 0,
        minOrderAmount: sale.minOrderAmount || 0,
        maxUsagePerUser: sale.maxUsagePerUser || 0,
        totalBudget: sale.totalBudget || 0,
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        discountType: 'percentage',
        discountValue: 0,
        maxDiscount: 0,
        minOrderAmount: 0,
        maxUsagePerUser: 0,
        totalBudget: 0,
      });
    }
    setShowDialog(true);
  };

  const handleSaveFlashSale = async () => {
    try {
      if (!formData.title || !formData.startDate || !formData.endDate) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        toast.error('End date must be after start date');
        return;
      }

      if (editingId) {
        await FlashSalesService.updateFlashSale(editingId, {
          title: formData.title,
          description: formData.description,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
          discountType: formData.discountType,
          discountValue: formData.discountValue,
          maxDiscount: formData.maxDiscount || undefined,
          minOrderAmount: formData.minOrderAmount || undefined,
          maxUsagePerUser: formData.maxUsagePerUser || undefined,
          totalBudget: formData.totalBudget || undefined,
        });
        toast.success('Flash sale updated successfully');
      } else {
        await FlashSalesService.createFlashSale({
          title: formData.title,
          description: formData.description,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
          status: 'scheduled',
          discountType: formData.discountType,
          discountValue: formData.discountValue,
          maxDiscount: formData.maxDiscount || undefined,
          minOrderAmount: formData.minOrderAmount || undefined,
          maxUsagePerUser: formData.maxUsagePerUser || undefined,
          totalBudget: formData.totalBudget || undefined,
        });
        toast.success('Flash sale created successfully');
      }

      setShowDialog(false);
      await loadFlashSales();
    } catch (error) {
      console.error('Error saving flash sale:', error);
      toast.error('Failed to save flash sale');
    }
  };

  const handleDeleteFlashSale = async (id: string) => {
    if (!confirm('Are you sure you want to delete this flash sale?')) return;

    try {
      await FlashSalesService.deleteFlashSale(id);
      toast.success('Flash sale deleted successfully');
      await loadFlashSales();
    } catch (error) {
      console.error('Error deleting flash sale:', error);
      toast.error('Failed to delete flash sale');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'ended':
        return 'bg-gray-100 text-gray-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredSales = flashSales.filter(sale => {
    const matchesTab = sale.status === activeTab;
    const matchesSearch = sale.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const formatCountdown = (timeRemaining: any) => {
    if (!timeRemaining.isActive) return 'Ended';
    if (timeRemaining.days > 0) {
      return `${timeRemaining.days}d ${timeRemaining.hours}h`;
    }
    if (timeRemaining.hours > 0) {
      return `${timeRemaining.hours}h ${timeRemaining.minutes}m`;
    }
    return `${timeRemaining.minutes}m ${timeRemaining.seconds}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Flash Sales Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage time-limited promotions</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          New Flash Sale
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Search flash sales..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-md"
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(['active', 'scheduled', 'ended'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Flash Sales Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredSales.length === 0 ? (
        <div className="text-center py-12">
          <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No flash sales found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredSales.map((sale) => (
            <div key={sale.id} className="border rounded-lg p-4 bg-card hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-foreground">{sale.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(sale.status)}`}>
                      {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                    </span>
                  </div>
                  {sale.description && (
                    <p className="text-sm text-muted-foreground mb-2">{sale.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenDialog(sale)}
                    className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-foreground" />
                  </button>
                  <button
                    onClick={() => handleDeleteFlashSale(sale.id)}
                    className="p-2 hover:bg-red-100 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>

              {/* Sale Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pb-4 border-b">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Discount</p>
                  <p className="font-semibold text-foreground">
                    {sale.discountValue}{sale.discountType === 'percentage' ? '%' : '$'}
                  </p>
                  {sale.maxDiscount && (
                    <p className="text-xs text-muted-foreground">Max: ${sale.maxDiscount}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Min Order</p>
                  <p className="font-semibold text-foreground">
                    ${sale.minOrderAmount || '0'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Time Remaining</p>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-primary" />
                    <p className="font-semibold text-foreground">
                      {formatCountdown(sale.timeRemaining)}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Budget Used</p>
                  <p className="font-semibold text-foreground">
                    {sale.totalBudget
                      ? `$${sale.currentSpent}/$${sale.totalBudget}`
                      : 'Unlimited'}
                  </p>
                </div>
              </div>

              {/* Dates */}
              <div className="text-xs text-muted-foreground flex justify-between">
                <span>Start: {new Date(sale.startDate).toLocaleString()}</span>
                <span>End: {new Date(sale.endDate).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Flash Sale' : 'Create Flash Sale'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Weekend Super Sale"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Discount Type</label>
                <Select value={formData.discountType} onValueChange={(val: any) => setFormData({ ...formData, discountType: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Discount Value</label>
                <Input
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) })}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Max Discount (Optional)</label>
              <Input
                type="number"
                value={formData.maxDiscount}
                onChange={(e) => setFormData({ ...formData, maxDiscount: parseFloat(e.target.value) })}
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Min Order Amount (Optional)</label>
              <Input
                type="number"
                value={formData.minOrderAmount}
                onChange={(e) => setFormData({ ...formData, minOrderAmount: parseFloat(e.target.value) })}
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Total Budget (Optional)</label>
              <Input
                type="number"
                value={formData.totalBudget}
                onChange={(e) => setFormData({ ...formData, totalBudget: parseFloat(e.target.value) })}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveFlashSale}>
              {editingId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

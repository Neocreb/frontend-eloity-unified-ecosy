import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Copy, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { FlashSalesService, StoreCoupon } from '@/services/flashSalesService';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CouponFormData {
  code: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscount: number;
  minOrderAmount: number;
  maxUsagePerUser: number;
  totalUsageLimit: number;
  validFrom: string;
  validUntil: string;
}

export default function PromotionalCodesManagement() {
  const [coupons, setCoupons] = useState<StoreCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [formData, setFormData] = useState<CouponFormData>({
    code: '',
    title: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    maxDiscount: 0,
    minOrderAmount: 0,
    maxUsagePerUser: 0,
    totalUsageLimit: 0,
    validFrom: '',
    validUntil: '',
  });

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const allCoupons = await FlashSalesService.getAllStoreCoupons();
      setCoupons(allCoupons);
    } catch (error) {
      console.error('Error loading coupons:', error);
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (coupon?: StoreCoupon) => {
    if (coupon) {
      setEditingId(coupon.id);
      setFormData({
        code: coupon.code,
        title: coupon.title,
        description: coupon.description || '',
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscount: coupon.maxDiscount || 0,
        minOrderAmount: coupon.minOrderAmount || 0,
        maxUsagePerUser: coupon.maxUsagePerUser || 0,
        totalUsageLimit: coupon.totalUsageLimit || 0,
        validFrom: coupon.validFrom.split('T')[0],
        validUntil: coupon.validUntil.split('T')[0],
      });
    } else {
      setEditingId(null);
      setFormData({
        code: '',
        title: '',
        description: '',
        discountType: 'percentage',
        discountValue: 0,
        maxDiscount: 0,
        minOrderAmount: 0,
        maxUsagePerUser: 0,
        totalUsageLimit: 0,
        validFrom: '',
        validUntil: '',
      });
    }
    setShowDialog(true);
  };

  const handleSaveCoupon = async () => {
    try {
      if (!formData.code || !formData.title) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (new Date(formData.validFrom) >= new Date(formData.validUntil)) {
        toast.error('Expiry date must be after valid from date');
        return;
      }

      if (editingId) {
        await FlashSalesService.updateStoreCoupon(editingId, {
          code: formData.code,
          title: formData.title,
          description: formData.description,
          discountType: formData.discountType,
          discountValue: formData.discountValue,
          maxDiscount: formData.maxDiscount || undefined,
          minOrderAmount: formData.minOrderAmount || undefined,
          maxUsagePerUser: formData.maxUsagePerUser || undefined,
          totalUsageLimit: formData.totalUsageLimit || undefined,
          validFrom: new Date(formData.validFrom).toISOString(),
          validUntil: new Date(formData.validUntil).toISOString(),
        });
        toast.success('Coupon updated successfully');
      } else {
        await FlashSalesService.createStoreCoupon({
          code: formData.code,
          title: formData.title,
          description: formData.description,
          discountType: formData.discountType,
          discountValue: formData.discountValue,
          maxDiscount: formData.maxDiscount || undefined,
          minOrderAmount: formData.minOrderAmount || undefined,
          maxUsagePerUser: formData.maxUsagePerUser || undefined,
          totalUsageLimit: formData.totalUsageLimit || undefined,
          validFrom: new Date(formData.validFrom).toISOString(),
          validUntil: new Date(formData.validUntil).toISOString(),
          active: true,
        });
        toast.success('Coupon created successfully');
      }

      setShowDialog(false);
      await loadCoupons();
    } catch (error) {
      console.error('Error saving coupon:', error);
      toast.error('Failed to save coupon');
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      await FlashSalesService.deleteStoreCoupon(id);
      toast.success('Coupon deleted successfully');
      await loadCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error('Failed to delete coupon');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const isExpired = (date: string) => new Date(date) < new Date();
  const isActive = (validFrom: string, validUntil: string) => {
    const now = new Date();
    return new Date(validFrom) <= now && now <= new Date(validUntil);
  };

  const filteredCoupons = coupons.filter(coupon =>
    coupon.code.includes(searchQuery.toUpperCase()) ||
    coupon.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCoupons = filteredCoupons.filter(c => isActive(c.validFrom, c.validUntil) && c.active);
  const inactiveCoupons = filteredCoupons.filter(c => !isActive(c.validFrom, c.validUntil) || !c.active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Promotional Codes</h1>
          <p className="text-muted-foreground mt-1">Manage store coupons and discount codes</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          New Coupon
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Search by code or title..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-md"
      />

      {/* Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">
            Active ({activeCoupons.length})
          </TabsTrigger>
          <TabsTrigger value="inactive">
            Inactive ({inactiveCoupons.length})
          </TabsTrigger>
        </TabsList>

        {/* Active Coupons */}
        <TabsContent value="active" className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : activeCoupons.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No active coupons</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {activeCoupons.map((coupon) => (
                <CouponCard
                  key={coupon.id}
                  coupon={coupon}
                  onEdit={() => handleOpenDialog(coupon)}
                  onDelete={() => handleDeleteCoupon(coupon.id)}
                  onCopy={() => handleCopyCode(coupon.code)}
                  copied={copiedCode === coupon.code}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Inactive Coupons */}
        <TabsContent value="inactive" className="space-y-4">
          {inactiveCoupons.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No inactive coupons</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {inactiveCoupons.map((coupon) => (
                <CouponCard
                  key={coupon.id}
                  coupon={coupon}
                  onEdit={() => handleOpenDialog(coupon)}
                  onDelete={() => handleDeleteCoupon(coupon.id)}
                  onCopy={() => handleCopyCode(coupon.code)}
                  copied={copiedCode === coupon.code}
                  disabled={isExpired(coupon.validUntil)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Coupon' : 'Create Coupon'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Code</label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g., SUMMER20"
                disabled={!!editingId}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Summer Sale 20% Off"
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
                <label className="block text-sm font-medium mb-1">Value</label>
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
              <label className="block text-sm font-medium mb-1">Max Uses Per User (Optional)</label>
              <Input
                type="number"
                value={formData.maxUsagePerUser}
                onChange={(e) => setFormData({ ...formData, maxUsagePerUser: parseInt(e.target.value) })}
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Total Usage Limit (Optional)</label>
              <Input
                type="number"
                value={formData.totalUsageLimit}
                onChange={(e) => setFormData({ ...formData, totalUsageLimit: parseInt(e.target.value) })}
                placeholder="0"
                min="0"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Valid From</label>
                <Input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Valid Until</label>
                <Input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCoupon}>
              {editingId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface CouponCardProps {
  coupon: StoreCoupon;
  onEdit: () => void;
  onDelete: () => void;
  onCopy: () => void;
  copied: boolean;
  disabled?: boolean;
}

function CouponCard({ coupon, onEdit, onDelete, onCopy, copied, disabled }: CouponCardProps) {
  const isActive = new Date(coupon.validFrom) <= new Date() && new Date() <= new Date(coupon.validUntil);

  return (
    <div className={`border rounded-lg p-4 bg-card ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <code className="text-lg font-bold text-primary bg-primary/10 px-2 py-1 rounded">
              {coupon.code}
            </code>
            <button
              onClick={onCopy}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>
          <h3 className="font-semibold text-foreground">{coupon.title}</h3>
          {coupon.description && (
            <p className="text-sm text-muted-foreground">{coupon.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={onEdit} className="p-2 hover:bg-gray-100 rounded transition-colors">
            <Edit2 className="w-4 h-4 text-foreground" />
          </button>
          <button onClick={onDelete} className="p-2 hover:bg-red-100 rounded transition-colors">
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Discount</p>
          <p className="font-semibold text-foreground">
            {coupon.discountValue}{coupon.discountType === 'percentage' ? '%' : '$'}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Min Order</p>
          <p className="font-semibold text-foreground">
            {coupon.minOrderAmount ? `$${coupon.minOrderAmount}` : '-'}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Usage</p>
          <p className="font-semibold text-foreground">
            {coupon.currentUsage || 0}/{coupon.totalUsageLimit || '∞'}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Valid Until</p>
          <p className="font-semibold text-foreground">
            {new Date(coupon.validUntil).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t flex items-center justify-between">
        <span className={`text-xs font-medium px-2 py-1 rounded ${
          isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import {
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface CommissionSetting {
  id: string;
  service_type: string;
  operator_id: number | null;
  commission_type: 'percentage' | 'fixed_amount' | 'none';
  commission_value: number;
  min_amount?: number;
  max_amount?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const AdminReloadlyCommission = () => {
  const { toast } = useToast();
  const { session } = useAuth();
  const [settings, setSettings] = useState<CommissionSetting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterService, setFilterService] = useState('all');
  const [filterActive, setFilterActive] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    service_type: 'airtime',
    operator_id: '',
    commission_type: 'percentage',
    commission_value: '',
    min_amount: '',
    max_amount: '',
    is_active: true,
  });

  const serviceTypes = ['airtime', 'data', 'utilities', 'gift_cards'];
  const commissionTypes = ['percentage', 'fixed_amount', 'none'];

  // Fetch commission settings
  const fetchSettings = async () => {
    if (!session?.access_token) return;

    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filterService !== 'all') params.append('serviceType', filterService);
      if (filterActive !== 'all') params.append('isActive', filterActive === 'true' ? 'true' : 'false');

      const response = await fetch(`/api/commission/settings?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        const errorMsg = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
        console.error('Commission API Error Details:', { status: response.status, statusText: response.statusText, body: errorText });
        throw new Error(errorMsg);
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setSettings(data.data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch commission settings',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch settings',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create or update setting
  const handleSave = async () => {
    if (!session?.access_token) return;
    if (!formData.service_type || !formData.commission_type || !formData.commission_value) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        service_type: formData.service_type,
        operator_id: formData.operator_id ? parseInt(formData.operator_id) : null,
        commission_type: formData.commission_type,
        commission_value: parseFloat(formData.commission_value),
        min_amount: formData.min_amount ? parseFloat(formData.min_amount) : undefined,
        max_amount: formData.max_amount ? parseFloat(formData.max_amount) : undefined,
        is_active: formData.is_active,
      };

      const url = editingId ? `/api/commission/settings/${editingId}` : '/api/commission/settings';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: editingId ? 'Commission setting updated' : 'Commission setting created',
          variant: 'default'
        });
        resetForm();
        fetchSettings();
      }
    } catch (error) {
      console.error('Error saving setting:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save setting',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete setting
  const handleDelete = async (id: string) => {
    if (!session?.access_token) return;
    if (!window.confirm('Are you sure you want to delete this commission setting?')) return;

    try {
      const response = await fetch(`/api/commission/settings/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      toast({
        title: 'Success',
        description: 'Commission setting deleted',
        variant: 'default'
      });
      fetchSettings();
    } catch (error) {
      console.error('Error deleting setting:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete setting',
        variant: 'destructive'
      });
    }
  };

  // Edit setting
  const handleEdit = (setting: CommissionSetting) => {
    setEditingId(setting.id);
    setFormData({
      service_type: setting.service_type,
      operator_id: setting.operator_id?.toString() || '',
      commission_type: setting.commission_type,
      commission_value: setting.commission_value.toString(),
      min_amount: setting.min_amount?.toString() || '',
      max_amount: setting.max_amount?.toString() || '',
      is_active: setting.is_active,
    });
    setShowForm(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      service_type: 'airtime',
      operator_id: '',
      commission_type: 'percentage',
      commission_value: '',
      min_amount: '',
      max_amount: '',
      is_active: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  // Load settings on mount and filter changes
  useEffect(() => {
    if (session?.access_token) {
      fetchSettings();
    }
  }, [session?.access_token, filterService, filterActive]);

  const filteredSettings = settings.filter(setting => {
    const serviceMatch = filterService === 'all' || setting.service_type === filterService;
    const activeMatch = filterActive === 'all' || (filterActive === 'true' ? setting.is_active : !setting.is_active);
    return serviceMatch && activeMatch;
  });

  const getCommissionDisplay = (setting: CommissionSetting) => {
    if (setting.commission_type === 'none') return 'No Commission';
    if (setting.commission_type === 'percentage') return `${setting.commission_value}%`;
    return `${setting.commission_value.toFixed(2)}`;
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge>
    ) : (
      <Badge variant="outline" className="bg-gray-50 text-gray-700">Inactive</Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <DollarSign className="w-8 h-8" />
            Commission Settings
          </h1>
          <p className="text-gray-600 mt-1">Manage commission rules for RELOADLY services</p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={showForm} className="gap-2">
          <Plus className="w-4 h-4" />
          New Commission
        </Button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{editingId ? 'Edit Commission' : 'Create New Commission'}</CardTitle>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Service Type */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Service Type *</label>
                <Select value={formData.service_type} onValueChange={(value) => setFormData({ ...formData, service_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map(type => (
                      <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Commission Type */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Commission Type *</label>
                <Select value={formData.commission_type} onValueChange={(value) => setFormData({ ...formData, commission_type: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {commissionTypes.map(type => (
                      <SelectItem key={type} value={type}>{type.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Commission Value */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Commission Value {formData.commission_type === 'percentage' ? '(%)' : '(Amount)'}  *
                </label>
                <Input
                  type="number"
                  step={formData.commission_type === 'percentage' ? '0.01' : '1'}
                  placeholder="0.00"
                  value={formData.commission_value}
                  onChange={(e) => setFormData({ ...formData, commission_value: e.target.value })}
                />
              </div>

              {/* Operator ID (Optional) */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Operator ID (Optional)</label>
                <Input
                  type="number"
                  placeholder="Leave empty for global"
                  value={formData.operator_id}
                  onChange={(e) => setFormData({ ...formData, operator_id: e.target.value })}
                />
              </div>

              {/* Min Amount */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Min Amount (Optional)</label>
                <Input
                  type="number"
                  placeholder="No minimum"
                  value={formData.min_amount}
                  onChange={(e) => setFormData({ ...formData, min_amount: e.target.value })}
                />
              </div>

              {/* Max Amount */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Max Amount (Optional)</label>
                <Input
                  type="number"
                  placeholder="No maximum"
                  value={formData.max_amount}
                  onChange={(e) => setFormData({ ...formData, max_amount: e.target.value })}
                />
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="is_active" className="text-sm font-medium">Active</label>
            </div>

            {/* Form Actions */}
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                {isSaving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </Button>
              <Button variant="outline" onClick={resetForm} disabled={isSaving}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
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
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Status</label>
            <Select value={filterActive} onValueChange={setFilterActive}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={fetchSettings} variant="outline" disabled={isLoading} className="gap-2">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Settings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Rules</CardTitle>
          <CardDescription>Showing {filteredSettings.length} settings</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSettings.length === 0 ? (
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>No commission settings found. Create one to get started.</AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium">Service</th>
                    <th className="text-left py-3 px-4 font-medium">Operator ID</th>
                    <th className="text-left py-3 px-4 font-medium">Type</th>
                    <th className="text-left py-3 px-4 font-medium">Value</th>
                    <th className="text-left py-3 px-4 font-medium">Range</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSettings.map(setting => (
                    <tr key={setting.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Badge variant="outline">{setting.service_type}</Badge>
                      </td>
                      <td className="py-3 px-4 text-sm">{setting.operator_id ? setting.operator_id : 'Global'}</td>
                      <td className="py-3 px-4 text-sm">{setting.commission_type.replace('_', ' ')}</td>
                      <td className="py-3 px-4 font-semibold text-green-600">{getCommissionDisplay(setting)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {setting.min_amount || setting.max_amount ? (
                          <>
                            {setting.min_amount && `Min: ${setting.min_amount.toFixed(2)}`}
                            {setting.min_amount && setting.max_amount && ' - '}
                            {setting.max_amount && `Max: ${setting.max_amount.toFixed(2)}`}
                          </>
                        ) : (
                          'No limits'
                        )}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(setting.is_active)}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(setting)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(setting.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredSettings.length}</div>
            <p className="text-xs text-gray-600 mt-1">Commission rules configured</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{filteredSettings.filter(s => s.is_active).length}</div>
            <p className="text-xs text-gray-600 mt-1">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Operator-Specific</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{filteredSettings.filter(s => s.operator_id).length}</div>
            <p className="text-xs text-gray-600 mt-1">Custom operator rules</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminReloadlyCommission;

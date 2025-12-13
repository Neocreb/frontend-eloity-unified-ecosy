import React, { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';

interface Comparison {
  id: string;
  feature_name: string;
  category: string;
  eloity_has: boolean;
  feature_description?: string;
  competitors?: Record<string, boolean>;
  is_active: boolean;
  order: number;
}

export const AdminLandingComparison: React.FC = () => {
  const { toast } = useToast();
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    feature_name: '',
    category: 'social',
    eloity_has: true,
    feature_description: '',
    competitors: '{}',
    is_active: true,
    order: 0,
  });

  useEffect(() => {
    loadComparisons();
  }, []);

  const loadComparisons = async () => {
    try {
      const response = await fetch('/api/admin/landing/comparison');
      if (!response.ok) throw new Error('Failed to load comparisons');
      const data = await response.json();
      setComparisons(data);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load comparisons',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const url = editingId
        ? `/api/admin/landing/comparison/${editingId}`
        : '/api/admin/landing/comparison';
      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          competitors: JSON.parse(formData.competitors),
          order: Number(formData.order),
        }),
      });

      if (!response.ok) throw new Error('Failed to save');

      toast({
        title: 'Success',
        description: editingId ? 'Comparison updated' : 'Comparison created',
      });

      setShowDialog(false);
      resetForm();
      loadComparisons();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save comparison',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this comparison?')) return;

    try {
      const response = await fetch(`/api/admin/landing/comparison/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      toast({ title: 'Success', description: 'Comparison deleted' });
      loadComparisons();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (comparison: Comparison) => {
    setEditingId(comparison.id);
    setFormData({
      feature_name: comparison.feature_name,
      category: comparison.category,
      eloity_has: comparison.eloity_has,
      feature_description: comparison.feature_description || '',
      competitors: JSON.stringify(comparison.competitors || {}),
      is_active: comparison.is_active,
      order: comparison.order,
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      feature_name: '',
      category: 'social',
      eloity_has: true,
      feature_description: '',
      competitors: '{}',
      is_active: true,
      order: 0,
    });
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    resetForm();
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Feature Comparison</h1>
          <p className="text-muted-foreground mt-2">
            Manage Eloity vs competitors feature comparison
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Comparison
        </Button>
      </div>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-md max-h-96 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Comparison' : 'Add Comparison'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Feature Name"
              value={formData.feature_name}
              onChange={(e) =>
                setFormData({ ...formData, feature_name: e.target.value })
              }
            />
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="commerce">Commerce</SelectItem>
                <SelectItem value="crypto">Crypto</SelectItem>
                <SelectItem value="freelance">Freelance</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Feature Description"
              value={formData.feature_description}
              onChange={(e) =>
                setFormData({ ...formData, feature_description: e.target.value })
              }
              rows={3}
            />
            <Input
              placeholder={'Competitors JSON (e.g., {"TikTok":true,"Instagram":false})'}
              value={formData.competitors}
              onChange={(e) =>
                setFormData({ ...formData, competitors: e.target.value })
              }
            />
            <Input
              type="number"
              placeholder="Display Order"
              value={formData.order}
              onChange={(e) =>
                setFormData({ ...formData, order: Number(e.target.value) })
              }
            />
            <div className="flex gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.eloity_has}
                  onChange={(e) =>
                    setFormData({ ...formData, eloity_has: e.target.checked })
                  }
                />
                Eloity Has Feature
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                />
                Active
              </label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit} className="flex-1">
                {editingId ? 'Update' : 'Create'}
              </Button>
              <Button
                variant="outline"
                onClick={handleCloseDialog}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* List */}
      <div className="grid gap-4">
        {comparisons.map((comparison) => (
          <Card key={comparison.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{comparison.feature_name}</h3>
                    {comparison.is_active ? (
                      <Badge>Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {comparison.category} • {comparison.eloity_has ? 'Has' : 'Missing'} feature
                  </p>
                  {comparison.feature_description && (
                    <p className="text-sm mt-2">{comparison.feature_description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(comparison)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(comparison.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {comparisons.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No comparisons yet. Create one to get started!
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminLandingComparison;

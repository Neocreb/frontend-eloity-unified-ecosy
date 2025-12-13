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
import { Plus, Edit2, Trash2 } from 'lucide-react';

interface UseCase {
  id: string;
  user_type: string;
  title: string;
  description: string;
  avatar_url?: string;
  results?: Record<string, string | number>;
  timeline_weeks?: number;
  image_url?: string;
  is_featured: boolean;
  order: number;
}

export const AdminLandingUseCases: React.FC = () => {
  const { toast } = useToast();
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    user_type: 'creator',
    title: '',
    description: '',
    avatar_url: '',
    results: '{}',
    timeline_weeks: '',
    image_url: '',
    is_featured: true,
    order: 0,
  });

  useEffect(() => {
    loadUseCases();
  }, []);

  const loadUseCases = async () => {
    try {
      const response = await fetch('/api/admin/landing/use-cases');
      if (!response.ok) throw new Error('Failed to load use cases');
      const data = await response.json();
      setUseCases(data);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load use cases',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const url = editingId ? `/api/admin/landing/use-cases/${editingId}` : '/api/admin/landing/use-cases';
      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          results: JSON.parse(formData.results),
          timeline_weeks: formData.timeline_weeks ? Number(formData.timeline_weeks) : undefined,
          order: Number(formData.order),
        }),
      });

      if (!response.ok) throw new Error('Failed to save');

      toast({
        title: 'Success',
        description: editingId ? 'Use case updated' : 'Use case created',
      });

      setShowDialog(false);
      resetForm();
      loadUseCases();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save use case',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this use case?')) return;

    try {
      const response = await fetch(`/api/admin/landing/use-cases/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      toast({ title: 'Success', description: 'Use case deleted' });
      loadUseCases();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (useCase: UseCase) => {
    setEditingId(useCase.id);
    setFormData({
      user_type: useCase.user_type,
      title: useCase.title,
      description: useCase.description,
      avatar_url: useCase.avatar_url || '',
      results: JSON.stringify(useCase.results || {}),
      timeline_weeks: useCase.timeline_weeks?.toString() || '',
      image_url: useCase.image_url || '',
      is_featured: useCase.is_featured,
      order: useCase.order,
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      user_type: 'creator',
      title: '',
      description: '',
      avatar_url: '',
      results: '{}',
      timeline_weeks: '',
      image_url: '',
      is_featured: true,
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
          <h1 className="text-3xl font-bold">Use Cases</h1>
          <p className="text-muted-foreground mt-2">
            Manage customer success stories
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Use Case
        </Button>
      </div>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-md max-h-96 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Use Case' : 'Add Use Case'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Select
              value={formData.user_type}
              onValueChange={(value) =>
                setFormData({ ...formData, user_type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="creator">Creator</SelectItem>
                <SelectItem value="freelancer">Freelancer</SelectItem>
                <SelectItem value="trader">Trader</SelectItem>
                <SelectItem value="merchant">Merchant</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
            <Textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
            />
            <Input
              placeholder="Avatar URL"
              value={formData.avatar_url}
              onChange={(e) =>
                setFormData({ ...formData, avatar_url: e.target.value })
              }
            />
            <Input
              placeholder="Image URL"
              value={formData.image_url}
              onChange={(e) =>
                setFormData({ ...formData, image_url: e.target.value })
              }
            />
            <Input
              type="number"
              placeholder="Timeline (weeks)"
              value={formData.timeline_weeks}
              onChange={(e) =>
                setFormData({ ...formData, timeline_weeks: e.target.value })
              }
            />
            <Input
              placeholder={'Results JSON (e.g., {"followers":"50000","revenue":"$12000"})'}
              value={formData.results}
              onChange={(e) =>
                setFormData({ ...formData, results: e.target.value })
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
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) =>
                  setFormData({ ...formData, is_featured: e.target.checked })
                }
              />
              Featured
            </label>
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
        {useCases.map((useCase) => (
          <Card key={useCase.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{useCase.title}</h3>
                    {useCase.is_featured && <Badge>Featured</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {useCase.user_type} • {useCase.timeline_weeks} weeks
                  </p>
                  <p className="text-sm mt-2">{useCase.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(useCase)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(useCase.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {useCases.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No use cases yet. Create one to get started!
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminLandingUseCases;

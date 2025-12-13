import React, { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit2, Trash2, Star } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  title: string;
  quote: string;
  image_url?: string;
  category: string;
  rating: number;
  is_verified: boolean;
  is_featured: boolean;
  metrics?: Record<string, string>;
  order: number;
}

export const AdminLandingTestimonials: React.FC = () => {
  const { toast } = useToast();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    quote: '',
    image_url: '',
    category: 'general',
    rating: 5,
    is_verified: false,
    is_featured: true,
    metrics: '{}',
    order: 0,
  });

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    try {
      const response = await fetch('/api/admin/landing/testimonials');
      if (!response.ok) throw new Error('Failed to load testimonials');
      const data = await response.json();
      setTestimonials(data);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load testimonials',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const url = editingId
        ? `/api/admin/landing/testimonials/${editingId}`
        : '/api/admin/landing/testimonials';

      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          metrics: JSON.parse(formData.metrics),
          rating: Number(formData.rating),
          order: Number(formData.order),
        }),
      });

      if (!response.ok) throw new Error('Failed to save');

      toast({
        title: 'Success',
        description: editingId ? 'Testimonial updated' : 'Testimonial created',
      });

      setShowDialog(false);
      setEditingId(null);
      resetForm();
      loadTestimonials();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save testimonial',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this testimonial?')) return;

    try {
      const response = await fetch(`/api/admin/landing/testimonials/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      toast({ title: 'Success', description: 'Testimonial deleted' });
      loadTestimonials();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (testimonial: Testimonial) => {
    setEditingId(testimonial.id);
    setFormData({
      name: testimonial.name,
      title: testimonial.title,
      quote: testimonial.quote,
      image_url: testimonial.image_url || '',
      category: testimonial.category,
      rating: testimonial.rating,
      is_verified: testimonial.is_verified,
      is_featured: testimonial.is_featured,
      metrics: JSON.stringify(testimonial.metrics || {}),
      order: testimonial.order,
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      title: '',
      quote: '',
      image_url: '',
      category: 'general',
      rating: 5,
      is_verified: false,
      is_featured: true,
      metrics: '{}',
      order: 0,
    });
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingId(null);
    resetForm();
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Testimonials</h1>
          <p className="text-muted-foreground mt-2">
            Manage user testimonials and success stories
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Testimonial
        </Button>
      </div>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Testimonial' : 'Add Testimonial'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
            <Input
              placeholder="Job Title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
            <Textarea
              placeholder="Testimonial Quote"
              value={formData.quote}
              onChange={(e) =>
                setFormData({ ...formData, quote: e.target.value })
              }
              rows={4}
            />
            <Input
              placeholder="Image URL"
              value={formData.image_url}
              onChange={(e) =>
                setFormData({ ...formData, image_url: e.target.value })
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
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="creator">Creator</SelectItem>
                <SelectItem value="freelancer">Freelancer</SelectItem>
                <SelectItem value="trader">Trader</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Rating (1-5)"
              min={1}
              max={5}
              value={formData.rating}
              onChange={(e) =>
                setFormData({ ...formData, rating: Number(e.target.value) })
              }
            />
            <Input
              placeholder={"Metrics JSON (e.g., {\"earnings_increased\":\"450%\"})"}
              value={formData.metrics}
              onChange={(e) =>
                setFormData({ ...formData, metrics: e.target.value })
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
                  checked={formData.is_featured}
                  onChange={(e) =>
                    setFormData({ ...formData, is_featured: e.target.checked })
                  }
                />
                Featured
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_verified}
                  onChange={(e) =>
                    setFormData({ ...formData, is_verified: e.target.checked })
                  }
                />
                Verified
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
        {testimonials.map((testimonial) => (
          <Card key={testimonial.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg">{testimonial.name}</h3>
                    {testimonial.is_featured && (
                      <Badge>Featured</Badge>
                    )}
                    {testimonial.is_verified && (
                      <Badge variant="outline">Verified</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.title}
                  </p>
                  <p className="text-sm mt-2">{testimonial.quote}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(testimonial)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(testimonial.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {testimonials.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No testimonials yet. Create one to get started!
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminLandingTestimonials;

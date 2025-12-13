import React, { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit2 } from 'lucide-react';

interface Stat {
  id: string;
  metric_name: string;
  current_value: string | number;
  unit: string;
  label: string;
  icon?: string;
  display_format: string;
  order: number;
}

export const AdminLandingStats: React.FC = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/landing/stats');
      if (!response.ok) throw new Error('Failed to load stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load stats',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateValue = async (metricName: string) => {
    try {
      const response = await fetch(
        `/api/admin/landing/stats/${metricName}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ current_value: editValue }),
        }
      );

      if (!response.ok) throw new Error('Failed to update');

      toast({
        title: 'Success',
        description: 'Stat updated successfully',
      });

      setEditingId(null);
      setEditValue('');
      loadStats();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update stat',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Social Proof Statistics</h1>
        <p className="text-muted-foreground mt-2">
          Update platform statistics displayed on the landing page
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.map((stat) => (
          <Card key={stat.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <span>{stat.icon || '📊'}</span>
                    {stat.label}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    {stat.metric_name}
                  </p>
                </div>
                {editingId !== stat.metric_name && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(stat.metric_name);
                      setEditValue(stat.current_value.toString());
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editingId === stat.metric_name ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1"
                    />
                    <span className="flex items-center text-sm text-muted-foreground">
                      {stat.unit}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        handleUpdateValue(stat.metric_name)
                      }
                      className="flex-1"
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(null);
                        setEditValue('');
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-3xl font-bold text-primary">
                    {Number(stat.current_value).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {stat.unit} • Format: {stat.display_format}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {stats.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No statistics configured yet.
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminLandingStats;

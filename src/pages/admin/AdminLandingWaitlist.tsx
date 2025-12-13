import React, { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Download, Eye, Mail } from 'lucide-react';

interface WaitlistLead {
  id: string;
  email: string;
  name: string;
  user_type_interested: string;
  country?: string;
  phone?: string;
  message?: string;
  source: string;
  lead_score: number;
  is_verified: boolean;
  conversion_status: string;
  created_at: string;
}

export const AdminLandingWaitlist: React.FC = () => {
  const { toast } = useToast();
  const [leads, setLeads] = useState<WaitlistLead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<WaitlistLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState<WaitlistLead | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    loadLeads();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [leads, statusFilter]);

  const loadLeads = async () => {
    try {
      const response = await fetch('/api/admin/landing/waitlist');
      if (!response.ok) throw new Error('Failed to load leads');
      const data = await response.json();
      setLeads(data);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load waitlist leads',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterLeads = () => {
    if (statusFilter === 'all') {
      setFilteredLeads(leads);
    } else {
      setFilteredLeads(leads.filter((lead) => lead.conversion_status === statusFilter));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lead?')) return;

    try {
      const response = await fetch(`/api/admin/landing/waitlist/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      toast({ title: 'Success', description: 'Lead deleted' });
      loadLeads();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete',
        variant: 'destructive',
      });
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch('/api/admin/landing/waitlist/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: statusFilter === 'all' ? undefined : statusFilter,
          format,
        }),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `waitlist.${format === 'csv' ? 'csv' : 'json'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ title: 'Success', description: 'Export started' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Export failed',
        variant: 'destructive',
      });
    }
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Waitlist Leads</h1>
          <p className="text-muted-foreground mt-2">
            Total: {leads.length} leads
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
            disabled={leads.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('json')}
            disabled={leads.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="waitlist">Waitlist</SelectItem>
            <SelectItem value="signed_up">Signed Up</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="bounced">Bounced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-semibold">{selectedLead.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-semibold">{selectedLead.email}</p>
              </div>
              {selectedLead.phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-semibold">{selectedLead.phone}</p>
                </div>
              )}
              {selectedLead.country && (
                <div>
                  <p className="text-sm text-muted-foreground">Country</p>
                  <p className="font-semibold">{selectedLead.country}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Interested In</p>
                <p className="font-semibold capitalize">
                  {selectedLead.user_type_interested}
                </p>
              </div>
              {selectedLead.message && (
                <div>
                  <p className="text-sm text-muted-foreground">Message</p>
                  <p className="font-semibold">{selectedLead.message}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Source</p>
                <p className="font-semibold capitalize">{selectedLead.source}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lead Score</p>
                <p className="font-semibold">{selectedLead.lead_score}/100</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge>{selectedLead.conversion_status}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Joined</p>
                <p className="font-semibold">
                  {new Date(selectedLead.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* List */}
      <div className="grid gap-4">
        {filteredLeads.length > 0 ? (
          filteredLeads.map((lead) => (
            <Card key={lead.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold">{lead.name}</h3>
                      {lead.is_verified && (
                        <Badge variant="outline">Verified</Badge>
                      )}
                      <Badge>{lead.conversion_status}</Badge>
                      <Badge
                        className={getScoreBadgeColor(lead.lead_score)}
                        variant="secondary"
                      >
                        {lead.lead_score}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {lead.email}
                    </p>
                    {lead.phone && (
                      <p className="text-sm text-muted-foreground">
                        {lead.phone}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Interested in: {lead.user_type_interested} • From: {lead.source} •
                      Joined: {new Date(lead.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedLead(lead);
                        setShowDetailsDialog(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        window.location.href = `mailto:${lead.email}`
                      }
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(lead.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No leads found for the selected status.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminLandingWaitlist;

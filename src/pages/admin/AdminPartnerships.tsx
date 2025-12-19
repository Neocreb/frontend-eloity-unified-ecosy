// @ts-nocheck
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useNotification } from "@/hooks/use-notification";
import { AdminService } from "@/services/adminService";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  Handshake,
  TrendingUp,
  DollarSign,
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Filter,
  BarChart3,
  AlertTriangle,
  Building,
} from "lucide-react";

interface Partnership {
  id: string;
  name: string;
  category: string;
  description: string;
  commissionRate: number;
  status: "active" | "pending" | "inactive";
  totalEarnings: number;
  activeUsers: number;
  conversions: number;
  createdAt: string;
  updatedAt: string;
  requirements: string;
  benefits: string;
}

interface PartnershipMetrics {
  totalPartnerships: number;
  activePartnerships: number;
  totalCommissionsPaid: number;
  totalUsers: number;
  pendingApplications: number;
  monthlyGrowth: number;
}

const AdminPartnerships = () => {
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [metrics, setMetrics] = useState<PartnershipMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPartnership, setEditingPartnership] = useState<Partnership | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    commissionRate: 5,
    requirements: "",
    benefits: "",
  });

  const notification = useNotification();
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    loadPartnerships();
  }, []);

  const loadPartnerships = async () => {
    try {
      setIsLoading(true);
      const response = await AdminService.getPartnerships();
      
      if (response.success) {
        setPartnerships(response.data.partnerships || []);
        setMetrics(response.data.metrics);
      } else {
        throw new Error(response.error || "Failed to load partnerships");
      }
    } catch (error) {
      console.error("Error loading partnerships:", error);
      notification.error("Failed to load partnerships");
      setPartnerships([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPartnerships = partnerships.filter((p) => {
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleSavePartnership = async () => {
    try {
      if (!formData.name || !formData.category) {
        notification.error("Please fill in all required fields");
        return;
      }

      const payload = {
        ...formData,
        id: editingPartnership?.id,
      };

      const response = editingPartnership
        ? await AdminService.updatePartnership(editingPartnership.id, payload)
        : await AdminService.createPartnership(payload);

      if (response.success) {
        notification.success(
          editingPartnership
            ? "Partnership updated successfully"
            : "Partnership created successfully"
        );
        setShowCreateDialog(false);
        setEditingPartnership(null);
        resetForm();
        await loadPartnerships();
      } else {
        throw new Error(response.error || "Failed to save partnership");
      }
    } catch (error) {
      console.error("Error saving partnership:", error);
      notification.error("Failed to save partnership");
    }
  };

  const handleDeletePartnership = async (id: string) => {
    if (!confirm("Are you sure you want to delete this partnership?")) return;

    try {
      const response = await AdminService.deletePartnership(id);
      if (response.success) {
        notification.success("Partnership deleted successfully");
        await loadPartnerships();
      } else {
        throw new Error(response.error || "Failed to delete partnership");
      }
    } catch (error) {
      console.error("Error deleting partnership:", error);
      notification.error("Failed to delete partnership");
    }
  };

  const handleEdit = (partnership: Partnership) => {
    setEditingPartnership(partnership);
    setFormData({
      name: partnership.name,
      category: partnership.category,
      description: partnership.description,
      commissionRate: partnership.commissionRate,
      requirements: partnership.requirements,
      benefits: partnership.benefits,
    });
    setShowCreateDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      description: "",
      commissionRate: 5,
      requirements: "",
      benefits: "",
    });
  };

  const handleCloseDialog = () => {
    setShowCreateDialog(false);
    setEditingPartnership(null);
    resetForm();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-20 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Partnerships</h1>
          <p className="text-gray-600 mt-1">Manage affiliate and partnership programs</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => {
                setEditingPartnership(null);
                resetForm();
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Partnership
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPartnership ? "Edit Partnership" : "Create Partnership"}
              </DialogTitle>
              <DialogDescription>
                {editingPartnership
                  ? "Update partnership details"
                  : "Create a new partnership offer"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <Label>Partnership Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Crypto Exchange"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Input
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="e.g., Finance, Education"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Partnership description"
                  rows={3}
                />
              </div>
              <div>
                <Label>Commission Rate (%)</Label>
                <Input
                  type="number"
                  value={formData.commissionRate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      commissionRate: parseFloat(e.target.value),
                    })
                  }
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <Label>Requirements</Label>
                <Textarea
                  value={formData.requirements}
                  onChange={(e) =>
                    setFormData({ ...formData, requirements: e.target.value })
                  }
                  placeholder="e.g., Minimum followers, engagement rate"
                  rows={2}
                />
              </div>
              <div>
                <Label>Benefits</Label>
                <Textarea
                  value={formData.benefits}
                  onChange={(e) =>
                    setFormData({ ...formData, benefits: e.target.value })
                  }
                  placeholder="e.g., Commission, exclusive features"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCloseDialog}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                onClick={handleSavePartnership}
              >
                {editingPartnership ? "Update" : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Partnerships</CardTitle>
              <Building className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalPartnerships}</div>
              <p className="text-xs text-gray-600 mt-1">
                {metrics.activePartnerships} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(metrics.totalCommissionsPaid)}
              </div>
              <p className="text-xs text-gray-600 mt-1">Paid out</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalUsers}</div>
              <p className="text-xs text-gray-600 mt-1">In partnerships</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.pendingApplications}</div>
              <p className="text-xs text-gray-600 mt-1">Applications</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <Input
            placeholder="Search partnerships..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="max-w-xs">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Partnerships Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Partnerships</CardTitle>
          <CardDescription>
            {filteredPartnerships.length} partnership(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Conversions</TableHead>
                  <TableHead>Earnings</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPartnerships.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                      No partnerships found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPartnerships.map((partnership) => (
                    <TableRow key={partnership.id}>
                      <TableCell className="font-medium">{partnership.name}</TableCell>
                      <TableCell>{partnership.category}</TableCell>
                      <TableCell>{partnership.commissionRate}%</TableCell>
                      <TableCell>{partnership.activeUsers}</TableCell>
                      <TableCell>{partnership.conversions}</TableCell>
                      <TableCell>{formatCurrency(partnership.totalEarnings)}</TableCell>
                      <TableCell>{getStatusBadge(partnership.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(partnership)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePartnership(partnership.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPartnerships;

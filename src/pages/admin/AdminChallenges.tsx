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
  Trophy,
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
  Zap,
} from "lucide-react";

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: "daily" | "weekly" | "monthly" | "seasonal";
  status: "active" | "draft" | "scheduled" | "ended";
  rewardAmount: number;
  rewardType: "elo_points" | "cash" | "badge" | "mixed";
  participantCount: number;
  completionRate: number;
  startDate: string;
  endDate: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  requirements: string;
  createdAt: string;
  updatedAt: string;
}

interface ChallengeMetrics {
  totalChallenges: number;
  activeChallenges: number;
  totalParticipants: number;
  totalRewardsPaid: number;
  avgCompletionRate: number;
  engagementRate: number;
}

const AdminChallenges = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [metrics, setMetrics] = useState<ChallengeMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "weekly" as const,
    rewardAmount: 100,
    rewardType: "elo_points" as const,
    difficulty: "medium" as const,
    category: "",
    requirements: "",
    startDate: "",
    endDate: "",
  });

  const notification = useNotification();
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      setIsLoading(true);
      const response = await AdminService.getChallenges();
      
      if (response.success) {
        setChallenges(response.data.challenges || []);
        setMetrics(response.data.metrics);
      } else {
        throw new Error(response.error || "Failed to load challenges");
      }
    } catch (error) {
      console.error("Error loading challenges:", error);
      notification.error("Failed to load challenges");
      setChallenges([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredChallenges = challenges.filter((c) => {
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleSaveChallenge = async () => {
    try {
      if (!formData.title || !formData.category) {
        notification.error("Please fill in all required fields");
        return;
      }

      const payload = {
        ...formData,
        id: editingChallenge?.id,
      };

      const response = editingChallenge
        ? await AdminService.updateChallenge(editingChallenge.id, payload)
        : await AdminService.createChallenge(payload);

      if (response.success) {
        notification.success(
          editingChallenge
            ? "Challenge updated successfully"
            : "Challenge created successfully"
        );
        setShowCreateDialog(false);
        setEditingChallenge(null);
        resetForm();
        await loadChallenges();
      } else {
        throw new Error(response.error || "Failed to save challenge");
      }
    } catch (error) {
      console.error("Error saving challenge:", error);
      notification.error("Failed to save challenge");
    }
  };

  const handleDeleteChallenge = async (id: string) => {
    if (!confirm("Are you sure you want to delete this challenge?")) return;

    try {
      const response = await AdminService.deleteChallenge(id);
      if (response.success) {
        notification.success("Challenge deleted successfully");
        await loadChallenges();
      } else {
        throw new Error(response.error || "Failed to delete challenge");
      }
    } catch (error) {
      console.error("Error deleting challenge:", error);
      notification.error("Failed to delete challenge");
    }
  };

  const handleEdit = (challenge: Challenge) => {
    setEditingChallenge(challenge);
    setFormData({
      title: challenge.title,
      description: challenge.description,
      type: challenge.type,
      rewardAmount: challenge.rewardAmount,
      rewardType: challenge.rewardType,
      difficulty: challenge.difficulty,
      category: challenge.category,
      requirements: challenge.requirements,
      startDate: challenge.startDate,
      endDate: challenge.endDate,
    });
    setShowCreateDialog(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "weekly",
      rewardAmount: 100,
      rewardType: "elo_points",
      difficulty: "medium",
      category: "",
      requirements: "",
      startDate: "",
      endDate: "",
    });
  };

  const handleCloseDialog = () => {
    setShowCreateDialog(false);
    setEditingChallenge(null);
    resetForm();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-500">Scheduled</Badge>;
      case "draft":
        return <Badge className="bg-gray-500">Draft</Badge>;
      case "ended":
        return <Badge variant="secondary">Ended</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "text-green-600";
      case "medium":
        return "text-yellow-600";
      case "hard":
        return "text-red-600";
      default:
        return "text-gray-600";
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
          <h1 className="text-3xl font-bold text-gray-900">Challenges</h1>
          <p className="text-gray-600 mt-1">Create and manage user challenges and contests</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => {
                setEditingChallenge(null);
                resetForm();
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Challenge
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingChallenge ? "Edit Challenge" : "Create Challenge"}
              </DialogTitle>
              <DialogDescription>
                {editingChallenge
                  ? "Update challenge details"
                  : "Create a new challenge for users"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <Label>Challenge Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., Weekly Posting Challenge"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Challenge description and rules"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Challenge Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="seasonal">Seasonal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Difficulty</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, difficulty: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Reward Amount</Label>
                  <Input
                    type="number"
                    value={formData.rewardAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rewardAmount: parseFloat(e.target.value),
                      })
                    }
                    min="0"
                  />
                </div>
                <div>
                  <Label>Reward Type</Label>
                  <Select
                    value={formData.rewardType}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, rewardType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="elo_points">ELO Points</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="badge">Badge</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Category</Label>
                <Input
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="e.g., Content Creation, Community"
                />
              </div>
              <div>
                <Label>Requirements</Label>
                <Textarea
                  value={formData.requirements}
                  onChange={(e) =>
                    setFormData({ ...formData, requirements: e.target.value })
                  }
                  placeholder="What users need to do to complete the challenge"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                  />
                </div>
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
                onClick={handleSaveChallenge}
              >
                {editingChallenge ? "Update" : "Create"}
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
              <CardTitle className="text-sm font-medium">Total Challenges</CardTitle>
              <Trophy className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalChallenges}</div>
              <p className="text-xs text-gray-600 mt-1">
                {metrics.activeChallenges} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Participants</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalParticipants}</div>
              <p className="text-xs text-gray-600 mt-1">Total participants</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rewards Paid</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(metrics.totalRewardsPaid)}
              </div>
              <p className="text-xs text-gray-600 mt-1">Total payouts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.avgCompletionRate.toFixed(1)}%</div>
              <p className="text-xs text-gray-600 mt-1">Average completion</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <Input
            placeholder="Search challenges..."
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
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="ended">Ended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Challenges Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Challenges</CardTitle>
          <CardDescription>
            {filteredChallenges.length} challenge(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Reward</TableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead>Completion</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChallenges.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                      No challenges found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredChallenges.map((challenge) => (
                    <TableRow key={challenge.id}>
                      <TableCell className="font-medium">{challenge.title}</TableCell>
                      <TableCell className="capitalize">{challenge.type}</TableCell>
                      <TableCell>
                        <span className={getDifficultyColor(challenge.difficulty)}>
                          {challenge.difficulty}
                        </span>
                      </TableCell>
                      <TableCell>
                        {challenge.rewardAmount} {challenge.rewardType}
                      </TableCell>
                      <TableCell>{challenge.participantCount}</TableCell>
                      <TableCell>{challenge.completionRate.toFixed(1)}%</TableCell>
                      <TableCell>{getStatusBadge(challenge.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(challenge)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteChallenge(challenge.id)}
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

export default AdminChallenges;

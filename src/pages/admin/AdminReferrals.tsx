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
import { useNotification } from "@/hooks/use-notification";
import { AdminService } from "@/services/adminService";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  Users,
  TrendingUp,
  DollarSign,
  UserPlus,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Filter,
  BarChart3,
  AlertTriangle,
  Link2,
  Zap,
} from "lucide-react";

interface Referral {
  id: string;
  referrerId: string;
  referrerName: string;
  referrerEmail: string;
  referredUserId: string;
  referredUsername: string;
  referredEmail: string;
  status: "pending" | "converted" | "cancelled";
  referralCode: string;
  conversionDate?: string;
  rewardAmount: number;
  rewardType: string;
  createdAt: string;
}

interface ReferralMetrics {
  totalReferrals: number;
  pendingReferrals: number;
  convertedReferrals: number;
  conversionRate: number;
  totalRewardsDistributed: number;
  avgRewardPerReferral: number;
  topReferrers: Array<{
    name: string;
    referrals: number;
    conversions: number;
  }>;
}

const AdminReferrals = () => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [metrics, setMetrics] = useState<ReferralMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("overview");

  const notification = useNotification();
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    loadReferrals();
  }, []);

  const loadReferrals = async () => {
    try {
      setIsLoading(true);
      const response = await AdminService.getReferrals();
      
      if (response.success) {
        setReferrals(response.data.referrals || []);
        setMetrics(response.data.metrics);
      } else {
        throw new Error(response.error || "Failed to load referrals");
      }
    } catch (error) {
      console.error("Error loading referrals:", error);
      notification.error("Failed to load referrals");
      setReferrals([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReferrals = referrals.filter((r) => {
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const matchesSearch =
      r.referrerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.referredUsername.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.referralCode.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleApproveReferral = async (id: string) => {
    try {
      const response = await AdminService.approveReferral(id);
      if (response.success) {
        notification.success("Referral approved");
        await loadReferrals();
      } else {
        throw new Error(response.error || "Failed to approve referral");
      }
    } catch (error) {
      console.error("Error approving referral:", error);
      notification.error("Failed to approve referral");
    }
  };

  const handleRejectReferral = async (id: string) => {
    try {
      const response = await AdminService.rejectReferral(id);
      if (response.success) {
        notification.success("Referral rejected");
        await loadReferrals();
      } else {
        throw new Error(response.error || "Failed to reject referral");
      }
    } catch (error) {
      console.error("Error rejecting referral:", error);
      notification.error("Failed to reject referral");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "converted":
        return <Badge className="bg-green-500">Converted</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelled</Badge>;
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Referral Program</h1>
        <p className="text-gray-600 mt-1">Manage referrals and track program performance</p>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalReferrals}</div>
              <p className="text-xs text-gray-600 mt-1">
                {metrics.convertedReferrals} converted
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</div>
              <p className="text-xs text-gray-600 mt-1">Success rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rewards Paid</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(metrics.totalRewardsDistributed)}
              </div>
              <p className="text-xs text-gray-600 mt-1">Total distributed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.pendingReferrals}</div>
              <p className="text-xs text-gray-600 mt-1">Awaiting conversion</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="referrals">All Referrals</TabsTrigger>
          <TabsTrigger value="top-referrers">Top Referrers</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Referral Program Overview</CardTitle>
              <CardDescription>
                Key metrics and insights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Average Reward per Referral</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(metrics?.avgRewardPerReferral || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Success Rate</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(100, (metrics?.conversionRate || 0) * 10)}%`,
                      }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {metrics?.conversionRate.toFixed(1)}% conversion
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Referrals Tab */}
        <TabsContent value="referrals" className="space-y-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Input
                placeholder="Search referrals..."
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
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Referrals List</CardTitle>
              <CardDescription>
                {filteredReferrals.length} referral(s) found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Referrer</TableHead>
                      <TableHead>Referred User</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Reward</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReferrals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                          No referrals found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReferrals.map((referral) => (
                        <TableRow key={referral.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{referral.referrerName}</p>
                              <p className="text-xs text-gray-500">{referral.referrerEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{referral.referredUsername}</p>
                              <p className="text-xs text-gray-500">{referral.referredEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {referral.referralCode}
                          </TableCell>
                          <TableCell>{formatCurrency(referral.rewardAmount)}</TableCell>
                          <TableCell>{getStatusBadge(referral.status)}</TableCell>
                          <TableCell className="text-sm">
                            {new Date(referral.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {referral.status === "pending" && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600"
                                  onClick={() => handleApproveReferral(referral.id)}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600"
                                  onClick={() => handleRejectReferral(referral.id)}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Referrers Tab */}
        <TabsContent value="top-referrers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Referrers</CardTitle>
              <CardDescription>
                Users with the most successful referrals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics?.topReferrers && metrics.topReferrers.length > 0 ? (
                  metrics.topReferrers.map((referrer, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-600">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-medium">{referrer.name}</p>
                          <p className="text-xs text-gray-600">
                            {referrer.conversions}/{referrer.referrals} converted
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{referrer.conversions}</p>
                        <p className="text-xs text-gray-600">conversions</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">No referrer data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminReferrals;

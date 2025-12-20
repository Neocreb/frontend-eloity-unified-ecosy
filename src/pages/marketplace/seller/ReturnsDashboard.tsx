import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  RotateCw,
  CheckCircle,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Filter,
  Eye,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefundProcessor } from "@/components/marketplace/seller/RefundProcessor";
import { ReturnAnalytics } from "@/components/marketplace/seller/ReturnAnalytics";
import { returnsManagementService, ReturnRequest, ReturnStatus } from "@/services/returnsManagementService";
import { useToast } from "@/components/ui/use-toast";

export const ReturnsDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [filteredReturns, setFilteredReturns] = useState<ReturnRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<ReturnStatus | "all">("all");
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      navigate("/auth");
      return;
    }
    loadReturns();
  }, [user]);

  const loadReturns = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const data = await returnsManagementService.getSellerReturns(user.id);
      setReturns(data);
      filterReturns(data, selectedStatus);
    } catch (error) {
      console.error("Error loading returns:", error);
      toast({
        title: "Error",
        description: "Failed to load returns",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterReturns = (data: ReturnRequest[], status: ReturnStatus | "all") => {
    if (status === "all") {
      setFilteredReturns(data);
    } else {
      setFilteredReturns(data.filter((r) => r.status === status));
    }
  };

  const handleStatusChange = (status: ReturnStatus | "all") => {
    setSelectedStatus(status);
    filterReturns(returns, status);
  };

  const handleApprove = async (returnId: string) => {
    try {
      const success = await returnsManagementService.approveReturn(returnId);
      if (success) {
        toast({
          title: "Success",
          description: "Return approved",
        });
        loadReturns();
        setShowDetails(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve return",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (returnId: string, reason: string) => {
    try {
      const success = await returnsManagementService.rejectReturn(returnId, reason);
      if (success) {
        toast({
          title: "Success",
          description: "Return rejected",
        });
        loadReturns();
        setShowDetails(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject return",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: ReturnStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-blue-100 text-blue-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "returned_received":
        return "bg-purple-100 text-purple-800";
      case "refunded":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      defective: "Defective",
      not_as_described: "Not as Described",
      wrong_item: "Wrong Item",
      damage_shipping: "Damage in Shipping",
      changed_mind: "Changed Mind",
      other: "Other",
    };
    return labels[reason] || reason;
  };

  const stats = {
    total: returns.length,
    pending: returns.filter((r) => r.status === "pending").length,
    approved: returns.filter((r) => r.status === "approved").length,
    refunded: returns.filter((r) => r.status === "refunded").length,
    totalRefunded: returns
      .filter((r) => r.status === "refunded")
      .reduce((sum, r) => sum + r.refundAmount, 0),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Returns Management</h1>
            <p className="text-gray-600 mt-1">Handle customer return requests and process refunds</p>
          </div>
          <Button variant="outline" onClick={loadReturns}>
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <RotateCw className="w-4 h-4 text-orange-600" />
                Total Returns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.total}</p>
              <p className="text-xs text-gray-600 mt-1">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.pending}</p>
              <p className="text-xs text-gray-600 mt-1">Awaiting action</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.approved}</p>
              <p className="text-xs text-gray-600 mt-1">Ready to refund</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                Refunded
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">${stats.totalRefunded.toLocaleString()}</p>
              <p className="text-xs text-gray-600 mt-1">{stats.refunded} refunds</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list">Return Requests</TabsTrigger>
            <TabsTrigger value="processor">Refund Processor</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Return Requests Tab */}
          <TabsContent value="list" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedStatus === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusChange("all")}
                    className="gap-2"
                  >
                    <Filter className="w-4 h-4" />
                    All ({stats.total})
                  </Button>
                  <Button
                    variant={selectedStatus === "pending" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusChange("pending")}
                  >
                    Pending ({stats.pending})
                  </Button>
                  <Button
                    variant={selectedStatus === "approved" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusChange("approved")}
                  >
                    Approved ({stats.approved})
                  </Button>
                  <Button
                    variant={selectedStatus === "refunded" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusChange("refunded")}
                  >
                    Refunded ({stats.refunded})
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Returns List */}
            {filteredReturns.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <RotateCw className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No returns found</p>
                  <p className="text-sm text-gray-500">Check back later for return requests</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredReturns.map((ret) => (
                  <Card
                    key={ret.id}
                    className="cursor-pointer hover:border-gray-400 transition"
                    onClick={() => {
                      setSelectedReturn(ret);
                      setShowDetails(true);
                    }}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">Order {ret.orderId.substring(0, 8)}</h4>
                            <Badge className={getStatusColor(ret.status)}>
                              {ret.status.replace(/_/g, " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            Reason: {getReasonLabel(ret.reason)}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Refund Amount: <span className="font-semibold">${ret.refundAmount.toFixed(2)}</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            Requested: {new Date(ret.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReturn(ret);
                            setShowDetails(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                          Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Refund Processor Tab */}
          <TabsContent value="processor">
            <RefundProcessor sellerId={user?.id || ""} returns={returns} onRefundProcessed={loadReturns} />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <ReturnAnalytics sellerId={user?.id || ""} />
          </TabsContent>
        </Tabs>

        {/* Return Details Modal */}
        {showDetails && selectedReturn && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-96 overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Return Details</span>
                  <Button variant="ghost" size="sm" onClick={() => setShowDetails(false)}>
                    ✕
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Order ID</p>
                    <p className="font-semibold">{selectedReturn.orderId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Return ID</p>
                    <p className="font-semibold">{selectedReturn.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge className={getStatusColor(selectedReturn.status)}>
                      {selectedReturn.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Return Reason</p>
                    <p className="font-semibold">{getReasonLabel(selectedReturn.reason)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Original Price</p>
                    <p className="font-semibold">${selectedReturn.originalPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Refund Amount</p>
                    <p className="font-semibold">${selectedReturn.refundAmount.toFixed(2)}</p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">Description</p>
                  <p className="text-sm bg-gray-50 p-3 rounded">{selectedReturn.description}</p>
                </div>

                {/* Evidence Images */}
                {selectedReturn.evidenceImages && selectedReturn.evidenceImages.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Evidence Images</p>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedReturn.evidenceImages.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Evidence ${idx + 1}`}
                          className="w-full h-24 object-cover rounded"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {selectedReturn.status === "pending" && (
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => {
                        handleApprove(selectedReturn.id);
                      }}
                      className="gap-2 flex-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve Return
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        const reason = prompt("Enter rejection reason:");
                        if (reason) {
                          handleReject(selectedReturn.id, reason);
                        }
                      }}
                      className="gap-2 flex-1"
                    >
                      <AlertCircle className="w-4 h-4" />
                      Reject Return
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReturnsDashboard;

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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Star,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  TrendingUp,
  Filter,
  Download,
  Eye,
  Trash2,
} from "lucide-react";
import { ReviewService } from "@/services/reviewService";
import { useToast } from "@/components/ui/use-toast";

interface ReviewItem {
  id: string;
  productId: string;
  productName: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  rating: number;
  title: string;
  content: string;
  status: "pending" | "approved" | "rejected";
  flagged: boolean;
  flagReason?: string;
  helpfulCount: number;
  unHelpfulCount: number;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

interface ReviewAnalytics {
  totalReviews: number;
  pendingReviews: number;
  approvedReviews: number;
  rejectedReviews: number;
  averageRating: number;
  ratingDistribution: { rating: number; count: number }[];
  topFlaggedReasons: { reason: string; count: number }[];
}

const ReviewModeration: React.FC = () => {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [analytics, setAnalytics] = useState<ReviewAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const [sellerResponseOpen, setSellerResponseOpen] = useState(false);
  const [sellerResponse, setSellerResponse] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    loadReviews();
    loadAnalytics();
  }, [filterStatus, searchQuery]);

  const loadReviews = async () => {
    try {
      setIsLoading(true);
      // In real implementation, this would fetch from ReviewService
      const mockReviews: ReviewItem[] = [
        {
          id: "review-1",
          productId: "prod-1",
          productName: "Premium Wireless Headphones",
          authorId: "user-1",
          authorName: "John Doe",
          rating: 5,
          title: "Excellent product!",
          content: "These headphones are amazing. Great sound quality and comfortable to wear.",
          status: "approved",
          flagged: false,
          helpfulCount: 45,
          unHelpfulCount: 2,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "review-2",
          productId: "prod-2",
          productName: "USB-C Cable",
          authorId: "user-2",
          authorName: "Jane Smith",
          rating: 1,
          title: "Broke after one week",
          content: "This cable is terrible. It broke after using it for just one week. Complete waste of money.",
          status: "pending",
          flagged: true,
          flagReason: "Potential fake review",
          helpfulCount: 12,
          unHelpfulCount: 8,
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "review-3",
          productId: "prod-1",
          productName: "Premium Wireless Headphones",
          authorId: "user-3",
          authorName: "Mike Johnson",
          rating: 4,
          title: "Good but not perfect",
          content: "Good sound quality but battery life could be better. Still a solid product.",
          status: "approved",
          flagged: false,
          helpfulCount: 28,
          unHelpfulCount: 3,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      setReviews(mockReviews);
    } catch (error) {
      console.error("Error loading reviews:", error);
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const mockAnalytics: ReviewAnalytics = {
        totalReviews: 156,
        pendingReviews: 12,
        approvedReviews: 138,
        rejectedReviews: 6,
        averageRating: 4.2,
        ratingDistribution: [
          { rating: 5, count: 68 },
          { rating: 4, count: 54 },
          { rating: 3, count: 22 },
          { rating: 2, count: 8 },
          { rating: 1, count: 4 },
        ],
        topFlaggedReasons: [
          { reason: "Potential fake review", count: 8 },
          { reason: "Spam/Promotional", count: 3 },
          { reason: "Offensive language", count: 2 },
          { reason: "Contains profanity", count: 1 },
        ],
      };

      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
  };

  const handleApproveReview = async (reviewId: string) => {
    try {
      // In real implementation, call ReviewService.approveReview(reviewId)
      setReviews(
        reviews.map((r) =>
          r.id === reviewId ? { ...r, status: "approved" } : r
        )
      );
      toast({
        title: "Success",
        description: "Review approved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve review",
        variant: "destructive",
      });
    }
  };

  const handleRejectReview = async (reviewId: string, reason: string) => {
    try {
      // In real implementation, call ReviewService.rejectReview(reviewId, reason)
      setReviews(
        reviews.map((r) =>
          r.id === reviewId ? { ...r, status: "rejected" } : r
        )
      );
      toast({
        title: "Success",
        description: "Review rejected successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject review",
        variant: "destructive",
      });
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      // In real implementation, call ReviewService.deleteReview(reviewId)
      setReviews(reviews.filter((r) => r.id !== reviewId));
      toast({
        title: "Success",
        description: "Review deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete review",
        variant: "destructive",
      });
    }
  };

  const handleAddSellerResponse = async () => {
    if (!selectedReview || !sellerResponse.trim()) {
      toast({
        title: "Error",
        description: "Please enter a response",
        variant: "destructive",
      });
      return;
    }

    try {
      // In real implementation, call ReviewService.addSellerResponse(reviewId, response)
      setSellerResponseOpen(false);
      setSellerResponse("");
      toast({
        title: "Success",
        description: "Seller response added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add seller response",
        variant: "destructive",
      });
    }
  };

  const filteredReviews = reviews.filter((review) => {
    const statusMatch = filterStatus === "all" || review.status === filterStatus;
    const searchMatch =
      review.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.content.toLowerCase().includes(searchQuery.toLowerCase());
    return statusMatch && searchMatch;
  });

  const CHART_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Review Moderation</h1>
          <p className="text-gray-600 mt-1">
            Manage and moderate product reviews
          </p>
        </div>
        <Button
          onClick={() => {
            // Export functionality
            toast({
              title: "Export",
              description: "Reviews exported successfully",
            });
          }}
          variant="outline"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Reviews
        </Button>
      </div>

      {/* Analytics Dashboard */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Reviews</p>
                  <p className="text-2xl font-bold">{analytics.totalReviews}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {analytics.pendingReviews}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-green-600">
                    {analytics.approvedReviews}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg. Rating</p>
                  <div className="flex items-center gap-1 mt-1">
                    <p className="text-2xl font-bold">
                      {analytics.averageRating}
                    </p>
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
            <CardDescription>Review ratings breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.ratingDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rating" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Review Status</CardTitle>
            <CardDescription>Moderation status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics && (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: "Approved",
                        value: analytics.approvedReviews,
                      },
                      { name: "Pending", value: analytics.pendingReviews },
                      { name: "Rejected", value: analytics.rejectedReviews },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {CHART_COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reviews Table */}
      <Card>
        <CardHeader>
          <CardTitle>Review List</CardTitle>
          <CardDescription>Manage and moderate reviews</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={filterStatus}
            onValueChange={(v) =>
              setFilterStatus(v as "all" | "pending" | "approved" | "rejected")
            }
            className="mb-4"
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending" className="relative">
                Pending
                {analytics && analytics.pendingReviews > 0 && (
                  <span className="ml-2 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {analytics.pendingReviews}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search */}
          <div className="mb-4">
            <Input
              placeholder="Search by product, author, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="text-center py-8">Loading reviews...</div>
          ) : filteredReviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No reviews found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Flagged</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell className="font-medium">
                        {review.productName}
                      </TableCell>
                      <TableCell>{review.authorName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-semibold">
                            {review.rating}
                          </span>
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {review.title}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            review.status === "approved"
                              ? "default"
                              : review.status === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {review.status.charAt(0).toUpperCase() +
                            review.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {review.flagged ? (
                          <Badge variant="destructive" className="text-xs">
                            {review.flagReason}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedReview(review);
                              setShowDetailsDialog(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {review.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleApproveReview(review.id)
                                }
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleRejectReview(review.id, "Inappropriate content")
                                }
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteReview(review.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
          </DialogHeader>

          {selectedReview && (
            <div className="space-y-6">
              {/* Review Info */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Product</h3>
                  <p className="text-gray-600">{selectedReview.productName}</p>
                </div>

                <div>
                  <h3 className="font-semibold">Author</h3>
                  <p className="text-gray-600">{selectedReview.authorName}</p>
                </div>

                <div>
                  <h3 className="font-semibold">Rating</h3>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: selectedReview.rating }).map(
                      (_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 text-yellow-500 fill-yellow-500"
                        />
                      )
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold">Title</h3>
                  <p className="text-gray-600">{selectedReview.title}</p>
                </div>

                <div>
                  <h3 className="font-semibold">Content</h3>
                  <p className="text-gray-600">{selectedReview.content}</p>
                </div>

                {selectedReview.flagged && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Flagged</AlertTitle>
                    <AlertDescription>
                      Reason: {selectedReview.flagReason}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Helpful Votes</p>
                    <p className="text-xl font-semibold">
                      {selectedReview.helpfulCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Unhelpful Votes</p>
                    <p className="text-xl font-semibold">
                      {selectedReview.unHelpfulCount}
                    </p>
                  </div>
                </div>
              </div>

              {/* Seller Response Section */}
              {selectedReview.status === "approved" && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Seller Response
                    </h3>
                    <Button
                      size="sm"
                      onClick={() => setSellerResponseOpen(true)}
                    >
                      Add Response
                    </Button>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">
                      No seller response yet
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                {selectedReview.status === "pending" && (
                  <>
                    <Button
                      onClick={() => handleApproveReview(selectedReview.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() =>
                        handleRejectReview(
                          selectedReview.id,
                          "Inappropriate content"
                        )
                      }
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </>
                )}
                <Button
                  onClick={() => handleDeleteReview(selectedReview.id)}
                  variant="outline"
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Seller Response Dialog */}
      <Dialog open={sellerResponseOpen} onOpenChange={setSellerResponseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Seller Response</DialogTitle>
            <DialogDescription>
              Provide a response to this customer review
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedReview && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold text-sm mb-2">
                  {selectedReview.authorName}'s Review
                </p>
                <p className="text-sm text-gray-600">{selectedReview.title}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Your Response</label>
              <Textarea
                placeholder="Write a thoughtful response to this review..."
                value={sellerResponse}
                onChange={(e) => setSellerResponse(e.target.value)}
                className="mt-2 min-h-32"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSellerResponseOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddSellerResponse}>
              Post Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewModeration;

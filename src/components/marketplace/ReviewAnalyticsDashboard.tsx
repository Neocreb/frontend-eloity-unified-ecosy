import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts";
import { Star, TrendingUp, Users, MessageSquare, Eye } from "lucide-react";

interface ReviewCategory {
  id: string;
  name: string;
  description: string;
  averageRating: number;
  reviewCount: number;
}

interface ReviewTrend {
  date: string;
  reviews: number;
  averageRating: number;
}

interface ReviewMetrics {
  totalReviews: number;
  averageRating: number;
  ratingCategories: ReviewCategory[];
  reviewTrends: ReviewTrend[];
  topRatedCategories: ReviewCategory[];
  commonKeywords: { word: string; frequency: number }[];
  reviewersStats: {
    totalReviewers: number;
    verifiedPurchaseReviews: number;
    averageReviewsPerUser: number;
  };
}

interface ReviewAnalyticsDashboardProps {
  productId?: string;
  sellerId?: string;
  timeRange?: "7d" | "30d" | "90d" | "1y";
}

const ReviewAnalyticsDashboard: React.FC<ReviewAnalyticsDashboardProps> = ({
  productId,
  sellerId,
  timeRange = "30d",
}) => {
  const [metrics, setMetrics] = useState<ReviewMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [productId, sellerId, timeRange]);

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      // Mock data - in real implementation, fetch from API
      const mockMetrics: ReviewMetrics = {
        totalReviews: 256,
        averageRating: 4.3,
        ratingCategories: [
          {
            id: "quality",
            name: "Product Quality",
            description: "Quality of materials and construction",
            averageRating: 4.5,
            reviewCount: 156,
          },
          {
            id: "shipping",
            name: "Shipping & Delivery",
            description: "Speed and condition of delivery",
            averageRating: 4.1,
            reviewCount: 245,
          },
          {
            id: "customer-service",
            name: "Customer Service",
            description: "Responsiveness and helpfulness",
            averageRating: 4.2,
            reviewCount: 189,
          },
          {
            id: "value",
            name: "Value for Money",
            description: "Price to quality ratio",
            averageRating: 4.0,
            reviewCount: 200,
          },
          {
            id: "packaging",
            name: "Packaging",
            description: "Quality and presentation of packaging",
            averageRating: 3.9,
            reviewCount: 178,
          },
        ],
        reviewTrends: [
          { date: "Dec 1", reviews: 12, averageRating: 4.2 },
          { date: "Dec 5", reviews: 18, averageRating: 4.3 },
          { date: "Dec 10", reviews: 15, averageRating: 4.1 },
          { date: "Dec 15", reviews: 22, averageRating: 4.4 },
          { date: "Dec 20", reviews: 19, averageRating: 4.3 },
        ],
        topRatedCategories: [
          {
            id: "quality",
            name: "Product Quality",
            description: "Quality of materials and construction",
            averageRating: 4.5,
            reviewCount: 156,
          },
          {
            id: "customer-service",
            name: "Customer Service",
            description: "Responsiveness and helpfulness",
            averageRating: 4.2,
            reviewCount: 189,
          },
        ],
        commonKeywords: [
          { word: "excellent", frequency: 45 },
          { word: "quality", frequency: 38 },
          { word: "fast", frequency: 32 },
          { word: "reliable", frequency: 28 },
          { word: "worth", frequency: 24 },
          { word: "recommend", frequency: 21 },
          { word: "amazing", frequency: 18 },
          { word: "durable", frequency: 15 },
        ],
        reviewersStats: {
          totalReviewers: 189,
          verifiedPurchaseReviews: 234,
          averageReviewsPerUser: 1.35,
        },
      };

      setMetrics(mockMetrics);
    } catch (error) {
      console.error("Error loading metrics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  if (!metrics) {
    return (
      <div className="text-center py-8 text-red-600">
        Failed to load analytics
      </div>
    );
  }

  const ratingPercentages = {
    5: 42,
    4: 35,
    3: 16,
    2: 5,
    1: 2,
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Average Rating</p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold">{metrics.averageRating}</p>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.round(metrics.averageRating)
                            ? "text-yellow-500 fill-yellow-500"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Reviews</p>
                <p className="text-3xl font-bold">{metrics.totalReviews}</p>
                <p className="text-xs text-gray-500 mt-1">
                  From {metrics.reviewersStats.totalReviewers} reviewers
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  Verified Purchases
                </p>
                <p className="text-3xl font-bold">
                  {metrics.reviewersStats.verifiedPurchaseReviews}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {(
                    (metrics.reviewersStats.verifiedPurchaseReviews /
                      metrics.totalReviews) *
                    100
                  ).toFixed(1)}
                  % of reviews
                </p>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categories">Rating Categories</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>

        {/* Rating Categories */}
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Rating by Category</CardTitle>
              <CardDescription>
                Average ratings for different product aspects
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {metrics.ratingCategories.map((category) => (
                <div key={category.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{category.name}</h4>
                      <p className="text-xs text-gray-600">
                        {category.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <span className="font-semibold">
                          {category.averageRating}
                        </span>
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      </div>
                      <p className="text-xs text-gray-600">
                        {category.reviewCount} reviews
                      </p>
                    </div>
                  </div>
                  <Progress
                    value={(category.averageRating / 5) * 100}
                    className="h-2"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Review Trends</CardTitle>
              <CardDescription>
                Review count and average rating over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.reviewTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="reviews"
                    stroke="#3b82f6"
                    name="Reviews per day"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="averageRating"
                    stroke="#10b981"
                    name="Average rating"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Keywords */}
        <TabsContent value="keywords">
          <Card>
            <CardHeader>
              <CardTitle>Common Keywords</CardTitle>
              <CardDescription>
                Most frequently mentioned words in reviews
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {metrics.commonKeywords.map((keyword, index) => (
                  <Badge
                    key={keyword.word}
                    variant={index < 3 ? "default" : "secondary"}
                    className="px-3 py-1"
                  >
                    {keyword.word}
                    <span className="ml-2 text-xs opacity-75">
                      ({keyword.frequency})
                    </span>
                  </Badge>
                ))}
              </div>

              {/* Keywords Chart */}
              <div className="mt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.commonKeywords.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="word" angle={-45} textAnchor="end" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="frequency" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distribution */}
        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle>Rating Distribution</CardTitle>
              <CardDescription>
                Breakdown of ratings from customers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium w-12">{rating} ⭐</span>
                      <span className="text-sm text-gray-600">
                        {ratingPercentages[rating as keyof typeof ratingPercentages]}%
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {Math.round(
                        (ratingPercentages[rating as keyof typeof ratingPercentages] / 100) *
                          metrics.totalReviews
                      )}{" "}
                      reviews
                    </span>
                  </div>
                  <Progress
                    value={
                      ratingPercentages[rating as keyof typeof ratingPercentages]
                    }
                    className="h-2"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sentiment Analysis Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Sentiment Summary</CardTitle>
          <CardDescription>
            Overall customer sentiment from reviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">77%</p>
              <p className="text-sm text-gray-600">Positive</p>
              <p className="text-xs text-gray-500 mt-1">4-5 stars</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">16%</p>
              <p className="text-sm text-gray-600">Neutral</p>
              <p className="text-xs text-gray-500 mt-1">3 stars</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">7%</p>
              <p className="text-sm text-gray-600">Negative</p>
              <p className="text-xs text-gray-500 mt-1">1-2 stars</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewAnalyticsDashboard;

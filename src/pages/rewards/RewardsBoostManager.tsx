import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBoostManager } from "@/hooks/useBoostManager";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  Flame,
  TrendingUp,
  Clock,
  Target,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

export default function RewardsBoostManager() {
  const navigate = useNavigate();
  const { packages, activeBoosts, stats, isLoading, error, createBoost } = useBoostManager();
  const [selectedBoost, setSelectedBoost] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-10 w-10"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 flex items-center gap-3">
            <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30">
              <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">Boost Manager</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-6">
          {isLoading ? (
            <>
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </>
          ) : error ? (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-900">
                {error.message}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Stats Section */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-gray-600 font-medium">Active Boosts</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.activeBoostsCount}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-gray-600 font-medium">Total Spent</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(stats.totalSpent, "USD")}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-gray-600 font-medium">Total Reach</p>
                      <p className="text-2xl font-bold text-green-600">
                        {(stats.totalReach / 1000).toFixed(1)}K
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-gray-600 font-medium">Engagement</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {stats.totalEngagement.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Active Boosts Section */}
              {activeBoosts.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-gray-900">Active Boosts</h2>
                  {activeBoosts.map((boost) => (
                    <Card key={boost.id} className="border-green-200 bg-green-50">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">🚀</span>
                            <div>
                              <h3 className="font-bold text-gray-900">
                                {boost.boost_name}
                              </h3>
                              <p className="text-xs text-gray-600">
                                {new Date(boost.start_date).toLocaleDateString()} — {new Date(boost.end_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-green-200 text-green-800 hover:bg-green-200">
                            {boost.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="bg-white rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-600 font-medium">Spent</p>
                            <p className="text-lg font-bold text-gray-900">
                              {formatCurrency(boost.price_paid || 0, "USD")}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-600 font-medium">Reach</p>
                            <p className="text-lg font-bold text-blue-600">
                              {boost.reach_achieved.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-600 font-medium">
                              Engagement
                            </p>
                            <p className="text-lg font-bold text-purple-600">
                              {boost.engagement_achieved.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <Button variant="outline" className="w-full h-9 text-sm">
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Boost Packages */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Available Boosts</h2>
            <div className="space-y-3">
              {BOOST_PACKAGES.map((boost) => (
                <Card
                  key={boost.id}
                  className={`cursor-pointer transition-all ${
                    selectedBoost === boost.id
                      ? "border-orange-500 bg-orange-50 shadow-md"
                      : "hover:shadow-md"
                  } ${boost.popular ? "border-orange-200" : ""}`}
                  onClick={() => setSelectedBoost(boost.id)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-3xl">{boost.icon}</span>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">
                            {boost.name}
                          </h3>
                          <p className="text-xs text-gray-600">
                            {boost.duration} days
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-orange-600">
                          ${boost.price.toFixed(2)}
                        </p>
                        {boost.popular && (
                          <Badge className="mt-2 bg-orange-500 text-white hover:bg-orange-600">
                            Popular
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-gray-600" />
                        <span className="text-sm text-gray-700">
                          Estimated reach: {boost.reach}
                        </span>
                      </div>
                    </div>

                    <ul className="space-y-2 mb-4">
                      {boost.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-2 text-sm text-gray-700"
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {selectedBoost === boost.id && (
                      <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                        Purchase Boost
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Performance Tips */}
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              💡 <strong>Tip:</strong> Post engaging content before boosting for maximum results.
              High-quality content performs 3x better!
            </AlertDescription>
          </Alert>

          {/* FAQ */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">How Boosts Work</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-medium text-sm text-gray-900 mb-1">
                  What does a boost do?
                </h4>
                <p className="text-sm text-gray-700">
                  Boosts increase your content visibility to a wider audience for a specified period.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-900 mb-1">
                  When should I boost?
                </h4>
                <p className="text-sm text-gray-700">
                  Boost high-performing content to maximize reach and engagement.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

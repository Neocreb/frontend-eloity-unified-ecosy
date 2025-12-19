import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { usePartnershipStats } from "@/hooks/usePartnershipStats";
import {
  Handshake,
  DollarSign,
  Users,
  TrendingUp,
  CheckCircle,
  Clock,
  ExternalLink,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

export default function PartnershipsSection() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState<"active" | "pending" | "available">("active");
  const [isApplying, setIsApplying] = useState<string | null>(null);
  const {
    availablePartnerships,
    userPartnerships,
    stats,
    isLoading,
    error,
    applyForPartnership,
  } = usePartnershipStats();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100">
            Rejected
          </Badge>
        );
      case "paused":
        return (
          <Badge className="bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100">
            Paused
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleApplyForPartnership = async (partnershipId: string) => {
    setIsApplying(partnershipId);
    const success = await applyForPartnership(partnershipId);
    setIsApplying(null);

    if (success) {
      toast({
        title: "✓ Application Submitted",
        description: "Your partnership application has been submitted for review",
      });
    }
  };

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-900">
          {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  const activePartnershipCount = userPartnerships.filter((p) => p.status === "active").length;
  const pendingPartnershipCount = userPartnerships.filter((p) => p.status === "pending").length;
  const availablePartnershipCount = availablePartnerships.length;

  const filteredUserPartnerships = userPartnerships.filter((p) => p.status === selectedTab);
  const filteredAvailablePartnerships = availablePartnerships.filter((p) => !userPartnerships.some((up) => up.partnership_id === p.id));

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 dark:from-purple-950 dark:to-pink-950 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Handshake className="w-5 h-5 text-purple-600" />
            Partnership Earnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <>
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {formatCurrency(stats?.totalEarned || 0, "USD")}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                From {stats?.activePartnerships || 0} active partnership{(stats?.activePartnerships || 0) !== 1 ? "s" : ""}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
        {[
          { value: "active" as const, label: "Active", count: activePartnershipCount },
          { value: "pending" as const, label: "Pending", count: pendingPartnershipCount },
          { value: "available" as const, label: "Available", count: availablePartnershipCount },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSelectedTab(tab.value)}
            className={`pb-2 px-2 text-sm font-medium transition-colors flex items-center gap-2 ${
              selectedTab === tab.value
                ? "text-purple-600 border-b-2 border-purple-600 dark:text-purple-400 dark:border-purple-400"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full text-xs">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Partnership Cards */}
      <div className="space-y-3">
        {isLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </>
        ) : selectedTab === "available" ? (
          filteredAvailablePartnerships.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    All available partnerships are listed
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Check back later for more opportunities!
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredAvailablePartnerships.map((partnership) => (
              <Card
                key={partnership.id}
                className="transition-all hover:shadow-md border-blue-200 dark:border-blue-800"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl flex-shrink-0">
                      {partnership.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white">
                            {partnership.name}
                          </h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {partnership.category}
                          </p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100">
                          Available
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 my-2">
                        {partnership.description}
                      </p>

                      <div className="flex gap-4 text-sm">
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Commission Rate
                          </p>
                          <p className="font-bold text-gray-900 dark:text-white">
                            {partnership.commission_rate}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleApplyForPartnership(partnership.id)}
                        disabled={isApplying === partnership.id}
                      >
                        {isApplying === partnership.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Applying...
                          </>
                        ) : (
                          "Apply"
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )
        ) : filteredUserPartnerships.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {selectedTab === "active" && "No active partnerships yet"}
                  {selectedTab === "pending" && "No pending applications"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredUserPartnerships.map((userPartnership) => (
            <Card
              key={userPartnership.id}
              className="transition-all hover:shadow-md"
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="text-3xl flex-shrink-0">
                    {userPartnership.partnership_icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          {userPartnership.partnership_name}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {userPartnership.partnership_category}
                        </p>
                      </div>
                      {getStatusBadge(userPartnership.status)}
                    </div>

                    {userPartnership.status === "active" && (
                      <div className="flex gap-4 text-sm mt-2">
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Commission Rate
                          </p>
                          <p className="font-bold text-gray-900 dark:text-white">
                            {userPartnership.commission_rate}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Total Earned
                          </p>
                          <p className="font-bold text-green-600">
                            {formatCurrency(userPartnership.total_earned, "USD")}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Referrals
                          </p>
                          <p className="font-bold text-gray-900 dark:text-white">
                            {userPartnership.successful_referrals}/{userPartnership.total_referrals}
                          </p>
                        </div>
                      </div>
                    )}

                    {userPartnership.status === "pending" && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                        Applied on {new Date(userPartnership.applied_at).toLocaleDateString()}
                      </p>
                    )}

                    {userPartnership.status === "rejected" && userPartnership.rejection_reason && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                        Reason: {userPartnership.rejection_reason}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Benefits Card */}
      <Card>
        <CardHeader>
          <CardTitle>Partnership Benefits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <DollarSign className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Recurring Commissions
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Earn ongoing commissions from your referrals
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <TrendingUp className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Performance Bonuses
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Unlock higher commissions as you hit milestones
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Users className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Dedicated Support
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get help from partnership managers
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

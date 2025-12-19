import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Handshake,
  DollarSign,
  Users,
  TrendingUp,
  CheckCircle,
  Clock,
  ExternalLink,
} from "lucide-react";

interface Partnership {
  id: string;
  name: string;
  category: string;
  status: "active" | "pending" | "available";
  commissionRate: number;
  earnings: number;
  description: string;
  icon: string;
  url?: string;
}

export default function PartnershipsSection() {
  const [selectedTab, setSelectedTab] = useState<"active" | "pending" | "available">("active");

  const partnerships: Partnership[] = [
    {
      id: "1",
      name: "Crypto Exchange",
      category: "Finance",
      status: "active",
      commissionRate: 8,
      earnings: 1250.5,
      description: "Earn commission on successful referrals",
      icon: "💱",
      url: "https://crypto-exchange.example.com",
    },
    {
      id: "2",
      name: "Premium Subscription",
      category: "SaaS",
      status: "active",
      commissionRate: 15,
      earnings: 890.25,
      description: "Promote premium features to earn recurring commissions",
      icon: "⭐",
      url: "https://premium.example.com",
    },
    {
      id: "3",
      name: "E-learning Platform",
      category: "Education",
      status: "pending",
      commissionRate: 10,
      earnings: 0,
      description: "Waiting for approval to begin",
      icon: "📚",
    },
    {
      id: "4",
      name: "Gaming Studio",
      category: "Gaming",
      status: "available",
      commissionRate: 12,
      earnings: 0,
      description: "Join our affiliate program today",
      icon: "🎮",
      url: "https://gaming-studio.example.com",
    },
    {
      id: "5",
      name: "Web Hosting",
      category: "Technology",
      status: "available",
      commissionRate: 20,
      earnings: 0,
      description: "High commission for web hosting referrals",
      icon: "🌐",
      url: "https://webhosting.example.com",
    },
  ];

  const filteredPartnerships = partnerships.filter((p) => p.status === selectedTab);
  const totalPartnershipEarnings = partnerships
    .filter((p) => p.status === "active")
    .reduce((sum, p) => sum + p.earnings, 0);
  const activeCount = partnerships.filter((p) => p.status === "active").length;
  const pendingCount = partnerships.filter((p) => p.status === "pending").length;
  const availableCount = partnerships.filter((p) => p.status === "available").length;

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
      case "available":
        return (
          <Badge className="bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100">
            Available
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

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
          <div className="text-3xl font-bold text-purple-600 mb-2">
            ${totalPartnershipEarnings.toFixed(2)} ELO
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            From {activeCount} active partnership{activeCount !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
        {[
          { value: "active" as const, label: "Active", count: activeCount },
          { value: "pending" as const, label: "Pending", count: pendingCount },
          { value: "available" as const, label: "Available", count: availableCount },
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
        {filteredPartnerships.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {selectedTab === "active" && "No active partnerships yet"}
                  {selectedTab === "pending" && "No pending applications"}
                  {selectedTab === "available" && "All available partnerships are listed above"}
                </p>
                {selectedTab === "available" && (
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Check back later for more opportunities!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredPartnerships.map((partnership) => (
            <Card
              key={partnership.id}
              className={`transition-all hover:shadow-md ${
                partnership.status === "available"
                  ? "border-blue-200 dark:border-blue-800"
                  : ""
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="text-3xl flex-shrink-0">
                    {partnership.icon}
                  </div>

                  {/* Info */}
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
                      {getStatusBadge(partnership.status)}
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 my-2">
                      {partnership.description}
                    </p>

                    {/* Stats */}
                    {partnership.status === "active" && (
                      <div className="flex gap-4 text-sm">
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Commission Rate
                          </p>
                          <p className="font-bold text-gray-900 dark:text-white">
                            {partnership.commissionRate}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Earnings
                          </p>
                          <p className="font-bold text-green-600">
                            ${partnership.earnings.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="flex-shrink-0">
                    {partnership.status === "active" && partnership.url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(partnership.url, "_blank")}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                    {partnership.status === "available" && (
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Apply
                      </Button>
                    )}
                    {partnership.status === "pending" && (
                      <Button size="sm" variant="outline" disabled>
                        Pending
                      </Button>
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

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ChevronLeft,
  Handshake,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Mail,
  MessageSquare,
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
}

const PARTNERSHIPS: Partnership[] = [
  {
    id: 1,
    name: "Crypto Exchange",
    category: "Finance",
    status: "active",
    commissionRate: 8,
    earnings: 1250.50,
    description: "Earn commission on successful referrals",
    icon: "💱",
  },
  {
    id: 2,
    name: "Premium Subscription",
    category: "SaaS",
    status: "active",
    commissionRate: 15,
    earnings: 890.25,
    description: "Promote premium features to earn recurring commissions",
    icon: "⭐",
  },
  {
    id: 3,
    name: "E-learning Platform",
    category: "Education",
    status: "pending",
    commissionRate: 10,
    earnings: 0,
    description: "Waiting for approval to begin",
    icon: "📚",
  },
  {
    id: 4,
    name: "Gaming Studio",
    category: "Gaming",
    status: "available",
    commissionRate: 12,
    earnings: 0,
    description: "Join our affiliate program today",
    icon: "🎮",
  },
];

export default function RewardsPartnerships() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("active");

  const filteredPartnerships = PARTNERSHIPS.filter((p) => {
    if (selectedTab === "active") return p.status === "active";
    if (selectedTab === "pending") return p.status === "pending";
    return p.status === "available";
  });

  const totalPartnershipEarnings = PARTNERSHIPS.filter(
    (p) => p.status === "active"
  ).reduce((sum, p) => sum + p.earnings, 0);

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
            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
              <Handshake className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">Partnerships</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-6">
          {/* Summary Card */}
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardHeader>
              <CardTitle className="text-base">Partnership Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 mb-2">
                ${totalPartnershipEarnings.toFixed(2)}
              </div>
              <p className="text-sm text-gray-600">
                From {PARTNERSHIPS.filter((p) => p.status === "active").length} active partnerships
              </p>
            </CardContent>
          </Card>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-gray-200">
            {[
              { value: "active", label: "Active" },
              { value: "pending", label: "Pending" },
              { value: "available", label: "Available" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSelectedTab(tab.value)}
                className={`pb-2 text-sm font-medium transition-colors ${
                  selectedTab === tab.value
                    ? "text-purple-600 border-b-2 border-purple-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Partnership Cards */}
          <div className="space-y-3">
            {filteredPartnerships.map((partnership) => (
              <Card key={partnership.id} className="hover:shadow-md transition-all">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{partnership.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-gray-900">
                            {partnership.name}
                          </h3>
                          <p className="text-xs text-gray-600">
                            {partnership.category}
                          </p>
                        </div>
                        <Badge
                          className={`ml-2 whitespace-nowrap ${
                            partnership.status === "active"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : partnership.status === "pending"
                                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                          }`}
                        >
                          {partnership.status.charAt(0).toUpperCase() +
                            partnership.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">
                        {partnership.description}
                      </p>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-gray-600">
                          Commission: {partnership.commissionRate}%
                        </span>
                        {partnership.earnings > 0 && (
                          <span className="text-sm font-bold text-green-600">
                            +${partnership.earnings.toFixed(2)}
                          </span>
                        )}
                      </div>
                      {partnership.status === "active" && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs flex-1"
                          >
                            <Mail className="h-3 w-3 mr-1" />
                            Contact
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs flex-1"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Dashboard
                          </Button>
                        </div>
                      )}
                      {partnership.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-8 text-xs"
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          Awaiting Approval
                        </Button>
                      )}
                      {partnership.status === "available" && (
                        <Button
                          size="sm"
                          className="w-full h-8 text-xs bg-purple-600 hover:bg-purple-700"
                        >
                          Join Partnership
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Info Box */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Partnerships are a great way to earn passive income. Apply for new programs to expand
              your earning potential.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}

import { Clock } from "lucide-react";

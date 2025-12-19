import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ChevronLeft,
  ArrowUp,
  AlertCircle,
  CheckCircle2,
  Wallet,
  AlertTriangle,
} from "lucide-react";
import WithdrawEarnings from "@/components/rewards/WithdrawEarnings";

export default function RewardsWithdraw() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();

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
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
              <ArrowUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">Withdraw Earnings</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
          <WithdrawEarnings
            availableBalance={1250.50}
            userId={user?.id || ""}
            onWithdraw={() => {
              navigate(-1);
            }}
          />
        </div>
      </div>
    </div>
  );
}

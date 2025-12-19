import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRewardsHistory } from "@/hooks/useRewardsHistory";
import {
  ChevronLeft,
  History,
  TrendingUp,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

export default function RewardsHistory() {
  const navigate = useNavigate();
  const [historyTab, setHistoryTab] = useState<"all" | "earned" | "redeemed">("all");

  const { transactions, monthlyEarnings, isLoading: historyLoading, error: historyError } = useRewardsHistory();

  const filteredTransactions = transactions.filter((t) => {
    if (historyTab === "earned") return t.transaction_type === "reward" || t.transaction_type === "bonus";
    if (historyTab === "redeemed") return t.transaction_type === "redemption" || t.transaction_type === "withdrawal";
    return true;
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "reward":
        return "✨";
      case "bonus":
        return "🎁";
      case "referral":
        return "👥";
      case "challenge":
        return "🏆";
      case "boost":
        return "🚀";
      case "redemption":
        return "🔄";
      case "withdrawal":
        return "💸";
      default:
        return "📝";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-50";
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      case "failed":
        return "text-red-600 bg-red-50";
      case "refunded":
        return "text-orange-600 bg-orange-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getTotalEarnings = () => {
    return transactions
      .filter((t) => t.status === "completed" && (t.transaction_type === "reward" || t.transaction_type === "bonus" || t.transaction_type === "referral"))
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalRedeemed = () => {
    return transactions
      .filter((t) => t.status === "completed" && (t.transaction_type === "redemption" || t.transaction_type === "withdrawal"))
      .reduce((sum, t) => sum + t.amount, 0);
  };

  return (
    <>
      <Helmet>
        <title>History | Eloity Rewards</title>
        <meta name="description" content="View your rewards transaction history" />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 z-50">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/app/rewards")}
              className="h-10 w-10"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <History className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold">History</h1>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
            {historyError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-900">
                  {historyError.message}
                </AlertDescription>
              </Alert>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 dark:from-green-950 dark:to-emerald-950 dark:border-green-800">
                <CardContent className="pt-6">
                  {historyLoading ? (
                    <Skeleton className="h-12 w-32" />
                  ) : (
                    <>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">
                        Total Earned
                      </p>
                      <p className="text-3xl font-bold text-green-600">
                        {formatCurrency(getTotalEarnings(), "USD")}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                        {transactions.filter((t) => t.transaction_type === "reward" || t.transaction_type === "bonus" || t.transaction_type === "referral").length} transactions
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 dark:from-purple-950 dark:to-pink-950 dark:border-purple-800">
                <CardContent className="pt-6">
                  {historyLoading ? (
                    <Skeleton className="h-12 w-32" />
                  ) : (
                    <>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">
                        Total Redeemed
                      </p>
                      <p className="text-3xl font-bold text-purple-600">
                        {formatCurrency(getTotalRedeemed(), "USD")}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                        {transactions.filter((t) => t.transaction_type === "redemption" || t.transaction_type === "withdrawal").length} transactions
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
              {[
                { value: "all" as const, label: "All Transactions" },
                { value: "earned" as const, label: "Earned" },
                { value: "redeemed" as const, label: "Redeemed" },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setHistoryTab(tab.value)}
                  className={`pb-2 px-2 text-sm font-medium transition-colors ${
                    historyTab === tab.value
                      ? "text-purple-600 border-b-2 border-purple-600 dark:text-purple-400 dark:border-purple-400"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Monthly Earnings Chart */}
            {monthlyEarnings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Monthly Earnings Trend
                  </CardTitle>
                  <CardDescription>Last 12 months overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {monthlyEarnings.map((month) => (
                      <div key={month.month} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {month.month}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {month.transaction_count} transactions
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(month.total_amount, "USD")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transaction List */}
            <Card>
              <CardHeader>
                <CardTitle>Transaction Details</CardTitle>
                <CardDescription>
                  {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-400">
                      No transactions found
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <span className="text-2xl flex-shrink-0">
                            {getTransactionIcon(transaction.transaction_type)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white capitalize">
                              {transaction.transaction_type.replace(/_/g, " ")}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(transaction.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <p className="font-bold text-gray-900 dark:text-white">
                              {transaction.transaction_type === "redemption" || transaction.transaction_type === "withdrawal"
                                ? "−"
                                : "+"}{" "}
                              {formatCurrency(transaction.amount, transaction.currency)}
                            </p>
                            <Badge
                              variant="secondary"
                              className={`text-xs capitalize ${getStatusColor(transaction.status)}`}
                            >
                              {transaction.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

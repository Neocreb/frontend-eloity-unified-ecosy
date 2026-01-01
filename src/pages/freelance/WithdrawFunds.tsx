import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Wallet, AlertCircle, CheckCircle } from "lucide-react";
import FreelanceWithdrawalMethods from "@/components/freelance/FreelanceWithdrawalMethods";
import { useAuth } from "@/contexts/AuthContext";
import { useFreelance } from "@/hooks/use-freelance";
import { toast } from "sonner";

const WithdrawFunds: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getFreelancerEarningsStats } = useFreelance();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bank_transfer");
  const [isProcessing, setIsProcessing] = useState(false);

  React.useEffect(() => {
    const loadStats = async () => {
      if (!user?.id) return;
      try {
        const statsData = await getFreelancerEarningsStats(user.id);
        setStats(statsData);
      } catch (error) {
        console.error("Failed to load earnings stats:", error);
        toast.error("Failed to load withdrawal information");
      }
    };
    loadStats();
  }, [user?.id, getFreelancerEarningsStats]);

  const availableBalance = stats?.totalEarnings - (stats?.pending || 0) || 0;
  const amountNum = parseFloat(amount) || 0;
  const isValid = amountNum > 0 && amountNum <= availableBalance;

  const handleWithdraw = async () => {
    if (!isValid) {
      toast.error("Invalid withdrawal amount");
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate withdrawal processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success("Withdrawal processed successfully!");
      setTimeout(() => {
        navigate("/app/freelance/dashboard");
      }, 1000);
    } catch (error) {
      console.error("Withdrawal failed:", error);
      toast.error("Withdrawal failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Withdraw Funds
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Transfer your earnings to your bank account
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Balance Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Available Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total Earnings
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    ${(stats?.totalEarnings || 0).toFixed(2)}
                  </p>
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Available to Withdraw
                    </p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ${availableBalance.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Pending: ${(stats?.pending || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Withdrawal Form */}
            <Card>
              <CardHeader>
                <CardTitle>Withdrawal Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Withdrawal Method */}
                <div>
                  <Label htmlFor="method" className="text-base font-medium">
                    Withdrawal Method
                  </Label>
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger id="method" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="crypto">Cryptocurrency</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Select how you want to receive your funds
                  </p>
                </div>

                {/* Amount */}
                <div>
                  <Label htmlFor="amount" className="text-base font-medium">
                    Withdrawal Amount
                  </Label>
                  <div className="relative mt-2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                      $
                    </span>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-6"
                      min="0"
                      max={availableBalance}
                      step="0.01"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Min: $1.00 | Max: ${availableBalance.toFixed(2)}
                  </p>
                </div>

                {/* Quick Amount Buttons */}
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Quick Select
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {[50, 100, 250, 500].map((val) => (
                      <Button
                        key={val}
                        variant={amount === val.toString() ? "default" : "outline"}
                        size="sm"
                        onClick={() => setAmount(val.toString())}
                        disabled={val > availableBalance}
                      >
                        ${val}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Processing Fee */}
                {amountNum > 0 && (
                  <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            Amount
                          </span>
                          <span className="font-medium">
                            ${amountNum.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            Processing Fee (2%)
                          </span>
                          <span className="font-medium">
                            ${(amountNum * 0.02).toFixed(2)}
                          </span>
                        </div>
                        <div className="border-t border-blue-200 dark:border-blue-800 pt-2 flex justify-between text-base font-bold">
                          <span>You will receive</span>
                          <span className="text-green-600 dark:text-green-400">
                            ${(amountNum * 0.98).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Information */}
                <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800 dark:text-yellow-300">
                      <p className="font-medium mb-1">Processing Time</p>
                      <p>
                        Bank transfers typically process within 1-3 business days.
                        Please ensure your banking details are correct.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Need Help Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Having trouble withdrawing your funds? Our support team is here to help.
                </p>
                <Button variant="outline" className="w-full">
                  Contact Support
                </Button>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Secure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Your financial information is encrypted and secure. We never store
                  full bank details on our servers.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="sticky bottom-0 z-40 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleWithdraw}
            disabled={!isValid || isProcessing}
            className="gap-2"
          >
            {isProcessing ? "Processing..." : "Confirm Withdrawal"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WithdrawFunds;

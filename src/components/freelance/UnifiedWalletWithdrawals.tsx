import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  ArrowDownRight,
  Loader2,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  DollarSign,
  Wallet,
} from "lucide-react";
import { useFreelanceUnifiedWallet, type WithdrawalRequest } from "@/hooks/useFreelanceUnifiedWallet";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
};

const statusIcons = {
  pending: <Clock className="w-4 h-4" />,
  completed: <CheckCircle2 className="w-4 h-4" />,
  failed: <XCircle className="w-4 h-4" />,
  cancelled: <XCircle className="w-4 h-4" />,
};

const methodIcons = {
  bank_transfer: <DollarSign className="w-4 h-4" />,
  paypal: <Wallet className="w-4 h-4" />,
  crypto: <DollarSign className="w-4 h-4" />,
  mobile_money: <DollarSign className="w-4 h-4" />,
};

interface WithdrawalFormProps {
  balance: number;
  currency: string;
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
}

const WithdrawalForm: React.FC<WithdrawalFormProps> = ({ balance, currency, onSubmit, isLoading }) => {
  const [method, setMethod] = useState("bank_transfer");
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [cryptoAddress, setCryptoAddress] = useState("");
  const [cryptoNetwork, setCryptoNetwork] = useState("ethereum");
  const [mobileNumber, setMobileNumber] = useState("");
  const [mobileCountry, setMobileCountry] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount) {
      toast.error("Please enter an amount");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return;
    }

    if (parsedAmount > balance) {
      toast.error("Amount exceeds available balance");
      return;
    }

    let withdrawalDetails: any = {};

    switch (method) {
      case "bank_transfer":
        if (!bankName || !accountNumber) {
          toast.error("Please fill in bank details");
          return;
        }
        withdrawalDetails = { bankName, accountNumber, routingNumber };
        break;

      case "paypal":
        if (!paypalEmail) {
          toast.error("Please enter PayPal email");
          return;
        }
        withdrawalDetails = { paypalEmail };
        break;

      case "crypto":
        if (!cryptoAddress) {
          toast.error("Please enter crypto address");
          return;
        }
        withdrawalDetails = { cryptoAddress, cryptoNetwork };
        break;

      case "mobile_money":
        if (!mobileNumber || !mobileCountry) {
          toast.error("Please fill in mobile money details");
          return;
        }
        withdrawalDetails = { mobileNumber, mobileCountry };
        break;
    }

    try {
      await onSubmit({
        amount: parsedAmount,
        method,
        withdrawalDetails,
      });

      // Reset form
      setAmount("");
      setBankName("");
      setAccountNumber("");
      setRoutingNumber("");
      setPaypalEmail("");
      setCryptoAddress("");
      setMobileNumber("");
      setMobileCountry("");
    } catch (error) {
      console.error("Error submitting withdrawal:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Balance Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Available Balance</p>
            <p className="text-2xl font-bold">
              {currency} {balance.toLocaleString()}
            </p>
          </div>
          <Wallet className="w-8 h-8 text-blue-500" />
        </div>
      </div>

      {/* Important Note */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Note:</strong> There is no minimum withdrawal amount. You can withdraw any positive amount from your balance.
        </AlertDescription>
      </Alert>

      {/* Amount */}
      <div className="space-y-2">
        <Label htmlFor="amount">Withdrawal Amount *</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currency}</span>
          <Input
            id="amount"
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.01"
            min="0"
            disabled={isLoading}
            className="pl-12"
          />
        </div>
        {amount && (
          <p className="text-sm text-muted-foreground">
            {parseFloat(amount) > balance && "Exceeds available balance"}
            {parseFloat(amount) > 0 && parseFloat(amount) <= balance && "✓ Valid amount"}
          </p>
        )}
      </div>

      {/* Method Selection */}
      <div className="space-y-2">
        <Label htmlFor="method">Withdrawal Method *</Label>
        <Select value={method} onValueChange={setMethod} disabled={isLoading}>
          <SelectTrigger id="method">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            <SelectItem value="paypal">PayPal</SelectItem>
            <SelectItem value="crypto">Cryptocurrency</SelectItem>
            <SelectItem value="mobile_money">Mobile Money</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Conditional Fields */}
      {method === "bank_transfer" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="bankName">Bank Name *</Label>
            <Input
              id="bankName"
              placeholder="e.g., Bank of America"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountNumber">Account Number *</Label>
            <Input
              id="accountNumber"
              placeholder="e.g., 123456789"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="routingNumber">Routing Number</Label>
            <Input
              id="routingNumber"
              placeholder="e.g., 987654321"
              value={routingNumber}
              onChange={(e) => setRoutingNumber(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </>
      )}

      {method === "paypal" && (
        <div className="space-y-2">
          <Label htmlFor="paypalEmail">PayPal Email *</Label>
          <Input
            id="paypalEmail"
            type="email"
            placeholder="you@example.com"
            value={paypalEmail}
            onChange={(e) => setPaypalEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
      )}

      {method === "crypto" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="cryptoNetwork">Network *</Label>
            <Select value={cryptoNetwork} onValueChange={setCryptoNetwork} disabled={isLoading}>
              <SelectTrigger id="cryptoNetwork">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ethereum">Ethereum</SelectItem>
                <SelectItem value="bitcoin">Bitcoin</SelectItem>
                <SelectItem value="polygon">Polygon</SelectItem>
                <SelectItem value="binance">Binance Smart Chain</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cryptoAddress">Wallet Address *</Label>
            <Input
              id="cryptoAddress"
              placeholder="e.g., 0x..."
              value={cryptoAddress}
              onChange={(e) => setCryptoAddress(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </>
      )}

      {method === "mobile_money" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="mobileNumber">Mobile Number *</Label>
            <Input
              id="mobileNumber"
              placeholder="e.g., +234701234567"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mobileCountry">Country *</Label>
            <Input
              id="mobileCountry"
              placeholder="e.g., Nigeria"
              value={mobileCountry}
              onChange={(e) => setMobileCountry(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </>
      )}

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <ArrowDownRight className="w-4 h-4 mr-2" />
            Request Withdrawal
          </>
        )}
      </Button>
    </form>
  );
};

interface WithdrawalCardProps {
  withdrawal: WithdrawalRequest;
  onCancel: (id: string) => void;
  isLoading: boolean;
}

const WithdrawalCard: React.FC<WithdrawalCardProps> = ({ withdrawal, onCancel, isLoading }) => {
  const methodLabel = withdrawal.method.replace("_", " ").toUpperCase();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {methodIcons[withdrawal.method as keyof typeof methodIcons] || <DollarSign className="w-8 h-8" />}
            <div>
              <h3 className="font-semibold">{methodLabel}</h3>
              <p className="text-sm text-muted-foreground">{new Date(withdrawal.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <Badge className={statusColors[withdrawal.status as keyof typeof statusColors] || statusColors.pending}>
            {withdrawal.status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-muted-foreground">Amount</p>
            <p className="text-lg font-semibold">
              {withdrawal.currency} {withdrawal.amount.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <div className="flex items-center gap-2">
              {statusIcons[withdrawal.status as keyof typeof statusIcons]}
              <span className="capitalize text-sm">{withdrawal.status}</span>
            </div>
          </div>
        </div>

        {withdrawal.status === "pending" && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onCancel(withdrawal.id)}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Cancelling...
              </>
            ) : (
              "Cancel Withdrawal"
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export const UnifiedWalletWithdrawals: React.FC = () => {
  const {
    balance,
    currency,
    withdrawals,
    withdrawalStats,
    loading,
    requestWithdrawal,
    loadWithdrawals,
    cancelWithdrawal,
  } = useFreelanceUnifiedWallet();
  const [isCreating, setIsCreating] = useState(false);
  const [showWithdrawalDialog, setShowWithdrawalDialog] = useState(false);

  const handleRequestWithdrawal = async (data: any) => {
    setIsCreating(true);
    try {
      const result = await requestWithdrawal(data.amount, data.method, data.withdrawalDetails);

      if (result) {
        setShowWithdrawalDialog(false);
        toast.success("Withdrawal request created successfully");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancelWithdrawal = async (withdrawalId: string) => {
    setIsCreating(true);
    try {
      const result = await cancelWithdrawal(withdrawalId);
      if (result) {
        toast.success("Withdrawal cancelled");
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-2xl font-bold">{currency} {balance.toLocaleString()}</p>
              </div>
              <Wallet className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Withdrawn</p>
                <p className="text-2xl font-bold">{currency} {withdrawalStats.totalWithdrawn.toLocaleString()}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{currency} {withdrawalStats.pendingAmount.toLocaleString()}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{withdrawalStats.withdrawalCount}</p>
              </div>
              <ArrowDownRight className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Withdrawals</h2>
          <p className="text-muted-foreground">Manage your earnings withdrawals</p>
        </div>
        <Dialog open={showWithdrawalDialog} onOpenChange={setShowWithdrawalDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Request Withdrawal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Request Withdrawal</DialogTitle>
              <DialogDescription>
                Withdraw your earnings from your unified wallet. No minimum amount required.
              </DialogDescription>
            </DialogHeader>
            <WithdrawalForm
              balance={balance}
              currency={currency}
              onSubmit={handleRequestWithdrawal}
              isLoading={isCreating}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Withdrawals List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : withdrawals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ArrowDownRight className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No withdrawals yet</p>
            <Button onClick={() => setShowWithdrawalDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Request Your First Withdrawal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {withdrawals.map((withdrawal) => (
            <WithdrawalCard
              key={withdrawal.id}
              withdrawal={withdrawal}
              onCancel={handleCancelWithdrawal}
              isLoading={isCreating}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default UnifiedWalletWithdrawals;

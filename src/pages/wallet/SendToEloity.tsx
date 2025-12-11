import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWalletContext } from "@/contexts/WalletContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { WalletActionHeader } from "@/components/wallet/WalletActionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowRight,
  Search,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react";

interface Recipient {
  id: string;
  name: string;
  username: string;
  avatar?: string;
}

interface RecipientData {
  type: "username";
  username?: string;
  name?: string;
}

const SendToEloity = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const { walletBalance } = useWalletContext();

  const [step, setStep] = useState<"recipient" | "amount" | "review" | "success">(
    "recipient"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [recipient, setRecipient] = useState<RecipientData>({ type: "username" });
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Mock recent recipients
  const recentRecipients: Recipient[] = [
    {
      id: "1",
      name: "John Doe",
      username: "johndoe",
      avatar: "/placeholder.svg",
    },
    {
      id: "2",
      name: "Sarah Smith",
      username: "sarahsmith",
      avatar: "/placeholder.svg",
    },
    {
      id: "3",
      name: "Mike Johnson",
      username: "mikej",
      avatar: "/placeholder.svg",
    },
  ];

  const filteredRecipients = recentRecipients.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContinueAmount = () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    if (parseFloat(amount) > (walletBalance?.total || 0)) {
      alert("Insufficient balance");
      return;
    }
    setStep("review");
  };

  const handleSendMoney = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setStep("success");
    } catch (error) {
      alert("Error sending money. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Select Recipient
  if (step === "recipient") {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <WalletActionHeader title="Send to Eloity User" subtitle="Choose a recipient" />

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-6">
            {/* Balance Card */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Available Balance</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      ${walletBalance?.total.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">💰</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Search Eloity User */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Search Eloity User
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Name or username (e.g., john or @johndoe)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            {searchQuery === "" && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Recent Recipients
                </h3>
              </div>
            )}

            <div className="space-y-2">
              {filteredRecipients.length > 0 ? (
                filteredRecipients.map((rec) => (
                  <button
                    key={rec.id}
                    onClick={() => {
                      setRecipient({ type: "username", username: rec.username, name: rec.name });
                      setStep("amount");
                    }}
                    className="w-full text-left"
                  >
                    <Card className="border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
                      <CardContent className="p-4 flex items-center gap-3">
                        <Avatar className="h-12 w-12 flex-shrink-0">
                          <AvatarImage src={rec.avatar} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white font-semibold">
                            {rec.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900">
                            {rec.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            @{rec.username}
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      </CardContent>
                    </Card>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No users found
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t p-4 sm:p-6">
          <Button
            variant="outline"
            onClick={() => navigate("/app/wallet")}
            className="w-full h-12"
          >
            Back
          </Button>
        </div>
      </div>
    );
  }

  // Step 2: Enter Amount
  if (step === "amount") {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <WalletActionHeader title="Enter Amount" />

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-6">
            {/* Selected Recipient */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white font-semibold">
                    {recipient.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("") || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-900">
                    {recipient.name || recipient.username}
                  </p>
                  <p className="text-sm text-gray-500">
                    @{recipient.username}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Amount Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-600">
                  $
                </span>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-10 h-16 text-3xl font-bold border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="mt-3 flex justify-between text-xs text-gray-600">
                <span>Min: $0.01</span>
                <span>Max: ${walletBalance?.total.toFixed(2) || "0.00"}</span>
              </div>
            </div>

            {/* Quick Amounts */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">
                Quick Amount
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[50, 100, 200].map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    variant="outline"
                    onClick={() => setAmount(quickAmount.toString())}
                    className="h-10 text-sm font-semibold border-gray-300 hover:border-blue-500 hover:text-blue-600"
                  >
                    ${quickAmount}
                  </Button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Note (Optional)
              </label>
              <Input
                placeholder="Add a note (visible to recipient)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 sm:p-6 space-y-3">
          <Button
            onClick={handleContinueAmount}
            disabled={!amount || parseFloat(amount) <= 0}
            className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-lg"
          >
            Continue
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setStep("recipient");
              setAmount("");
            }}
            className="w-full h-12"
          >
            Back
          </Button>
        </div>
      </div>
    );
  }

  // Step 3: Review Transfer
  if (step === "review") {
    const amountNum = parseFloat(amount);

    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <WalletActionHeader title="Review Transfer" />

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-6">
            {/* Transfer Details */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="p-6 space-y-6">
                  {/* From */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user?.profile?.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-br from-green-400 to-green-600 text-white font-semibold">
                          {user?.username?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs text-gray-600">From</p>
                        <p className="font-semibold text-gray-900">
                          {user?.profile?.full_name || user?.username || "Your Account"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Arrow Down */}
                  <div className="flex justify-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <ArrowRight className="h-5 w-5 text-blue-600 rotate-90" />
                    </div>
                  </div>

                  {/* To */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white font-semibold">
                          {recipient.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("") || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs text-gray-600">To</p>
                        <p className="font-semibold text-gray-900">
                          {recipient.name} (@{recipient.username})
                        </p>
                        <p className="text-xs text-gray-600">Eloity User</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200" />

                {/* Amount Section */}
                <div className="p-6">
                  <p className="text-sm text-gray-600 mb-2">Amount to Send</p>
                  <p className="text-4xl font-bold text-gray-900">
                    ${amountNum.toFixed(2)}
                  </p>
                  {note && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600">Note:</p>
                      <p className="text-sm text-gray-900 mt-1">{note}</p>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200" />

                {/* Fees */}
                <div className="p-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Transfer Fee</span>
                    <span className="font-semibold text-gray-900">
                      Free
                    </span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-gray-200 pt-3">
                    <span className="font-semibold text-gray-900">Total Charge</span>
                    <span className="font-bold text-lg text-gray-900">
                      ${amountNum.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Info Alert */}
            <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900">
                  Instant Transfer
                </p>
                <p className="text-xs text-blue-700 mt-0.5">
                  Money will arrive instantly
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 sm:p-6 space-y-3">
          <Button
            onClick={handleSendMoney}
            disabled={isLoading}
            className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Money"
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => setStep("amount")}
            disabled={isLoading}
            className="w-full h-12"
          >
            Back
          </Button>
        </div>
      </div>
    );
  }

  // Step 4: Success
  if (step === "success") {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-green-50 to-emerald-50">
        <WalletActionHeader title="Transfer Complete" />

        <div className="flex-1 flex items-center justify-center overflow-y-auto">
          <div className="px-4 sm:px-6 py-8 text-center max-w-md mx-auto">
            {/* Success Icon */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>

            {/* Success Message */}
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Money Sent!
            </h2>
            <p className="text-gray-600 mb-8">
              ${parseFloat(amount).toFixed(2)} has been sent to{" "}
              <span className="font-semibold">
                {recipient.name || recipient.username}
              </span>
            </p>

            {/* Details */}
            <Card className="border-0 shadow-sm mb-6">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID</span>
                  <span className="font-mono text-sm text-gray-900">
                    TXN{String(Date.now()).slice(-6)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type</span>
                  <span className="text-gray-900">P2P Transfer</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time</span>
                  <span className="text-gray-900">{new Date().toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className="text-green-600 font-semibold">Completed</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 sm:p-6 space-y-3">
          <Button
            onClick={() => navigate("/app/wallet")}
            className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-lg"
          >
            Back to Wallet
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setStep("recipient");
              setAmount("");
              setNote("");
              setRecipient({ type: "username" });
              setSearchQuery("");
            }}
            className="w-full h-12"
          >
            Send Again
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default SendToEloity;

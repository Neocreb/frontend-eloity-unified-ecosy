import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWalletContext } from "@/contexts/WalletContext";
import { WalletActionHeader } from "@/components/wallet/WalletActionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, ArrowRight, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { UserService } from "@/services/userService";
import { virtualGiftsService } from "@/services/virtualGiftsService";

interface Recipient {
  id: string;
  name: string;
  username: string;
  avatar?: string;
}

const Request = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<"recipient" | "amount" | "review" | "success">("recipient");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedPeople, setSuggestedPeople] = useState<Recipient[]>([]);
  const [searchResults, setSearchResults] = useState<Recipient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingSuggested, setLoadingSuggested] = useState(true);

  useEffect(() => {
    loadSuggestedPeople();
  }, []);

  const loadSuggestedPeople = async () => {
    try {
      setLoadingSuggested(true);
      if (!user?.id) return;

      const recipients = await virtualGiftsService.getRecentRecipients(user.id, 10);
      const mappedRecipients: Recipient[] = recipients.map((r) => ({
        id: r.id,
        name: r.display_name || r.username,
        username: r.username,
        avatar: r.avatar_url,
      }));
      setSuggestedPeople(mappedRecipients);
    } catch (error) {
      console.error("Error loading suggested people:", error);
    } finally {
      setLoadingSuggested(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim()) {
      searchForUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchForUsers = async () => {
    try {
      setIsSearching(true);
      const results = await UserService.searchUsers(searchQuery, 20);
      const mappedResults: Recipient[] = results.map((u) => ({
        id: u.id,
        name: u.full_name || u.name || u.username || "Unknown",
        username: u.username || "unknown",
        avatar: u.avatar_url || u.avatar,
      }));
      setSearchResults(mappedResults);
    } catch (error) {
      console.error("Error searching users:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const filtered = searchQuery.trim() ? searchResults : suggestedPeople;

  const handleSelectRecipient = (recipient: Recipient) => {
    setSelectedRecipient(recipient);
    setStep("amount");
  };

  const handleContinue = () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    setStep("review");
  };

  const handleSendRequest = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setStep("success");
    } catch (error) {
      alert("Error sending request");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "recipient") {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <WalletActionHeader title="Request Money" />
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                From Who?
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Name or username"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              {filtered.length > 0 ? (
                filtered.map((person) => (
                  <button
                    key={person.id}
                    onClick={() => handleSelectRecipient(person)}
                    className="w-full text-left"
                  >
                    <Card className="border hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer">
                      <CardContent className="p-4 flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={person.avatar} />
                          <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-emerald-600 text-white">
                            {person.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{person.name}</p>
                          <p className="text-sm text-gray-500">@{person.username}</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                      </CardContent>
                    </Card>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">No people found</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === "amount") {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <WalletActionHeader title="Request Amount" />
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedRecipient?.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-emerald-600 text-white">
                    {selectedRecipient?.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs text-gray-600">Requesting from</p>
                  <p className="font-semibold text-gray-900">{selectedRecipient?.name}</p>
                </div>
              </CardContent>
            </Card>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Amount Needed
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
                  className="pl-10 h-16 text-3xl font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Description (Optional)
              </label>
              <Input
                placeholder="What is this payment for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-12"
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t p-4 sm:p-6 space-y-3">
          <Button
            onClick={handleContinue}
            disabled={!amount}
            className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold"
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

  if (step === "review") {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <WalletActionHeader title="Review Request" />
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedRecipient?.avatar} />
                    <AvatarFallback className="bg-emerald-500 text-white">
                      {selectedRecipient?.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs text-gray-600">Requesting from</p>
                    <p className="font-semibold text-gray-900">{selectedRecipient?.name}</p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <p className="text-sm text-gray-600 mb-2">Amount Requested</p>
                  <p className="text-4xl font-bold text-emerald-600">${parseFloat(amount).toFixed(2)}</p>
                </div>

                {description && (
                  <>
                    <div className="border-t border-gray-200 pt-6">
                      <p className="text-sm text-gray-600 mb-2">Note</p>
                      <p className="text-gray-900">{description}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-900">Request sent instantly</p>
                <p className="text-xs text-emerald-700 mt-0.5">They'll see it in their app</p>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t p-4 sm:p-6 space-y-3">
          <Button
            onClick={handleSendRequest}
            disabled={isLoading}
            className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Request"
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

  if (step === "success") {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
        <WalletActionHeader title="Request Sent" />
        <div className="flex-1 flex items-center justify-center overflow-y-auto">
          <div className="px-4 sm:px-6 py-8 text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">Request Sent!</h2>
            <p className="text-gray-600 mb-8">
              Requesting ${parseFloat(amount).toFixed(2)} from{" "}
              <span className="font-semibold">{selectedRecipient?.name}</span>
            </p>

            <Card className="border-0 shadow-sm mb-6">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className="text-emerald-600 font-semibold">Pending</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t p-4 sm:p-6 space-y-3">
          <Button
            onClick={() => navigate("/app/wallet")}
            className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
          >
            Back to Wallet
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default Request;

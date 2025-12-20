import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ChevronLeft,
  Gift,
  Search,
  Heart,
  Star,
  Zap,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import { virtualGiftsService, VirtualGift } from "@/services/virtualGiftsService";
import { giftTipNotificationService } from "@/services/giftTipNotificationService";

export default function RewardsSendGifts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedGift, setSelectedGift] = useState<VirtualGift | null>(null);
  const [recipientUsername, setRecipientUsername] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [virtualGifts, setVirtualGifts] = useState<VirtualGift[]>([]);
  const [giftQuantity, setGiftQuantity] = useState(1);
  const [tipAmount, setTipAmount] = useState(5);

  useEffect(() => {
    loadVirtualGifts();
  }, []);

  const loadVirtualGifts = async () => {
    try {
      const gifts = await virtualGiftsService.getVirtualGiftsFromDB();
      setVirtualGifts(gifts);
    } catch (error) {
      console.error("Error loading virtual gifts:", error);
      toast({
        title: "Error",
        description: "Failed to load gifts. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  const handleSearchRecipient = async () => {
    if (!recipientUsername.trim()) {
      toast({
        title: "Enter username",
        description: "Please enter a username to search",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      // In a real app, this would search the database for the user
      // For now, we'll just use the username as the recipient ID
      setRecipientId(recipientUsername);
      toast({
        title: "Recipient found",
        description: `Ready to send gift to ${recipientUsername}`,
      });
    } catch (error) {
      console.error("Error searching for recipient:", error);
      toast({
        title: "User not found",
        description: "Could not find this user. Please try another username.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendGift = async () => {
    if (!selectedGift || !recipientUsername.trim() || !user?.id) {
      toast({
        title: "Missing information",
        description: "Please select a gift and enter a recipient",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const transaction = await virtualGiftsService.sendGift(
        user.id,
        recipientId || recipientUsername,
        selectedGift.id,
        giftQuantity,
        message || undefined,
        false,
      );

      if (transaction) {
        // Trigger notification service
        giftTipNotificationService.notifyGiftSent({
          senderName: user.user_metadata?.username || 'User',
          senderAvatar: user.user_metadata?.avatar_url,
          recipientName: recipientUsername,
          amount: selectedGift.price * giftQuantity,
          currency: selectedGift.currency,
          giftEmoji: selectedGift.emoji,
          giftName: selectedGift.name,
          message: message || undefined,
          isAnonymous: false,
          timestamp: new Date().toISOString(),
        });

        toast({
          title: "Gift sent! 🎁",
          description: `You sent ${giftQuantity}x ${selectedGift.name} to ${recipientUsername}`,
        });

        navigate(-1);
      } else {
        throw new Error("Failed to send gift");
      }
    } catch (error) {
      console.error("Error sending gift:", error);
      toast({
        title: "Failed to send gift",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTip = async () => {
    if (!recipientUsername.trim() || !user?.id) {
      toast({
        title: "Missing information",
        description: "Please enter a recipient and tip amount",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const transaction = await virtualGiftsService.sendTip(
        user.id,
        recipientId || recipientUsername,
        tipAmount,
        message || undefined,
        undefined,
        false,
      );

      if (transaction) {
        // Trigger notification service
        giftTipNotificationService.notifyTipSent({
          senderName: user.user_metadata?.username || 'User',
          senderAvatar: user.user_metadata?.avatar_url,
          recipientName: recipientUsername,
          amount: tipAmount,
          currency: 'USD',
          message: message || undefined,
          isAnonymous: false,
          timestamp: new Date().toISOString(),
        });

        toast({
          title: "Tip sent! 💰",
          description: `You sent $${tipAmount} tip to ${recipientUsername}`,
        });

        navigate(-1);
      } else {
        throw new Error("Failed to send tip");
      }
    } catch (error) {
      console.error("Error sending tip:", error);
      toast({
        title: "Failed to send tip",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

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
            <div className="p-2 rounded-full bg-pink-100 dark:bg-pink-900/30">
              <Gift className="h-4 w-4 sm:h-5 sm:w-5 text-pink-600" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">Send Gifts & Tips</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-6">
          <Tabs defaultValue="gifts" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="gifts" className="flex items-center gap-2">
                <Gift className="h-4 w-4" />
                <span className="hidden sm:inline">Gifts</span>
              </TabsTrigger>
              <TabsTrigger value="tips" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">Tips</span>
              </TabsTrigger>
            </TabsList>

            {/* Gifts Tab */}
            <TabsContent value="gifts" className="space-y-6">
              {/* Recipient Selection */}
              <div className="space-y-3">
                <Label htmlFor="recipient" className="text-base font-bold">
                  Send To
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="recipient"
                      placeholder="Enter username..."
                      value={recipientUsername}
                      onChange={(e) => setRecipientUsername(e.target.value)}
                      className="pl-10 h-12"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleSearchRecipient}
                    disabled={isSearching}
                    className="h-12"
                  >
                    {isSearching ? "Searching..." : "Search"}
                  </Button>
                </div>
              </div>

              {/* Gift Selection */}
              <div className="space-y-4">
                <Label className="text-base font-bold">Choose a Gift</Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
                  {virtualGifts.length > 0 ? (
                    virtualGifts.slice(0, 12).map((gift) => (
                      <button
                        key={gift.id}
                        onClick={() => setSelectedGift(gift)}
                        className={`p-3 sm:p-4 rounded-lg border-2 transition-all text-center ${
                          selectedGift?.id === gift.id
                            ? "border-purple-600 bg-purple-50 dark:bg-purple-900/30"
                            : "border-gray-200 hover:border-gray-300 dark:border-gray-800"
                        }`}
                      >
                        <div className="text-3xl sm:text-4xl mb-1">{gift.emoji}</div>
                        <div className="text-xs sm:text-sm font-medium truncate">
                          {gift.name}
                        </div>
                        <div className="text-xs text-purple-600 dark:text-purple-400 font-bold mt-1">
                          ${gift.price.toFixed(2)}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="col-span-3 sm:col-span-4 text-center py-8 text-gray-500">
                      Loading gifts...
                    </div>
                  )}
                </div>
              </div>

              {/* Quantity Selection */}
              {selectedGift && (
                <div className="space-y-3">
                  <Label className="text-base font-bold">Quantity</Label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setGiftQuantity(Math.max(1, giftQuantity - 1))}
                      className="h-10 w-10 p-0"
                    >
                      -
                    </Button>
                    <span className="flex-1 text-center font-bold text-lg">{giftQuantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setGiftQuantity(Math.min(99, giftQuantity + 1))}
                      className="h-10 w-10 p-0"
                    >
                      +
                    </Button>
                  </div>
                </div>
              )}

              {/* Message */}
              <div className="space-y-3">
                <Label htmlFor="message" className="text-base font-bold">
                  Message (Optional)
                </Label>
                <textarea
                  id="message"
                  placeholder="Add a personal message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full h-24 p-3 border border-gray-300 dark:border-gray-700 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-600 dark:bg-gray-900 dark:text-white"
                />
              </div>

              {/* Summary */}
              {selectedGift && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Gift Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Gift</span>
                      <span className="font-bold">
                        {selectedGift.emoji} {selectedGift.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">To</span>
                      <span className="font-bold">
                        {recipientUsername || "Select recipient"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Quantity</span>
                      <span className="font-bold">×{giftQuantity}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Total Cost</span>
                      <span className="font-bold text-lg">
                        ${(selectedGift.price * giftQuantity).toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Send Button */}
              <Button
                onClick={handleSendGift}
                disabled={!selectedGift || !recipientUsername.trim() || isLoading}
                className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-bold"
              >
                {isLoading ? "Sending..." : "Send Gift"}
              </Button>
            </TabsContent>

            {/* Tips Tab */}
            <TabsContent value="tips" className="space-y-6">
              {/* Recipient Selection */}
              <div className="space-y-3">
                <Label htmlFor="tip-recipient" className="text-base font-bold">
                  Send To
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="tip-recipient"
                      placeholder="Enter username..."
                      value={recipientUsername}
                      onChange={(e) => setRecipientUsername(e.target.value)}
                      className="pl-10 h-12"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleSearchRecipient}
                    disabled={isSearching}
                    className="h-12"
                  >
                    {isSearching ? "Searching..." : "Search"}
                  </Button>
                </div>
              </div>

              {/* Tip Amount Selection */}
              <div className="space-y-3">
                <Label className="text-base font-bold">Tip Amount</Label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 5, 10, 20, 50].map((amount) => (
                    <Button
                      key={amount}
                      variant={tipAmount === amount ? "default" : "outline"}
                      onClick={() => setTipAmount(amount)}
                      className="text-sm h-10"
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div className="space-y-3">
                <Label htmlFor="custom-tip" className="text-base font-bold">
                  Custom Amount
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="custom-tip"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(parseFloat(e.target.value) || 0)}
                    className="pl-10 h-12"
                  />
                </div>
              </div>

              {/* Message */}
              <div className="space-y-3">
                <Label htmlFor="tip-message" className="text-base font-bold">
                  Message (Optional)
                </Label>
                <textarea
                  id="tip-message"
                  placeholder="Thank you message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full h-24 p-3 border border-gray-300 dark:border-gray-700 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-600 dark:bg-gray-900 dark:text-white"
                />
              </div>

              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tip Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">To</span>
                    <span className="font-bold">
                      {recipientUsername || "Select recipient"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Tip Amount</span>
                    <span className="font-bold text-lg">${tipAmount.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Send Button */}
              <Button
                onClick={handleSendTip}
                disabled={!recipientUsername.trim() || tipAmount <= 0 || isLoading}
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold"
              >
                {isLoading ? "Sending..." : `Send $${tipAmount.toFixed(2)} Tip`}
              </Button>
            </TabsContent>
          </Tabs>

          {/* Info Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Gifts and tips will be delivered immediately and your recipient will be notified.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}

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
            <h1 className="text-xl sm:text-2xl font-bold">Send Gifts</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-6">
          {/* Gift Selection */}
          <div className="space-y-4">
            <Label className="text-base font-bold">Choose a Gift</Label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {GIFT_CATALOG.map((gift) => (
                <button
                  key={gift.id}
                  onClick={() => setSelectedGift(gift)}
                  className={`p-3 sm:p-4 rounded-lg border-2 transition-all text-center ${
                    selectedGift?.id === gift.id
                      ? "border-purple-600 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-3xl sm:text-4xl mb-1">{gift.emoji}</div>
                  <div className="text-xs sm:text-sm font-medium text-gray-900">
                    {gift.name}
                  </div>
                  <div className="text-xs text-purple-600 font-bold mt-1">
                    {gift.price} pts
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Recipient Selection */}
          <div className="space-y-3">
            <Label htmlFor="recipient" className="text-base font-bold">
              Send To
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="recipient"
                placeholder="Search by username..."
                value={recipientUsername}
                onChange={(e) => setRecipientUsername(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
          </div>

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
              className="w-full h-24 p-3 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-600"
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
                  <span className="text-gray-600">Gift</span>
                  <span className="font-bold">
                    {selectedGift.emoji} {selectedGift.name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">To</span>
                  <span className="font-bold">
                    {recipientUsername || "Select recipient"}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="text-gray-600">Cost</span>
                  <span className="font-bold text-lg">{selectedGift.price} pts</span>
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

          {/* Info Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Gifts will be delivered immediately and your recipient will be notified.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
} from "lucide-react";

const GIFT_CATALOG = [
  { id: 1, name: "Rose", emoji: "🌹", price: 5, color: "text-red-500" },
  { id: 2, name: "Diamond", emoji: "💎", price: 25, color: "text-blue-500" },
  { id: 3, name: "Crown", emoji: "👑", price: 50, color: "text-yellow-500" },
  { id: 4, name: "Fire", emoji: "🔥", price: 10, color: "text-orange-500" },
  { id: 5, name: "Star", emoji: "⭐", price: 15, color: "text-yellow-400" },
  { id: 6, name: "Heart", emoji: "❤️", price: 3, color: "text-red-600" },
];

export default function RewardsSendGifts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedGift, setSelectedGift] = useState<typeof GIFT_CATALOG[0] | null>(null);
  const [recipientUsername, setRecipientUsername] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendGift = async () => {
    if (!selectedGift || !recipientUsername.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      navigate(-1);
    } finally {
      setIsLoading(false);
    }
  };

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

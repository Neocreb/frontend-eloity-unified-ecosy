import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useWalletContext } from "@/contexts/WalletContext";
import {
  RequestMoneyModal,
} from "./QuickActionModals";
import WalletServicesGrid from "./WalletServicesGrid";
import {
  Smartphone,
  Gift,
  Store,
  Users,
  Clock,
  Send,
  Loader2,
} from "lucide-react";
import { virtualGiftsService } from "@/services/virtualGiftsService";

interface ActionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
  badge?: {
    text: string;
    variant: "default" | "new" | "promotion";
  };
}

interface RecentRecipient {
  id: string;
  name: string;
  avatar?: string;
  lastAmount: number;
  frequency: number;
}

const QuickActionsWidget = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { walletBalance, transactions, getTotalEarnings } = useWalletContext();
  const [recentRecipients, setRecentRecipients] = useState<RecentRecipient[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(true);

  useEffect(() => {
    loadRecentRecipients();
  }, []);

  const loadRecentRecipients = async () => {
    try {
      setLoadingRecipients(true);
      if (!user?.id) return;

      const recipients = await virtualGiftsService.getRecentRecipients(user.id, 5);
      const mappedRecipients: RecentRecipient[] = recipients.map((r) => ({
        id: r.id,
        name: r.display_name || r.username,
        avatar: r.avatar_url,
        lastAmount: 0,
        frequency: 1,
      }));
      setRecentRecipients(mappedRecipients);
    } catch (error) {
      console.error("Error loading recent recipients:", error);
    } finally {
      setLoadingRecipients(false);
    }
  };

  // Modal states
  const [showSendModal, setShowSendModal] = useState(false);


  // Virtual Gifts & Gift Cards Actions (Tertiary)
  const giftActions: ActionItem[] = [
    {
      id: "send-gifts",
      label: "Send Gifts",
      icon: <Gift className="h-6 w-6" />,
      color: "bg-rose-500",
      action: () => navigate("/app/send-gifts"),
      badge: { text: "Popular", variant: "promotion" },
    },
    {
      id: "buy-gift",
      label: "Buy Gift Cards",
      icon: <Gift className="h-6 w-6" />,
      color: "bg-pink-500",
      action: () => navigate("/app/wallet/buy-gift-cards"),
    },
    {
      id: "sell-gift",
      label: "Sell Gift Cards",
      icon: <Store className="h-6 w-6" />,
      color: "bg-teal-500",
      action: () => navigate("/app/wallet/sell-gift-cards"),
    },
  ];

  const ActionCard = ({ action }: { action: ActionItem }) => (
    <Button
      onClick={action.action}
      className={`${action.color} text-white border-0 hover:shadow-lg transition-all duration-200 flex flex-col items-center gap-2 h-auto py-6 px-4 rounded-xl hover:scale-105 relative group`}
    >
      <div className="flex-1 flex items-center justify-center">{action.icon}</div>
      <span className="text-xs font-semibold text-center leading-tight">{action.label}</span>
      {action.badge && (
        <Badge
          className={`absolute top-1 right-1 text-xs font-bold ${
            action.badge.variant === "new"
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              : "bg-gradient-to-r from-amber-400 to-orange-500 text-white"
          }`}
        >
          {action.badge.text}
        </Badge>
      )}
    </Button>
  );

  // Quick action card component for gift actions
  const ActionCardSmall = ({ action }: { action: ActionItem }) => (
    <Button
      onClick={action.action}
      className={`${action.color} text-white border-0 hover:shadow-lg transition-all duration-200 flex flex-col items-center gap-2 h-auto py-4 px-3 rounded-xl hover:scale-105 relative group`}
    >
      <div className="flex-1 flex items-center justify-center">{action.icon}</div>
      <span className="text-xs font-semibold text-center leading-tight">{action.label}</span>
      {action.badge && (
        <Badge
          className={`absolute top-1 right-1 text-xs font-bold ${
            action.badge.variant === "new"
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              : "bg-gradient-to-r from-amber-400 to-orange-500 text-white"
          }`}
        >
          {action.badge.text}
        </Badge>
      )}
    </Button>
  );

  return (
    <div className="space-y-6">
      {/* Wallet Services Grid - Main Feature */}
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Smartphone className="h-5 w-5 text-eloity-500" />
            Wallet Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          <WalletServicesGrid />
        </CardContent>
      </Card>

      {/* Virtual Gifts & Gift Cards Actions */}
      {giftActions.length > 0 && (
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Gift className="h-5 w-5 text-rose-500" />
              Gifts & Rewards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {giftActions.map((action) => (
                <ActionCardSmall key={action.id} action={action} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Recipients */}
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Users className="h-5 w-5 text-indigo-500" />
            Frequent Recipients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loadingRecipients ? (
              <div className="text-center py-6">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-600" />
                <p className="text-sm text-gray-500 mt-2">Loading recipients...</p>
              </div>
            ) : recentRecipients.length > 0 ? (
              recentRecipients.map((recipient) => (
                <div
                  key={recipient.id}
                  className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all duration-200 cursor-pointer group"
                  onClick={() => setShowSendModal(true)}
                >
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={recipient.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white font-semibold">
                      {recipient.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900">{recipient.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      Recipient
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="shrink-0 bg-blue-500 hover:bg-blue-600 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSendModal(true);
                    }}
                  >
                    <Send className="h-3 w-3 sm:mr-1" />
                    <span className="hidden sm:inline text-xs">Send</span>
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-500">
                <p className="text-sm">No recent recipients yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Clock className="h-5 w-5 text-blue-500" />
            Today's Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center p-2">
              <div className="text-3xl font-bold text-green-600">
                +${getTotalEarnings(1).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Earned Today</div>
            </div>
            <div className="text-center p-2">
              <div className="text-3xl font-bold text-blue-600">
                {transactions.filter((t) => new Date(t.timestamp).toDateString() === new Date().toDateString()).length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Transactions</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Action Modals - Send Money still uses modal for now */}
      <RequestMoneyModal isOpen={showSendModal} onClose={() => setShowSendModal(false)} />
    </div>
  );
};

export default QuickActionsWidget;

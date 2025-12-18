import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
  DollarSign,
  TrendingUp,
  Users,
  Zap,
  BarChart3,
  History,
  Handshake,
  ArrowUpDown,
  Activity,
  UserPlus,
  Star,
  Trophy,
  Gift,
  Target,
} from "lucide-react";

interface CreatorEconomyHeaderProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  category: "creator" | "activity";
  highlight?: boolean;
}

const CreatorEconomyHeader = ({
  activeTab,
  setActiveTab,
}: CreatorEconomyHeaderProps) => {
  const { user } = useAuth();

  const creatorTabs: TabItem[] = [
    { id: "overview", label: "Overview", icon: BarChart3, category: "creator" },
    { id: "content", label: "Content", icon: TrendingUp, category: "creator" },
    { id: "boosts", label: "Boosts", icon: Zap, category: "creator" },
    { id: "subscribers", label: "Subscribers", icon: Users, category: "creator" },
    { id: "withdraw", label: "Withdraw", icon: ArrowUpDown, category: "creator" },
    { id: "history", label: "History", icon: History, category: "creator" },
    { id: "partnerships", label: "Partnerships", icon: Handshake, category: "creator" },
  ];

  const activityTabs: TabItem[] = [
    { id: "activity", label: "Activity", icon: Activity, category: "activity" },
    { id: "challenges", label: "Challenges", icon: Target, category: "activity" },
    { id: "battles", label: "Battles", icon: Trophy, category: "activity" },
    { id: "gifts", label: "Gifts & Tips", icon: Gift, category: "activity" },
    { id: "referrals", label: "Referrals", icon: UserPlus, category: "activity" },
  ];

  const TabButton = ({ tab, isActive }: { tab: TabItem; isActive: boolean }) => {
    const Icon = tab.icon;
    const isPurple = tab.category === "creator";

    return (
      <Button
        key={tab.id}
        variant={isActive ? "default" : "outline"}
        size="sm"
        onClick={() => setActiveTab(tab.id)}
        className={`flex items-center gap-1.5 transition-all duration-200 ${
          isActive
            ? isPurple
              ? "bg-purple-600 hover:bg-purple-700 border-purple-600 text-white"
              : "bg-blue-600 hover:bg-blue-700 border-blue-600 text-white"
            : isPurple
              ? "hover:bg-purple-50 border-gray-200 text-gray-700"
              : "hover:bg-blue-50 border-blue-200 text-blue-700"
        }`}
      >
        <Icon className="w-4 h-4" />
        <span className="hidden sm:inline text-xs md:text-sm font-medium">
          {tab.label}
        </span>
      </Button>
    );
  };

  return (
    <div className="mb-6 space-y-4">
      {/* Creator Economy Section */}
      <div className="space-y-3 bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-6 bg-purple-600 rounded-full"></div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              Creator Economy
            </h3>
          </div>
          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200">
            Active
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {creatorTabs.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
            />
          ))}
        </div>
      </div>

      {/* Activity Economy Section */}
      <div className="space-y-3 bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              Activity Economy 2.0
            </h3>
          </div>
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 flex items-center gap-1">
            <Star className="w-3 h-3" />
            NEW
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {activityTabs.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
            />
          ))}
        </div>
      </div>

      {/* Info Message */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex items-start gap-2">
        <div className="text-lg">💡</div>
        <div>
          <p className="font-medium">Maximize Your Earnings</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Explore all creator economy features and activity rewards to grow your income.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreatorEconomyHeader;

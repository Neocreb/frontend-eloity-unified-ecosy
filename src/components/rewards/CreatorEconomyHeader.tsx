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
  const mainTabs: TabItem[] = [
    { id: "overview", label: "Overview", icon: BarChart3, category: "creator" },
    { id: "activity", label: "Activity", icon: Activity, category: "activity" },
    { id: "challenges", label: "Challenges", icon: Target, category: "activity" },
    { id: "referrals", label: "Referrals", icon: UserPlus, category: "activity" },
    { id: "battles", label: "Battles", icon: Trophy, category: "activity" },
  ];

  const TabButton = ({ tab, isActive }: { tab: TabItem; isActive: boolean }) => {
    const Icon = tab.icon;

    return (
      <Button
        key={tab.id}
        variant="ghost"
        size="sm"
        onClick={() => setActiveTab(tab.id)}
        className={`flex items-center gap-1 relative transition-all duration-200 text-xs md:text-sm font-medium ${
          isActive
            ? "text-gray-900"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        <Icon className="w-4 h-4 hidden sm:inline" />
        <span>{tab.label}</span>
        {isActive && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
        )}
      </Button>
    );
  };

  return (
    <div className="border-b border-gray-200 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 mb-6">
      <div className="flex gap-6 overflow-x-auto">
        {mainTabs.map((tab) => (
          <TabButton
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
          />
        ))}
      </div>
    </div>
  );
};

export default CreatorEconomyHeader;

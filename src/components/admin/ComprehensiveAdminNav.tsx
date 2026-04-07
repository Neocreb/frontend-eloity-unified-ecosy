// @ts-nocheck
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Shield,
  BarChart3,
  Users,
  Settings,
  Eye,
  UserCog,
  Bell,
  Briefcase,
  ShoppingCart,
  Bitcoin,
  MessageSquare,
  Star,
  Flag,
  CreditCard,
  Zap,
  Globe,
  FileText,
  AlertTriangle,
  Database,
  Activity,
  UserCheck,
  DollarSign,
  ChevronDown,
  Sparkles,
  TrendingUp,
  BarChart4,
} from "lucide-react";

interface NavItem {
  title: string;
  href?: string;
  icon: React.ElementType;
  description: string;
  children?: NavItem[];
}

const adminNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: BarChart3,
    description: "Platform overview and analytics",
  },
  {
    title: "User Management",
    href: "/admin/users",
    icon: Users,
    description: "Manage users, KYC, and permissions",
  },
  {
    title: "KYC Verification",
    href: "/admin/kyc",
    icon: UserCheck,
    description: "Review identity verifications and compliance",
  },
  {
    title: "Freelance",
    href: "/admin/freelance",
    icon: Briefcase,
    description: "Jobs, projects, and freelancer management",
  },
  {
    title: "Marketplace",
    icon: ShoppingCart,
    description: "Products, orders, and seller management",
    children: [
      {
        title: "Overview",
        href: "/admin/marketplace",
        icon: ShoppingCart,
        description: "Main marketplace dashboard",
      },
      {
        title: "Flash Sales",
        href: "/admin/marketplace/flash-sales",
        icon: Sparkles,
        description: "Manage flash sales and promotions",
      },
      {
        title: "Promotional Codes",
        href: "/admin/marketplace/promotional-codes",
        icon: Tag,
        description: "Create and manage coupons",
      },
      {
        title: "Analytics",
        href: "/admin/marketplace/analytics",
        icon: TrendingUp,
        description: "Marketplace performance insights",
      },
      {
        title: "Reviews",
        href: "/admin/marketplace/reviews",
        icon: Star,
        description: "Moderate product reviews",
      },
    ],
  },
  {
    title: "P2P Trading",
    href: "/admin/crypto",
    icon: Bitcoin,
    description: "Crypto trading and dispute resolution",
  },
  {
    title: "Content Moderation",
    href: "/admin/moderation",
    icon: Eye,
    description: "Review reports and moderate content",
  },
  {
    title: "Financial",
    href: "/admin/financial",
    icon: CreditCard,
    description: "Platform earnings and wallet management",
  },
  {
    title: "RELOADLY Services",
    icon: DollarSign,
    description: "Manage RELOADLY integrations",
    children: [
      {
        title: "Commission Settings",
        href: "/admin/reloadly/commission",
        icon: CreditCard,
        description: "Manage commission settings",
      },
      {
        title: "Transactions",
        href: "/admin/reloadly/transactions",
        icon: FileText,
        description: "View transaction history",
      },
      {
        title: "Reports",
        href: "/admin/reloadly/reports",
        icon: BarChart4,
        description: "Commission and revenue analytics",
      },
    ],
  },
  {
    title: "Boost System",
    href: "/admin/boosts",
    icon: Zap,
    description: "Content promotion and advertising",
  },
  {
    title: "Chat & Messages",
    href: "/admin/chat",
    icon: MessageSquare,
    description: "Monitor and moderate communications",
  },
  {
    title: "Reports & Analytics",
    href: "/admin/analytics",
    icon: Activity,
    description: "Detailed platform analytics",
  },
  {
    title: "System Health",
    href: "/admin/system",
    icon: Database,
    description: "Server performance and monitoring",
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
    description: "Platform configuration and admin settings",
  },
];

interface ComprehensiveAdminNavProps {
  className?: string;
  onNavigate?: () => void;
}

interface ExpandedState {
  [key: string]: boolean;
}

const Tag = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
    <circle cx="7" cy="7" r="1.5" />
  </svg>
);

export function ComprehensiveAdminNav({
  className,
  onNavigate,
}: ComprehensiveAdminNavProps) {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<ExpandedState>({
    Marketplace: true,
    "RELOADLY Services": false,
  });

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const isActiveOrChildActive = (item: NavItem): boolean => {
    if (item.href && location.pathname === item.href) {
      return true;
    }
    if (item.children) {
      return item.children.some((child) => isActiveOrChildActive(child));
    }
    return false;
  };

  const renderNavItem = (item: NavItem, level: number = 0): React.ReactNode => {
    const Icon = item.icon;
    const isActive = item.href && location.pathname === item.href;
    const isExpanded = expandedItems[item.title];
    const hasChildren = item.children && item.children.length > 0;
    const isAnyChildActive = hasChildren && item.children.some((child) => isActiveOrChildActive(child));

    if (hasChildren) {
      return (
        <div key={item.title} className="mb-1">
          <button
            onClick={() => toggleExpanded(item.title)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all w-full text-left hover:bg-accent hover:text-accent-foreground",
              isAnyChildActive
                ? "bg-accent/50 text-accent-foreground font-medium"
                : "text-muted-foreground",
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{item.title}</div>
              <div className="text-xs text-muted-foreground line-clamp-1">
                {item.description}
              </div>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 flex-shrink-0 transition-transform duration-200",
                isExpanded ? "rotate-180" : "",
              )}
            />
          </button>

          {isExpanded && (
            <div className="ml-2 mt-1 space-y-1 border-l border-border pl-3">
              {item.children.map((child) => renderNavItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.href}
        to={item.href!}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground",
          isActive
            ? "bg-accent text-accent-foreground font-medium"
            : "text-muted-foreground",
        )}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{item.title}</div>
          <div className="text-xs text-muted-foreground line-clamp-1">
            {item.description}
          </div>
        </div>
        {isActive && (
          <div className="ml-auto h-2 w-2 rounded-full bg-primary flex-shrink-0" />
        )}
      </Link>
    );
  };

  return (
    <nav className={cn("space-y-2", className)}>
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
          Admin Panel
        </h2>
        <div className="space-y-1">
          {adminNavItems.map((item) => renderNavItem(item))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-3 py-2 border-t">
        <h3 className="mb-2 px-4 text-sm font-semibold tracking-tight text-muted-foreground">
          Quick Actions
        </h3>
        <div className="space-y-1">
          <button className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground w-full text-left">
            <Bell className="h-4 w-4" />
            <span>Send Global Alert</span>
          </button>
          <button className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground w-full text-left">
            <Flag className="h-4 w-4" />
            <span>Emergency Lockdown</span>
          </button>
          <button className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground w-full text-left">
            <Globe className="h-4 w-4" />
            <span>Platform Status</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

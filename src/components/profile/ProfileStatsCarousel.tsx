import React, { useState, useEffect, useRef } from "react";
import { StatsCard } from "./StatsCard";
import { cn } from "@/lib/utils";
import {
  Users,
  UserPlus,
  MessageSquare,
  Eye,
  ShoppingBag,
  TrendingUp,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Coins,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserProfile } from "@/types/user";
import { useProfileStats } from "@/hooks/useProfileStats";

interface ProfileStatsCarouselProps {
  profile: UserProfile;
  followerCount?: number;
  followingCount?: number;
  loading?: boolean;
  onStatClick?: (statType: string) => void;
  enableRealData?: boolean;
  isOwnProfile?: boolean;
  walletBalance?: number;
  eloPoints?: number;
}

interface StatItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  value: string | number;
  description?: string;
  gradient: string;
  onClick?: string;
  isPrivate?: boolean;
}

export const ProfileStatsCarousel: React.FC<ProfileStatsCarouselProps> = ({
  profile,
  followerCount: initialFollowerCount = 0,
  followingCount: initialFollowingCount = 0,
  loading: externalLoading = false,
  onStatClick,
  enableRealData = true,
  isOwnProfile = false,
  walletBalance = 0,
  eloPoints = 0,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch real stats from database
  const stats = useProfileStats(
    profile,
    profile?.id,
    enableRealData,
    walletBalance,
    eloPoints
  );

  // Mark carousel as initialized when stats load completes
  useEffect(() => {
    if (!stats.loading) {
      setIsInitialized(true);
    }
  }, [stats.loading]);

  // Use real data if available, otherwise fallback to props
  const followerCount = stats.followerCount || initialFollowerCount;
  const followingCount = stats.followingCount || initialFollowingCount;
  const loading = externalLoading || stats.loading;

  // Handle scroll navigation
  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    
    const itemWidth = 320; // Approximate card width with gap
    if (direction === "left") {
      scrollContainerRef.current.scrollBy({ left: -itemWidth, behavior: "smooth" });
      setCurrentIndex(Math.max(0, currentIndex - 1));
    } else {
      scrollContainerRef.current.scrollBy({ left: itemWidth, behavior: "smooth" });
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Build stats items with conditional visibility
  const baseStatsItems: StatItem[] = [
    {
      id: "posts",
      label: "Posts",
      icon: <MessageSquare className="h-6 w-6" aria-hidden="true" />,
      value: profile?.posts_count || 0,
      description: "Content shared",
      gradient: "bg-gradient-to-br from-blue-500 to-blue-600",
      onClick: "posts",
    },
    {
      id: "followers",
      label: "Followers",
      icon: <Users className="h-6 w-6" aria-hidden="true" />,
      value: followerCount,
      description: "People following",
      gradient: "bg-gradient-to-br from-purple-500 to-purple-600",
      onClick: "followers",
    },
    {
      id: "following",
      label: "Following",
      icon: <UserPlus className="h-6 w-6" aria-hidden="true" />,
      value: followingCount,
      description: "People you follow",
      gradient: "bg-gradient-to-br from-pink-500 to-pink-600",
      onClick: "following",
    },
    {
      id: "views",
      label: "Profile Views",
      icon: <Eye className="h-6 w-6" aria-hidden="true" />,
      value: stats.profileViews,
      description: "Times viewed",
      gradient: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      onClick: "views",
    },
    {
      id: "sales",
      label: "Marketplace Sales",
      icon: <ShoppingBag className="h-6 w-6" aria-hidden="true" />,
      value: stats.marketplaceSales,
      description: "Items sold",
      gradient: "bg-gradient-to-br from-amber-500 to-amber-600",
      onClick: "sales",
    },
    {
      id: "trades",
      label: "P2P Trades",
      icon: <TrendingUp className="h-6 w-6" aria-hidden="true" />,
      value: stats.cryptoTrades,
      description: "Successful trades",
      gradient: "bg-gradient-to-br from-cyan-500 to-cyan-600",
      onClick: "trades",
    },
    {
      id: "likes",
      label: "Total Likes",
      icon: <Heart className="h-6 w-6" aria-hidden="true" />,
      value: stats.likesCount,
      description: "Content appreciation",
      gradient: "bg-gradient-to-br from-rose-500 to-rose-600",
      onClick: "likes",
    },
    {
      id: "shares",
      label: "Shares",
      icon: <Share2 className="h-6 w-6" aria-hidden="true" />,
      value: stats.sharesCount,
      description: "Shared by others",
      gradient: "bg-gradient-to-br from-slate-500 to-slate-600",
      onClick: "shares",
    },
  ];

  // Owner-only stats (wallet balance and ELO points)
  const ownerOnlyStats: StatItem[] = isOwnProfile
    ? [
        {
          id: "wallet",
          label: "Wallet Balance",
          icon: <Wallet className="h-6 w-6" aria-hidden="true" />,
          value:
            typeof stats.walletBalance === "number"
              ? `$${stats.walletBalance.toFixed(2)}`
              : "$0.00",
          description: "Total balance",
          gradient: "bg-gradient-to-br from-green-500 to-green-600",
          onClick: "wallet",
        },
        {
          id: "elopoints",
          label: "ELO Points",
          icon: <Coins className="h-6 w-6" aria-hidden="true" />,
          value: stats.eloPoints || 0,
          description: "Reward points",
          gradient: "bg-gradient-to-br from-violet-500 to-violet-600",
          onClick: "elopoints",
        },
      ]
    : [];

  // Combine all items
  const statsItems: StatItem[] = [...baseStatsItems, ...ownerOnlyStats];

  // Show error state if stats failed to load
  if (stats.error && isInitialized) {
    return (
      <div className="w-full py-8 text-center">
        <p className="text-sm text-red-500 mb-3">
          Unable to load statistics. Please refresh the page.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-blue-600 hover:underline font-medium"
          aria-label="Retry loading statistics"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4" role="region" aria-label="Profile statistics carousel">
      {/* Stats Container with scroll snap */}
      <div className="relative">
        {/* Navigation Buttons - Desktop only */}
        <div className="hidden lg:flex absolute inset-y-0 left-0 right-0 pointer-events-none">
          <Button
            onClick={() => scroll("left")}
            size="icon"
            variant="ghost"
            className={cn(
              "absolute left-0 top-1/3 -translate-y-1/2 h-10 w-10 pointer-events-auto",
              "bg-white/80 hover:bg-white border border-gray-300 shadow-md",
              "transition-all duration-300 hover:shadow-lg hover:bg-gray-50"
            )}
            aria-label="Scroll carousel left"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            onClick={() => scroll("right")}
            size="icon"
            variant="ghost"
            className={cn(
              "absolute right-0 top-1/3 -translate-y-1/2 h-10 w-10 pointer-events-auto",
              "bg-white/80 hover:bg-white border border-gray-300 shadow-md",
              "transition-all duration-300 hover:shadow-lg hover:bg-gray-50"
            )}
            aria-label="Scroll carousel right"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="w-full overflow-x-auto scroll-smooth"
          style={{
            scrollBehavior: "smooth",
            scrollSnapType: "x mandatory",
          }}
          role="list"
          aria-label="Statistics items"
        >
          <div className="flex gap-3 sm:gap-4 pb-2 px-2 sm:px-0">
            {statsItems.map((stat) => (
              <div
                key={stat.id}
                className="flex-shrink-0 w-full xs:w-1/2 sm:w-1/2 md:w-1/3 lg:w-1/4"
                style={{ scrollSnapAlign: "start" }}
                role="listitem"
              >
                <StatsCard
                  icon={stat.icon}
                  label={stat.label}
                  value={stat.value}
                  description={stat.description}
                  gradient={stat.gradient}
                  loading={loading}
                  onClick={() => {
                    if (onStatClick && stat.onClick) {
                      onStatClick(stat.onClick);
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Navigation - Visible only on small/medium screens */}
        <div className="flex lg:hidden justify-center gap-2 mt-6">
          <Button
            onClick={() => scroll("left")}
            size="sm"
            variant="outline"
            className="h-9 w-9 p-0 shadow-md transition-all duration-300 hover:shadow-lg"
            aria-label="Scroll carousel left"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => scroll("right")}
            size="sm"
            variant="outline"
            className="h-9 w-9 p-0 shadow-md transition-all duration-300 hover:shadow-lg"
            aria-label="Scroll carousel right"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Dots Indicator - Enhanced styling and accessibility */}
      <div className="flex justify-center gap-1.5 mt-4 sm:mt-6 px-4" role="tablist" aria-label="Statistics carousel pages">
        {statsItems.map((stat, index) => (
          <button
            key={index}
            onClick={() => {
              // Scroll to position
              if (scrollContainerRef.current) {
                const itemWidth = 320;
                scrollContainerRef.current.scrollBy({
                  left: itemWidth * (index - currentIndex),
                  behavior: "smooth",
                });
                setCurrentIndex(index);
              }
            }}
            className={cn(
              "h-2 transition-all duration-300 rounded-full",
              "hover:bg-gray-500 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              index === currentIndex ? "bg-blue-500 w-4" : "bg-gray-300 w-2 hover:w-3"
            )}
            role="tab"
            aria-label={`Go to ${stat.label} statistics (slide ${index + 1})`}
            aria-selected={index === currentIndex}
            aria-controls={`stats-carousel-${index}`}
          />
        ))}
      </div>
    </div>
  );
};

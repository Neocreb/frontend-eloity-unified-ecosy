import React, { useState, useEffect } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
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
} from "lucide-react";
import { UserProfile } from "@/types/user";
import { useProfileStats } from "@/hooks/useProfileStats";

interface ProfileStatsCarouselProps {
  profile: UserProfile;
  followerCount?: number;
  followingCount?: number;
  loading?: boolean;
  onStatClick?: (statType: string) => void;
  enableRealData?: boolean;
}

interface StatItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  value: string | number;
  description?: string;
  gradient: string;
  onClick?: string;
}

export const ProfileStatsCarousel: React.FC<ProfileStatsCarouselProps> = ({
  profile,
  followerCount: initialFollowerCount = 0,
  followingCount: initialFollowingCount = 0,
  loading: externalLoading = false,
  onStatClick,
  enableRealData = true,
}) => {
  const [api, setApi] = useState<CarouselApi>();
  const [canScroll, setCanScroll] = useState(false);

  // Fetch real stats from database
  const stats = useProfileStats(profile, profile?.id, enableRealData);

  // Use real data if available, otherwise fallback to props
  const followerCount = stats.followerCount || initialFollowerCount;
  const followingCount = stats.followingCount || initialFollowingCount;
  const loading = externalLoading || stats.loading;

  useEffect(() => {
    if (!api) {
      return;
    }

    const onSelect = () => {
      setCanScroll(api.canScrollNext() || api.canScrollPrev());
    };

    api.on("select", onSelect);
    api.on("reInit", onSelect);

    return () => {
      api?.off("select", onSelect);
      api?.off("reInit", onSelect);
    };
  }, [api]);

  const statsItems: StatItem[] = [
    {
      id: "posts",
      label: "Posts",
      icon: <MessageSquare className="h-6 w-6" />,
      value: profile?.posts_count || 0,
      description: "Content shared",
      gradient: "bg-gradient-to-br from-blue-500 to-blue-600",
      onClick: "posts",
    },
    {
      id: "followers",
      label: "Followers",
      icon: <Users className="h-6 w-6" />,
      value: followerCount,
      description: "People following",
      gradient: "bg-gradient-to-br from-purple-500 to-purple-600",
      onClick: "followers",
    },
    {
      id: "following",
      label: "Following",
      icon: <UserPlus className="h-6 w-6" />,
      value: followingCount,
      description: "People you follow",
      gradient: "bg-gradient-to-br from-pink-500 to-pink-600",
      onClick: "following",
    },
    {
      id: "views",
      label: "Profile Views",
      icon: <Eye className="h-6 w-6" />,
      value: stats.profileViews,
      description: "Times viewed",
      gradient: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      onClick: "views",
    },
    {
      id: "sales",
      label: "Marketplace Sales",
      icon: <ShoppingBag className="h-6 w-6" />,
      value: stats.marketplaceSales,
      description: "Items sold",
      gradient: "bg-gradient-to-br from-amber-500 to-amber-600",
      onClick: "sales",
    },
    {
      id: "trades",
      label: "P2P Trades",
      icon: <TrendingUp className="h-6 w-6" />,
      value: stats.cryptoTrades,
      description: "Successful trades",
      gradient: "bg-gradient-to-br from-cyan-500 to-cyan-600",
      onClick: "trades",
    },
    {
      id: "likes",
      label: "Total Likes",
      icon: <Heart className="h-6 w-6" />,
      value: stats.likesCount,
      description: "Content appreciation",
      gradient: "bg-gradient-to-br from-rose-500 to-rose-600",
      onClick: "likes",
    },
    {
      id: "shares",
      label: "Shares",
      icon: <Share2 className="h-6 w-6" />,
      value: stats.sharesCount,
      description: "Shared by others",
      gradient: "bg-gradient-to-br from-slate-500 to-slate-600",
      onClick: "shares",
    },
  ];

  return (
    <div className="w-full space-y-4">
      <Carousel
        opts={{
          align: "start",
          loop: false,
          skipSnaps: false,
          dragFree: true,
        }}
        setApi={setApi}
        className="relative w-full"
      >
        {/* Navigation Buttons - Desktop only */}
        <div className="hidden lg:block">
          <CarouselPrevious className={cn(
            "left-0 top-1/3 -translate-y-1/2 h-10 w-10 bg-white/80 hover:bg-white",
            "border border-gray-300 shadow-md transition-all duration-300",
            "hover:shadow-lg hover:bg-gray-50"
          )} />
          <CarouselNext className={cn(
            "right-0 top-1/3 -translate-y-1/2 h-10 w-10 bg-white/80 hover:bg-white",
            "border border-gray-300 shadow-md transition-all duration-300",
            "hover:shadow-lg hover:bg-gray-50"
          )} />
        </div>

        <CarouselContent className="-ml-2 pl-2 sm:pl-0">
          {statsItems.map((stat) => (
            <CarouselItem
              key={stat.id}
              className="basis-full xs:basis-1/2 sm:basis-1/2 md:basis-1/3 lg:basis-1/4 pl-2 sm:pl-4"
            >
              <div className="transition-all duration-300 hover:scale-105">
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
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Mobile Navigation - Visible only on small/medium screens */}
        <div className="flex lg:hidden justify-center gap-2 mt-6">
          <CarouselPrevious className={cn(
            "static h-9 w-9 bg-gray-100 hover:bg-gray-200 border-0 shadow-md",
            "transition-all duration-300 hover:shadow-lg"
          )} />
          <CarouselNext className={cn(
            "static h-9 w-9 bg-gray-100 hover:bg-gray-200 border-0 shadow-md",
            "transition-all duration-300 hover:shadow-lg"
          )} />
        </div>
      </Carousel>

      {/* Dots Indicator - Enhanced styling */}
      <div className="flex justify-center gap-1.5 mt-4 sm:mt-6 px-4">
        {statsItems.map((_, index) => (
          <button
            key={index}
            onClick={() => api?.scrollSnapList()[index] && api?.scrollSnapList()[index]}
            className={cn(
              "h-2 transition-all duration-300 rounded-full",
              "hover:bg-gray-500 cursor-pointer",
              index === 0 ? "bg-blue-500 w-4" : "bg-gray-300 w-2 hover:w-3"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

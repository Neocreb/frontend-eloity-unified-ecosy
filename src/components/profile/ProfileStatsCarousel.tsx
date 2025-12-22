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

interface ProfileStatsCarouselProps {
  profile: UserProfile;
  followerCount?: number;
  followingCount?: number;
  loading?: boolean;
  onStatClick?: (statType: string) => void;
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
  followerCount = 0,
  followingCount = 0,
  loading = false,
  onStatClick,
}) => {
  const [api, setApi] = useState<CarouselApi>();
  const [canScroll, setCanScroll] = useState(false);

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

  const stats: StatItem[] = [
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
      value: followerCount || 0,
      description: "People following",
      gradient: "bg-gradient-to-br from-purple-500 to-purple-600",
      onClick: "followers",
    },
    {
      id: "following",
      label: "Following",
      icon: <UserPlus className="h-6 w-6" />,
      value: followingCount || 0,
      description: "People you follow",
      gradient: "bg-gradient-to-br from-pink-500 to-pink-600",
      onClick: "following",
    },
    {
      id: "views",
      label: "Profile Views",
      icon: <Eye className="h-6 w-6" />,
      value: profile?.profile_views || 0,
      description: "Times viewed",
      gradient: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      onClick: "views",
    },
    {
      id: "sales",
      label: "Marketplace Sales",
      icon: <ShoppingBag className="h-6 w-6" />,
      value: profile?.marketplace_sales || 0,
      description: "Items sold",
      gradient: "bg-gradient-to-br from-amber-500 to-amber-600",
      onClick: "sales",
    },
    {
      id: "trades",
      label: "P2P Trades",
      icon: <TrendingUp className="h-6 w-6" />,
      value: profile?.crypto_trades || 0,
      description: "Successful trades",
      gradient: "bg-gradient-to-br from-cyan-500 to-cyan-600",
      onClick: "trades",
    },
    {
      id: "likes",
      label: "Total Likes",
      icon: <Heart className="h-6 w-6" />,
      value: profile?.likes_count || 0,
      description: "Content appreciation",
      gradient: "bg-gradient-to-br from-rose-500 to-rose-600",
      onClick: "likes",
    },
    {
      id: "shares",
      label: "Shares",
      icon: <Share2 className="h-6 w-6" />,
      value: profile?.shares_count || 0,
      description: "Shared by others",
      gradient: "bg-gradient-to-br from-slate-500 to-slate-600",
      onClick: "shares",
    },
  ];

  return (
    <div className="w-full py-6 sm:py-8 px-0">
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
          <CarouselPrevious className="left-0 top-1/3 -translate-y-1/2 h-10 w-10 bg-white/80 hover:bg-white border border-gray-200 shadow-md" />
          <CarouselNext className="right-0 top-1/3 -translate-y-1/2 h-10 w-10 bg-white/80 hover:bg-white border border-gray-200 shadow-md" />
        </div>

        <CarouselContent className="pl-4 sm:pl-6">
          {stats.map((stat) => (
            <CarouselItem
              key={stat.id}
              className="basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4 pl-4 sm:pl-6"
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
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Mobile Navigation - Visible only on small screens */}
        <div className="flex lg:hidden justify-center gap-2 mt-4">
          <CarouselPrevious className="static h-8 w-8 bg-gray-100 hover:bg-gray-200 border-0 shadow-none" />
          <CarouselNext className="static h-8 w-8 bg-gray-100 hover:bg-gray-200 border-0 shadow-none" />
        </div>
      </Carousel>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-1.5 mt-4 sm:mt-6">
        {stats.map((_, index) => (
          <button
            key={index}
            onClick={() => api?.scrollSnapList()[index] && api?.scrollSnapList()[index]}
            className="h-2 transition-all duration-300 rounded-full bg-gray-300 hover:bg-gray-400"
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

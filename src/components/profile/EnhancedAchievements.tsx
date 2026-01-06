import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Trophy,
  Star,
  Award,
  Crown,
  Zap,
  Target,
  Heart,
  Flame,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type AchievementCategory =
  | "creator"
  | "seller"
  | "trader"
  | "social"
  | "community"
  | "special";

export type AchievementRarity = "common" | "rare" | "epic" | "legendary";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  icon: LucideIcon;
  earnedDate: string;
  rarity: AchievementRarity;
  progress?: {
    current: number;
    target: number;
    label?: string;
  };
}

interface EnhancedAchievementsProps {
  achievements: Achievement[];
  completedAchievements?: number;
  totalAchievements?: number;
}

const getCategoryColor = (category: AchievementCategory) => {
  const colors: Record<AchievementCategory, string> = {
    creator: "bg-purple-50 border-purple-200",
    seller: "bg-green-50 border-green-200",
    trader: "bg-blue-50 border-blue-200",
    social: "bg-pink-50 border-pink-200",
    community: "bg-amber-50 border-amber-200",
    special: "bg-indigo-50 border-indigo-200",
  };
  return colors[category] || "bg-gray-50 border-gray-200";
};

const getCategoryLabel = (category: AchievementCategory) => {
  const labels: Record<AchievementCategory, string> = {
    creator: "Creator",
    seller: "Seller",
    trader: "Trader",
    social: "Social",
    community: "Community",
    special: "Special",
  };
  return labels[category] || category;
};

const getRarityColor = (rarity: AchievementRarity) => {
  const colors: Record<AchievementRarity, string> = {
    common: "text-gray-600",
    rare: "text-blue-600",
    epic: "text-purple-600",
    legendary: "text-amber-600",
  };
  return colors[rarity] || "text-gray-600";
};

const getRarityBgColor = (rarity: AchievementRarity) => {
  const colors: Record<AchievementRarity, string> = {
    common: "bg-gray-100",
    rare: "bg-blue-100",
    epic: "bg-purple-100",
    legendary: "bg-amber-100",
  };
  return colors[rarity] || "bg-gray-100";
};

export const EnhancedAchievements: React.FC<
  EnhancedAchievementsProps
> = ({
  achievements,
  completedAchievements,
  totalAchievements,
}) => {
  const [expandedCategory, setExpandedCategory] =
    useState<AchievementCategory | null>(null);

  // Group achievements by category
  const achievementsByCategory = achievements.reduce(
    (acc, achievement) => {
      if (!acc[achievement.category]) {
        acc[achievement.category] = [];
      }
      acc[achievement.category].push(achievement);
      return acc;
    },
    {} as Record<AchievementCategory, Achievement[]>
  );

  const categories: AchievementCategory[] = [
    "creator",
    "seller",
    "trader",
    "social",
    "community",
    "special",
  ];

  const filteredCategories = categories.filter(
    (cat) => achievementsByCategory[cat]?.length > 0
  );

  const completionPercentage = totalAchievements
    ? Math.round(((completedAchievements || 0) / totalAchievements) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Achievements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        {totalAchievements && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Progress</span>
              <span className="text-muted-foreground">
                {completedAchievements} of {totalAchievements}
              </span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        )}

        {/* Categories */}
        {filteredCategories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No achievements yet. Keep working to unlock them!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCategories.map((category) => {
              const categoryAchievements = achievementsByCategory[category] || [];
              const isExpanded =
                expandedCategory === category ||
                categoryAchievements.length <= 3;

              return (
                <div key={category} className="space-y-2">
                  {/* Category Header */}
                  <button
                    onClick={() =>
                      setExpandedCategory(
                        isExpanded ? null : category
                      )
                    }
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between p-2 rounded hover:bg-muted transition-colors">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {getCategoryLabel(category)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {categoryAchievements.length} achievement
                          {categoryAchievements.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <span className="text-muted-foreground text-sm">
                        {isExpanded ? "−" : "+"}
                      </span>
                    </div>
                  </button>

                  {/* Category Achievements Grid */}
                  {isExpanded && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pl-2">
                      {categoryAchievements.map((achievement) => {
                        const Icon = achievement.icon;
                        const hasProgress = achievement.progress;

                        return (
                          <TooltipProvider key={achievement.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={cn(
                                    "p-4 rounded-lg border cursor-help transition-all hover:shadow-md",
                                    getCategoryColor(category),
                                    "hover:border-current"
                                  )}
                                >
                                  {/* Icon and Rarity Badge */}
                                  <div className="flex items-start justify-between mb-2">
                                    <div
                                      className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center",
                                        getRarityBgColor(achievement.rarity)
                                      )}
                                    >
                                      <Icon
                                        className={cn(
                                          "h-6 w-6",
                                          getRarityColor(achievement.rarity)
                                        )}
                                      />
                                    </div>
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-xs",
                                        getRarityColor(achievement.rarity)
                                      )}
                                    >
                                      {achievement.rarity}
                                    </Badge>
                                  </div>

                                  {/* Title */}
                                  <div className="font-medium text-sm mb-1">
                                    {achievement.title}
                                  </div>

                                  {/* Progress Bar (if applicable) */}
                                  {hasProgress && (
                                    <div className="space-y-1 mb-2">
                                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>
                                          {achievement.progress.label ||
                                            "Progress"}
                                        </span>
                                        <span>
                                          {achievement.progress.current} /{" "}
                                          {achievement.progress.target}
                                        </span>
                                      </div>
                                      <Progress
                                        value={
                                          (achievement.progress.current /
                                            achievement.progress.target) *
                                          100
                                        }
                                        className="h-1"
                                      />
                                    </div>
                                  )}

                                  {/* Date */}
                                  <div className="text-xs text-muted-foreground">
                                    {achievement.earnedDate}
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <div className="space-y-1">
                                  <div className="font-medium">
                                    {achievement.title}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {achievement.description}
                                  </div>
                                  <div className="text-xs pt-2 border-t">
                                    Earned on {achievement.earnedDate}
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  description?: string;
  gradient: string;
  loading?: boolean;
  onClick?: () => void;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  label,
  value,
  description,
  gradient,
  loading = false,
  onClick,
}) => {
  if (loading) {
    return (
      <Card className="border-0 overflow-hidden h-full">
        <CardContent className={cn("p-6 sm:p-8 h-full", gradient)}>
          <div className="flex flex-col gap-4">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "border-0 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 h-full group",
        "backdrop-blur-sm"
      )}
      onClick={onClick}
    >
      <CardContent className={cn("p-6 sm:p-8 h-full flex flex-col justify-between", gradient, "text-white")}>
        {/* Icon */}
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors">
            {icon}
          </div>
          <div className="text-sm font-medium opacity-75">{label}</div>
        </div>

        {/* Value */}
        <div className="space-y-2">
          <div className="text-3xl sm:text-4xl font-bold tabular-nums animate-in fade-in duration-500">
            {typeof value === "number" && value > 999
              ? value.toLocaleString()
              : value}
          </div>
          {description && (
            <p className="text-sm opacity-90 transition-opacity group-hover:opacity-100">
              {description}
            </p>
          )}
        </div>

        {/* Bottom accent */}
        <div className="mt-4 h-1 bg-white/30 rounded-full overflow-hidden">
          <div className="h-full bg-white/60 rounded-full w-3/4 group-hover:w-full transition-all duration-500" />
        </div>
      </CardContent>
    </Card>
  );
};

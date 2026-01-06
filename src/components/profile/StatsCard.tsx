import React, { useEffect, useState } from "react";
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
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (typeof value !== "number" || loading) return;

    const duration = 1000; // 1 second animation
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      current = Math.min(increment * step, value);
      setDisplayValue(Math.floor(current));

      if (step >= steps) {
        clearInterval(interval);
        setDisplayValue(value);
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [value, loading]);

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
        "border-0 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105 h-full group",
        "backdrop-blur-sm focus-within:ring-2 focus-within:ring-blue-400"
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick?.();
        }
      }}
    >
      <CardContent className={cn("p-6 sm:p-8 h-full flex flex-col justify-between", gradient, "text-white")}>
        {/* Icon with animation */}
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-lg bg-white/20 group-hover:bg-white/30 transition-all duration-300 transform group-hover:scale-110" aria-hidden="true">
            {icon}
          </div>
          <div className="text-sm font-medium opacity-75 group-hover:opacity-100 transition-opacity">{label}</div>
        </div>

        {/* Value with counter animation */}
        <div className="space-y-2">
          <div
            className="text-3xl sm:text-4xl font-bold tabular-nums transition-transform duration-300 group-hover:scale-105"
            aria-label={`${label}: ${typeof value === "number" && value > 999 ? displayValue.toLocaleString() : value}`}
          >
            {typeof value === "number" && value > 999
              ? displayValue.toLocaleString()
              : value}
          </div>
          {description && (
            <p className="text-sm opacity-90 transition-opacity group-hover:opacity-100">
              {description}
            </p>
          )}
        </div>

        {/* Animated bottom accent bar */}
        <div className="mt-4 h-1 bg-white/30 rounded-full overflow-hidden">
          <div className="h-full bg-white/60 rounded-full w-3/4 group-hover:w-full transition-all duration-500" />
        </div>
      </CardContent>
    </Card>
  );
};

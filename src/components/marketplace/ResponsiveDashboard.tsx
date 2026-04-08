import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Responsive Dashboard Layout Components
 * Optimized for all device sizes: mobile (320px), tablet (768px), desktop (1024px+), wide (1920px+)
 */

interface DashboardLayoutProps {
  children: ReactNode;
  className?: string;
}

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

interface DashboardGridProps {
  children: ReactNode;
  columns?: "2col" | "3col" | "4col" | "auto";
  gap?: "sm" | "md" | "lg";
  className?: string;
}

interface DashboardCardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
  variant?: "default" | "compact" | "expanded";
}

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  change?: {
    value: number;
    trend: "up" | "down";
  };
  className?: string;
}

interface ResponsiveTabsProps {
  tabs: Array<{
    value: string;
    label: string;
    icon?: ReactNode;
  }>;
  defaultValue: string;
  children: ReactNode;
  className?: string;
  variant?: "default" | "pills" | "underline";
}

/**
 * Main Dashboard Container
 * Handles responsive padding, spacing, and max-width constraints
 */
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        // Base layout
        "min-h-screen",
        // Responsive padding
        "px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6 lg:px-8 lg:py-8",
        // Max width constraints
        "mx-auto max-w-screen-2xl",
        // Background
        "bg-gray-50 dark:bg-slate-950",
        className
      )}
    >
      {children}
    </div>
  );
};

/**
 * Dashboard Header with Title and Action Button
 * Responsive spacing and text sizing
 */
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        // Container layout
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4",
        // Responsive spacing
        "mb-4 sm:mb-6 md:mb-8",
        className
      )}
    >
      <div className="flex-1 min-w-0">
        <h1
          className={cn(
            "font-bold text-gray-900 dark:text-white",
            // Responsive font sizes
            "text-xl sm:text-2xl md:text-3xl",
            // Prevent text overflow
            "truncate"
          )}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2 line-clamp-2">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="flex-shrink-0 w-full sm:w-auto">
          {action}
        </div>
      )}
    </div>
  );
};

/**
 * Responsive Grid for Dashboard Cards
 * Automatically adjusts columns based on device size
 */
export const DashboardGrid: React.FC<DashboardGridProps> = ({
  children,
  columns = "auto",
  gap = "md",
  className,
}) => {
  const columnClasses = {
    "2col": "grid-cols-1 sm:grid-cols-2",
    "3col": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    "4col": "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
    "auto": "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5",
  };

  const gapClasses = {
    sm: "gap-2 sm:gap-3 md:gap-4",
    md: "gap-3 sm:gap-4 md:gap-6",
    lg: "gap-4 sm:gap-6 md:gap-8",
  };

  return (
    <div
      className={cn(
        "grid",
        columnClasses[columns],
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  );
};

/**
 * Dashboard Card with Responsive Padding
 * Handles different card layouts: compact, default, expanded
 */
export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  subtitle,
  children,
  action,
  className,
  variant = "default",
}) => {
  const paddingClasses = {
    compact: "p-3 sm:p-4",
    default: "p-4 sm:p-6 md:p-8",
    expanded: "p-6 sm:p-8 md:p-10",
  };

  return (
    <div
      className={cn(
        // Base card styles
        "rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow",
        // Responsive padding
        paddingClasses[variant],
        className
      )}
    >
      {(title || action) && (
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className="space-y-3 sm:space-y-4">{children}</div>
    </div>
  );
};

/**
 * Statistic Card with Icon, Label, and Value
 * Shows optional trend indicator
 */
export const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  change,
  className,
}) => {
  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 shadow-sm p-4 sm:p-6",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1 sm:mb-2 truncate">
            {label}
          </p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white break-words">
            {value}
          </p>
          {change && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={`text-xs sm:text-sm font-semibold ${
                  change.trend === "up"
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {change.trend === "up" ? "+" : "-"}
                {Math.abs(change.value)}%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                vs last month
              </span>
            </div>
          )}
        </div>
        <div className="flex-shrink-0 text-gray-400 dark:text-gray-600">
          {icon}
        </div>
      </div>
    </div>
  );
};

/**
 * Responsive Tab Navigation
 * Handles horizontal scrolling on mobile for many tabs
 */
export const ResponsiveTabNav: React.FC<{
  tabs: Array<{ value: string; label: string; icon?: ReactNode }>;
  activeTab: string;
  onTabChange: (value: string) => void;
  variant?: "default" | "pills" | "underline";
}> = ({ tabs, activeTab, onTabChange, variant = "default" }) => {
  const variantClasses = {
    default:
      "flex gap-1 border-b border-gray-200 dark:border-gray-700 overflow-x-auto pb-2",
    pills: "flex gap-2 overflow-x-auto pb-2",
    underline: "flex gap-4 border-b border-gray-200 dark:border-gray-700",
  };

  return (
    <div className={variantClasses[variant]}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onTabChange(tab.value)}
          className={cn(
            // Base button styles
            "flex items-center gap-2 whitespace-nowrap px-3 py-2 sm:px-4 sm:py-3 rounded-md transition-all",
            "text-xs sm:text-sm md:text-base font-medium",
            // Active/Inactive states
            activeTab === tab.value
              ? "bg-primary text-white dark:bg-blue-600"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800",
            // Underline variant
            variant === "underline" && activeTab === tab.value && "border-b-2 border-primary"
          )}
        >
          {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

/**
 * Responsive Section Container
 * For grouping related content with proper spacing
 */
export const DashboardSection: React.FC<{
  title?: string;
  children: ReactNode;
  className?: string;
}> = ({ title, children, className }) => {
  return (
    <div className={cn("space-y-3 sm:space-y-4 md:space-y-6", className)}>
      {title && (
        <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-white px-1">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
};

/**
 * Responsive List Item
 * For displaying items in lists with proper touch targets
 */
export const DashboardListItem: React.FC<{
  primary: ReactNode;
  secondary?: ReactNode;
  tertiary?: ReactNode;
  action?: ReactNode;
  className?: string;
}> = ({ primary, secondary, tertiary, action, className }) => {
  return (
    <div
      className={cn(
        // Layout
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4",
        // Spacing
        "p-3 sm:p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-slate-800/50",
        // Touch target minimum
        "min-h-12 sm:min-h-14",
        className
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white truncate">
          {primary}
        </p>
        {secondary && (
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
            {secondary}
          </p>
        )}
        {tertiary && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 line-clamp-2">
            {tertiary}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  );
};

/**
 * Responsive Empty State
 * For showing placeholder content in empty sections
 */
export const DashboardEmptyState: React.FC<{
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}> = ({ icon, title, description, action, className }) => {
  return (
    <div
      className={cn(
        // Container
        "flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600",
        // Responsive padding
        "py-8 sm:py-12 md:py-16 px-4 sm:px-6 md:px-8",
        // Colors
        "bg-gray-50 dark:bg-slate-900/50",
        className
      )}
    >
      <div className="text-gray-400 dark:text-gray-500 mb-4">
        {icon}
      </div>
      <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center mb-4 sm:mb-6 max-w-xs">
          {description}
        </p>
      )}
      {action && action}
    </div>
  );
};

/**
 * Responsive Action Bar
 * For grouping action buttons with responsive layout
 */
export const DashboardActionBar: React.FC<{
  children: ReactNode;
  alignment?: "left" | "center" | "right" | "between";
  className?: string;
}> = ({ children, alignment = "between", className }) => {
  const alignmentClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
    between: "justify-between",
  };

  return (
    <div
      className={cn(
        // Layout
        "flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4",
        alignmentClasses[alignment],
        // Children should be full width on mobile, auto on larger screens
        "[&>*]:w-full sm:[&>*]:w-auto",
        className
      )}
    >
      {children}
    </div>
  );
};

/**
 * Responsive Modal Dialog
 * For modals and dialogs with proper mobile handling
 */
export const DashboardModalContent: React.FC<{
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}> = ({ title, description, children, footer, className }) => {
  return (
    <div className={cn("space-y-4 sm:space-y-6", className)}>
      <div className="space-y-1 sm:space-y-2">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
      <div className="space-y-3 sm:space-y-4">{children}</div>
      {footer && <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">{footer}</div>}
    </div>
  );
};

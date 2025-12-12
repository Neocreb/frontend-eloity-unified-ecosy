import React from 'react';
import { cn } from '@/utils/utils';

/**
 * Skeleton Loader - Simulates content shape while loading
 */
export const SkeletonLoader: React.FC<{
  className?: string;
  count?: number;
  circle?: boolean;
}> = ({ className, count = 1, circle = false }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className={cn(
          'bg-muted animate-pulse',
          circle ? 'rounded-full' : 'rounded-lg',
          className || 'h-4 w-full mb-2'
        )}
      />
    ))}
  </>
);

/**
 * Video Card Skeleton - Skeleton for video cards
 */
export const VideoCardSkeleton: React.FC<{ className?: string }> = ({
  className,
}) => (
  <div className={cn('space-y-2', className)}>
    <div className="w-full aspect-video bg-muted rounded-lg animate-pulse" />
    <div className="space-y-2 px-2">
      <SkeletonLoader className="h-4 w-3/4" />
      <SkeletonLoader className="h-3 w-1/2" />
    </div>
  </div>
);

/**
 * Comment Skeleton - Skeleton for comments
 */
export const CommentSkeleton: React.FC<{ className?: string }> = ({
  className,
}) => (
  <div className={cn('flex gap-2 mb-4', className)}>
    <SkeletonLoader className="h-8 w-8 rounded-full" count={1} circle />
    <div className="flex-1 space-y-2">
      <SkeletonLoader className="h-4 w-1/3" count={1} />
      <SkeletonLoader className="h-3 w-full" count={2} />
    </div>
  </div>
);

/**
 * Progressive Content Loader - Loads content progressively
 */
export const ProgressiveContentLoader: React.FC<{
  isLoading: boolean;
  progress?: number;
  children: React.ReactNode;
  className?: string;
}> = ({ isLoading, progress = 0, children, className }) => (
  <div className={cn('relative', className)}>
    {children}
    {isLoading && (
      <div className="absolute inset-0 bg-white/5 backdrop-blur-sm rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-white/80 animate-spin mx-auto mb-2" />
          {progress > 0 && (
            <div className="text-xs text-muted-foreground">
              {Math.round(progress * 100)}%
            </div>
          )}
        </div>
      </div>
    )}
  </div>
);

/**
 * Shimmer Loading - Smooth shimmer effect
 */
export const ShimmerLoader: React.FC<{
  className?: string;
  count?: number;
}> = ({ className, count = 1 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className={cn(
          'relative overflow-hidden rounded-lg bg-muted',
          className || 'h-20 w-full mb-4'
        )}
      >
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          style={{
            animation: 'shimmer 2s infinite',
          }}
        />
      </div>
    ))}
    <style>{`
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    `}</style>
  </>
);

/**
 * Pulse Loader - Pulsing animation
 */
export const PulseLoader: React.FC<{
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ className, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-4',
    lg: 'w-14 h-14 border-4',
  };

  return (
    <div
      className={cn(
        'rounded-full border border-primary/20 border-t-primary animate-spin',
        sizeClasses[size],
        className
      )}
    />
  );
};

/**
 * Skeleton Grid - Multiple skeleton items
 */
export const SkeletonGrid: React.FC<{
  count?: number;
  columns?: 1 | 2 | 3 | 4;
}> = ({ count = 12, columns = 3 }) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  return (
    <div className={`grid ${gridClasses[columns]} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <VideoCardSkeleton key={i} />
      ))}
    </div>
  );
};

/**
 * Loading Overlay - Overlay with loading indicator
 */
export const LoadingOverlay: React.FC<{
  isLoading: boolean;
  message?: string;
  progress?: number;
}> = ({ isLoading, message, progress }) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-background rounded-lg p-8 text-center max-w-sm">
        <PulseLoader size="lg" className="mx-auto mb-4" />
        {message && <p className="text-sm text-muted-foreground mb-2">{message}</p>}
        {progress !== undefined && progress > 0 && (
          <div className="mt-4">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {Math.round(progress * 100)}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Inline Loader - Small loader for inline loading states
 */
export const InlineLoader: React.FC<{
  message?: string;
  className?: string;
}> = ({ message, className }) => (
  <div className={cn('flex items-center justify-center gap-2 py-4', className)}>
    <div className="w-4 h-4 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
    {message && <span className="text-sm text-muted-foreground">{message}</span>}
  </div>
);

/**
 * Progress Ring - Circular progress indicator
 */
export const ProgressRing: React.FC<{
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}> = ({ progress, size = 100, strokeWidth = 4, className }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      className={cn('transform -rotate-90', className)}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="none"
        className="text-muted/20"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        className="text-primary transition-all duration-300"
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dy="0.3em"
        className="text-xs font-semibold fill-current"
      >
        {Math.round(progress)}%
      </text>
    </svg>
  );
};

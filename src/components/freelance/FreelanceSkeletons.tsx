import React from 'react';

const SkeletonPulse = () => (
  <div className="animate-pulse" />
);

/**
 * Skeleton loading components for freelance platform
 */
export const FreelanceSkeletons = {
  /**
   * Job card skeleton
   */
  JobCardSkeleton: () => (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 space-y-3">
      <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4" />
      <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full" />
      <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6" />
      <div className="flex gap-2 pt-2">
        <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-20" />
        <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-20" />
      </div>
      <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3" />
      </div>
    </div>
  ),

  /**
   * Job detail page skeleton
   */
  JobDetailSkeleton: () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4" />
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2" />
      </div>

      {/* Description */}
      <div className="space-y-3">
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full" />
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full" />
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3" />
      </div>

      {/* Budget and info */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded" />
            <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded" />
          </div>
        ))}
      </div>

      {/* Apply button */}
      <div className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3" />
    </div>
  ),

  /**
   * Freelancer profile skeleton
   */
  FreelancerProfileSkeleton: () => (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex gap-3">
        <div className="h-16 w-16 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2" />
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3" />
        </div>
      </div>

      {/* Rating and stats */}
      <div className="flex gap-4 pt-2 border-t border-neutral-200 dark:border-neutral-800">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-1">
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-12" />
            <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-16" />
          </div>
        ))}
      </div>

      {/* Description */}
      <div className="space-y-2 pt-2">
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full" />
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6" />
      </div>

      {/* Skills */}
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-20" />
        ))}
      </div>

      {/* Button */}
      <div className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded w-full" />
    </div>
  ),

  /**
   * Project card skeleton
   */
  ProjectCardSkeleton: () => (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 space-y-4">
      <div className="space-y-2">
        <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4" />
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2" />
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full w-full" />
        <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full w-1/3" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        {[1, 2].map((i) => (
          <div key={i} className="space-y-1">
            <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2" />
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded" />
          </div>
        ))}
      </div>
    </div>
  ),

  /**
   * Proposal skeleton
   */
  ProposalSkeleton: () => (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3" />
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2" />
        </div>
        <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-16" />
      </div>

      {/* Freelancer info */}
      <div className="flex gap-3 py-3 border-y border-neutral-200 dark:border-neutral-800">
        <div className="h-12 w-12 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2" />
          <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3" />
        </div>
      </div>

      {/* Cover letter */}
      <div className="space-y-2">
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full" />
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6" />
      </div>

      {/* Budget and timeline */}
      <div className="grid grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="space-y-1">
            <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2" />
            <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded" />
          </div>
        ))}
      </div>
    </div>
  ),

  /**
   * Review/rating skeleton
   */
  ReviewSkeleton: () => (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex gap-2 items-center">
          <div className="h-10 w-10 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
          <div className="space-y-1">
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-20" />
            <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-16" />
          </div>
        </div>
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-12" />
      </div>

      {/* Stars */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-4 w-4 bg-neutral-200 dark:bg-neutral-700 rounded" />
        ))}
      </div>

      {/* Review text */}
      <div className="space-y-2">
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full" />
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6" />
      </div>
    </div>
  ),

  /**
   * Earnings history skeleton
   */
  EarningsHistorySkeleton: () => (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex justify-between items-center p-3 bg-neutral-50 dark:bg-neutral-900 rounded">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2" />
            <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3" />
          </div>
          <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-20" />
        </div>
      ))}
    </div>
  ),

  /**
   * Dashboard stats skeleton
   */
  DashboardStatsSkeleton: () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 space-y-2">
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3" />
          <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2" />
          <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3" />
        </div>
      ))}
    </div>
  ),

  /**
   * List skeleton - for multiple items
   */
  ListSkeleton: ({ count = 3 }: { count?: number }) => (
    <div className="space-y-3">
      {Array(count)
        .fill(null)
        .map((_, i) => (
          <div key={i} className="h-16 bg-neutral-200 dark:bg-neutral-700 rounded" />
        ))}
    </div>
  ),
};

export default FreelanceSkeletons;

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const FreelanceSkeletons = {
  // Job card skeleton
  JobCardSkeleton: () => (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
          <Skeleton className="h-2" />
        </div>
      </CardContent>
    </Card>
  ),

  // Multiple job cards skeleton
  JobListSkeleton: ({ count = 3 }: { count?: number }) => (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <FreelanceSkeletons.JobCardSkeleton key={i} />
      ))}
    </div>
  ),

  // Freelancer profile skeleton
  FreelancerProfileSkeleton: () => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  ),

  // Multiple freelancer profiles skeleton
  FreelancerListSkeleton: ({ count = 3 }: { count?: number }) => (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <FreelanceSkeletons.FreelancerProfileSkeleton key={i} />
      ))}
    </div>
  ),

  // Project card skeleton
  ProjectCardSkeleton: () => (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
          <Skeleton className="h-2" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        </div>
      </CardContent>
    </Card>
  ),

  // Multiple project cards skeleton
  ProjectListSkeleton: ({ count = 3 }: { count?: number }) => (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <FreelanceSkeletons.ProjectCardSkeleton key={i} />
      ))}
    </div>
  ),

  // Proposal skeleton
  ProposalSkeleton: () => (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-4 w-3/4" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  ),

  // Multiple proposals skeleton
  ProposalListSkeleton: ({ count = 3 }: { count?: number }) => (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <FreelanceSkeletons.ProposalSkeleton key={i} />
      ))}
    </div>
  ),

  // Review skeleton
  ReviewSkeleton: () => (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-4 rounded-full" />
              ))}
            </div>
          </div>
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </CardContent>
    </Card>
  ),

  // Multiple reviews skeleton
  ReviewListSkeleton: ({ count = 3 }: { count?: number }) => (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <FreelanceSkeletons.ReviewSkeleton key={i} />
      ))}
    </div>
  ),

  // Dashboard stats skeleton
  StatsSkeleton: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  ),

  // Message skeleton
  MessageSkeleton: () => (
    <div className="flex gap-3 mb-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  ),

  // Message thread skeleton
  MessageThreadSkeleton: ({ count = 5 }: { count?: number }) => (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <FreelanceSkeletons.MessageSkeleton key={i} />
      ))}
    </div>
  ),

  // Milestone skeleton
  MilestoneSkeleton: () => (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-2 w-full" />
          <div className="flex justify-between text-sm">
            <Skeleton className="h-3 w-1/4" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      </CardContent>
    </Card>
  ),

  // Multiple milestones skeleton
  MilestoneListSkeleton: ({ count = 3 }: { count?: number }) => (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <FreelanceSkeletons.MilestoneSkeleton key={i} />
      ))}
    </div>
  ),

  // Timeline skeleton
  TimelineSkeleton: () => (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-3 w-3 rounded-full mt-2" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  ),

  // Activity feed skeleton
  ActivityFeedSkeleton: ({ count = 4 }: { count?: number }) => (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-3">
            <div className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-2 w-1/4" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  ),

  // Payment history skeleton
  PaymentHistorySkeleton: ({ count = 5 }: { count?: number }) => (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex justify-between items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-5 w-20" />
        </div>
      ))}
    </div>
  ),

  // Invoice skeleton
  InvoiceSkeleton: () => (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/3" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-12" />
      </CardContent>
    </Card>
  ),

  // Dashboard layout skeleton
  DashboardSkeleton: () => (
    <div className="space-y-6">
      <FreelanceSkeletons.StatsSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FreelanceSkeletons.ProjectListSkeleton count={3} />
        </div>
        <div>
          <FreelanceSkeletons.ActivityFeedSkeleton count={4} />
        </div>
      </div>
    </div>
  ),
};

export default FreelanceSkeletons;

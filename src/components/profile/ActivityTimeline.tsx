import React, { useState } from 'react';
import {
  FileText,
  Trash2,
  Heart,
  MessageSquare,
  Share2,
  ShoppingCart,
  Package,
  TrendingUp,
  Briefcase,
  CheckCircle,
  Users,
  User,
  Award,
  Zap,
  Trophy,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import ActivityFilters from './ActivityFilters';
import {
  useActivityTimeline,
  type ActivityType,
  type ActivityItem,
} from '@/hooks/useActivityTimeline';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ActivityTimelineProps {
  userId: string;
  className?: string;
  showFilters?: boolean;
  maxItems?: number;
}

const iconMap: Record<string, React.ReactNode> = {
  FileText: <FileText className="h-5 w-5" />,
  Trash2: <Trash2 className="h-5 w-5" />,
  Heart: <Heart className="h-5 w-5" />,
  MessageSquare: <MessageSquare className="h-5 w-5" />,
  Share2: <Share2 className="h-5 w-5" />,
  ShoppingCart: <ShoppingCart className="h-5 w-5" />,
  Package: <Package className="h-5 w-5" />,
  TrendingUp: <TrendingUp className="h-5 w-5" />,
  Briefcase: <Briefcase className="h-5 w-5" />,
  CheckCircle: <CheckCircle className="h-5 w-5" />,
  Users: <Users className="h-5 w-5" />,
  User: <User className="h-5 w-5" />,
  Award: <Award className="h-5 w-5" />,
  Zap: <Zap className="h-5 w-5" />,
  Trophy: <Trophy className="h-5 w-5" />,
};

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  userId,
  className = '',
  showFilters = true,
  maxItems = 20,
}) => {
  const [filters, setFilters] = useState<ActivityType[]>([]);
  const [showAllFilters, setShowAllFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);

  const { activities, isLoading, error, activityConfig } = useActivityTimeline({
    userId,
    filters: filters.length > 0 ? filters : undefined,
    limit: maxItems,
  });

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + 5, activities.length));
  };

  const visibleActivities = activities.slice(0, visibleCount);
  const hasMore = visibleCount < activities.length;

  const groupedActivities: Record<string, ActivityItem[]> = {};

  // Group activities by date
  visibleActivities.forEach(activity => {
    const date = new Date(activity.timestamp);
    const dateKey = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    if (!groupedActivities[dateKey]) {
      groupedActivities[dateKey] = [];
    }
    groupedActivities[dateKey].push(activity);
  });

  const dateGroups = Object.entries(groupedActivities);

  if (error) {
    return (
      <div className={cn('rounded-lg border border-red-200 bg-red-50 p-4', className)}>
        <p className="text-sm text-red-700">Failed to load activity timeline: {error}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Filters Section */}
      {showFilters && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Filter Activities</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllFilters(!showAllFilters)}
              className="text-xs"
            >
              {showAllFilters ? 'Hide Filters' : 'Show Filters'}
              <ChevronDown className={cn('h-4 w-4 ml-1 transition-transform', showAllFilters && 'rotate-180')} />
            </Button>
          </div>

          {showAllFilters && (
            <Card className="p-4 bg-gray-50 border-gray-200">
              <ActivityFilters
                selectedFilters={filters}
                onFilterChange={setFilters}
              />
            </Card>
          )}
        </div>
      )}

      {/* Activity Timeline */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && visibleActivities.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No activities yet</h3>
          <p className="text-sm text-gray-500">
            {filters.length > 0
              ? 'No activities match your selected filters'
              : 'Start engaging with the platform to build your activity history'}
          </p>
        </div>
      )}

      {!isLoading && dateGroups.length > 0 && (
        <div className="space-y-8">
          {dateGroups.map(([date, dayActivities]) => (
            <div key={date}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-1 w-8 bg-gray-300 rounded-full" />
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {date}
                </h3>
                <div className="flex-1 h-1 bg-gray-200 rounded-full" />
              </div>

              {/* Activities for this date */}
              <div className="space-y-3 ml-4 border-l-2 border-gray-200 pl-6 relative">
                {dayActivities.map((activity, index) => {
                  const config = activityConfig[activity.type];
                  const icon = iconMap[activity.icon];

                  return (
                    <div key={activity.id} className="group">
                      {/* Timeline dot */}
                      <div className="absolute -left-[17px] top-2 h-4 w-4 rounded-full border-4 border-white bg-blue-500 group-hover:bg-blue-600 transition-colors" />

                      {/* Activity card */}
                      <Card className="hover:shadow-md transition-all hover:border-blue-300">
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            {/* Icon */}
                            <div
                              className={cn(
                                'h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0',
                                config?.color || 'bg-gray-100 text-gray-700'
                              )}
                            >
                              {icon}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {activity.description}
                              </p>

                              {/* Related entity */}
                              {activity.relatedEntity && (
                                <a
                                  href={activity.relatedEntity.url}
                                  className="inline-block text-xs text-blue-600 hover:text-blue-700 hover:underline mt-1"
                                >
                                  {activity.relatedEntity.title}
                                </a>
                              )}

                              {/* Metadata */}
                              {activity.metadata && (
                                <div className="mt-2 text-xs text-gray-600 space-y-0.5">
                                  {Object.entries(activity.metadata).map(([key, value]) => (
                                    <p key={key}>
                                      <span className="font-medium capitalize">{key}:</span> {String(value)}
                                    </p>
                                  ))}
                                </div>
                              )}

                              {/* Timestamp */}
                              <p className="text-xs text-gray-500 mt-2">
                                {formatDistanceToNow(new Date(activity.timestamp), {
                                  addSuffix: true,
                                })}
                              </p>
                            </div>

                            {/* Activity type badge */}
                            <div className="flex flex-col items-end justify-start">
                              <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                                {activity.type.replace(/_/g, ' ').toTitle()}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load more button */}
      {!isLoading && hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            className="w-full sm:w-auto"
          >
            Load More Activities
          </Button>
        </div>
      )}
    </div>
  );
};

// String toTitle helper
String.prototype.toTitle = function() {
  return (this as string)
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default ActivityTimeline;

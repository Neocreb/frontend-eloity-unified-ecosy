import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Eye,
  Heart,
  MessageSquare,
  Share2,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PostAnalytics {
  postId: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagementRate: number;
  viewsChange?: number;
  likesChange?: number;
  commentsChange?: number;
}

interface PostAnalyticsPreviewProps {
  postId: string;
  analytics: PostAnalytics;
  isOwnPost: boolean;
  onViewFullAnalytics?: () => void;
  className?: string;
  compact?: boolean;
}

const PostAnalyticsPreview: React.FC<PostAnalyticsPreviewProps> = ({
  postId,
  analytics,
  isOwnPost,
  onViewFullAnalytics,
  className = '',
  compact = false,
}) => {
  if (!isOwnPost) {
    return null;
  }

  const calculateEngagementRate = () => {
    if (analytics.views === 0) return 0;
    const totalInteractions = 
      analytics.likes + 
      analytics.comments + 
      analytics.shares + 
      analytics.saves;
    return ((totalInteractions / analytics.views) * 100).toFixed(1);
  };

  const engagementRate = calculateEngagementRate();

  if (compact) {
    return (
      <div className={cn('flex items-center gap-4 text-sm', className)}>
        <div className="flex items-center gap-1 text-gray-600">
          <Eye className="h-4 w-4" />
          <span>{analytics.views.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1 text-gray-600">
          <Heart className="h-4 w-4" />
          <span>{analytics.likes.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1 text-gray-600">
          <MessageSquare className="h-4 w-4" />
          <span>{analytics.comments.toLocaleString()}</span>
        </div>
        {onViewFullAnalytics && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewFullAnalytics}
            className="ml-auto text-xs text-blue-600 hover:text-blue-700"
          >
            View Analytics
            <ArrowUpRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={cn('bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200', className)}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Engagement Rate */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">Engagement Rate</p>
              <p className="text-2xl font-bold text-blue-600 flex items-center gap-1">
                {engagementRate}%
                {analytics.views > 0 && (
                  <span className="text-xs text-green-600 flex items-center gap-0.5">
                    <TrendingUp className="h-3 w-3" />
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Analytics Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Views */}
            <div className="rounded-lg bg-white p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="h-4 w-4 text-gray-600" />
                <p className="text-xs font-medium text-gray-600">Views</p>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {analytics.views.toLocaleString()}
              </p>
              {analytics.viewsChange !== undefined && analytics.viewsChange !== 0 && (
                <p className={cn(
                  'text-xs mt-1',
                  analytics.viewsChange > 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {analytics.viewsChange > 0 ? '+' : ''}{analytics.viewsChange}%
                </p>
              )}
            </div>

            {/* Likes */}
            <div className="rounded-lg bg-white p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <Heart className="h-4 w-4 text-red-500" />
                <p className="text-xs font-medium text-gray-600">Likes</p>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {analytics.likes.toLocaleString()}
              </p>
              {analytics.likesChange !== undefined && analytics.likesChange !== 0 && (
                <p className={cn(
                  'text-xs mt-1',
                  analytics.likesChange > 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {analytics.likesChange > 0 ? '+' : ''}{analytics.likesChange}%
                </p>
              )}
            </div>

            {/* Comments */}
            <div className="rounded-lg bg-white p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                <p className="text-xs font-medium text-gray-600">Comments</p>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {analytics.comments.toLocaleString()}
              </p>
              {analytics.commentsChange !== undefined && analytics.commentsChange !== 0 && (
                <p className={cn(
                  'text-xs mt-1',
                  analytics.commentsChange > 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {analytics.commentsChange > 0 ? '+' : ''}{analytics.commentsChange}%
                </p>
              )}
            </div>

            {/* Shares & Saves */}
            <div className="rounded-lg bg-white p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <Share2 className="h-4 w-4 text-purple-500" />
                <p className="text-xs font-medium text-gray-600">Shares & Saves</p>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {(analytics.shares + analytics.saves).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {analytics.shares} shares • {analytics.saves} saves
              </p>
            </div>
          </div>

          {/* View Full Analytics Button */}
          {onViewFullAnalytics && (
            <Button
              variant="outline"
              size="sm"
              onClick={onViewFullAnalytics}
              className="w-full bg-white hover:bg-gray-50 border-gray-200"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              View Full Analytics
              <ArrowUpRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PostAnalyticsPreview;

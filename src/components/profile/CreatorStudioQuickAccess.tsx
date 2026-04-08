import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Eye,
  Heart,
  MessageSquare,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Video,
} from 'lucide-react';

interface CreatorStats {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  topPostViews: number;
  averageEngagementRate: number;
  videosCreated: number;
}

interface CreatorStudioQuickAccessProps {
  isOwnProfile: boolean;
  stats?: CreatorStats;
}

const defaultStats: CreatorStats = {
  totalViews: 0,
  totalLikes: 0,
  totalComments: 0,
  topPostViews: 0,
  averageEngagementRate: 0,
  videosCreated: 0,
};

export const CreatorStudioQuickAccess: React.FC<CreatorStudioQuickAccessProps> = ({
  isOwnProfile,
  stats = defaultStats,
}) => {
  const navigate = useNavigate();

  if (!isOwnProfile) {
    return null;
  }

  const handleOpenStudio = () => {
    navigate('/app/creator-studio');
  };

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-lg text-amber-900">Creator Studio</CardTitle>
          </div>
          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
            Analytics
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-lg bg-white p-3 border border-amber-100">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Eye className="h-3 w-3 text-blue-500" />
              <span>Views</span>
            </div>
            <div className="text-lg font-bold text-amber-900">
              {(stats.totalViews || 0).toLocaleString()}
            </div>
          </div>

          <div className="rounded-lg bg-white p-3 border border-amber-100">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Heart className="h-3 w-3 text-red-500" />
              <span>Likes</span>
            </div>
            <div className="text-lg font-bold text-amber-900">
              {(stats.totalLikes || 0).toLocaleString()}
            </div>
          </div>

          <div className="rounded-lg bg-white p-3 border border-amber-100">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <MessageSquare className="h-3 w-3 text-green-500" />
              <span>Comments</span>
            </div>
            <div className="text-lg font-bold text-amber-900">
              {(stats.totalComments || 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="space-y-2 pt-2 border-t border-amber-100">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Engagement Rate</span>
            </div>
            <span className="font-semibold text-amber-900">
              {(stats.averageEngagementRate || 0).toFixed(1)}%
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Video className="h-4 w-4" />
              <span>Content Created</span>
            </div>
            <span className="font-semibold text-amber-900">
              {stats.videosCreated} videos
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              <span>Top Post Views</span>
            </div>
            <span className="font-semibold text-amber-900">
              {(stats.topPostViews || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleOpenStudio}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white mt-4"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Open Creator Studio
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>

        {/* Help Text */}
        <p className="text-xs text-amber-700 text-center">
          Manage content, analytics, and grow your audience
        </p>
      </CardContent>
    </Card>
  );
};

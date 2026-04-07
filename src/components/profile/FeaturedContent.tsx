import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageSquare, Share2, GripVertical, X, Star, TrendingUp } from 'lucide-react';
import { cn } from '@/utils/utils';

export interface FeaturedPost {
  id: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
  };
}

interface FeaturedContentProps {
  pinnedPosts: FeaturedPost[];
  isOwner?: boolean;
  onReorder?: (reorderedPosts: FeaturedPost[]) => void;
  onRemove?: (postId: string) => void;
}

export const FeaturedContent: React.FC<FeaturedContentProps> = ({
  pinnedPosts = [],
  isOwner = false,
  onReorder,
  onRemove,
}) => {
  const [draggedPostId, setDraggedPostId] = useState<string | null>(null);
  const [localPosts, setLocalPosts] = useState<FeaturedPost[]>(pinnedPosts);

  const handleDragStart = (postId: string) => {
    setDraggedPostId(postId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetPostId: string) => {
    if (!draggedPostId || draggedPostId === targetPostId) {
      setDraggedPostId(null);
      return;
    }

    const draggedIdx = localPosts.findIndex(p => p.id === draggedPostId);
    const targetIdx = localPosts.findIndex(p => p.id === targetPostId);

    if (draggedIdx !== -1 && targetIdx !== -1) {
      const newPosts = [...localPosts];
      [newPosts[draggedIdx], newPosts[targetIdx]] = [
        newPosts[targetIdx],
        newPosts[draggedIdx],
      ];
      setLocalPosts(newPosts);
      onReorder?.(newPosts);
    }
    setDraggedPostId(null);
  };

  const handleRemove = (postId: string) => {
    const filtered = localPosts.filter(p => p.id !== postId);
    setLocalPosts(filtered);
    onRemove?.(postId);
  };

  const getEngagementScore = (post: FeaturedPost) => {
    const engagement = post.engagement || {
      likes: post.likes || 0,
      comments: post.comments || 0,
      shares: post.shares || 0,
      saves: 0,
    };
    return engagement.likes * 1 + engagement.comments * 2 + engagement.shares * 3 + engagement.saves * 0.5;
  };

  const sortedByEngagement = [...localPosts].sort((a, b) => 
    getEngagementScore(b) - getEngagementScore(a)
  );

  if (pinnedPosts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Featured Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Star className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="mb-2">No featured content yet</p>
            <p className="text-sm">{isOwner ? 'Pin your best posts to showcase them here' : 'This user hasn\'t featured any content yet'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Featured Content ({pinnedPosts.length})
          </CardTitle>
          {isOwner && (
            <span className="text-xs text-muted-foreground">
              {draggedPostId ? 'Drop to reorder' : 'Drag to reorder'}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Engagement Tips */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
          <div className="flex items-start gap-2">
            <TrendingUp className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-amber-900">
              <p className="font-medium">Top performer: <span className="font-semibold">{sortedByEngagement[0]?.content?.substring(0, 30)}...</span></p>
              <p className="text-xs text-amber-700 mt-1">Engagement score: {getEngagementScore(sortedByEngagement[0]).toFixed(0)}</p>
            </div>
          </div>
        </div>

        {/* Featured Posts List */}
        <div className="space-y-3">
          {localPosts.map((post, index) => {
            const engagement = post.engagement || {
              likes: post.likes || 0,
              comments: post.comments || 0,
              shares: post.shares || 0,
              saves: 0,
            };
            const score = getEngagementScore(post);

            return (
              <div
                key={post.id}
                draggable={isOwner}
                onDragStart={() => handleDragStart(post.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(post.id)}
                className={cn(
                  'border rounded-lg p-3 transition-all',
                  draggedPostId === post.id && 'opacity-50 bg-gray-100',
                  isOwner && 'cursor-move hover:border-amber-300 hover:bg-amber-50'
                )}
              >
                <div className="flex gap-3">
                  {/* Drag Handle */}
                  {isOwner && (
                    <div className="flex-shrink-0 flex items-center pt-1">
                      <GripVertical className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    </div>
                  )}

                  {/* Thumbnail */}
                  {post.image && (
                    <div className="flex-shrink-0">
                      <img
                        src={post.image}
                        alt="featured content"
                        className="h-16 w-16 rounded object-cover"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium line-clamp-2">
                          {post.content || 'Untitled post'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(post.id)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Engagement Stats */}
                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex items-center gap-1 text-xs">
                        <Heart className="h-3 w-3 text-red-500" />
                        <span className="text-gray-600">{engagement.likes}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <MessageSquare className="h-3 w-3 text-blue-500" />
                        <span className="text-gray-600">{engagement.comments}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Share2 className="h-3 w-3 text-green-500" />
                        <span className="text-gray-600">{engagement.shares}</span>
                      </div>
                      {engagement.saves > 0 && (
                        <Badge variant="outline" className="text-xs ml-auto">
                          {engagement.saves} saves
                        </Badge>
                      )}
                    </div>

                    {/* Engagement Score */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all"
                          style={{ width: `${Math.min((score / 100) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600 whitespace-nowrap">
                        {score.toFixed(0)} pts
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default FeaturedContent;

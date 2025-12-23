import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pin, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProfilePostCard } from './ProfilePostCard';

export interface PinnedPost {
  postId: string;
  pinnedOrder: number;
  pinnedDate: string;
}

interface PostPinningSystemProps {
  posts: any[];
  pinnedPostIds: PinnedPost[];
  isOwnProfile: boolean;
  maxPinned?: number;
  onPinChange?: (postId: string, isPinned: boolean) => void;
  onReorder?: (pinnedPosts: PinnedPost[]) => void;
  onDelete?: (postId: string) => void;
  onPrivacyChange?: (postId: string, privacy: string) => void;
  onLikeToggle?: (postId: string, newLikeCount: number, isLiked: boolean) => void;
  onSaveToggle?: (postId: string, isSaved: boolean) => void;
  className?: string;
}

const PostPinningSystem: React.FC<PostPinningSystemProps> = ({
  posts,
  pinnedPostIds = [],
  isOwnProfile,
  maxPinned = 3,
  onPinChange,
  onReorder,
  onDelete,
  onPrivacyChange,
  onLikeToggle,
  onSaveToggle,
  className = '',
}) => {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [localPinned, setLocalPinned] = useState<PinnedPost[]>(pinnedPostIds);

  // Separate pinned and regular posts
  const pinnedPostsList = posts.filter(p => 
    localPinned.some(pinned => pinned.postId === p.id)
  ).sort((a, b) => {
    const aOrder = localPinned.find(p => p.postId === a.id)?.pinnedOrder || 0;
    const bOrder = localPinned.find(p => p.postId === b.id)?.pinnedOrder || 0;
    return aOrder - bOrder;
  });

  const regularPosts = posts.filter(p => 
    !localPinned.some(pinned => pinned.postId === p.id)
  );

  const handlePin = (postId: string) => {
    if (localPinned.length < maxPinned) {
      const newPinned: PinnedPost = {
        postId,
        pinnedOrder: localPinned.length,
        pinnedDate: new Date().toISOString(),
      };
      setLocalPinned([...localPinned, newPinned]);
      onPinChange?.(postId, true);
    }
  };

  const handleUnpin = (postId: string) => {
    const filtered = localPinned
      .filter(p => p.postId !== postId)
      .map((p, idx) => ({ ...p, pinnedOrder: idx }));
    setLocalPinned(filtered);
    onPinChange?.(postId, false);
    onReorder?.(filtered);
  };

  const handleDragStart = (postId: string) => {
    setDraggedItem(postId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetPostId: string) => {
    if (!draggedItem) return;

    const sourceIdx = localPinned.findIndex(p => p.postId === draggedItem);
    const targetIdx = localPinned.findIndex(p => p.postId === targetPostId);

    if (sourceIdx !== -1 && targetIdx !== -1) {
      const newPinned = [...localPinned];
      [newPinned[sourceIdx], newPinned[targetIdx]] = [
        newPinned[targetIdx],
        newPinned[sourceIdx],
      ];
      
      // Update order numbers
      newPinned.forEach((p, idx) => {
        p.pinnedOrder = idx;
      });

      setLocalPinned(newPinned);
      onReorder?.(newPinned);
    }
    setDraggedItem(null);
  };

  if (posts.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Pinned Posts Section */}
      {pinnedPostsList.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Pin className="h-4 w-4 text-blue-600" />
              Featured Posts ({pinnedPostsList.length}/{maxPinned})
            </h3>
          </div>

          <div className="space-y-3">
            {pinnedPostsList.map((post, idx) => (
              <div
                key={post.id}
                draggable={isOwnProfile}
                onDragStart={() => handleDragStart(post.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(post.id)}
                className={cn(
                  'relative',
                  isOwnProfile && 'cursor-move hover:opacity-75 transition-opacity'
                )}
              >
                {/* Pinned Post Card */}
                <div className="relative">
                  {/* Pinned indicator badge */}
                  <div className="absolute -top-3 -right-3 z-20">
                    <Badge className="bg-blue-600 text-white flex items-center gap-1 shadow-md">
                      <Pin className="h-3 w-3" />
                      Featured {idx + 1}
                    </Badge>
                  </div>

                  {/* Reorder hint for owner */}
                  {isOwnProfile && (
                    <div className="absolute -left-12 top-0 text-xs text-gray-500 italic hidden lg:block">
                      Drag to reorder
                    </div>
                  )}

                  {/* Featured post styling wrapper */}
                  <div className="border-2 border-blue-200 bg-blue-50/30 rounded-lg">
                    <ProfilePostCard
                      post={post}
                      isOwnPost={isOwnProfile}
                      isPinned={true}
                      canPin={false}
                      onDelete={onDelete}
                      onPrivacyChange={onPrivacyChange}
                      onLikeToggle={onLikeToggle}
                      onSaveToggle={onSaveToggle}
                      onUnpin={() => handleUnpin(post.id)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regular Posts Section */}
      {regularPosts.length > 0 && (
        <div className="space-y-3">
          {pinnedPostsList.length > 0 && (
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-gray-700">
                Other Posts
              </h3>
              {isOwnProfile && pinnedPostsList.length < maxPinned && (
                <span className="text-xs text-gray-500">
                  {maxPinned - pinnedPostsList.length} spot(s) available to pin
                </span>
              )}
            </div>
          )}

          <div className="space-y-4">
            {regularPosts.map((post) => (
              <div key={post.id} className="relative group">
                {/* Pin button for owner */}
                {isOwnProfile && pinnedPostsList.length < maxPinned && (
                  <div className="absolute -right-12 top-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePin(post.id)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      title="Pin to featured posts"
                    >
                      <Pin className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Render post card with pin integration */}
                <ProfilePostCard
                  post={post}
                  isOwnPost={isOwnProfile}
                  isPinned={false}
                  canPin={pinnedPostsList.length < maxPinned}
                  onDelete={onDelete}
                  onPrivacyChange={onPrivacyChange}
                  onLikeToggle={onLikeToggle}
                  onSaveToggle={onSaveToggle}
                  onPin={() => handlePin(post.id)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {posts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Pin className="h-12 w-12 mx-auto text-gray-300 mb-2" />
          <p>No posts yet</p>
        </div>
      )}
    </div>
  );
};

export default PostPinningSystem;

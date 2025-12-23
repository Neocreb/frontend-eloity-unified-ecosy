import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  Eye,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import { cn } from "@/utils/utils";
import { formatDistanceToNow } from "date-fns";
import { EnhancedCommentsSection } from "@/components/feed/EnhancedCommentsSection";
import EnhancedShareDialog from "@/components/feed/EnhancedShareDialog";
import VirtualGiftsAndTips from "@/components/premium/VirtualGiftsAndTips";
import { usePostAnalytics } from "@/hooks/usePostAnalytics";

interface PostAuthor {
  id: string;
  name: string;
  username: string;
  avatar: string;
  verified: boolean;
}

interface Post {
  id: string;
  content: string;
  image?: string;
  createdAt: string;
  likes: number;
  comments: number;
  shares: number;
  views?: number;
  privacy: string;
  author: PostAuthor;
  _liked?: boolean;
  _saved?: boolean;
}

interface PostDetailModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  isOwnPost: boolean;
  onLikeToggle?: (postId: string, newLikeCount: number, isLiked: boolean) => void;
  onSaveToggle?: (postId: string, isSaved: boolean) => void;
}

export const PostDetailModal = ({
  post,
  isOpen,
  onClose,
  isOwnPost,
  onLikeToggle,
  onSaveToggle,
}: PostDetailModalProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showGifts, setShowGifts] = useState(false);

  // Fetch real analytics data
  const { analytics, isLoading: analyticsLoading } = usePostAnalytics(post?.id || "");

  useEffect(() => {
    if (post) {
      setIsLiked(post._liked || false);
      setIsSaved(post._saved || false);
      setLikeCount(post.likes);
    }
  }, [post]);

  if (!post) return null;

  const handleLike = async () => {
    const newIsLiked = !isLiked;
    const newCount = newIsLiked ? likeCount + 1 : likeCount - 1;

    setIsLiked(newIsLiked);
    setLikeCount(newCount);
    onLikeToggle?.(post.id, newCount, newIsLiked);
  };

  const handleSave = () => {
    const newIsSaved = !isSaved;
    setIsSaved(newIsSaved);
    onSaveToggle?.(post.id, newIsSaved);
  };

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate to author profile
    window.location.href = `/profile/${post.author.id}`;
  };

  const engagementRate = post.likes > 0
    ? ((post.likes + post.comments + post.shares) / (analytics?.views || post.likes * 10) * 100).toFixed(1)
    : "0";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between pr-8">
          <DialogTitle>Post Details</DialogTitle>
          <DialogClose className="opacity-70 hover:opacity-100" />
        </DialogHeader>

        <div className="space-y-6 pb-4">
          {/* Post Author Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={post.author.avatar} alt={post.author.name} />
                <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAuthorClick}
                    className="font-semibold hover:underline flex items-center gap-1"
                  >
                    {post.author.name}
                    {post.author.verified && (
                      <span className="text-blue-500 text-sm">✓</span>
                    )}
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">
                  @{post.author.username}
                </p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </div>
          </div>

          <Separator />

          {/* Post Content */}
          <div className="space-y-4">
            <p className="text-base leading-relaxed whitespace-pre-wrap break-words">
              {post.content}
            </p>

            {post.image && (
              <div className="rounded-lg overflow-hidden bg-muted">
                <img
                  src={post.image}
                  alt="Post content"
                  className="w-full h-auto max-h-96 object-cover"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Analytics Overview */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card className="bg-muted/50 border-0">
              <CardContent className="pt-4">
                <div className="text-center">
                  <Eye className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">
                    {analyticsLoading ? "..." : analytics?.views || 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Views</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/50 border-0">
              <CardContent className="pt-4">
                <div className="text-center">
                  <Heart className="h-5 w-5 mx-auto mb-2 text-red-500" />
                  <p className="text-2xl font-bold text-red-500">{likeCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Likes</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/50 border-0">
              <CardContent className="pt-4">
                <div className="text-center">
                  <MessageSquare className="h-5 w-5 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold text-blue-500">{post.comments}</p>
                  <p className="text-xs text-muted-foreground mt-1">Comments</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/50 border-0">
              <CardContent className="pt-4">
                <div className="text-center">
                  <TrendingUp className="h-5 w-5 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold text-green-500">{engagementRate}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Engagement</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 justify-between">
            <Button
              variant={isLiked ? "default" : "outline"}
              size="sm"
              onClick={handleLike}
              className={cn(
                "flex-1",
                isLiked && "bg-red-500 hover:bg-red-600"
              )}
            >
              <Heart
                className={cn(
                  "h-4 w-4 mr-2",
                  isLiked && "fill-current"
                )}
              />
              Like ({likeCount})
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="flex-1"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Comment ({post.comments})
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShare(true)}
              className="flex-1"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>

            <Button
              variant={isSaved ? "default" : "outline"}
              size="sm"
              onClick={handleSave}
              className="flex-1"
            >
              <Bookmark
                className={cn(
                  "h-4 w-4 mr-2",
                  isSaved && "fill-current"
                )}
              />
              Save
            </Button>
          </div>

          {/* Privacy Badge */}
          <div className="flex items-center justify-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {post.privacy}
            </Badge>
          </div>

          <Separator />

          {/* Comments Section */}
          {showComments && (
            <div className="space-y-4">
              <h3 className="font-semibold">Comments</h3>
              <EnhancedCommentsSection
                postId={post.id}
                commentCount={post.comments}
              />
            </div>
          )}

          {/* Share Dialog */}
          {showShare && (
            <div className="space-y-4">
              <EnhancedShareDialog
                contentId={post.id}
                contentType="post"
                contentTitle={post.content.substring(0, 50)}
                contentAuthor={post.author.name}
                onClose={() => setShowShare(false)}
              />
            </div>
          )}

          {/* Virtual Gifts Section */}
          {!isOwnPost && (
            <div className="space-y-4 pt-2">
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Send Appreciation</h3>
                <VirtualGiftsAndTips
                  recipientId={post.author.id}
                  recipientName={post.author.name}
                  contentId={post.id}
                  contentType="post"
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostDetailModal;

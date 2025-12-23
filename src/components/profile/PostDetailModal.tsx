import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Heart,
  MessageSquare,
  Share2,
  Gift,
  Bookmark,
  Lock,
  Users,
  Globe,
  Pin,
  TrendingUp,
  X,
} from "lucide-react";
import { cn } from "@/utils/utils";
import { useToast } from "@/components/ui/use-toast";
import EnhancedShareDialog from "@/components/feed/EnhancedShareDialog";
import { EnhancedCommentsSection } from "@/components/feed/EnhancedCommentsSection";
import VirtualGiftsAndTips from "@/components/premium/VirtualGiftsAndTips";
import PostAnalyticsPreview from "./PostAnalyticsPreview";
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
  privacy: string;
  author: PostAuthor;
  _liked?: boolean;
  _saved?: boolean;
}

interface PostDetailModalProps {
  post: Post | null;
  isOpen: boolean;
  isOwnPost?: boolean;
  onClose: () => void;
  onLikeToggle?: (postId: string, newLikeCount: number, isLiked: boolean) => void;
  onSaveToggle?: (postId: string, isSaved: boolean) => void;
}

export const PostDetailModal = ({
  post,
  isOpen,
  isOwnPost = false,
  onClose,
  onLikeToggle,
  onSaveToggle,
}: PostDetailModalProps) => {
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(post?._liked || false);
  const [isSaved, setIsSaved] = useState(post?._saved || false);
  const [likeCount, setLikeCount] = useState(post?.likes || 0);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Fetch real analytics data
  const { analytics, isLoading: analyticsLoading } = usePostAnalytics(post?.id || "");

  if (!post) return null;

  const handleLike = () => {
    const newIsLiked = !isLiked;
    const newCount = newIsLiked ? likeCount + 1 : likeCount - 1;

    setIsLiked(newIsLiked);
    setLikeCount(newCount);
    onLikeToggle?.(post.id, newCount, newIsLiked);

    toast({
      title: newIsLiked ? "Post liked" : "Post unliked",
      duration: 2000,
    });
  };

  const handleSave = () => {
    const newIsSaved = !isSaved;
    setIsSaved(newIsSaved);
    onSaveToggle?.(post.id, newIsSaved);

    toast({
      title: newIsSaved ? "Post saved" : "Post unsaved",
      description: newIsSaved
        ? "Added to your saved posts"
        : "Removed from saved posts",
      duration: 2000,
    });
  };

  const getPrivacyIcon = () => {
    switch (post.privacy.toLowerCase()) {
      case "public":
        return <Globe className="h-4 w-4" />;
      case "friends":
        return <Users className="h-4 w-4" />;
      case "private":
        return <Lock className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post Details</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="absolute right-4 top-4">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogClose>
        </DialogHeader>

        <Separator />

        <div className="space-y-4">
          {/* Author Section */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={post.author.avatar} alt={post.author.name} />
                <AvatarFallback>
                  {post.author.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{post.author.name}</h3>
                  {post.author.verified && (
                    <Badge className="bg-blue-500 text-white h-5 text-xs">
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  @{post.author.username}
                </p>
                <p className="text-xs text-muted-foreground">{post.createdAt}</p>
              </div>
            </div>

            <Badge variant="outline" className="flex items-center gap-1">
              {getPrivacyIcon()}
              <span className="capitalize">{post.privacy}</span>
            </Badge>
          </div>

          <Separator />

          {/* Post Content */}
          <div className="space-y-3">
            {post.content && (
              <p className="text-base leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>
            )}

            {post.image && (
              <div className="rounded-lg overflow-hidden bg-muted">
                <img
                  src={post.image}
                  alt="Post image"
                  className="w-full h-auto max-h-96 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => window.open(post.image, "_blank")}
                  title="Click to view full size"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Analytics (if owner) */}
          {isOwnPost && (
            <div>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "flex items-center gap-2",
                  showAnalytics && "bg-green-50 border-green-300"
                )}
                onClick={() => setShowAnalytics(!showAnalytics)}
              >
                <TrendingUp className="h-4 w-4" />
                Post Analytics
              </Button>

              {showAnalytics && (
                <div className="mt-4">
                  <PostAnalyticsPreview
                    analytics={analytics}
                    isLoading={analyticsLoading}
                  />
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Engagement Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <p className="text-2xl font-bold text-red-500">{likeCount}</p>
              <p className="text-xs text-muted-foreground">Likes</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-blue-500">{post.comments}</p>
              <p className="text-xs text-muted-foreground">Comments</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-green-500">{post.shares}</p>
              <p className="text-xs text-muted-foreground">Shares</p>
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "flex items-center gap-1",
                  isLiked && "text-red-500"
                )}
                onClick={handleLike}
                title="Like this post (Keyboard: L)"
              >
                <Heart
                  className={cn("w-4 h-4", isLiked && "fill-current")}
                />
                <span>Like</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1"
                title="View comments (Keyboard: C)"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Comment</span>
              </Button>

              <EnhancedShareDialog
                postId={post.id}
                postContent={post.content}
                postAuthor={{
                  name: post.author.name,
                  username: post.author.username,
                }}
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 hover:text-green-500"
                    title="Share this post (Keyboard: S)"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </Button>
                }
              />

              <VirtualGiftsAndTips
                recipientId={post.author.id}
                recipientName={post.author.name}
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 text-yellow-600 hover:text-yellow-700"
                    title="Send gift"
                  >
                    <Gift className="w-4 h-4" />
                    <span>Gift</span>
                  </Button>
                }
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "px-3",
                isSaved && "text-blue-500"
              )}
              onClick={handleSave}
              title="Save this post (Keyboard: B)"
            >
              <Bookmark
                className={cn("w-4 h-4", isSaved && "fill-current")}
              />
            </Button>
          </div>

          <Separator />

          {/* Comments Section */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Comments ({post.comments})</h4>
            <EnhancedCommentsSection
              postId={post.id}
              postAuthorId={post.author.id}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostDetailModal;

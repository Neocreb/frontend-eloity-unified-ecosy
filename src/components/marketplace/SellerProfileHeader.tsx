import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Share2,
  MessageCircle,
  Heart,
  MoreVertical,
  MapPin,
  Star,
  TrendingUp,
  Users,
  Package,
  Clock,
  Check,
  Flag,
} from "lucide-react";
import { SellerProfile } from "@/types/marketplace";

interface SellerProfileHeaderProps {
  seller: SellerProfile;
  onContactClick: () => void;
  isFollowing?: boolean;
  onFollowClick?: () => void;
  followerCount?: number;
  averageResponse Time?: number;
}

const SellerProfileHeader: React.FC<SellerProfileHeaderProps> = ({
  seller,
  onContactClick,
  isFollowing = false,
  onFollowClick,
  followerCount = 0,
  averageResponse Time = 4,
}) => {
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
    }).format(date);
  };

  const calculateYearsActive = (joinDate: string) => {
    const now = new Date();
    const joinDateObj = new Date(joinDate);
    return Math.floor((now.getTime() - joinDateObj.getTime()) / (1000 * 60 * 60 * 24 * 365));
  };

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="relative h-48 md:h-64 rounded-lg overflow-hidden bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
        {seller.bannerImage && (
          <img
            src={seller.bannerImage}
            alt="Store Banner"
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* Profile Section */}
      <Card className="relative -mt-20 mx-4 md:mx-0">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-end gap-6">
            {/* Avatar */}
            <div className="flex flex-col items-center md:items-start">
              <div className="h-32 w-32 rounded-lg overflow-hidden border-4 border-white shadow-lg bg-gray-100 flex-shrink-0">
                <img
                  src={seller.avatar}
                  alt={seller.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Seller Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 justify-center md:justify-start flex-wrap">
                    {seller.name}
                    {seller.isVerified && (
                      <Badge className="bg-blue-500">
                        <Check className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </h1>
                  <p className="text-gray-600 text-sm mt-1">@{seller.username}</p>

                  {seller.location && (
                    <div className="flex items-center gap-1 text-gray-600 text-sm mt-2 justify-center md:justify-start">
                      <MapPin className="h-4 w-4" />
                      {seller.location}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 flex-wrap justify-center">
                  <Button
                    onClick={onContactClick}
                    className="gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Contact
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onFollowClick}
                    className="gap-2"
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        isFollowing ? "fill-red-500 text-red-500" : ""
                      }`}
                    />
                    {isFollowing ? "Following" : "Follow"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShareOpen(true)}
                    size="icon"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
                        <Flag className="h-4 w-4 mr-2" />
                        Report Store
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span className="font-bold text-lg">{seller.rating.toFixed(1)}</span>
              </div>
              <p className="text-xs text-gray-600">Rating</p>
              <p className="text-xs text-gray-500">
                {seller.reviewCount} reviews
              </p>
            </div>

            <div className="text-center">
              <div className="font-bold text-lg mb-1">{followerCount}</div>
              <p className="text-xs text-gray-600">Followers</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Package className="h-4 w-4 text-blue-500" />
              </div>
              <div className="font-bold text-lg">{seller.productCount}</div>
              <p className="text-xs text-gray-600">Products</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <div className="font-bold text-lg">{seller.salesCount || 0}</div>
              <p className="text-xs text-gray-600">Sales</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="h-4 w-4 text-orange-500" />
              </div>
              <div className="font-bold text-lg">{averageResponse Time}h</div>
              <p className="text-xs text-gray-600">Response time</p>
            </div>
          </div>

          {seller.bio && (
            <>
              <Separator className="my-6" />
              <div>
                <h3 className="font-semibold mb-2">About This Seller</h3>
                <p className="text-gray-600 text-sm">{seller.bio}</p>
              </div>
            </>
          )}

          {/* Additional Info */}
          <Separator className="my-6" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Member Since</p>
              <p className="font-semibold">{formatDate(seller.joinedDate)}</p>
              <p className="text-xs text-gray-500">
                {calculateYearsActive(seller.joinedDate)} years active
              </p>
            </div>
            {seller.isVerified && (
              <div>
                <p className="text-gray-600">Account Status</p>
                <p className="font-semibold text-green-600 flex items-center gap-1">
                  <Check className="h-4 w-4" />
                  Verified
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Share Dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share This Store</DialogTitle>
            <DialogDescription>
              Share {seller.name}'s store with others
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-3 bg-gray-100 rounded-lg">
              <p className="text-sm font-mono text-gray-700">
                {`${window.location.origin}/marketplace/seller/${seller.username}`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/marketplace/seller/${seller.username}`
                  );
                }}
              >
                Copy Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Store</DialogTitle>
            <DialogDescription>
              Help us maintain a safe marketplace
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              If you believe this store is violating our policies, please let us know.
            </p>
            <Button className="w-full" onClick={() => setShowReportDialog(false)}>
              Report Store
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerProfileHeader;
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useInvitationStats } from "@/hooks/useInvitationStats";
import {
  Copy,
  Share2,
  Users,
  Gift,
  DollarSign,
  CheckCircle,
  Clock,
  ArrowRight,
  Twitter,
  Facebook,
  Mail,
  MessageCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

export default function InviteFriendsSection() {
  const { toast } = useToast();
  const { invitations, stats, isLoading, error, sendInvitation } = useInvitationStats();
  const [email, setEmail] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      toast({
        title: "✓ Copied!",
        description: "Referral link copied to clipboard",
      });
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const shareOn = (platform: string) => {
    const text = `Join Eloity with my referral link and earn rewards! ${referralLink}`;
    let url = "";

    switch (platform) {
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
        break;
      case "whatsapp":
        url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        break;
      case "email":
        url = `mailto:?subject=Join Eloity&body=${encodeURIComponent(text)}`;
        break;
    }

    if (url) {
      window.open(url, "_blank");
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 dark:from-blue-950 dark:to-cyan-950 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Your Invitation Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-2xl font-bold text-blue-600">{invitedFriends.length}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Invites Sent</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{convertedFriends}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Joined</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{totalReward} ELO</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Earned</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral Link Section */}
      <Card>
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
          <CardDescription>
            Share this link with friends to earn rewards when they join
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Copy Section */}
          <div className="flex gap-2">
            <Input
              value={referralLink}
              readOnly
              className="bg-gray-50 dark:bg-gray-900"
            />
            <Button
              onClick={copyReferralLink}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {copiedLink ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </Button>
          </div>

          {/* Or Your Code */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Or use code:</span>
            <code className="px-3 py-1 bg-gray-100 dark:bg-gray-900 rounded font-mono font-bold text-sm">
              {referralCode}
            </code>
          </div>

          {/* Social Share Buttons */}
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-3 text-gray-900 dark:text-white">
              Share on Social Media
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareOn("twitter")}
                className="gap-2"
              >
                <Twitter className="w-4 h-4" />
                <span className="hidden sm:inline">Twitter</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareOn("facebook")}
                className="gap-2"
              >
                <Facebook className="w-4 h-4" />
                <span className="hidden sm:inline">Facebook</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareOn("whatsapp")}
                className="gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">WhatsApp</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareOn("email")}
                className="gap-2"
              >
                <Mail className="w-4 h-4" />
                <span className="hidden sm:inline">Email</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invited Friends List */}
      <Card>
        <CardHeader>
          <CardTitle>Invited Friends</CardTitle>
          <CardDescription>
            {pendingFriends > 0 && `${pendingFriends} pending, `}
            {convertedFriends} joined
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitedFriends.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">No invites sent yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Start inviting friends to earn rewards!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {invitedFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {friend.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {friend.email}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {friend.status === "converted" && (
                      <>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Joined
                        </Badge>
                        <div className="text-right">
                          <p className="font-bold text-green-600 dark:text-green-400">
                            +{friend.reward} ELO
                          </p>
                          {friend.joinDate && (
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {new Date(friend.joinDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </>
                    )}

                    {friend.status === "pending" && (
                      <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                1
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Share Your Link
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Send your unique referral link to friends
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                2
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  They Join
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Friends sign up using your link or code
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                3
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Earn Rewards
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get 50 ELO points for each friend who completes signup
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

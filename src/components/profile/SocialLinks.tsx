import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Github,
  Linkedin,
  Twitter,
  Globe,
  Plus,
  Edit,
  ExternalLink,
  CheckCircle,
} from "lucide-react";

export type SocialPlatform =
  | "linkedin"
  | "twitter"
  | "github"
  | "portfolio"
  | "discord"
  | "telegram"
  | "youtube"
  | "instagram";

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
  isVerified?: boolean;
  username?: string;
}

interface SocialLinksProps {
  links: SocialLink[];
  isOwner?: boolean;
  onEdit?: () => void;
  onOpenLink?: (url: string) => void;
}

const getPlatformIcon = (platform: SocialPlatform) => {
  switch (platform) {
    case "linkedin":
      return Linkedin;
    case "twitter":
      return Twitter;
    case "github":
      return Github;
    case "portfolio":
      return Globe;
    case "youtube":
      return Youtube;
    case "instagram":
      return Instagram;
    case "discord":
      return Discord;
    case "telegram":
      return Telegram;
    default:
      return Globe;
  }
};

const getPlatformLabel = (platform: SocialPlatform) => {
  const labels: Record<SocialPlatform, string> = {
    linkedin: "LinkedIn",
    twitter: "Twitter/X",
    github: "GitHub",
    portfolio: "Portfolio",
    discord: "Discord",
    telegram: "Telegram",
    youtube: "YouTube",
    instagram: "Instagram",
  };
  return labels[platform] || platform;
};

const getPlatformColor = (platform: SocialPlatform) => {
  const colors: Record<SocialPlatform, string> = {
    linkedin: "text-blue-600 hover:text-blue-700",
    twitter: "text-black hover:text-gray-700",
    github: "text-gray-800 hover:text-black",
    portfolio: "text-purple-600 hover:text-purple-700",
    discord: "text-indigo-600 hover:text-indigo-700",
    telegram: "text-sky-500 hover:text-sky-600",
    youtube: "text-red-600 hover:text-red-700",
    instagram: "text-pink-600 hover:text-pink-700",
  };
  return colors[platform] || "text-gray-600 hover:text-gray-700";
};

// Placeholder icons for missing ones
const Youtube = () => <Globe className="h-5 w-5" />;
const Instagram = () => <Globe className="h-5 w-5" />;
const Discord = () => <Globe className="h-5 w-5" />;
const Telegram = () => <Globe className="h-5 w-5" />;

export const SocialLinks: React.FC<SocialLinksProps> = ({
  links,
  isOwner = false,
  onEdit,
  onOpenLink,
}) => {
  const verifiedLinks = links.filter((l) => l.isVerified);
  const unverifiedLinks = links.filter((l) => !l.isVerified);

  if (links.length === 0 && !isOwner) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Social Links</CardTitle>
        {isOwner && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {links.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-4">No social links added yet</p>
            {isOwner && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                Add social links
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Verified links section */}
            {verifiedLinks.length > 0 && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-3">
                  Verified
                </div>
                <div className="flex flex-wrap gap-2">
                  {verifiedLinks.map((link) => {
                    const Icon = getPlatformIcon(link.platform);
                    return (
                      <button
                        key={`${link.platform}-${link.url}`}
                        onClick={() => onOpenLink?.(link.url)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-input bg-card hover:bg-accent transition-colors group ${getPlatformColor(
                          link.platform
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-sm font-medium">
                          {getPlatformLabel(link.platform)}
                        </span>
                        <CheckCircle className="h-4 w-4 ml-1 opacity-60" />
                        <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Unverified links section */}
            {unverifiedLinks.length > 0 && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-3">
                  Other Links
                </div>
                <div className="flex flex-wrap gap-2">
                  {unverifiedLinks.map((link) => {
                    const Icon = getPlatformIcon(link.platform);
                    return (
                      <button
                        key={`${link.platform}-${link.url}`}
                        onClick={() => onOpenLink?.(link.url)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-input bg-card/50 hover:bg-accent transition-colors group opacity-75 hover:opacity-100 ${getPlatformColor(
                          link.platform
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-sm font-medium">
                          {getPlatformLabel(link.platform)}
                        </span>
                        <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

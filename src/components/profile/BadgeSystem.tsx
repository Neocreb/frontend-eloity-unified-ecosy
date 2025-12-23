import React, { useState } from 'react';
import {
  Crown,
  Shield,
  Star,
  TrendingUp,
  Zap,
  Award,
  CheckCircle,
  Target,
  Heart,
  Flame,
  Trophy,
  Code,
  Verified,
  Gift,
  Users,
  MessageSquare,
  BarChart3,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import BadgeDetailModal from './BadgeDetailModal';

export interface BadgeData {
  id: string;
  type: 'account' | 'creator' | 'trust' | 'trading' | 'engagement' | 'special';
  name: string;
  description?: string;
  icon: React.ReactNode;
  color: string;
  earnedDate: string;
  isActive: boolean;
  requirements?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

interface BadgeSystemProps {
  userId: string;
  badges?: BadgeData[];
  isOwnProfile?: boolean;
  maxDisplay?: number;
  variant?: 'compact' | 'detailed';
  className?: string;
}

// Map badge types to their icons and colors
const badgeIconMap: Record<string, React.ReactNode> = {
  'Premium': <Crown className="h-4 w-4" />,
  'Verified': <Verified className="h-4 w-4" />,
  'KYC Verified': <CheckCircle className="h-4 w-4" />,
  'Creator': <Star className="h-4 w-4" />,
  'Pro Seller': <TrendingUp className="h-4 w-4" />,
  'Top Freelancer': <Award className="h-4 w-4" />,
  'Crypto Trader': <Zap className="h-4 w-4" />,
  'Active Trader': <Target className="h-4 w-4" />,
  'Top Contributor': <Heart className="h-4 w-4" />,
  'Community Hero': <Flame className="h-4 w-4" />,
  'Pioneer': <Trophy className="h-4 w-4" />,
  'Beta Tester': <Code className="h-4 w-4" />,
  'Ambassador': <Users className="h-4 w-4" />,
  'Trustworthy': <Shield className="h-4 w-4" />,
  'Helpful': <MessageSquare className="h-4 w-4" />,
  'Engaged': <BarChart3className="h-4 w-4" />,
  'Reliable': <Clock className="h-4 w-4" />,
  'Exceptional': <AlertCircle className="h-4 w-4" />,
};

const badgeColorMap: Record<string, string> = {
  'account': 'bg-blue-100 text-blue-700 border-blue-200',
  'creator': 'bg-purple-100 text-purple-700 border-purple-200',
  'trust': 'bg-green-100 text-green-700 border-green-200',
  'trading': 'bg-orange-100 text-orange-700 border-orange-200',
  'engagement': 'bg-red-100 text-red-700 border-red-200',
  'special': 'bg-gradient-to-r from-yellow-100 to-pink-100 text-yellow-700 border-yellow-200',
};

const mockBadges: BadgeData[] = [
  {
    id: '1',
    type: 'special',
    name: 'Premium',
    description: 'Premium member with exclusive benefits',
    icon: badgeIconMap['Premium'],
    color: badgeColorMap['special'],
    earnedDate: '2024-01-15',
    isActive: true,
    rarity: 'rare',
  },
  {
    id: '2',
    type: 'trust',
    name: 'Trustworthy',
    description: 'Verified trusted member',
    icon: badgeIconMap['Trustworthy'],
    color: badgeColorMap['trust'],
    earnedDate: '2024-02-10',
    isActive: true,
    rarity: 'common',
  },
  {
    id: '3',
    type: 'engagement',
    name: 'Top Contributor',
    description: 'Highly engaged community member',
    icon: badgeIconMap['Top Contributor'],
    color: badgeColorMap['engagement'],
    earnedDate: '2024-03-05',
    isActive: true,
    rarity: 'epic',
  },
  {
    id: '4',
    type: 'creator',
    name: 'Creator',
    description: 'Active content creator',
    icon: badgeIconMap['Creator'],
    color: badgeColorMap['creator'],
    earnedDate: '2024-02-20',
    isActive: true,
    rarity: 'rare',
  },
  {
    id: '5',
    type: 'trading',
    name: 'Crypto Trader',
    description: 'Active cryptocurrency trader',
    icon: badgeIconMap['Crypto Trader'],
    color: badgeColorMap['trading'],
    earnedDate: '2024-01-30',
    isActive: true,
    rarity: 'rare',
  },
  {
    id: '6',
    type: 'special',
    name: 'Pioneer',
    description: 'Early platform adopter',
    icon: badgeIconMap['Pioneer'],
    color: badgeColorMap['special'],
    earnedDate: '2023-12-01',
    isActive: true,
    rarity: 'legendary',
  },
];

const BadgeSystem: React.FC<BadgeSystemProps> = ({
  userId,
  badges,
  isOwnProfile = false,
  maxDisplay = 8,
  variant = 'compact',
  className = '',
}) => {
  const [selectedBadge, setSelectedBadge] = useState<BadgeData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Use provided badges or mock data
  const displayBadges = badges && badges.length > 0 ? badges : mockBadges;
  const activeBadges = displayBadges.filter(b => b.isActive);
  const visibleBadges = activeBadges.slice(0, maxDisplay);
  const hasMoreBadges = activeBadges.length > maxDisplay;

  const handleBadgeClick = (badge: BadgeData) => {
    setSelectedBadge(badge);
    setShowDetailModal(true);
  };

  const handleCloseBadgeModal = () => {
    setShowDetailModal(false);
    setSelectedBadge(null);
  };

  if (activeBadges.length === 0) {
    return null;
  }

  if (variant === 'detailed') {
    return (
      <>
        <TooltipProvider>
          <div className={cn('flex flex-wrap gap-2', className)}>
            {visibleBadges.map((badge) => (
              <Tooltip key={badge.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleBadgeClick(badge)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-xs cursor-pointer transition-all hover:shadow-md',
                        badge.color
                      )}
                    >
                      {badge.icon && <span className="mr-1 flex-shrink-0">{badge.icon}</span>}
                      {badge.name}
                    </Badge>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">{badge.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Earned {new Date(badge.earnedDate).toLocaleDateString()}
                  </p>
                </TooltipContent>
              </Tooltip>
            ))}
            {hasMoreBadges && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetailModal(true)}
                className="h-6 text-xs px-2"
              >
                +{activeBadges.length - maxDisplay} more
              </Button>
            )}
          </div>
        </TooltipProvider>

        {showDetailModal && (
          <BadgeDetailModal
            badge={selectedBadge}
            allBadges={visibleBadges}
            isOpen={showDetailModal}
            onClose={handleCloseBadgeModal}
            isOwnProfile={isOwnProfile}
          />
        )}
      </>
    );
  }

  // Compact variant
  return (
    <>
      <TooltipProvider>
        <div className={cn('flex flex-wrap gap-1.5', className)}>
          {visibleBadges.map((badge) => (
            <Tooltip key={badge.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleBadgeClick(badge)}
                  className="focus:outline-none transition-transform hover:scale-105"
                >
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-xs cursor-pointer transition-all hover:shadow-sm',
                      badge.color
                    )}
                  >
                    {badge.icon && <span className="mr-0.5 flex-shrink-0">{badge.icon}</span>}
                    {badge.name}
                  </Badge>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-xs">{badge.description}</p>
              </TooltipContent>
            </Tooltip>
          ))}
          {hasMoreBadges && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetailModal(true)}
              className="h-6 text-xs px-2 hover:bg-gray-100"
            >
              View all ({activeBadges.length})
            </Button>
          )}
        </div>
      </TooltipProvider>

      {showDetailModal && (
        <BadgeDetailModal
          badge={selectedBadge}
          allBadges={activeBadges}
          isOpen={showDetailModal}
          onClose={handleCloseBadgeModal}
          isOwnProfile={isOwnProfile}
        />
      )}
    </>
  );
};

export default BadgeSystem;
export { badgeColorMap, badgeIconMap };
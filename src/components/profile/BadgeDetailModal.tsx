import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Share2, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BadgeData } from './BadgeSystem';

interface BadgeDetailModalProps {
  badge: BadgeData | null;
  allBadges: BadgeData[];
  isOpen: boolean;
  onClose: () => void;
  isOwnProfile?: boolean;
}

const rarityStyles: Record<string, string> = {
  'common': 'border-gray-300 bg-gray-50',
  'rare': 'border-blue-300 bg-blue-50',
  'epic': 'border-purple-300 bg-purple-50',
  'legendary': 'border-yellow-300 bg-yellow-50',
};

const rarityTextStyles: Record<string, string> = {
  'common': 'text-gray-600',
  'rare': 'text-blue-600',
  'epic': 'text-purple-600',
  'legendary': 'text-yellow-600',
};

const BadgeDetailModal: React.FC<BadgeDetailModalProps> = ({
  badge,
  allBadges,
  isOpen,
  onClose,
  isOwnProfile = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  // Group badges by type for the all badges view
  const badgesByType = useMemo(() => {
    const grouped: Record<string, BadgeData[]> = {
      account: [],
      creator: [],
      trust: [],
      trading: [],
      engagement: [],
      special: [],
    };
    allBadges.forEach(b => {
      grouped[b.type].push(b);
    });
    return grouped;
  }, [allBadges]);

  const handleCopyBadgeLink = () => {
    if (badge) {
      const link = `${window.location.origin}/badges/${badge.id}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const selectedBadge = badge || allBadges[0];
  if (!selectedBadge) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Badge Details</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Badge Details</TabsTrigger>
            <TabsTrigger value="all">All Badges ({allBadges.length})</TabsTrigger>
          </TabsList>

          {/* Badge Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <div className={cn('rounded-lg border-2 p-8', rarityStyles[selectedBadge.rarity || 'common'])}>
              <div className="flex items-center gap-4 mb-4">
                <div className="h-16 w-16 rounded-full bg-white border-2 flex items-center justify-center">
                  {selectedBadge.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedBadge.name}</h2>
                  <Badge className={cn('mt-1', selectedBadge.color)}>
                    {selectedBadge.rarity ? selectedBadge.rarity.charAt(0).toUpperCase() + selectedBadge.rarity.slice(1) : 'Common'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Badge Information */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Description</h3>
                <p className="text-base text-gray-800">
                  {selectedBadge.description || 'No description available'}
                </p>
              </div>

              {selectedBadge.requirements && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">Requirements</h3>
                  <p className="text-base text-gray-800">{selectedBadge.requirements}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-xs font-medium text-gray-600 mb-1">Earned Date</h4>
                  <p className="text-sm font-semibold">
                    {new Date(selectedBadge.earnedDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-xs font-medium text-gray-600 mb-1">Category</h4>
                  <p className="text-sm font-semibold capitalize">{selectedBadge.type}</p>
                </div>
              </div>

              {isOwnProfile && (
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyBadgeLink}
                    className="flex-1"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Badge Link
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* All Badges Tab */}
          <TabsContent value="all" className="space-y-4">
            {Object.entries(badgesByType).map(([type, badges]) => {
              if (badges.length === 0) return null;

              const typeLabels: Record<string, string> = {
                account: 'Account Status',
                creator: 'Creator Status',
                trust: 'Trust Status',
                trading: 'Trading Status',
                engagement: 'Engagement',
                special: 'Special',
              };

              return (
                <div key={type}>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 capitalize">
                    {typeLabels[type]}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {badges.map(b => (
                      <button
                        key={b.id}
                        onClick={() => setActiveTab('details')}
                        className={cn(
                          'p-3 rounded-lg border-2 text-left transition-all hover:shadow-md',
                          b.id === selectedBadge.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white',
                          rarityStyles[b.rarity || 'common']
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-white border flex items-center justify-center flex-shrink-0">
                            {b.icon}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium line-clamp-1">{b.name}</p>
                            <p className="text-xs text-gray-600">
                              {new Date(b.earnedDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            {allBadges.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                <p>No badges yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BadgeDetailModal;

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, ArrowRight, Share2, TrendingUp, Network } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/utils/utils';

export interface Connection {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  role?: string;
  mutualConnections?: number;
  sharedInterests?: string[];
}

interface ConnectionStatsProps {
  totalConnections: number;
  mutualConnections: number;
  networkSize: number;
  topConnections?: Connection[];
  isOwner?: boolean;
  onViewNetwork?: () => void;
}

interface NetworkMetric {
  label: string;
  value: number;
  change?: number;
  trend?: 'up' | 'down';
}

export const ConnectionStats: React.FC<ConnectionStatsProps> = ({
  totalConnections = 0,
  mutualConnections = 0,
  networkSize = 0,
  topConnections = [],
  isOwner = false,
  onViewNetwork,
}) => {
  const [showAllConnections, setShowAllConnections] = useState(false);

  const displayedConnections = showAllConnections ? topConnections : topConnections?.slice(0, 3) || [];

  const metrics: NetworkMetric[] = [
    {
      label: 'Direct Connections',
      value: totalConnections,
      change: 12,
      trend: 'up',
    },
    {
      label: 'Mutual Connections',
      value: mutualConnections,
      change: 5,
      trend: 'up',
    },
    {
      label: 'Network Reach',
      value: networkSize,
      change: 24,
      trend: 'up',
    },
  ];

  const connectionDensity = totalConnections > 0 ? (mutualConnections / totalConnections) * 100 : 0;

  if (totalConnections === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5 text-purple-600" />
            Network & Connections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="mb-2">No connections yet</p>
            <p className="text-sm">{isOwner ? 'Connect with others to expand your network' : 'This user hasn\'t made any connections yet'}</p>
            {isOwner && (
              <Button className="mt-4" variant="default" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Find People to Connect
              </Button>
            )}
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
            <Network className="h-5 w-5 text-purple-600" />
            Network & Connections
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewNetwork}
            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
          >
            View Network
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {metrics.map((metric, idx) => (
            <div key={idx} className="bg-gray-50 rounded-lg p-4 border">
              <p className="text-sm text-gray-600 mb-2">{metric.label}</p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{metric.value.toLocaleString()}</p>
                  {metric.change && (
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className={cn(
                        'h-3 w-3',
                        metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      )} />
                      <span className={cn(
                        'text-xs font-medium',
                        metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      )}>
                        {metric.trend === 'up' ? '+' : '-'}{metric.change}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Connection Quality Indicator */}
        <div className="border rounded-lg p-4 bg-gradient-to-br from-purple-50 to-indigo-50">
          <div className="flex items-center justify-between mb-2">
            <p className="font-medium text-gray-900">Connection Quality</p>
            <span className="text-sm font-semibold text-purple-600">
              {connectionDensity.toFixed(0)}% mutual
            </span>
          </div>
          <Progress value={Math.min(connectionDensity, 100)} className="mb-2" />
          <p className="text-xs text-gray-600">
            {connectionDensity > 80 && 'Excellent network density - highly interconnected community'}
            {connectionDensity > 50 && connectionDensity <= 80 && 'Good network quality with strong mutual connections'}
            {connectionDensity > 20 && connectionDensity <= 50 && 'Moderate network density - room to build more mutual connections'}
            {connectionDensity <= 20 && 'Growing network - continue connecting to build stronger bonds'}
          </p>
        </div>

        {/* Top Connections */}
        {topConnections && topConnections.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              Top Connections ({topConnections.length})
            </h4>
            <div className="space-y-3">
              {displayedConnections.map((connection) => (
                <div
                  key={connection.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={connection.avatar} />
                      <AvatarFallback>{connection.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{connection.name}</p>
                      <p className="text-xs text-gray-600">@{connection.username}</p>
                    </div>
                  </div>
                  {connection.mutualConnections && connection.mutualConnections > 0 && (
                    <Badge variant="secondary" className="ml-2 flex-shrink-0">
                      {connection.mutualConnections} mutual
                    </Badge>
                  )}
                </div>
              ))}
            </div>

            {topConnections.length > 3 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllConnections(!showAllConnections)}
                className="w-full mt-3"
              >
                {showAllConnections ? 'Show Less' : `Show All ${topConnections.length} Connections`}
              </Button>
            )}
          </div>
        )}

        {/* Shared Interests */}
        {topConnections && topConnections[0]?.sharedInterests && topConnections[0].sharedInterests.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
              Common Interests
            </h4>
            <div className="flex flex-wrap gap-2">
              {Array.from(
                new Set(
                  topConnections
                    .flatMap(c => c.sharedInterests || [])
                )
              ).slice(0, 8).map((interest, idx) => (
                <Badge key={idx} variant="outline" className="bg-indigo-50">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" className="flex-1">
            <UserPlus className="h-4 w-4 mr-2" />
            Find More Connections
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Share2 className="h-4 w-4 mr-2" />
            Share Network
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectionStats;

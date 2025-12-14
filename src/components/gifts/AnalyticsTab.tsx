import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  Gift,
  DollarSign,
  Users,
  Calendar,
  RefreshCw,
  Crown,
  Heart,
  Zap,
  Loader2
} from 'lucide-react';

interface AnalyticsTabProps {
  onRefresh: () => void;
}

const AnalyticsTab = ({ onRefresh }: AnalyticsTabProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [spendingData, setSpendingData] = useState<any[]>([]);
  const [giftDistribution, setGiftDistribution] = useState<any[]>([]);
  const [topRecipients, setTopRecipients] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalGifts: 0,
    totalTips: 0,
    totalSpent: 0,
    topGift: 'N/A',
    favoriteCreator: 'N/A',
    avgGiftValue: 0,
  });

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe'];

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);

      // Fetch gift transactions
      const { data: giftTxData, error: giftError } = await supabase
        .from('gift_transactions')
        .select('*, gift:virtual_gifts(name, category)')
        .order('created_at', { ascending: false });

      if (giftError) throw giftError;

      // Fetch tip transactions
      const { data: tipTxData, error: tipError } = await supabase
        .from('tip_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (tipError) throw tipError;

      // Process spending data by day
      const dayMap = new Map<string, { gifts: number; tips: number }>();
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      days.forEach(day => {
        dayMap.set(day, { gifts: 0, tips: 0 });
      });

      (giftTxData || []).forEach(tx => {
        const date = new Date(tx.created_at);
        const dayIndex = date.getDay();
        const dayName = days[dayIndex];
        const current = dayMap.get(dayName) || { gifts: 0, tips: 0 };
        current.gifts += 1;
        dayMap.set(dayName, current);
      });

      (tipTxData || []).forEach(tx => {
        const date = new Date(tx.created_at);
        const dayIndex = date.getDay();
        const dayName = days[dayIndex];
        const current = dayMap.get(dayName) || { gifts: 0, tips: 0 };
        current.tips += 1;
        dayMap.set(dayName, current);
      });

      const processedSpendingData = days.map(day => {
        const data = dayMap.get(day) || { gifts: 0, tips: 0 };
        return {
          day,
          gifts: data.gifts,
          tips: data.tips,
          total: data.gifts + data.tips
        };
      });
      setSpendingData(processedSpendingData);

      // Process gift distribution by category
      const categoryMap = new Map<string, number>();
      (giftTxData || []).forEach(tx => {
        const category = tx.gift?.category || 'Other';
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
      });

      const processedDistribution = Array.from(categoryMap.entries()).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
      }));
      setGiftDistribution(processedDistribution);

      // Get top recipients
      const recipientMap = new Map<string, { gifts: number; tips: number; username: string; avatar_url: string }>();

      (giftTxData || []).forEach(tx => {
        const key = tx.to_user_id;
        const current = recipientMap.get(key) || { gifts: 0, tips: 0, username: '', avatar_url: '' };
        current.gifts += 1;
        recipientMap.set(key, current);
      });

      (tipTxData || []).forEach(tx => {
        const key = tx.to_user_id;
        const current = recipientMap.get(key) || { gifts: 0, tips: 0, username: '', avatar_url: '' };
        current.tips += 1;
        recipientMap.set(key, current);
      });

      const topRecipientList = Array.from(recipientMap.entries())
        .map(([id, data]) => ({
          id,
          username: data.username || 'Unknown',
          avatar: data.avatar_url || '/placeholder-user.jpg',
          gifts: data.gifts,
          tips: data.tips,
          total: data.gifts + data.tips
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 4);

      setTopRecipients(topRecipientList);

      // Calculate stats
      const totalGifts = giftTxData?.length || 0;
      const totalTips = tipTxData?.length || 0;
      const totalSpent =
        ((giftTxData || []).reduce((sum, tx) => sum + tx.total_amount, 0) || 0) +
        ((tipTxData || []).reduce((sum, tx) => sum + tx.amount, 0) || 0);

      const topGiftName = giftTxData && giftTxData.length > 0
        ? giftTxData[0].gift?.name || 'N/A'
        : 'N/A';

      const topCreator = topRecipientList[0]?.username || 'N/A';
      const avgGiftValue = totalGifts > 0 ? totalSpent / (totalGifts + totalTips) : 0;

      setStats({
        totalGifts,
        totalTips,
        totalSpent,
        topGift: topGiftName,
        favoriteCreator: topCreator,
        avgGiftValue: parseFloat(avgGiftValue.toFixed(2)),
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadAnalytics();
    onRefresh();
    toast({
      title: 'Analytics Updated',
      description: 'Your analytics data has been refreshed.',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading analytics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/20 border-purple-500/30">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-purple-300">Total Gifts</p>
                <p className="text-lg sm:text-xl font-bold text-purple-50">{stats.totalGifts}</p>
              </div>
              <Gift className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/20 border-blue-500/30">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-blue-300">Total Tips</p>
                <p className="text-lg sm:text-xl font-bold text-blue-50">{stats.totalTips}</p>
              </div>
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/20 border-green-500/30">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-green-300">Total Spent</p>
                <p className="text-lg sm:text-xl font-bold text-green-50">${stats.totalSpent.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Spending Over Time */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                  Spending Over Time
                </CardTitle>
                <CardDescription>
                  Your gift and tip activity over the past week
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="gifts" name="Gifts" fill="#8884d8" />
                <Bar dataKey="tips" name="Tips" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gift Distribution */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Gift className="h-4 w-4 sm:h-5 sm:w-5" />
              Gift Distribution
            </CardTitle>
            <CardDescription>
              Breakdown of gifts by category
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={giftDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {giftDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Recipients */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            Top Recipients
          </CardTitle>
          <CardDescription>
            Creators you've supported the most
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topRecipients.map((recipient) => (
              <div key={recipient.id} className="flex items-center justify-between p-3 hover:bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <img 
                    src={recipient.avatar} 
                    alt={recipient.username} 
                    className="h-10 w-10 rounded-full"
                  />
                  <div>
                    <p className="font-medium">{recipient.username}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {recipient.gifts} gifts
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {recipient.tips} tips
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{recipient.total}</p>
                  <p className="text-xs text-muted-foreground">total interactions</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-full">
                <Crown className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Top Gift Sent</p>
                <p className="font-medium">{stats.topGift}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-500/10 rounded-full">
                <Heart className="h-5 w-5 text-pink-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Favorite Creator</p>
                <p className="font-medium">{stats.favoriteCreator}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsTab;

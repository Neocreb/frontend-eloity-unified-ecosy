import React, { useEffect, useState } from 'react';

interface StatItem {
  id: string;
  metric_name: string;
  current_value: string | number;
  unit: string;
  label: string;
  icon?: string;
  display_format: string;
}

const formatNumber = (value: string | number, format: string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) return '0';

  if (format === 'currency') {
    return '$' + num.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  if (format === 'percentage') {
    return num.toFixed(0) + '%';
  }

  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }

  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }

  return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
};

export const SocialProofSection: React.FC = () => {
  const [stats, setStats] = useState<StatItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const defaultStats: StatItem[] = [
    {
      id: '1',
      metric_name: 'active_users',
      current_value: 500000,
      unit: 'users',
      label: 'Active Users',
      display_format: 'number',
      icon: '👥',
    },
    {
      id: '2',
      metric_name: 'total_earnings',
      current_value: 125000000,
      unit: 'USD',
      label: 'Total Earnings Distributed',
      display_format: 'currency',
      icon: '💰',
    },
    {
      id: '3',
      metric_name: 'transactions',
      current_value: 2500000,
      unit: 'transactions',
      label: 'Transactions Completed',
      display_format: 'number',
      icon: '📊',
    },
    {
      id: '4',
      metric_name: 'uptime',
      current_value: 99.9,
      unit: '%',
      label: 'Platform Uptime',
      display_format: 'percentage',
      icon: '⚡',
    },
  ];

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/landing/social-proof-stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data && data.length > 0 ? data : defaultStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats(defaultStats);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (stats.length === 0) {
    return null;
  }

  return (
    <section className="py-16 px-4 bg-background border-y border-border">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            The Power of Eloity in Numbers
          </h2>
          <p className="text-lg text-muted-foreground">
            Join millions of users transforming their lives
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div
              key={stat.id}
              className="text-center p-6 rounded-lg bg-gradient-to-br from-primary/5 to-accent/5 border border-border hover:border-primary/50 transition-colors"
            >
              {/* Icon */}
              {stat.icon && (
                <div className="text-4xl mb-3 text-center">{stat.icon}</div>
              )}

              {/* Value */}
              <p className="text-3xl md:text-4xl font-bold text-primary mb-2">
                {formatNumber(stat.current_value, stat.display_format)}
              </p>

              {/* Unit */}
              <p className="text-sm text-muted-foreground mb-1">{stat.unit}</p>

              {/* Label */}
              <p className="font-semibold text-foreground text-sm">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

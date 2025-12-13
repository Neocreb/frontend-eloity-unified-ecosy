import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, MessageSquare, TrendingUp, List, BarChart3, Users } from 'lucide-react';

interface Stats {
  testimonials: number;
  faqs: number;
  useCases: number;
  comparisons: number;
  stats: number;
  waitlistLeads: number;
}

export const AdminLandingOverview: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    testimonials: 0,
    faqs: 0,
    useCases: 0,
    comparisons: 0,
    stats: 0,
    waitlistLeads: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [testimonialsRes, faqsRes, useCasesRes, comparisonsRes, statsRes, waitlistRes] =
        await Promise.all([
          fetch('/api/admin/landing/testimonials'),
          fetch('/api/admin/landing/faqs'),
          fetch('/api/admin/landing/use-cases'),
          fetch('/api/admin/landing/comparison'),
          fetch('/api/admin/landing/stats'),
          fetch('/api/admin/landing/waitlist'),
        ]);

      const [testimonials, faqs, useCases, comparisons, stats, waitlist] = await Promise.all([
        testimonialsRes.json(),
        faqsRes.json(),
        useCasesRes.json(),
        comparisonsRes.json(),
        statsRes.json(),
        waitlistRes.json(),
      ]);

      setStats({
        testimonials: Array.isArray(testimonials) ? testimonials.length : 0,
        faqs: Array.isArray(faqs) ? faqs.length : 0,
        useCases: Array.isArray(useCases) ? useCases.length : 0,
        comparisons: Array.isArray(comparisons) ? comparisons.length : 0,
        stats: Array.isArray(stats) ? stats.length : 0,
        waitlistLeads: Array.isArray(waitlist) ? waitlist.length : 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const contentItems = [
    {
      title: 'Testimonials',
      description: 'User success stories and reviews',
      count: stats.testimonials,
      icon: MessageSquare,
      color: 'text-blue-600',
      action: () => navigate('/admin/landing-testimonials'),
    },
    {
      title: 'FAQs',
      description: 'Frequently asked questions',
      count: stats.faqs,
      icon: List,
      color: 'text-green-600',
      action: () => navigate('/admin/landing-faqs'),
    },
    {
      title: 'Use Cases',
      description: 'Customer success stories',
      count: stats.useCases,
      icon: TrendingUp,
      color: 'text-purple-600',
      action: () => navigate('/admin/landing-use-cases'),
    },
    {
      title: 'Comparison Matrix',
      description: 'Feature comparison vs competitors',
      count: stats.comparisons,
      icon: BarChart3,
      color: 'text-orange-600',
      action: () => navigate('/admin/landing-comparison'),
    },
    {
      title: 'Social Proof Stats',
      description: 'Platform statistics and metrics',
      count: stats.stats,
      icon: FileText,
      color: 'text-red-600',
      action: () => navigate('/admin/landing-stats'),
    },
    {
      title: 'Waitlist Leads',
      description: 'Manage email signups',
      count: stats.waitlistLeads,
      icon: Users,
      color: 'text-indigo-600',
      action: () => navigate('/admin/landing-waitlist'),
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Landing Page Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage all dynamic content displayed on your landing page
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contentItems.map((item) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.title}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={item.action}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${item.color}`} />
                      {item.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                      {item.description}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-bold">{item.count}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      item.action();
                    }}
                  >
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => navigate('/admin/landing-testimonials')}
          >
            Add New Testimonial
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => navigate('/admin/landing-faqs')}
          >
            Add New FAQ
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => navigate('/admin/landing-use-cases')}
          >
            Add New Use Case
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => navigate('/admin/landing-waitlist')}
          >
            View Waitlist Leads
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLandingOverview;

import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Mock data for fallback
const mockStats = [
  {
    id: 'stat-1',
    metric_name: 'Active Users',
    metric_value: '500K+',
    metric_icon: 'Users',
    metric_description: 'Global users on Eloity platform',
    category: 'growth',
    is_featured: true,
    order: 1,
  },
  {
    id: 'stat-2',
    metric_name: 'Total Transactions',
    metric_value: '$100M+',
    metric_icon: 'DollarSign',
    metric_description: 'Total value processed on platform',
    category: 'financial',
    is_featured: true,
    order: 2,
  },
  {
    id: 'stat-3',
    metric_name: 'Supported Countries',
    metric_value: '150+',
    metric_icon: 'Globe',
    metric_description: 'Countries with Eloity presence',
    category: 'geographic',
    is_featured: true,
    order: 3,
  },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

    // If Supabase not configured, return mock data
    if (!supabaseUrl || !supabaseKey) {
      return res.json(mockStats);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('landing_social_proof_stats')
      .select('*')
      .order('order', { ascending: true });

    if (error) {
      console.error('Error fetching stats:', error);
      return res.json(mockStats);
    }

    res.json(data || mockStats);
  } catch (error) {
    console.error('Error in social-proof-stats endpoint:', error);
    res.status(200).json(mockStats);
  }
}

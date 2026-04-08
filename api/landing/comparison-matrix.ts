import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Mock data for fallback
const mockComparisons = [
  {
    id: 'comparison-1',
    feature_name: 'Multi-currency Support',
    category: 'payments',
    eloity_has: true,
    feature_description: 'Support for 150+ currencies with real-time exchange rates',
    competitors: { 'Competitor A': false, 'Competitor B': true, 'Competitor C': false },
  },
  {
    id: 'comparison-2',
    feature_name: 'Creator Monetization',
    category: 'features',
    eloity_has: true,
    feature_description: 'Multiple revenue streams including tips, sponsorships, and subscriptions',
    competitors: { 'Competitor A': false, 'Competitor B': true, 'Competitor C': true },
  },
  {
    id: 'comparison-3',
    feature_name: 'Global Marketplace',
    category: 'features',
    eloity_has: true,
    feature_description: 'Decentralized marketplace connecting buyers and sellers worldwide',
    competitors: { 'Competitor A': false, 'Competitor B': false, 'Competitor C': true },
  },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { category } = req.query;
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

    // If Supabase not configured, return mock data
    if (!supabaseUrl || !supabaseKey) {
      const filtered = mockComparisons.filter(c => !category || c.category === category);
      return res.json(filtered);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase
      .from('landing_comparison_matrix')
      .select('*');

    if (category) {
      query = query.eq('category', category as string);
    }

    const { data, error } = await query.order('id', { ascending: true });

    if (error) {
      console.error('Error fetching comparisons:', error);
      // Return mock data on error
      const filtered = mockComparisons.filter(c => !category || c.category === category);
      return res.json(filtered);
    }

    res.json(data || mockComparisons);
  } catch (error) {
    console.error('Error in comparison-matrix endpoint:', error);
    res.status(200).json(mockComparisons);
  }
}

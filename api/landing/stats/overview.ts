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

const mockTestimonials = [
  {
    id: 'testimonial-1',
    name: 'Sarah Johnson',
    title: 'Freelance Developer',
    quote: 'Eloity transformed how I manage my freelance work.',
    is_featured: true,
  },
  {
    id: 'testimonial-2',
    name: 'Ahmed Hassan',
    title: 'Content Creator',
    quote: 'The creator economy tools helped me monetize my content effectively.',
    is_featured: true,
  },
];

const mockUseCases = [
  {
    id: 'usecase-1',
    title: 'Build Your Freelance Career',
    is_featured: true,
  },
  {
    id: 'usecase-2',
    title: 'Monetize Your Content',
    is_featured: true,
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
      return res.json({
        stats: mockStats,
        testimonials: mockTestimonials.slice(0, 3),
        useCases: mockUseCases.slice(0, 2),
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all data in parallel
    const [statsRes, testimonialsRes, useCasesRes] = await Promise.all([
      supabase.from('landing_social_proof_stats').select('*').order('order', { ascending: true }),
      supabase
        .from('landing_testimonials')
        .select('*')
        .eq('is_featured', true)
        .order('order', { ascending: true })
        .limit(3),
      supabase
        .from('landing_use_cases')
        .select('*')
        .eq('is_featured', true)
        .order('order', { ascending: true })
        .limit(2),
    ]);

    res.json({
      stats: statsRes.data || mockStats,
      testimonials: testimonialsRes.data || mockTestimonials.slice(0, 3),
      useCases: useCasesRes.data || mockUseCases.slice(0, 2),
    });
  } catch (error) {
    console.error('Error in stats overview endpoint:', error);
    res.status(200).json({
      stats: mockStats,
      testimonials: mockTestimonials,
      useCases: mockUseCases,
    });
  }
}

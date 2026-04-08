import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Mock data for fallback
const mockUseCases = [
  {
    id: 'usecase-1',
    user_type: 'freelancer',
    title: 'Build Your Freelance Career',
    description: "Connect with clients worldwide and grow your freelance business with Eloity's comprehensive tools and marketplace.",
    avatar_url: 'https://randomuser.me/api/portraits/women/45.jpg',
    results: { clients: '1000+', earnings: '$100K+', projects: '500+' },
    timeline_weeks: 24,
    image_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop',
    is_featured: true,
    order: 1,
  },
  {
    id: 'usecase-2',
    user_type: 'creator',
    title: 'Monetize Your Content',
    description: "Turn your passion into income with Eloity's creator tools, sponsorships, and community monetization features.",
    avatar_url: 'https://randomuser.me/api/portraits/men/46.jpg',
    results: { monthly_earnings: '$10K+', followers: '100K+' },
    timeline_weeks: 12,
    image_url: 'https://images.unsplash.com/photo-1516321318423-f06f70504504?w=500&h=300&fit=crop',
    is_featured: true,
    order: 2,
  },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_type, featured } = req.query;
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

    // If Supabase not configured, return mock data
    if (!supabaseUrl || !supabaseKey) {
      const filtered = mockUseCases.filter(u => !featured || u.is_featured);
      return res.json(filtered);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase
      .from('landing_use_cases')
      .select('*');

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }
    if (user_type) {
      query = query.eq('user_type', user_type as string);
    }

    const { data, error } = await query.order('order', { ascending: true });

    if (error) {
      console.error('Error fetching use cases:', error);
      // Return mock data on error
      const filtered = mockUseCases.filter(u => !featured || u.is_featured);
      return res.json(filtered);
    }

    res.json(data || mockUseCases);
  } catch (error) {
    console.error('Error in use-cases endpoint:', error);
    res.status(200).json(mockUseCases);
  }
}

import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Mock data for fallback
const mockTestimonials = [
  {
    id: 'testimonial-1',
    name: 'Sarah Johnson',
    title: 'Freelance Developer',
    quote: 'Eloity transformed how I manage my freelance work. The platform is intuitive and the payment processing is seamless.',
    image_url: 'https://randomuser.me/api/portraits/women/32.jpg',
    metrics: { earnings: 50000, projects: 120 },
    category: 'freelancer',
    rating: 5,
    is_verified: true,
    is_featured: true,
    order: 1,
  },
  {
    id: 'testimonial-2',
    name: 'Ahmed Hassan',
    title: 'Content Creator',
    quote: 'The creator economy tools on Eloity helped me monetize my content effectively. I doubled my income in 6 months.',
    image_url: 'https://randomuser.me/api/portraits/men/44.jpg',
    metrics: { followers: 500000, monthly_earnings: 25000 },
    category: 'creator',
    rating: 5,
    is_verified: true,
    is_featured: true,
    order: 2,
  },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { category, featured } = req.query;
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

    // If Supabase not configured, return mock data
    if (!supabaseUrl || !supabaseKey) {
      const filtered = mockTestimonials.filter(t => !featured || t.is_featured);
      return res.json(filtered);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase
      .from('landing_testimonials')
      .select('*');

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }
    if (category) {
      query = query.eq('category', category as string);
    }

    const { data, error } = await query.order('order', { ascending: true });

    if (error) {
      console.error('Error fetching testimonials:', error);
      // Return mock data on error
      const filtered = mockTestimonials.filter(t => !featured || t.is_featured);
      return res.json(filtered);
    }

    res.json(data || mockTestimonials);
  } catch (error) {
    console.error('Error in testimonials endpoint:', error);
    res.status(200).json(mockTestimonials);
  }
}

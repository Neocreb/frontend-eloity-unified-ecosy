import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Mock data for fallback
const mockFAQs = [
  {
    id: 'faq-1',
    question: 'How do I get started on Eloity?',
    answer: 'Create an account, complete your profile, and start exploring opportunities in your field. It takes just a few minutes to get up and running.',
    category: 'getting-started',
    is_active: true,
    order: 1,
  },
  {
    id: 'faq-2',
    question: 'Is Eloity available in my country?',
    answer: 'Eloity is available in 150+ countries. We support multiple currencies and payment methods to serve a global audience.',
    category: 'platform',
    is_active: true,
    order: 2,
  },
  {
    id: 'faq-3',
    question: 'How are payments processed?',
    answer: 'We use secure payment processors to handle transactions. Payments are typically processed within 24-48 hours to your preferred wallet or bank account.',
    category: 'payments',
    is_active: true,
    order: 3,
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
      return res.json(mockFAQs.filter(f => !category || f.category === category));
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase
      .from('landing_faqs')
      .select('*')
      .eq('is_active', true);

    if (category) {
      query = query.eq('category', category as string);
    }

    const { data, error } = await query.order('order', { ascending: true });

    if (error) {
      console.error('Error fetching FAQs:', error);
      // Return mock data on error
      return res.json(mockFAQs.filter(f => !category || f.category === category));
    }

    res.json(data || mockFAQs);
  } catch (error) {
    console.error('Error in FAQs endpoint:', error);
    res.status(200).json(mockFAQs);
  }
}

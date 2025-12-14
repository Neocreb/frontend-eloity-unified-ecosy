import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

let supabase: any = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    logger.error('Failed to initialize Supabase client for landing service:', error);
  }
}

// Mock data for fallback when database is unavailable
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

const mockUseCases = [
  {
    id: 'usecase-1',
    user_type: 'freelancer',
    title: 'Build Your Freelance Career',
    description: 'Connect with clients worldwide and grow your freelance business with Eloity\'s comprehensive tools and marketplace.',
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
    description: 'Turn your passion into income with Eloity\'s creator tools, sponsorships, and community monetization features.',
    avatar_url: 'https://randomuser.me/api/portraits/men/46.jpg',
    results: { monthly_earnings: '$10K+', followers: '100K+' },
    timeline_weeks: 12,
    image_url: 'https://images.unsplash.com/photo-1516321318423-f06f70504504?w=500&h=300&fit=crop',
    is_featured: true,
    order: 2,
  },
];

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

// ============================================================================
// TESTIMONIALS SERVICE
// ============================================================================

export const TestimonialsService = {
  async getTestimonials(filters?: {
    category?: string;
    featured?: boolean;
  }) {
    try {
      if (!supabase) {
        logger.warn('Supabase client not initialized, returning mock testimonials');
        return mockTestimonials.filter(t => !filters?.featured || t.is_featured);
      }

      let query = supabase
        .from('landing_testimonials')
        .select('*');

      if (filters?.featured !== undefined) {
        query = query.eq('is_featured', filters.featured);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query.order('order', { ascending: true });
      if (error) {
        logger.warn('Failed to fetch testimonials from database, using mock data:', error);
        return mockTestimonials.filter(t => !filters?.featured || t.is_featured);
      }
      return data || mockTestimonials;
    } catch (error) {
      logger.error('Error fetching testimonials:', error);
      return mockTestimonials;
    }
  },

  async getTestimonialById(id: string) {
    try {
      const { data, error } = await supabase
        .from('landing_testimonials')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching testimonial:', error);
      throw error;
    }
  },

  async createTestimonial(input: any) {
    try {
      const { data, error } = await supabase
        .from('landing_testimonials')
        .insert({
          name: input.name,
          title: input.title,
          quote: input.quote,
          image_url: input.image_url,
          metrics: input.metrics || {},
          category: input.category || 'general',
          rating: input.rating || 5,
          is_verified: input.is_verified || false,
          is_featured: input.is_featured || true,
          order: input.order || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating testimonial:', error);
      throw error;
    }
  },

  async updateTestimonial(id: string, input: any) {
    try {
      const { data, error } = await supabase
        .from('landing_testimonials')
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating testimonial:', error);
      throw error;
    }
  },

  async deleteTestimonial(id: string) {
    try {
      const { error } = await supabase
        .from('landing_testimonials')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      throw error;
    }
  },

  async reorderTestimonials(orders: Array<{ id: string; order: number }>) {
    try {
      for (const item of orders) {
        await supabase
          .from('landing_testimonials')
          .update({ order: item.order, updated_at: new Date().toISOString() })
          .eq('id', item.id);
      }
      return { success: true };
    } catch (error) {
      console.error('Error reordering testimonials:', error);
      throw error;
    }
  },
};

// ============================================================================
// FAQS SERVICE
// ============================================================================

export const FAQsService = {
  async getFAQs(filters?: {
    category?: string;
    active?: boolean;
  }) {
    try {
      let query = supabase
        .from('landing_faqs')
        .select('*');

      if (filters?.active !== undefined) {
        query = query.eq('is_active', filters.active);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query.order('order', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      throw error;
    }
  },

  async getFAQById(id: string) {
    try {
      const { data, error } = await supabase
        .from('landing_faqs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching FAQ:', error);
      throw error;
    }
  },

  async createFAQ(input: any) {
    try {
      const { data, error } = await supabase
        .from('landing_faqs')
        .insert({
          question: input.question,
          answer: input.answer,
          category: input.category || 'general',
          order: input.order || 0,
          is_active: input.is_active !== false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating FAQ:', error);
      throw error;
    }
  },

  async updateFAQ(id: string, input: any) {
    try {
      const { data, error } = await supabase
        .from('landing_faqs')
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating FAQ:', error);
      throw error;
    }
  },

  async deleteFAQ(id: string) {
    try {
      const { error } = await supabase
        .from('landing_faqs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      throw error;
    }
  },
};

// ============================================================================
// USE CASES SERVICE
// ============================================================================

export const UseCasesService = {
  async getUseCases(filters?: {
    user_type?: string;
    featured?: boolean;
  }) {
    try {
      let query = supabase
        .from('landing_use_cases')
        .select('*');

      if (filters?.featured !== undefined) {
        query = query.eq('is_featured', filters.featured);
      }
      if (filters?.user_type) {
        query = query.eq('user_type', filters.user_type);
      }

      const { data, error } = await query.order('order', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching use cases:', error);
      throw error;
    }
  },

  async getUseCaseById(id: string) {
    try {
      const { data, error } = await supabase
        .from('landing_use_cases')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching use case:', error);
      throw error;
    }
  },

  async createUseCase(input: any) {
    try {
      const { data, error } = await supabase
        .from('landing_use_cases')
        .insert({
          user_type: input.user_type,
          title: input.title,
          description: input.description,
          avatar_url: input.avatar_url,
          results: input.results || {},
          timeline_weeks: input.timeline_weeks,
          image_url: input.image_url,
          is_featured: input.is_featured !== false,
          order: input.order || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating use case:', error);
      throw error;
    }
  },

  async updateUseCase(id: string, input: any) {
    try {
      const { data, error } = await supabase
        .from('landing_use_cases')
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating use case:', error);
      throw error;
    }
  },

  async deleteUseCase(id: string) {
    try {
      const { error } = await supabase
        .from('landing_use_cases')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting use case:', error);
      throw error;
    }
  },
};

// ============================================================================
// SOCIAL PROOF STATS SERVICE
// ============================================================================

export const SocialProofStatsService = {
  async getAllStats() {
    try {
      const { data, error } = await supabase
        .from('landing_social_proof_stats')
        .select('*')
        .order('order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  },

  async getStatByMetricName(metric_name: string) {
    try {
      const { data, error } = await supabase
        .from('landing_social_proof_stats')
        .select('*')
        .eq('metric_name', metric_name)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching stat:', error);
      throw error;
    }
  },

  async updateStat(metric_name: string, current_value: number) {
    try {
      const { data, error } = await supabase
        .from('landing_social_proof_stats')
        .update({
          current_value: current_value.toString(),
          updated_at: new Date().toISOString(),
        })
        .eq('metric_name', metric_name)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating stat:', error);
      throw error;
    }
  },

  async createStat(input: any) {
    try {
      const { data, error } = await supabase
        .from('landing_social_proof_stats')
        .insert({
          metric_name: input.metric_name,
          current_value: input.current_value.toString(),
          unit: input.unit,
          display_format: input.display_format || 'number',
          label: input.label,
          icon: input.icon,
          order: input.order || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating stat:', error);
      throw error;
    }
  },
};

// ============================================================================
// COMPARISON MATRIX SERVICE
// ============================================================================

export const ComparisonMatrixService = {
  async getComparisons(filters?: {
    category?: string;
    active?: boolean;
  }) {
    try {
      let query = supabase
        .from('landing_comparison_matrix')
        .select('*');

      if (filters?.active !== undefined) {
        query = query.eq('is_active', filters.active);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query.order('order', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching comparisons:', error);
      throw error;
    }
  },

  async getComparisonById(id: string) {
    try {
      const { data, error } = await supabase
        .from('landing_comparison_matrix')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching comparison:', error);
      throw error;
    }
  },

  async createComparison(input: any) {
    try {
      const { data, error } = await supabase
        .from('landing_comparison_matrix')
        .insert({
          feature_name: input.feature_name,
          category: input.category,
          eloity_has: input.eloity_has !== false,
          feature_description: input.feature_description,
          competitors: input.competitors || {},
          order: input.order || 0,
          is_active: input.is_active !== false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating comparison:', error);
      throw error;
    }
  },

  async updateComparison(id: string, input: any) {
    try {
      const { data, error } = await supabase
        .from('landing_comparison_matrix')
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating comparison:', error);
      throw error;
    }
  },

  async deleteComparison(id: string) {
    try {
      const { error } = await supabase
        .from('landing_comparison_matrix')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting comparison:', error);
      throw error;
    }
  },
};

// ============================================================================
// WAITLIST SERVICE
// ============================================================================

export const WaitlistService = {
  async getWaitlist(filters?: {
    status?: string;
    minScore?: number;
  }) {
    try {
      let query = supabase
        .from('landing_waitlist_leads')
        .select('*');

      if (filters?.status) {
        query = query.eq('conversion_status', filters.status);
      }
      if (filters?.minScore !== undefined) {
        query = query.gte('lead_score', filters.minScore);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching waitlist:', error);
      throw error;
    }
  },

  async getWaitlistById(id: string) {
    try {
      const { data, error } = await supabase
        .from('landing_waitlist_leads')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching waitlist lead:', error);
      throw error;
    }
  },

  async addToWaitlist(input: any) {
    try {
      const { data, error } = await supabase
        .from('landing_waitlist_leads')
        .insert({
          email: input.email,
          name: input.name,
          user_type_interested: input.user_type_interested || 'not_sure',
          country: input.country,
          phone: input.phone,
          message: input.message,
          source: input.source || 'homepage',
          lead_score: input.lead_score || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding to waitlist:', error);
      throw error;
    }
  },

  async updateWaitlistLead(id: string, input: any) {
    try {
      const { data, error } = await supabase
        .from('landing_waitlist_leads')
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating waitlist lead:', error);
      throw error;
    }
  },

  async deleteWaitlistLead(id: string) {
    try {
      const { error } = await supabase
        .from('landing_waitlist_leads')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting waitlist lead:', error);
      throw error;
    }
  },

  async checkEmailExists(email: string) {
    try {
      const { data, error } = await supabase
        .from('landing_waitlist_leads')
        .select('id')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return !!data;
    } catch (error) {
      console.error('Error checking email:', error);
      throw error;
    }
  },
};

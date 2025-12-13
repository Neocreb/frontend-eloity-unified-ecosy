import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// TESTIMONIALS SERVICE
// ============================================================================

export const TestimonialsService = {
  async getTestimonials(filters?: {
    category?: string;
    featured?: boolean;
  }) {
    try {
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
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      throw error;
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

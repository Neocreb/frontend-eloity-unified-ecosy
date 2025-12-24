import { useState, useEffect } from 'react';
import { Testimonial } from '@/components/profile/TestimonialsSection';

interface UseTestimonialsOptions {
  userId?: string;
  limit?: number;
}

interface UseTestimonialsResult {
  testimonials: Testimonial[];
  isLoading: boolean;
  error: Error | null;
  pinTestimonial: (testimonialId: string) => void;
  removeTestimonial: (testimonialId: string) => void;
  averageRating: number;
}

export const useTestimonials = ({
  userId,
  limit = 10,
}: UseTestimonialsOptions = {}): UseTestimonialsResult => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Default testimonials data
  const defaultTestimonials: Testimonial[] = [
    {
      id: 'test-1',
      authorName: 'Sarah Johnson',
      authorRole: 'Product Manager',
      authorCompany: 'Tech Innovations Inc',
      authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=60',
      rating: 5,
      title: 'Exceptional Work Quality',
      content: 'Outstanding design work and attention to detail. The project was delivered on time and exceeded all expectations. Highly recommend for any serious design needs.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      isPinned: true,
      helpfulCount: 24,
      source: 'freelance',
      relatedService: { id: '1', name: 'UI/UX Design' },
    },
    {
      id: 'test-2',
      authorName: 'Michael Chen',
      authorRole: 'CEO',
      authorCompany: 'Digital Solutions',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=60',
      rating: 5,
      title: 'Professional and Reliable',
      content: 'Great communication throughout the project. The developer was professional, knowledgeable, and delivered exactly what we needed.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      isPinned: false,
      helpfulCount: 18,
      source: 'freelance',
      relatedService: { id: '2', name: 'Full Stack Development' },
    },
    {
      id: 'test-3',
      authorName: 'Emily Rodriguez',
      authorRole: 'Freelance Designer',
      authorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=60',
      rating: 4,
      title: 'Good Collaboration',
      content: 'Easy to work with and very responsive to feedback. The final deliverables were high quality and professional.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
      isPinned: false,
      helpfulCount: 12,
      source: 'freelance',
      relatedService: { id: '3', name: 'Branding' },
    },
    {
      id: 'test-4',
      authorName: 'James Wilson',
      authorRole: 'Trader',
      authorCompany: 'Crypto Trading LLC',
      authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=60',
      rating: 5,
      title: 'Expert Trading Insights',
      content: 'Provided excellent market analysis and trading tips. Very knowledgeable about crypto markets and always willing to help.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString(),
      isPinned: false,
      helpfulCount: 9,
      source: 'trading',
    },
  ];

  useEffect(() => {
    const fetchTestimonials = async () => {
      if (!userId) {
        setTestimonials(defaultTestimonials.slice(0, limit));
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // In a real implementation, this would fetch from your API
        // For now, we'll use default data
        const { supabase } = await import('@/integrations/supabase/client');

        try {
          // Try to fetch testimonials from database
          const { data: dbTestimonials, error: dbError } = await supabase
            .from('testimonials')
            .select(`
              id,
              content,
              rating,
              title,
              created_at,
              is_pinned,
              helpful_count,
              source,
              author:profiles(id, full_name, username, avatar_url),
              related_service(id, name)
            `)
            .eq('recipient_id', userId)
            .order('is_pinned', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(limit);

          if (!dbError && dbTestimonials && dbTestimonials.length > 0) {
            const transformedTestimonials = dbTestimonials.map((test: any) => ({
              id: test.id,
              authorName: test.author?.full_name || 'Anonymous',
              authorRole: undefined,
              authorCompany: undefined,
              authorAvatar: test.author?.avatar_url || undefined,
              rating: test.rating || 5,
              title: test.title,
              content: test.content,
              createdAt: test.created_at,
              isPinned: test.is_pinned,
              helpfulCount: test.helpful_count || 0,
              source: test.source,
              relatedService: test.related_service,
            }));
            setTestimonials(transformedTestimonials);
          } else {
            // Fall back to default data
            setTestimonials(defaultTestimonials.slice(0, limit));
          }
        } catch (dbError) {
          console.warn('Failed to fetch testimonials from database:', dbError);
          setTestimonials(defaultTestimonials.slice(0, limit));
        }
      } catch (err) {
        console.error('Error fetching testimonials:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch testimonials'));
        setTestimonials(defaultTestimonials.slice(0, limit));
      } finally {
        setIsLoading(false);
      }
    };

    fetchTestimonials();
  }, [userId, limit]);

  const pinTestimonial = (testimonialId: string) => {
    setTestimonials(prev =>
      prev.map(test =>
        test.id === testimonialId ? { ...test, isPinned: !test.isPinned } : test
      )
    );
    // In a real implementation, this would update the database
  };

  const removeTestimonial = (testimonialId: string) => {
    setTestimonials(prev => prev.filter(test => test.id !== testimonialId));
    // In a real implementation, this would update the database
  };

  const averageRating =
    testimonials.length > 0
      ? testimonials.reduce((sum, test) => sum + test.rating, 0) / testimonials.length
      : 0;

  return {
    testimonials,
    isLoading,
    error,
    pinTestimonial,
    removeTestimonial,
    averageRating,
  };
};

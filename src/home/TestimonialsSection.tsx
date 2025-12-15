import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Testimonial {
  id: string;
  name: string;
  title: string;
  quote: string;
  image_url?: string;
  rating: number;
  metrics?: Record<string, string>;
  category: string;
}

// Default mock testimonials for fallback
const defaultTestimonials: Testimonial[] = [
  {
    id: 'testimonial-1',
    name: 'Sarah Johnson',
    title: 'Freelance Developer',
    quote: 'Eloity transformed how I manage my freelance work. The platform is intuitive and the payment processing is seamless.',
    image_url: 'https://randomuser.me/api/portraits/women/32.jpg',
    rating: 5,
    metrics: { earnings: '$50K+', projects: '120+' },
    category: 'freelancer',
  },
  {
    id: 'testimonial-2',
    name: 'Ahmed Hassan',
    title: 'Content Creator',
    quote: 'The creator economy tools on Eloity helped me monetize my content effectively. I doubled my income in 6 months.',
    image_url: 'https://randomuser.me/api/portraits/men/44.jpg',
    rating: 5,
    metrics: { followers: '500K+', monthly_earnings: '$25K+' },
    category: 'creator',
  },
];

export const TestimonialsSection: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(defaultTestimonials);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      setIsLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/landing/testimonials?featured=true', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn('Failed to fetch testimonials, using defaults');
        setTestimonials(defaultTestimonials);
        setError(null);
        return;
      }

      const data = await response.json();
      setTestimonials(Array.isArray(data) && data.length > 0 ? data : defaultTestimonials);
      setError(null);
    } catch (err) {
      console.error('Error fetching testimonials:', err);
      // Use default testimonials on error
      setTestimonials(defaultTestimonials);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  if (isLoading) {
    return (
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="h-96 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse" />
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) {
    return null;
  }

  const current = testimonials[currentIndex];

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-background to-secondary/10">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Success Stories from Real Users
          </h2>
          <p className="text-lg text-muted-foreground">
            See how creators, freelancers, and traders are transforming their lives with Eloity
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Testimonial Card */}
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-8 border border-border">
            {/* Rating */}
            <div className="flex gap-1 mb-4">
              {[...Array(current.rating)].map((_, i) => (
                <Star
                  key={i}
                  className="h-5 w-5 fill-yellow-400 text-yellow-400"
                />
              ))}
            </div>

            {/* Quote */}
            <p className="text-lg text-foreground mb-6 leading-relaxed italic">
              "{current.quote}"
            </p>

            {/* Author */}
            <div className="flex items-center gap-4">
              {current.image_url && (
                <img
                  src={current.image_url}
                  alt={current.name}
                  className="h-12 w-12 rounded-full object-cover"
                />
              )}
              <div>
                <p className="font-semibold text-foreground">{current.name}</p>
                <p className="text-sm text-muted-foreground">{current.title}</p>
              </div>
            </div>

            {/* Metrics */}
            {current.metrics && Object.keys(current.metrics).length > 0 && (
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm font-semibold text-muted-foreground mb-3">
                  Impact
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(current.metrics).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-sm text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ')}
                      </p>
                      <p className="text-lg font-bold text-primary">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Testimonials List */}
          <div className="space-y-4">
            {testimonials.map((testimonial, idx) => (
              <button
                key={testimonial.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  idx === currentIndex
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {testimonial.image_url && (
                    <img
                      src={testimonial.image_url}
                      alt={testimonial.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {testimonial.title}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-center gap-4 mt-8">
          <Button
            variant="outline"
            size="icon"
            onClick={prevSlide}
            className="h-10 w-10"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 w-2 rounded-full transition-all ${
                  idx === currentIndex ? 'bg-primary w-6' : 'bg-border'
                }`}
                aria-label={`Go to testimonial ${idx + 1}`}
              />
            ))}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={nextSlide}
            className="h-10 w-10"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

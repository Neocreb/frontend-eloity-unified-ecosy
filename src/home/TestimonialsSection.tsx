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

export const TestimonialsSection: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const defaultTestimonials: Testimonial[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      title: 'Content Creator',
      quote: 'Eloity transformed how I connect with my audience. I increased my earnings by 300% in just 3 months!',
      image_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
      rating: 5,
      category: 'creator',
      metrics: { earnings: '+300%', followers: '+50K' },
    },
    {
      id: '2',
      name: 'Ahmed Hassan',
      title: 'Freelance Developer',
      quote: 'The freelance marketplace is incredible. I found high-paying projects immediately and tripled my income.',
      image_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ahmed',
      rating: 5,
      category: 'freelancer',
      metrics: { projects: '+15', income: '+250%' },
    },
    {
      id: '3',
      name: 'Maria Chen',
      title: 'Crypto Trader',
      quote: 'The trading tools and community on Eloity are unmatched. I made smarter trades and reduced losses significantly.',
      image_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria',
      rating: 5,
      category: 'trader',
      metrics: { trades: '+200', returns: '+45%' },
    },
  ];

  const fetchTestimonials = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/landing/testimonials?featured=true');
      if (!response.ok) throw new Error('Failed to fetch testimonials');
      const data = await response.json();
      setTestimonials(data && data.length > 0 ? data : defaultTestimonials);
      setError(null);
    } catch (err) {
      console.error('Error fetching testimonials:', err);
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

  if (error || testimonials.length === 0) {
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

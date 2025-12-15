import React, { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';

interface UseCase {
  id: string;
  user_type: string;
  title: string;
  description: string;
  avatar_url?: string;
  results?: Record<string, string | number>;
  timeline_weeks?: number;
  image_url?: string;
}

const userTypeEmojis: Record<string, string> = {
  creator: '🎬',
  freelancer: '💼',
  trader: '📈',
  merchant: '🛍️',
};

// Default mock use cases for fallback
const defaultUseCases: UseCase[] = [
  {
    id: 'usecase-1',
    user_type: 'freelancer',
    title: 'Build Your Freelance Career',
    description: 'Connect with clients worldwide and grow your freelance business with Eloity\'s comprehensive tools and marketplace.',
    avatar_url: 'https://randomuser.me/api/portraits/women/45.jpg',
    results: { clients: '1000+', earnings: '$100K+', projects: '500+' },
    timeline_weeks: 24,
    image_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop',
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
  },
];

export const UseCasesSection: React.FC = () => {
  const [useCases, setUseCases] = useState<UseCase[]>(defaultUseCases);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUseCases();
  }, []);

  const fetchUseCases = async () => {
    try {
      setIsLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/landing/use-cases?featured=true', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn('Failed to fetch use cases, using defaults');
        setUseCases(defaultUseCases);
        return;
      }

      const data = await response.json();
      setUseCases(Array.isArray(data) && data.length > 0 ? data : defaultUseCases);
    } catch (error) {
      console.error('Error fetching use cases:', error);
      // Use default use cases on error
      setUseCases(defaultUseCases);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-96 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-background to-secondary/10">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How Users Are Succeeding with Eloity
          </h2>
          <p className="text-lg text-muted-foreground">
            Real stories from real users achieving their goals
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {useCases.map((useCase) => (
            <div
              key={useCase.id}
              className="bg-white dark:bg-slate-900 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow border border-border"
            >
              {/* Image */}
              {useCase.image_url && (
                <div className="h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
                  <img
                    src={useCase.image_url}
                    alt={useCase.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-6">
                {/* User Type Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 mb-4">
                  <span className="text-lg">
                    {userTypeEmojis[useCase.user_type] || '⭐'}
                  </span>
                  <span className="text-sm font-medium capitalize text-primary">
                    {useCase.user_type}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold mb-3">{useCase.title}</h3>

                {/* Description */}
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {useCase.description}
                </p>

                {/* Timeline */}
                {useCase.timeline_weeks && (
                  <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    <span>Achieved in {useCase.timeline_weeks} weeks</span>
                  </div>
                )}

                {/* Results */}
                {useCase.results && Object.keys(useCase.results).length > 0 && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm font-semibold text-muted-foreground mb-3">
                      Key Results
                    </p>
                    <div className="space-y-2">
                      {Object.entries(useCase.results).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm">
                            <span className="font-semibold text-foreground">
                              {value}
                            </span>
                            <span className="text-muted-foreground ml-1">
                              {key.replace(/_/g, ' ')}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

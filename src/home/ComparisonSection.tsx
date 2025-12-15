import React, { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Comparison {
  id: string;
  feature_name: string;
  category: string;
  eloity_has: boolean;
  feature_description?: string;
  competitors?: Record<string, boolean>;
}

// Default mock comparisons for fallback
const defaultComparisons: Comparison[] = [
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

export const ComparisonSection: React.FC = () => {
  const [comparisons, setComparisons] = useState<Comparison[]>(defaultComparisons);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    defaultComparisons.length > 0 ? defaultComparisons[0].category : ''
  );

  useEffect(() => {
    fetchComparisons();
  }, []);

  const fetchComparisons = async () => {
    try {
      setIsLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/landing/comparison-matrix', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn('Failed to fetch comparisons, using defaults');
        setComparisons(defaultComparisons);
        if (defaultComparisons.length > 0) {
          setSelectedCategory(defaultComparisons[0].category);
        }
        return;
      }

      const data = await response.json();
      const dataToUse = Array.isArray(data) && data.length > 0 ? data : defaultComparisons;
      setComparisons(dataToUse);
      if (dataToUse.length > 0) {
        setSelectedCategory(dataToUse[0].category);
      }
    } catch (error) {
      console.error('Error fetching comparisons:', error);
      // Use default comparisons on error
      setComparisons(defaultComparisons);
      if (defaultComparisons.length > 0) {
        setSelectedCategory(defaultComparisons[0].category);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const categories = Array.from(new Set(comparisons.map((c) => c.category)));
  const filteredComparisons = comparisons.filter((c) => c.category === selectedCategory);
  const allCompetitors = Array.from(
    new Set(
      comparisons.flatMap((c) => (c.competitors ? Object.keys(c.competitors) : []))
    )
  );

  if (isLoading) {
    return (
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="h-96 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-background to-secondary/10">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why Choose Eloity?
          </h2>
          <p className="text-lg text-muted-foreground">
            Compare features with other platforms and see why Eloity stands out
          </p>
        </div>

        {categories.length > 1 && (
          <Tabs
            value={selectedCategory}
            onValueChange={setSelectedCategory}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8">
              {categories.map((category) => (
                <TabsTrigger key={category} value={category} className="capitalize">
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 font-semibold text-foreground">
                        Feature
                      </th>
                      <th className="text-center p-4 font-semibold text-primary min-w-32">
                        Eloity
                      </th>
                      {allCompetitors.map((competitor) => (
                        <th
                          key={competitor}
                          className="text-center p-4 font-semibold text-muted-foreground min-w-32"
                        >
                          {competitor}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredComparisons.map((feature) => (
                      <tr key={feature.id} className="border-b border-border hover:bg-secondary/50">
                        <td className="p-4">
                          <div>
                            <p className="font-semibold text-foreground">
                              {feature.feature_name}
                            </p>
                            {feature.feature_description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {feature.feature_description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="text-center p-4">
                          {feature.eloity_has ? (
                            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                              <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                          ) : (
                            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                              <X className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                        </td>
                        {allCompetitors.map((competitor) => {
                          const has = feature.competitors?.[competitor];
                          return (
                            <td key={competitor} className="text-center p-4">
                              {has ? (
                                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                                  <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                              ) : (
                                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                                  <X className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {categories.length === 1 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-semibold text-foreground">
                    Feature
                  </th>
                  <th className="text-center p-4 font-semibold text-primary min-w-32">
                    Eloity
                  </th>
                  {allCompetitors.map((competitor) => (
                    <th
                      key={competitor}
                      className="text-center p-4 font-semibold text-muted-foreground min-w-32"
                    >
                      {competitor}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredComparisons.map((feature) => (
                  <tr key={feature.id} className="border-b border-border hover:bg-secondary/50">
                    <td className="p-4">
                      <div>
                        <p className="font-semibold text-foreground">
                          {feature.feature_name}
                        </p>
                        {feature.feature_description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {feature.feature_description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="text-center p-4">
                      {feature.eloity_has ? (
                        <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                          <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                      ) : (
                        <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                          <X className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                    </td>
                    {allCompetitors.map((competitor) => {
                      const has = feature.competitors?.[competitor];
                      return (
                        <td key={competitor} className="text-center p-4">
                          {has ? (
                            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                              <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                          ) : (
                            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                              <X className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

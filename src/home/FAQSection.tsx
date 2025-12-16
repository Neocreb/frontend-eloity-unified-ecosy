import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

// Default mock FAQs for fallback
const defaultFAQs: FAQ[] = [
  {
    id: 'faq-1',
    question: 'How do I get started on Eloity?',
    answer: 'Create an account, complete your profile, and start exploring opportunities in your field. It takes just a few minutes to get up and running.',
    category: 'getting-started',
  },
  {
    id: 'faq-2',
    question: 'Is Eloity available in my country?',
    answer: 'Eloity is available in 150+ countries. We support multiple currencies and payment methods to serve a global audience.',
    category: 'platform',
  },
  {
    id: 'faq-3',
    question: 'How are payments processed?',
    answer: 'We use secure payment processors to handle transactions. Payments are typically processed within 24-48 hours to your preferred wallet or bank account.',
    category: 'payments',
  },
];

export const FAQSection: React.FC = () => {
  const [faqs, setFAQs] = useState<FAQ[]>(defaultFAQs);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      setIsLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('/api/landing/faqs', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn('Failed to fetch FAQs, using defaults');
        setFAQs(defaultFAQs);
        return;
      }

      const data = await response.json();
      setFAQs(Array.isArray(data) && data.length > 0 ? data : defaultFAQs);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      // Use default FAQs on error
      setFAQs(defaultFAQs);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = Array.from(new Set(faqs.map((faq) => faq.category)));
  const filteredFAQs = selectedCategory
    ? faqs.filter((faq) => faq.category === selectedCategory)
    : faqs;

  if (isLoading) {
    return (
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="h-96 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground">
            Find answers to common questions about Eloity
          </p>
        </div>

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-3 justify-center mb-8">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                selectedCategory === null
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full font-medium transition-all capitalize ${
                  selectedCategory === category
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {/* FAQ Accordion */}
        <Accordion type="single" collapsible className="w-full">
          {filteredFAQs.map((faq, index) => (
            <AccordionItem key={faq.id} value={faq.id}>
              <AccordionTrigger className="text-left hover:no-underline">
                <span className="flex items-start gap-3 w-full">
                  <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {index + 1}
                  </span>
                  <span className="text-lg font-semibold">{faq.question}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pl-9">
                <p className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* No results message */}
        {filteredFAQs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No FAQs found for this category.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

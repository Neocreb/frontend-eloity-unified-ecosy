import React, { useState } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, Check, Sparkles } from 'lucide-react';

interface InterestCategory {
  id: string;
  name: string;
  icon: string;
  interests: {
    id: string;
    label: string;
  }[];
}

const INTEREST_CATEGORIES: InterestCategory[] = [
  {
    id: 'social',
    name: '👥 Social & Community',
    icon: '👥',
    interests: [
      { id: 'networking', label: 'Networking' },
      { id: 'making_friends', label: 'Making Friends' },
      { id: 'community', label: 'Community Building' },
      { id: 'events', label: 'Events & Meetups' },
      { id: 'groups', label: 'Interest Groups' },
    ],
  },
  {
    id: 'content',
    name: '🎨 Content & Creativity',
    icon: '🎨',
    interests: [
      { id: 'photography', label: 'Photography' },
      { id: 'video_creation', label: 'Video Creation' },
      { id: 'writing', label: 'Writing & Blogging' },
      { id: 'design', label: 'Design & Art' },
      { id: 'music', label: 'Music' },
    ],
  },
  {
    id: 'commerce',
    name: '🛍️ Shopping & Commerce',
    icon: '🛍️',
    interests: [
      { id: 'shopping', label: 'Online Shopping' },
      { id: 'reselling', label: 'Reselling & Dropshipping' },
      { id: 'fashion', label: 'Fashion & Style' },
      { id: 'deals', label: 'Deals & Discounts' },
      { id: 'marketplace', label: 'Marketplace' },
    ],
  },
  {
    id: 'finance',
    name: '💰 Finance & Crypto',
    icon: '💰',
    interests: [
      { id: 'investing', label: 'Investing' },
      { id: 'cryptocurrency', label: 'Cryptocurrency' },
      { id: 'trading', label: 'Trading' },
      { id: 'personal_finance', label: 'Personal Finance' },
      { id: 'passive_income', label: 'Passive Income' },
    ],
  },
  {
    id: 'learning',
    name: '📚 Learning & Education',
    icon: '📚',
    interests: [
      { id: 'online_courses', label: 'Online Courses' },
      { id: 'skill_development', label: 'Skill Development' },
      { id: 'tech', label: 'Technology & Programming' },
      { id: 'languages', label: 'Languages' },
      { id: 'professional_growth', label: 'Professional Growth' },
    ],
  },
  {
    id: 'work',
    name: '💼 Work & Freelance',
    icon: '💼',
    interests: [
      { id: 'freelancing', label: 'Freelancing' },
      { id: 'remote_work', label: 'Remote Work' },
      { id: 'entrepreneurship', label: 'Entrepreneurship' },
      { id: 'side_hustle', label: 'Side Hustle' },
      { id: 'job_search', label: 'Job Search' },
    ],
  },
  {
    id: 'lifestyle',
    name: '🌟 Lifestyle & Wellness',
    icon: '🌟',
    interests: [
      { id: 'fitness', label: 'Fitness & Health' },
      { id: 'wellness', label: 'Wellness & Mental Health' },
      { id: 'travel', label: 'Travel' },
      { id: 'food', label: 'Food & Cooking' },
      { id: 'hobbies', label: 'Hobbies' },
    ],
  },
  {
    id: 'entertainment',
    name: '🎬 Entertainment & Gaming',
    icon: '🎬',
    interests: [
      { id: 'gaming', label: 'Gaming' },
      { id: 'movies', label: 'Movies & TV' },
      { id: 'anime', label: 'Anime & Manga' },
      { id: 'streaming', label: 'Streaming & Content' },
      { id: 'sports', label: 'Sports' },
    ],
  },
];

const InterestsStep: React.FC = () => {
  const { data, updateData, nextStep, isLoading } = useOnboarding();
  const [localError, setLocalError] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const selectedInterests = new Set(data.selectedInterests || []);
  const selectedCategories = new Set(data.selectedCategories || []);

  const toggleInterest = (interestId: string, categoryId: string) => {
    const newInterests = new Set(selectedInterests);
    const newCategories = new Set(selectedCategories);

    if (newInterests.has(interestId)) {
      newInterests.delete(interestId);
    } else {
      newInterests.add(interestId);
      newCategories.add(categoryId);
    }

    updateData({
      selectedInterests: Array.from(newInterests),
      selectedCategories: Array.from(newCategories),
    });
    setLocalError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (selectedInterests.size === 0) {
      setLocalError('Please select at least 3 interests');
      return;
    }

    if (selectedInterests.size < 3) {
      setLocalError(`Please select at least 3 interests (${selectedInterests.size} selected)`);
      return;
    }

    nextStep();
  };

  const isFormValid = selectedInterests.size >= 3;

  return (
    <div className="p-6 md:p-8 h-full flex flex-col">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">What Are You Interested In?</h2>
        <p className="text-slate-400">Help us personalize your experience (select at least 3)</p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-4 overflow-y-auto">
        {/* Interest Categories */}
        <div className="space-y-4">
          {INTEREST_CATEGORIES.map((category) => (
            <div key={category.id} className="space-y-2">
              {/* Category Header */}
              <button
                type="button"
                onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-left"
              >
                <span className="font-medium text-white text-lg">{category.name}</span>
                <span className={`transform transition-transform ${expandedCategory === category.id ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>

              {/* Category Interests */}
              {expandedCategory === category.id && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-2">
                  {category.interests.map((interest) => (
                    <label
                      key={interest.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-slate-700 hover:bg-slate-600 cursor-pointer transition-colors group"
                    >
                      <input
                        type="checkbox"
                        checked={selectedInterests.has(interest.id)}
                        onChange={() => toggleInterest(interest.id, category.id)}
                        className="w-5 h-5 rounded bg-slate-600 border-slate-500 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
                      />
                      <span className="text-white group-hover:text-purple-300 transition-colors">
                        {interest.label}
                      </span>
                      {selectedInterests.has(interest.id) && (
                        <Check size={16} className="ml-auto text-green-400" />
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Selection Summary */}
        {selectedInterests.size > 0 && (
          <Card className="bg-slate-700 border-slate-600 p-4">
            <div className="flex items-start gap-3">
              <Sparkles size={18} className="text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-medium text-sm mb-2">Selected Interests ({selectedInterests.size})</p>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_CATEGORIES.map((category) =>
                    category.interests
                      .filter((interest) => selectedInterests.has(interest.id))
                      .map((interest) => (
                        <span
                          key={interest.id}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-600 text-white text-xs font-medium"
                        >
                          {interest.label}
                          <button
                            type="button"
                            onClick={() => toggleInterest(interest.id, category.id)}
                            className="ml-1 hover:text-purple-200"
                          >
                            ×
                          </button>
                        </span>
                      ))
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Error Message */}
        {localError && (
          <Card className="bg-red-950 border-red-800 p-3">
            <p className="text-red-300 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {localError}
            </p>
          </Card>
        )}

        {/* Submit Button */}
        <div className="pt-4 flex-shrink-0">
          <Button
            type="submit"
            disabled={!isFormValid || isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Loading...' : 'Continue to Verification (Optional)'}
          </Button>
        </div>

        <p className="text-xs text-slate-400 text-center pt-2">
          You can change your interests anytime in your profile settings
        </p>
      </form>
    </div>
  );
};

export default InterestsStep;

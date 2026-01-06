import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActivityType } from '@/hooks/useActivityTimeline';

interface ActivityFiltersProps {
  selectedFilters: ActivityType[];
  onFilterChange: (filters: ActivityType[]) => void;
  className?: string;
}

const filterOptions: { value: ActivityType; label: string; category: string }[] = [
  // Content Activities
  { value: 'post_created', label: 'Posts', category: 'Content' },
  { value: 'post_deleted', label: 'Posts Deleted', category: 'Content' },

  // Engagement
  { value: 'content_liked', label: 'Likes', category: 'Engagement' },
  { value: 'content_unliked', label: 'Unlikes', category: 'Engagement' },
  { value: 'comment_added', label: 'Comments', category: 'Engagement' },
  { value: 'comment_deleted', label: 'Comments Deleted', category: 'Engagement' },
  { value: 'content_shared', label: 'Shares', category: 'Engagement' },

  // Commerce
  { value: 'content_purchased', label: 'Purchases', category: 'Commerce' },
  { value: 'product_listed', label: 'Products Listed', category: 'Commerce' },
  { value: 'product_sold', label: 'Products Sold', category: 'Commerce' },
  { value: 'job_posted', label: 'Jobs Posted', category: 'Commerce' },
  { value: 'job_completed', label: 'Jobs Completed', category: 'Commerce' },

  // Trading
  { value: 'trade_executed', label: 'Trades', category: 'Trading' },

  // Social
  { value: 'followers_gained', label: 'New Followers', category: 'Social' },

  // Account
  { value: 'profile_updated', label: 'Profile Updates', category: 'Account' },
  { value: 'badge_earned', label: 'Badges Earned', category: 'Account' },
  { value: 'level_up', label: 'Level Up', category: 'Account' },
  { value: 'milestone_reached', label: 'Milestones', category: 'Account' },
];

const ActivityFilters: React.FC<ActivityFiltersProps> = ({
  selectedFilters,
  onFilterChange,
  className = '',
}) => {
  const categories = Array.from(
    new Set(filterOptions.map(opt => opt.category))
  );

  const toggleFilter = (filter: ActivityType) => {
    if (selectedFilters.includes(filter)) {
      onFilterChange(selectedFilters.filter(f => f !== filter));
    } else {
      onFilterChange([...selectedFilters, filter]);
    }
  };

  const handleSelectCategory = (category: string) => {
    const categoryFilters = filterOptions
      .filter(opt => opt.category === category)
      .map(opt => opt.value);

    const allSelected = categoryFilters.every(f => selectedFilters.includes(f));

    if (allSelected) {
      // Deselect all from this category
      onFilterChange(selectedFilters.filter(f => !categoryFilters.includes(f)));
    } else {
      // Select all from this category
      const newFilters = new Set([...selectedFilters, ...categoryFilters]);
      onFilterChange(Array.from(newFilters));
    }
  };

  const clearFilters = () => {
    onFilterChange([]);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Clear all button */}
      {selectedFilters.length > 0 && (
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-gray-600">
            Filters: {selectedFilters.length} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-auto p-0 text-xs text-blue-600 hover:text-blue-700"
          >
            <X className="h-3 w-3 mr-1" />
            Clear all
          </Button>
        </div>
      )}

      {/* Filter categories */}
      {categories.map(category => {
        const categoryFilters = filterOptions.filter(opt => opt.category === category);
        const allSelected = categoryFilters.every(f => selectedFilters.includes(f));
        const someSelected = categoryFilters.some(f => selectedFilters.includes(f));

        return (
          <div key={category} className="space-y-2">
            {/* Category header with select all */}
            <div className="flex items-center justify-between px-2">
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                {category}
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSelectCategory(category)}
                className="h-auto p-0 text-xs text-blue-600 hover:text-blue-700"
              >
                {allSelected ? 'Deselect all' : 'Select all'}
              </Button>
            </div>

            {/* Category filters */}
            <div className="flex flex-wrap gap-2 pl-2">
              {categoryFilters.map(option => (
                <Button
                  key={option.value}
                  variant={selectedFilters.includes(option.value) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleFilter(option.value)}
                  className={cn(
                    'text-xs h-8 px-3',
                    selectedFilters.includes(option.value) &&
                      'bg-blue-600 text-white hover:bg-blue-700'
                  )}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        );
      })}

      {/* Quick presets */}
      <div className="pt-4 border-t">
        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
          Quick Presets
        </h4>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedFilters.length === 0 ? 'default' : 'outline'}
            size="sm"
            onClick={clearFilters}
            className="text-xs h-8"
          >
            All Activities
          </Button>
          <Button
            variant={
              selectedFilters.includes('post_created') &&
              selectedFilters.includes('comment_added') &&
              selectedFilters.includes('content_shared')
                ? 'default'
                : 'outline'
            }
            size="sm"
            onClick={() =>
              onFilterChange(['post_created', 'comment_added', 'content_shared'])
            }
            className="text-xs h-8"
          >
            My Content
          </Button>
          <Button
            variant={
              selectedFilters.includes('content_liked') &&
              selectedFilters.includes('content_purchased')
                ? 'default'
                : 'outline'
            }
            size="sm"
            onClick={() => onFilterChange(['content_liked', 'content_purchased'])}
            className="text-xs h-8"
          >
            Interactions
          </Button>
          <Button
            variant={
              selectedFilters.includes('badge_earned') &&
              selectedFilters.includes('level_up') &&
              selectedFilters.includes('milestone_reached')
                ? 'default'
                : 'outline'
            }
            size="sm"
            onClick={() =>
              onFilterChange(['badge_earned', 'level_up', 'milestone_reached'])
            }
            className="text-xs h-8"
          >
            Achievements
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ActivityFilters;

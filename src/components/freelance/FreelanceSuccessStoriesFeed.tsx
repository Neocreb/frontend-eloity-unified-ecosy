// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Award, DollarSign, Calendar, MapPin } from 'lucide-react';
import { FreelanceSkeletons } from './FreelanceSkeletons';
import { FreelanceErrorMessage } from './FreelanceErrorBoundary';

interface FreelanceSuccessStory {
  id: string;
  projectId: string;
  freelancerId: string;
  freelancerName: string;
  freelancerTitle: string;
  freelancerAvatar: string;
  clientName: string;
  projectTitle: string;
  projectDescription: string;
  budget: number;
  currency: string;
  duration: string;
  rating: number;
  reviewText: string;
  completedDate: string;
  tags: string[];
}

/**
 * Success Story Card
 * Displays a single freelance project success story
 */
const SuccessStoryCard: React.FC<{ story: FreelanceSuccessStory; onClick?: () => void }> = ({
  story,
  onClick,
}) => (
  <div
    onClick={onClick}
    className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
  >
    {/* Header with client review rating */}
    <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {story.freelancerAvatar && (
            <img
              src={story.freelancerAvatar}
              alt={story.freelancerName}
              className="w-10 h-10 rounded-full object-cover"
            />
          )}
          <div>
            <p className="font-semibold text-neutral-900 dark:text-neutral-100">
              {story.freelancerName}
            </p>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">{story.freelancerTitle}</p>
          </div>
        </div>
        {/* Star rating */}
        <div className="flex items-center gap-1">
          <div className="flex text-yellow-400">
            {Array(Math.floor(story.rating))
              .fill(null)
              .map((_, i) => (
                <span key={i}>★</span>
              ))}
          </div>
          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {story.rating.toFixed(1)}
          </span>
        </div>
      </div>
    </div>

    {/* Project details */}
    <div className="p-4 space-y-3">
      {/* Project title */}
      <div>
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-lg mb-1">
          {story.projectTitle}
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400 text-sm line-clamp-2">
          {story.projectDescription}
        </p>
      </div>

      {/* Project meta info */}
      <div className="grid grid-cols-3 gap-2 pt-2">
        {/* Budget */}
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
          <span className="text-neutral-700 dark:text-neutral-300">
            ${story.budget.toLocaleString()}
          </span>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-neutral-700 dark:text-neutral-300">{story.duration}</span>
        </div>

        {/* Completion date */}
        <div className="flex items-center gap-2 text-sm">
          <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="text-neutral-700 dark:text-neutral-300">
            {new Date(story.completedDate).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Client review */}
      <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded p-3 mt-3">
        <p className="text-sm text-neutral-700 dark:text-neutral-300 italic">
          "{story.reviewText}"
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
          — {story.clientName}
        </p>
      </div>

      {/* Tags */}
      {story.tags && story.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {story.tags.slice(0, 3).map((tag, i) => (
            <span
              key={i}
              className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full"
            >
              {tag}
            </span>
          ))}
          {story.tags.length > 3 && (
            <span className="text-xs px-2 py-1 text-neutral-600 dark:text-neutral-400">
              +{story.tags.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>

    {/* CTA */}
    <div className="bg-neutral-50 dark:bg-neutral-800/50 px-4 py-3 border-t border-neutral-200 dark:border-neutral-800">
      <button className="w-full text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
        View Freelancer Profile →
      </button>
    </div>
  </div>
);

/**
 * Freelance Success Stories Feed Component
 * Displays completed freelance projects as success stories
 */
export const FreelanceSuccessStoriesFeed: React.FC<{
  limit?: number;
  showViewMore?: boolean;
}> = ({ limit = 6, showViewMore = true }) => {
  const [stories, setStories] = useState<FreelanceSuccessStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuccessStories = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get completed projects with high ratings
        const { data: projects, error: projectError } = await supabase
          .from('freelance_projects')
          .select(
            `
            id,
            title,
            description,
            budget,
            currency,
            status,
            freelancer_id,
            client_id,
            created_at,
            completed_at,
            freelancer_profiles: freelancer_id (
              user_id,
              title,
              avatar_url
            ),
            freelance_reviews (
              rating,
              review_text,
              created_at
            )
          `
          )
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(limit);

        if (projectError) throw projectError;

        // Get user details and format stories
        const formattedStories: FreelanceSuccessStory[] = await Promise.all(
          (projects || [])
            .filter((p: any) => p.freelance_reviews && p.freelance_reviews.length > 0)
            .map(async (project: any) => {
              const review = project.freelance_reviews[0];
              const { data: freelancer } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', project.freelancer_id)
                .single();

              const { data: client } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', project.client_id)
                .single();

              return {
                id: project.id,
                projectId: project.id,
                freelancerId: project.freelancer_id,
                freelancerName: freelancer?.full_name || 'Freelancer',
                freelancerTitle: project.freelancer_profiles?.title || 'Professional',
                freelancerAvatar: project.freelancer_profiles?.avatar_url || '',
                clientName: client?.full_name || 'Client',
                projectTitle: project.title,
                projectDescription: project.description || '',
                budget: project.budget || 0,
                currency: project.currency || 'USD',
                duration: `${Math.ceil((new Date(project.completed_at).getTime() - new Date(project.created_at).getTime()) / (1000 * 60 * 60 * 24))} days`,
                rating: review.rating || 5,
                reviewText: review.review_text || 'Great work!',
                completedDate: project.completed_at,
                tags: [
                  project.title.split(' ')[0],
                  ...((project.skills_used || []) as string[]).slice(0, 2),
                ].filter(Boolean),
              };
            })
        );

        setStories(formattedStories);
      } catch (err) {
        console.error('Error fetching success stories:', err);
        setError('Failed to load success stories');
      } finally {
        setLoading(false);
      }
    };

    fetchSuccessStories();
  }, [limit]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Success Stories
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(limit)
            .fill(null)
            .map((_, i) => (
              <FreelanceSkeletons.ProjectCardSkeleton key={i} />
            ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Success Stories
        </h2>
        <FreelanceErrorMessage title="Error Loading Stories" message={error} />
      </div>
    );
  }

  if (stories.length === 0) {
    return null; // Don't show section if no stories
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          Success Stories
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          See how our freelancers deliver exceptional results
        </p>
      </div>

      {/* Stories grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stories.map((story) => (
          <SuccessStoryCard
            key={story.id}
            story={story}
            onClick={() => {
              window.location.href = `/freelance/freelancers/${story.freelancerId}`;
            }}
          />
        ))}
      </div>

      {/* View more button */}
      {showViewMore && stories.length >= limit && (
        <div className="flex justify-center">
          <button className="px-6 py-2 text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors font-medium">
            View More Success Stories
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Single Success Story Card for embedding in feeds
 */
export const FreelanceSuccessStoryCard = SuccessStoryCard;

export default FreelanceSuccessStoriesFeed;

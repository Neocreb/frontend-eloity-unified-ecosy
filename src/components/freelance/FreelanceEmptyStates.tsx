import React from 'react';
import { Button } from '@/components/ui/button';
import { FileX, Briefcase, MessageSquare, Star, TrendingUp, Search } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyStateContainer: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
}) => (
  <div className="flex flex-col items-center justify-center py-12 px-4">
    <div className="mb-4 text-neutral-300">{icon}</div>
    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
      {title}
    </h3>
    <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-6 max-w-sm text-center">
      {description}
    </p>
    {action && (
      <Button onClick={action.onClick} className="gap-2">
        {action.label}
      </Button>
    )}
  </div>
);

/**
 * Empty states for freelance platform
 */
export const FreelanceEmptyStates = {
  /**
   * No jobs found/posted
   */
  EmptyJobs: ({ onPostJob }: { onPostJob?: () => void }) => (
    <EmptyStateContainer
      title="No Jobs Yet"
      description="Start your freelancing journey by browsing available jobs or create your profile to get started."
      icon={<Briefcase className="w-12 h-12" />}
      action={
        onPostJob
          ? {
              label: 'Browse Jobs',
              onClick: onPostJob,
            }
          : undefined
      }
    />
  ),

  /**
   * No proposals submitted/received
   */
  EmptyProposals: ({ isFreelancer, onAction }: { isFreelancer: boolean; onAction?: () => void }) => (
    <EmptyStateContainer
      title={isFreelancer ? 'No Proposals Yet' : 'No Proposals Received'}
      description={
        isFreelancer
          ? 'Start applying to jobs to see your proposals here.'
          : 'Post a job to receive proposals from freelancers.'
      }
      icon={<FileX className="w-12 h-12" />}
      action={
        onAction
          ? {
              label: isFreelancer ? 'Browse Jobs' : 'Post a Job',
              onClick: onAction,
            }
          : undefined
      }
    />
  ),

  /**
   * No projects
   */
  EmptyProjects: ({ onAction }: { onAction?: () => void }) => (
    <EmptyStateContainer
      title="No Active Projects"
      description="Your accepted projects will appear here. Start by submitting proposals or posting a job."
      icon={<Briefcase className="w-12 h-12" />}
      action={
        onAction
          ? {
              label: 'Get Started',
              onClick: onAction,
            }
          : undefined
      }
    />
  ),

  /**
   * No messages
   */
  EmptyMessages: ({ onAction }: { onAction?: () => void }) => (
    <EmptyStateContainer
      title="No Messages Yet"
      description="Messages with clients or freelancers will appear here once you start a project."
      icon={<MessageSquare className="w-12 h-12" />}
      action={
        onAction
          ? {
              label: 'Start Collaborating',
              onClick: onAction,
            }
          : undefined
      }
    />
  ),

  /**
   * No reviews/ratings
   */
  EmptyReviews: ({ onAction }: { onAction?: () => void }) => (
    <EmptyStateContainer
      title="No Reviews Yet"
      description="Complete projects and receive reviews from your clients to build your reputation."
      icon={<Star className="w-12 h-12" />}
      action={
        onAction
          ? {
              label: 'Find Projects',
              onClick: onAction,
            }
          : undefined
      }
    />
  ),

  /**
   * No earnings
   */
  EmptyEarnings: ({ onAction }: { onAction?: () => void }) => (
    <EmptyStateContainer
      title="No Earnings Yet"
      description="Complete projects to start earning. Your payments will appear here once projects are completed."
      icon={<TrendingUp className="w-12 h-12" />}
      action={
        onAction
          ? {
              label: 'Start Earning',
              onClick: onAction,
            }
          : undefined
      }
    />
  ),

  /**
   * No search results
   */
  EmptySearchResults: ({ query, onClear }: { query: string; onClear?: () => void }) => (
    <EmptyStateContainer
      title="No Results Found"
      description={`We couldn't find any results for "${query}". Try adjusting your search terms.`}
      icon={<Search className="w-12 h-12" />}
      action={
        onClear
          ? {
              label: 'Clear Search',
              onClick: onClear,
            }
          : undefined
      }
    />
  ),

  /**
   * No freelancers found
   */
  EmptyFreelancers: ({ onAction }: { onAction?: () => void }) => (
    <EmptyStateContainer
      title="No Freelancers Found"
      description="Try adjusting your filters or search criteria to find the right freelancer for your project."
      icon={<Search className="w-12 h-12" />}
      action={
        onAction
          ? {
              label: 'Adjust Filters',
              onClick: onAction,
            }
          : undefined
      }
    />
  ),
};

export default FreelanceEmptyStates;

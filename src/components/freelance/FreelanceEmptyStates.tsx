import React from "react";
import {
  Briefcase,
  FileText,
  Users,
  DollarSign,
  Star,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface EmptyStateProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

const BaseEmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  secondaryAction,
}) => (
  <div className="flex flex-col items-center justify-center py-12 px-4">
    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
      {title}
    </h3>
    <p className="text-gray-600 dark:text-gray-400 text-center mb-6 max-w-sm">
      {description}
    </p>
    <div className="flex gap-3">
      {action && (
        <Button onClick={action.onClick}>
          <Plus className="w-4 h-4 mr-2" />
          {action.label}
        </Button>
      )}
      {secondaryAction && (
        <Button variant="outline" onClick={secondaryAction.onClick}>
          <Search className="w-4 h-4 mr-2" />
          {secondaryAction.label}
        </Button>
      )}
    </div>
  </div>
);

interface FreelanceEmptyStatesProps {
  onCreateJob?: () => void;
  onBrowseJobs?: () => void;
  onFindFreelancers?: () => void;
  onApplyJob?: () => void;
}

export const FreelanceEmptyStates: React.FC<FreelanceEmptyStatesProps> = ({
  onCreateJob,
  onBrowseJobs,
  onFindFreelancers,
  onApplyJob,
}) => {
  const navigate = useNavigate();

  return {
    // Job-related empty states
    EmptyJobState: () => (
      <BaseEmptyState
        title="No Jobs Available"
        description="There are no active jobs matching your criteria right now. Check back soon or adjust your filters."
        icon={<Briefcase className="w-8 h-8 text-gray-400" />}
        action={{
          label: "Browse All Jobs",
          onClick: onBrowseJobs || (() => navigate("/app/freelance/browse-jobs")),
        }}
      />
    ),

    EmptyJobPostings: () => (
      <BaseEmptyState
        title="No Job Postings Yet"
        description="You haven't posted any jobs yet. Create your first job posting to find talented freelancers."
        icon={<Plus className="w-8 h-8 text-gray-400" />}
        action={{
          label: "Post a Job",
          onClick: onCreateJob || (() => navigate("/app/freelance/create-job")),
        }}
        secondaryAction={{
          label: "Browse Freelancers",
          onClick: onFindFreelancers || (() => navigate("/app/freelance/find-freelancers")),
        }}
      />
    ),

    // Project-related empty states
    EmptyProjects: () => (
      <BaseEmptyState
        title="No Projects Yet"
        description="You don't have any active projects. Start by browsing available jobs or posting a new one."
        icon={<Briefcase className="w-8 h-8 text-gray-400" />}
        action={{
          label: "Find a Project",
          onClick: onApplyJob || (() => navigate("/app/freelance/browse-jobs")),
        }}
      />
    ),

    EmptyActiveProjects: () => (
      <BaseEmptyState
        title="No Active Projects"
        description="You don't have any active projects at the moment. Your completed projects will appear here."
        icon={<CheckCircle2 className="w-8 h-8 text-gray-400" />}
        action={{
          label: "Find a Project",
          onClick: onBrowseJobs || (() => navigate("/app/freelance/browse-jobs")),
        }}
      />
    ),

    // Proposal-related empty states
    EmptyProposals: () => (
      <BaseEmptyState
        title="No Proposals Yet"
        description="You haven't submitted any proposals yet. Browse available jobs and submit your first proposal."
        icon={<FileText className="w-8 h-8 text-gray-400" />}
        action={{
          label: "Browse Jobs",
          onClick: onBrowseJobs || (() => navigate("/app/freelance/browse-jobs")),
        }}
      />
    ),

    EmptyJobProposals: () => (
      <BaseEmptyState
        title="No Proposals Received"
        description="You haven't received any proposals for this job yet. Try adjusting your requirements or increase your budget."
        icon={<FileText className="w-8 h-8 text-gray-400" />}
        action={{
          label: "Edit Job Post",
          onClick: () => navigate("/app/freelance"),
        }}
      />
    ),

    EmptyReceivedProposals: () => (
      <BaseEmptyState
        title="No Proposals Received"
        description="You haven't received any proposals yet. Make sure your job posting is detailed and competitive."
        icon={<FileText className="w-8 h-8 text-gray-400" />}
        action={{
          label: "View Active Jobs",
          onClick: () => navigate("/app/freelance"),
        }}
      />
    ),

    // Freelancer-related empty states
    EmptyFreelancers: () => (
      <BaseEmptyState
        title="No Freelancers Found"
        description="No freelancers match your search criteria. Try adjusting your filters or search terms."
        icon={<Users className="w-8 h-8 text-gray-400" />}
        action={{
          label: "Clear Filters",
          onClick: () => {
            // This would typically clear filters in parent component
          },
        }}
      />
    ),

    EmptyRecommendedFreelancers: () => (
      <BaseEmptyState
        title="No Recommended Freelancers"
        description="We couldn't find recommended freelancers for this job. Browse all freelancers instead."
        icon={<Star className="w-8 h-8 text-gray-400" />}
        action={{
          label: "Browse All Freelancers",
          onClick: onFindFreelancers || (() => navigate("/app/freelance/find-freelancers")),
        }}
      />
    ),

    // Review-related empty states
    NoReviewsState: () => (
      <BaseEmptyState
        title="No Reviews Yet"
        description="You don't have any reviews yet. Complete projects and ask clients to leave feedback."
        icon={<Star className="w-8 h-8 text-gray-400" />}
      />
    ),

    // Earnings-related empty states
    NoEarningsState: () => (
      <BaseEmptyState
        title="No Earnings Yet"
        description="You haven't earned any money yet. Complete projects and request payments to see your earnings."
        icon={<DollarSign className="w-8 h-8 text-gray-400" />}
        action={{
          label: "Find a Project",
          onClick: onBrowseJobs || (() => navigate("/app/freelance/browse-jobs")),
        }}
      />
    ),

    // Activity-related empty states
    NoActivityState: () => (
      <BaseEmptyState
        title="No Recent Activity"
        description="Your recent activity will appear here as you work on projects and interact with clients."
        icon={<AlertCircle className="w-8 h-8 text-gray-400" />}
      />
    ),

    // Messages-related empty states
    NoMessagesState: () => (
      <BaseEmptyState
        title="No Messages"
        description="You don't have any messages yet. Start collaborating with clients and freelancers."
        icon={<FileText className="w-8 h-8 text-gray-400" />}
      />
    ),

    // Search results empty states
    EmptySearchResults: () => (
      <BaseEmptyState
        title="No Results Found"
        description="Your search didn't return any results. Try using different keywords or filters."
        icon={<Search className="w-8 h-8 text-gray-400" />}
        secondaryAction={{
          label: "Clear Search",
          onClick: () => {
            // This would typically clear search in parent component
          },
        }}
      />
    ),
  };
};

export default FreelanceEmptyStates;

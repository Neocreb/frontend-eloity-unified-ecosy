// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  FreelancerProfile,
  JobPosting,
  Proposal,
  Project,
  SearchFilters,
  FreelanceStats,
  Milestone,
} from "@/types/freelance";
import { rewardsService } from "./rewardsService";

export class FreelanceService {
  // ============================================================================
  // PROFILE MANAGEMENT METHODS
  // ============================================================================

  static async createFreelancerProfile(
    profile: Partial<FreelancerProfile>
  ): Promise<FreelancerProfile | null> {
    try {
      const { data, error } = await supabase
        .from("freelancer_profiles")
        .insert({
          user_id: profile.userId,
          professional_title: profile.title,
          overview: profile.description,
          skills: profile.skills || [],
          hourly_rate: profile.hourlyRate?.toString(),
          experience_level: profile.experience,
          portfolio_url: profile.portfolio?.[0] || null,
          availability: "available",
          languages: profile.languages || [],
          education: profile.education || [],
          certifications: profile.certifications || [],
        })
        .select()
        .single();

      if (error) throw error;

      // Create stats record
      await supabase.from("freelance_stats").insert({
        user_id: profile.userId,
        total_projects: 0,
        completed_projects: 0,
        total_earnings: 0,
        average_rating: 5,
      });

      return this.mapProfileData(data);
    } catch (error) {
      console.error("Error creating profile:", error);
      return null;
    }
  }

  static async getFreelancerProfile(
    id: string
  ): Promise<FreelancerProfile | null> {
    try {
      const { data, error } = await supabase
        .from("freelancer_profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.warn("Profile not found:", error);
        return null;
      }

      return this.mapProfileData(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  }

  static async getFreelancerProfileByUserId(
    userId: string
  ): Promise<FreelancerProfile | null> {
    try {
      const { data, error } = await supabase
        .from("freelancer_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) return null;
      return this.mapProfileData(data);
    } catch (error) {
      console.error("Error fetching profile by user ID:", error);
      return null;
    }
  }

  static async updateFreelancerProfile(
    id: string,
    updates: Partial<FreelancerProfile>
  ): Promise<FreelancerProfile | null> {
    try {
      const updateData: any = {};

      if (updates.title) updateData.professional_title = updates.title;
      if (updates.description) updateData.overview = updates.description;
      if (updates.hourlyRate)
        updateData.hourly_rate = updates.hourlyRate.toString();
      if (updates.experience) updateData.experience_level = updates.experience;
      if (updates.portfolio) updateData.portfolio_url = updates.portfolio[0];
      if (updates.availability)
        updateData.availability = updates.availability;
      if (updates.languages) updateData.languages = updates.languages;
      if (updates.education) updateData.education = updates.education;
      if (updates.certifications)
        updateData.certifications = updates.certifications;
      if (updates.skills) updateData.skills = updates.skills;

      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from("freelancer_profiles")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      await this.logActivity({
        user_id: updates.userId || "",
        activity_type: "profile_updated",
        entity_type: "freelancer",
        entity_id: id,
        description: "Updated freelancer profile",
      });

      return this.mapProfileData(data);
    } catch (error) {
      console.error("Error updating profile:", error);
      return null;
    }
  }

  static async searchFreelancers(
    filters: SearchFilters
  ): Promise<FreelancerProfile[]> {
    try {
      let query = supabase.from("freelancer_profiles").select("*");

      if (filters.query) {
        query = query.or(
          `professional_title.ilike.%${filters.query}%,overview.ilike.%${filters.query}%`
        );
      }

      if (filters.skills && filters.skills.length > 0) {
        query = query.overlaps("skills", filters.skills);
      }

      if (filters.budgetMin) {
        query = query.gte("hourly_rate", filters.budgetMin.toString());
      }

      if (filters.budgetMax) {
        query = query.lte("hourly_rate", filters.budgetMax.toString());
      }

      if (filters.sortBy === "rating") {
        query = query.order("success_rate", { ascending: false });
      } else if (filters.sortBy === "hourly_rate") {
        query = query.order("hourly_rate", { ascending: true });
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

      return (data || []).map((p) => this.mapProfileData(p));
    } catch (error) {
      console.error("Error searching freelancers:", error);
      return [];
    }
  }

  static async getFreelancerRecommendations(
    jobId: string,
    limit: number = 10
  ): Promise<FreelancerProfile[]> {
    try {
      const job = await this.getJobPosting(jobId);
      if (!job) return [];

      const { data, error } = await supabase
        .from("freelancer_profiles")
        .select("*")
        .overlaps("skills", job.skills)
        .order("success_rate", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((p) => this.mapProfileData(p));
    } catch (error) {
      console.error("Error getting recommendations:", error);
      return [];
    }
  }

  // ============================================================================
  // JOB POSTING METHODS
  // ============================================================================

  static async searchJobs(filters: SearchFilters): Promise<JobPosting[]> {
    try {
      let query = supabase
        .from("job_postings")
        .select("*")
        .eq("status", "active");

      if (filters.query) {
        query = query.ilike("title", `%${filters.query}%`);
      }

      if (filters.category) {
        query = query.eq("category", filters.category);
      }

      if (filters.skills && filters.skills.length > 0) {
        query = query.overlaps("skills", filters.skills);
      }

      if (filters.budgetMin) {
        query = query.gte("budget_min", filters.budgetMin);
      }

      if (filters.budgetMax) {
        query = query.lte("budget_max", filters.budgetMax);
      }

      const { data, error } = await query.order("posted_date", {
        ascending: false,
      });

      if (error) throw error;

      return (data || []).map((job) => this.mapJobData(job));
    } catch (error) {
      console.error("Error searching jobs:", error);
      return [];
    }
  }

  static async getJobPosting(id: string): Promise<JobPosting | null> {
    try {
      const { data, error } = await supabase
        .from("job_postings")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching job:", error);
        return null;
      }

      return this.mapJobData(data);
    } catch (error) {
      console.error("Error in getJobPosting:", error);
      return null;
    }
  }

  static async createJobPosting(
    jobData: Omit<
      JobPosting,
      | "id"
      | "postedDate"
      | "applicationsCount"
      | "proposals"
      | "createdAt"
      | "updatedAt"
    >
  ): Promise<JobPosting | null> {
    try {
      const { data, error } = await supabase
        .from("job_postings")
        .insert([
          {
            client_id: jobData.clientId,
            title: jobData.title,
            description: jobData.description,
            category: jobData.category,
            subcategory: jobData.subcategory,
            skills: jobData.skills,
            budget_type: jobData.budget.type,
            budget_amount: jobData.budget.amount,
            budget_min: jobData.budget.range?.min,
            budget_max: jobData.budget.range?.max,
            duration: jobData.duration,
            experience_level: jobData.experience,
            status: "active",
            deadline: jobData.deadline?.toISOString(),
            attachments: jobData.attachments || [],
            location: jobData.location,
            is_remote: jobData.isRemote,
            posted_date: new Date().toISOString(),
            applications_count: 0,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      await this.logActivity({
        user_id: jobData.clientId,
        activity_type: "job_posted",
        entity_type: "job",
        entity_id: data.id,
        description: `Posted job: ${jobData.title}`,
      });

      return this.mapJobData(data);
    } catch (error) {
      console.error("Error creating job:", error);
      return null;
    }
  }

  static async getActiveJobs(clientId: string): Promise<JobPosting[]> {
    try {
      const { data, error } = await supabase
        .from("job_postings")
        .select("*")
        .eq("client_id", clientId)
        .eq("status", "active")
        .order("posted_date", { ascending: false });

      if (error) throw error;

      return (data || []).map((job) => this.mapJobData(job));
    } catch (error) {
      console.error("Error fetching active jobs:", error);
      return [];
    }
  }

  static async updateJobStatus(
    jobId: string,
    status: JobPosting["status"]
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("job_postings")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error updating job status:", error);
      return false;
    }
  }

  static async closeJob(jobId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("job_postings")
        .update({
          status: "closed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);

      if (error) throw error;

      await this.logActivity({
        user_id: "",
        activity_type: "job_closed",
        entity_type: "job",
        entity_id: jobId,
        description: "Job closed",
      });

      return true;
    } catch (error) {
      console.error("Error closing job:", error);
      return false;
    }
  }

  static async repostJob(jobId: string): Promise<JobPosting | null> {
    try {
      const job = await this.getJobPosting(jobId);
      if (!job) return null;

      return await this.createJobPosting({
        clientId: job.clientId,
        title: job.title,
        description: job.description,
        category: job.category,
        subcategory: job.subcategory,
        skills: job.skills,
        budget: job.budget,
        duration: job.duration,
        experience: job.experience,
        status: "active",
        deadline: job.deadline,
        attachments: job.attachments,
        location: job.location,
        isRemote: job.isRemote,
      });
    } catch (error) {
      console.error("Error reposting job:", error);
      return null;
    }
  }

  // ============================================================================
  // PROPOSAL METHODS
  // ============================================================================

  static async submitProposal(
    proposalData: Omit<Proposal, "id" | "submittedDate" | "status">
  ): Promise<Proposal | null> {
    try {
      const { data, error } = await supabase
        .from("freelance_proposals")
        .insert([
          {
            project_id: proposalData.jobId,
            freelancer_id: proposalData.freelancerId,
            cover_letter: proposalData.coverLetter,
            proposed_budget: proposalData.proposedRate,
            estimated_duration: proposalData.proposedDuration,
            attachments: proposalData.attachments,
            status: "pending",
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Update job applications count
      const job = await this.getJobPosting(proposalData.jobId);
      if (job) {
        await supabase
          .from("job_postings")
          .update({
            applications_count: (job.applicationsCount || 0) + 1,
          })
          .eq("id", proposalData.jobId);
      }

      await this.logActivity({
        user_id: proposalData.freelancerId,
        activity_type: "proposal_submitted",
        entity_type: "proposal",
        entity_id: data.id,
        description: `Submitted proposal for job: ${proposalData.jobId}`,
      });

      return this.mapProposalData(data);
    } catch (error) {
      console.error("Error submitting proposal:", error);
      return null;
    }
  }

  static async getProposals(freelancerId: string): Promise<Proposal[]> {
    try {
      const { data, error } = await supabase
        .from("freelance_proposals")
        .select("*")
        .eq("freelancer_id", freelancerId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((proposal) => this.mapProposalData(proposal));
    } catch (error) {
      console.error("Error fetching proposals:", error);
      return [];
    }
  }

  static async getJobProposals(jobId: string): Promise<Proposal[]> {
    try {
      const { data, error } = await supabase
        .from("freelance_proposals")
        .select("*")
        .eq("project_id", jobId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((proposal) => this.mapProposalData(proposal));
    } catch (error) {
      console.error("Error fetching job proposals:", error);
      return [];
    }
  }

  static async getProposal(proposalId: string): Promise<Proposal | null> {
    try {
      const { data, error } = await supabase
        .from("freelance_proposals")
        .select("*")
        .eq("id", proposalId)
        .single();

      if (error) return null;

      return this.mapProposalData(data);
    } catch (error) {
      console.error("Error fetching proposal:", error);
      return null;
    }
  }

  static async acceptProposal(proposalId: string): Promise<Project | null> {
    try {
      const proposal = await this.getProposal(proposalId);
      if (!proposal) return null;

      const job = await this.getJobPosting(proposal.jobId);
      if (!job) return null;

      // Create project from accepted proposal
      const { data: projectData, error: projectError } = await supabase
        .from("freelance_projects")
        .insert([
          {
            client_id: job.clientId,
            freelancer_id: proposal.freelancerId,
            job_id: proposal.jobId,
            title: job.title,
            description: job.description,
            budget_min:
              proposal.proposedRate || job.budget.amount || job.budget.range?.min,
            budget_max:
              proposal.proposedRate || job.budget.amount || job.budget.range?.max,
            status: "active",
            start_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (projectError) throw projectError;

      // Update proposal status
      await supabase
        .from("freelance_proposals")
        .update({
          status: "accepted",
          updated_at: new Date().toISOString(),
        })
        .eq("id", proposalId);

      // Reject other proposals for this job
      await supabase
        .from("freelance_proposals")
        .update({
          status: "rejected",
          updated_at: new Date().toISOString(),
        })
        .eq("project_id", proposal.jobId)
        .neq("id", proposalId);

      // Update job status
      await this.updateJobStatus(proposal.jobId, "in_progress");

      await this.logActivity({
        user_id: job.clientId,
        activity_type: "proposal_accepted",
        entity_type: "proposal",
        entity_id: proposalId,
        description: "Accepted proposal",
      });

      await this.logActivity({
        user_id: proposal.freelancerId,
        activity_type: "project_started",
        entity_type: "project",
        entity_id: projectData.id,
        description: "Project started",
      });

      return this.mapProjectData(projectData);
    } catch (error) {
      console.error("Error accepting proposal:", error);
      return null;
    }
  }

  static async rejectProposal(
    proposalId: string,
    reason?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("freelance_proposals")
        .update({
          status: "rejected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", proposalId);

      if (error) throw error;

      const proposal = await this.getProposal(proposalId);
      if (proposal) {
        await this.logActivity({
          user_id: "",
          activity_type: "proposal_rejected",
          entity_type: "proposal",
          entity_id: proposalId,
          description: reason || "Proposal rejected",
        });
      }

      return true;
    } catch (error) {
      console.error("Error rejecting proposal:", error);
      return false;
    }
  }

  static async withdrawProposal(proposalId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("freelance_proposals")
        .update({
          status: "withdrawn",
          updated_at: new Date().toISOString(),
        })
        .eq("id", proposalId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error withdrawing proposal:", error);
      return false;
    }
  }

  // ============================================================================
  // PROJECT METHODS
  // ============================================================================

  static async getProjects(
    userId: string,
    userType: "freelancer" | "client"
  ): Promise<Project[]> {
    try {
      let query = supabase.from("freelance_projects").select("*");

      if (userType === "freelancer") {
        query = query.eq("freelancer_id", userId);
      } else {
        query = query.eq("client_id", userId);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;

      return (data || []).map((project) => this.mapProjectData(project));
    } catch (error) {
      console.error("Error fetching projects:", error);
      return [];
    }
  }

  static async getProject(id: string): Promise<Project | null> {
    try {
      const { data, error } = await supabase
        .from("freelance_projects")
        .select("*")
        .eq("id", id)
        .single();

      if (error) return null;

      return this.mapProjectData(data);
    } catch (error) {
      console.error("Error fetching project:", error);
      return null;
    }
  }

  static async updateProjectStatus(
    id: string,
    status: Project["status"]
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("freelance_projects")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      await this.logActivity({
        user_id: "",
        activity_type: "project_status_updated",
        entity_type: "project",
        entity_id: id,
        description: `Project status updated to ${status}`,
      });

      return true;
    } catch (error) {
      console.error("Error updating project status:", error);
      return false;
    }
  }

  static async completeProject(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("freelance_projects")
        .update({
          status: "completed",
          completion_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      const project = await this.getProject(id);
      if (project) {
        // Update freelancer stats
        await this.updateFreelancerStats(project.freelancerId);

        await this.logActivity({
          user_id: project.freelancerId,
          activity_type: "project_completed",
          entity_type: "project",
          entity_id: id,
          description: "Project completed",
        });
      }

      return true;
    } catch (error) {
      console.error("Error completing project:", error);
      return false;
    }
  }

  // ============================================================================
  // MILESTONE METHODS
  // ============================================================================

  static async createMilestone(
    milestone: Omit<Milestone, "id" | "createdAt" | "updatedAt">
  ): Promise<Milestone | null> {
    try {
      const { data, error } = await supabase
        .from("milestones")
        .insert([
          {
            project_id: milestone.projectId,
            title: milestone.title,
            description: milestone.description,
            amount: milestone.amount,
            due_date: milestone.dueDate.toISOString(),
            status: "pending",
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      await this.logActivity({
        user_id: "",
        activity_type: "milestone_created",
        entity_type: "milestone",
        entity_id: data.id,
        description: milestone.title,
      });

      return this.mapMilestoneData(data);
    } catch (error) {
      console.error("Error creating milestone:", error);
      return null;
    }
  }

  static async getMilestones(projectId: string): Promise<Milestone[]> {
    try {
      const { data, error } = await supabase
        .from("milestones")
        .select("*")
        .eq("project_id", projectId)
        .order("due_date", { ascending: true });

      if (error) throw error;

      return (data || []).map((m) => this.mapMilestoneData(m));
    } catch (error) {
      console.error("Error fetching milestones:", error);
      return [];
    }
  }

  static async updateMilestoneStatus(
    milestoneId: string,
    status: Milestone["status"]
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("milestones")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", milestoneId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error updating milestone status:", error);
      return false;
    }
  }

  static async completeMilestone(milestoneId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("milestones")
        .update({
          status: "completed",
          submission_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", milestoneId);

      if (error) throw error;

      await this.logActivity({
        user_id: "",
        activity_type: "milestone_completed",
        entity_type: "milestone",
        entity_id: milestoneId,
        description: "Milestone marked as completed for review",
      });

      return true;
    } catch (error) {
      console.error("Error completing milestone:", error);
      return false;
    }
  }

  static async approveMilestone(milestoneId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("milestones")
        .update({
          status: "approved",
          approval_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", milestoneId);

      if (error) throw error;

      const milestone = await this.getMilestoneDetails(milestoneId);
      if (milestone) {
        await this.logActivity({
          user_id: "",
          activity_type: "milestone_approved",
          entity_type: "milestone",
          entity_id: milestoneId,
          description: "Milestone approved and payment will be released",
        });
      }

      return true;
    } catch (error) {
      console.error("Error approving milestone:", error);
      return false;
    }
  }

  static async getMilestoneDetails(
    milestoneId: string
  ): Promise<Milestone | null> {
    try {
      const { data, error } = await supabase
        .from("milestones")
        .select("*")
        .eq("id", milestoneId)
        .single();

      if (error) return null;
      return this.mapMilestoneData(data);
    } catch (error) {
      console.error("Error fetching milestone:", error);
      return null;
    }
  }

  // ============================================================================
  // REVIEW AND RATING METHODS
  // ============================================================================

  static async submitReview(
    freelancerId: string,
    reviewData: {
      projectId: string;
      rating: number;
      title: string;
      content: string;
      aspects: Record<string, number>;
      byUserId: string;
    }
  ): Promise<boolean> {
    try {
      const { error } = await supabase.from("freelancer_reviews").insert([
        {
          freelancer_id: freelancerId,
          reviewer_id: reviewData.byUserId,
          project_id: reviewData.projectId,
          rating: reviewData.rating,
          title: reviewData.title,
          content: reviewData.content,
          aspects: reviewData.aspects,
          status: "published",
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      // Update freelancer ratings
      await this.updateFreelancerRating(freelancerId);

      await this.logActivity({
        user_id: reviewData.byUserId,
        activity_type: "review_submitted",
        entity_type: "review",
        entity_id: freelancerId,
        description: `Submitted ${reviewData.rating}-star review`,
      });

      return true;
    } catch (error) {
      console.error("Error submitting review:", error);
      return false;
    }
  }

  static async getReviews(freelancerId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("freelancer_reviews")
        .select("*")
        .eq("freelancer_id", freelancerId)
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching reviews:", error);
      return [];
    }
  }

  static async updateFreelancerRating(freelancerId: string): Promise<boolean> {
    try {
      const { data: reviews, error: reviewError } = await supabase
        .from("freelancer_reviews")
        .select("rating, aspects")
        .eq("freelancer_id", freelancerId)
        .eq("status", "published");

      if (reviewError || !reviews || reviews.length === 0) return false;

      const avgRating =
        reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
        reviews.length;
      const avgCommunication =
        reviews.reduce((sum: number, r: any) => sum + (r.aspects?.communication || 5), 0) /
        reviews.length;
      const avgQuality =
        reviews.reduce((sum: number, r: any) => sum + (r.aspects?.quality || 5), 0) /
        reviews.length;
      const avgProfessionalism =
        reviews.reduce((sum: number, r: any) => sum + (r.aspects?.professionalism || 5), 0) /
        reviews.length;
      const avgTimeliness =
        reviews.reduce((sum: number, r: any) => sum + (r.aspects?.timeliness || 5), 0) /
        reviews.length;

      const { error: updateError } = await supabase
        .from("freelancer_profiles")
        .update({
          success_rate: Math.round((avgRating / 5) * 100),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", freelancerId);

      if (updateError) throw updateError;
      return true;
    } catch (error) {
      console.error("Error updating rating:", error);
      return false;
    }
  }

  // ============================================================================
  // STATS AND EARNINGS METHODS
  // ============================================================================

  static async getFreelanceStats(
    freelancerId: string
  ): Promise<FreelanceStats | null> {
    try {
      const { data, error } = await supabase
        .from("freelance_stats")
        .select("*")
        .eq("user_id", freelancerId)
        .single();

      if (error) return null;

      return {
        totalProjects: data.total_projects || 0,
        completedProjects: data.completed_projects || 0,
        totalEarnings: data.total_earnings || 0,
        averageRating: data.average_rating || 5,
        responseTime: data.response_time || 24,
        successRate: data.success_rate || 100,
        repeatClients: data.repeat_clients || 0,
      };
    } catch (error) {
      console.error("Error fetching stats:", error);
      return null;
    }
  }

  static async updateFreelancerStats(freelancerId: string): Promise<void> {
    try {
      const projects = await this.getProjects(freelancerId, "freelancer");
      const completedProjects = projects.filter(
        (p) => p.status === "completed"
      );

      let totalEarnings = 0;
      for (const project of completedProjects) {
        totalEarnings += project.budget;
      }

      const { error } = await supabase
        .from("freelance_stats")
        .update({
          total_projects: projects.length,
          completed_projects: completedProjects.length,
          total_earnings: totalEarnings,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", freelancerId);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating stats:", error);
    }
  }

  static async getFreelancerBalance(freelancerId: string): Promise<number> {
    try {
      const response = await fetch(
        `/api/wallet/balance?userId=${freelancerId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.data?.balances?.freelance || 0;
      }
      return 0;
    } catch (error) {
      console.error("Error fetching balance:", error);
      return 0;
    }
  }

  static async getFreelancerEarnings(freelancerId: string): Promise<any[]> {
    try {
      const response = await fetch(
        `/api/wallet/transactions?userId=${freelancerId}&type=freelance`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      }
      return [];
    } catch (error) {
      console.error("Error fetching earnings:", error);
      return [];
    }
  }

  static async calculateEarnings(
    freelancerId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    try {
      const { data, error } = await supabase
        .from("milestones")
        .select("amount")
        .eq("freelancer_id", freelancerId)
        .eq("status", "approved")
        .gte("approval_date", startDate.toISOString())
        .lte("approval_date", endDate.toISOString());

      if (error) throw error;

      return (data || []).reduce((sum: number, m: any) => sum + (m.amount || 0), 0);
    } catch (error) {
      console.error("Error calculating earnings:", error);
      return 0;
    }
  }

  static async getFreelancerEarningsStats(userId: string): Promise<{
    totalEarnings: number;
    monthlyEarnings: number;
    projectCount: number;
    completedProjects: number;
    averageRating: number;
    successRate: number;
  } | null> {
    try {
      const stats = await this.getFreelanceStats(userId);

      // Calculate earnings for current month
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const monthlyEarnings = await this.calculateEarnings(userId, monthStart, monthEnd);

      if (!stats) {
        return {
          totalEarnings: 0,
          monthlyEarnings: monthlyEarnings,
          projectCount: 0,
          completedProjects: 0,
          averageRating: 5,
          successRate: 0,
        };
      }

      return {
        totalEarnings: stats.totalEarnings || 0,
        monthlyEarnings: monthlyEarnings || 0,
        projectCount: stats.totalProjects || 0,
        completedProjects: stats.completedProjects || 0,
        averageRating: stats.averageRating || 5,
        successRate: stats.successRate || 0,
      };
    } catch (error) {
      console.error("Error fetching earnings stats:", error);
      return null;
    }
  }

  // ============================================================================
  // ACTIVITY LOGGING
  // ============================================================================

  static async logActivity(activity: {
    user_id: string;
    activity_type: string;
    entity_type?: string;
    entity_id?: string;
    description: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      await supabase.from("freelance_activity_logs").insert([
        {
          user_id: activity.user_id,
          activity_type: activity.activity_type,
          entity_type: activity.entity_type,
          entity_id: activity.entity_id,
          description: activity.description,
          metadata: activity.metadata || {},
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  }

  static async getActivityLog(userId: string, limit: number = 20): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("freelance_activity_logs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching activity log:", error);
      return [];
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  static async getCategories(): Promise<string[]> {
    return [
      "Web Development",
      "Mobile Development",
      "Design",
      "Writing",
      "Marketing",
      "Data Science",
      "DevOps",
      "Cybersecurity",
      "Finance",
      "Legal",
      "Translation",
      "Video Editing",
      "Photography",
      "3D Modeling",
      "Animation",
    ];
  }

  static async getSkills(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from("freelance_skills")
        .select("name")
        .eq("is_active", true);

      if (error || !data) {
        return this.getDefaultSkills();
      }

      return data.map((skill) => skill.name);
    } catch (error) {
      return this.getDefaultSkills();
    }
  }

  private static getDefaultSkills(): string[] {
    return [
      "React",
      "Vue.js",
      "Angular",
      "Node.js",
      "Python",
      "Java",
      "JavaScript",
      "TypeScript",
      "HTML",
      "CSS",
      "UI/UX Design",
      "Graphic Design",
      "Content Writing",
      "SEO",
      "Digital Marketing",
      "Data Analysis",
      "Machine Learning",
      "AWS",
      "Docker",
      "Kubernetes",
      "Blockchain",
      "Solidity",
      "Smart Contracts",
      "Project Management",
      "Agile",
      "Scrum",
    ];
  }

  // ============================================================================
  // DATA MAPPING HELPERS
  // ============================================================================

  private static mapProfileData(data: any): FreelancerProfile {
    return {
      id: data.id,
      userId: data.user_id,
      title: data.professional_title || "",
      description: data.overview || "",
      skills: Array.isArray(data.skills) ? data.skills : [],
      hourlyRate: parseFloat(data.hourly_rate || "0"),
      experience: data.experience_level || "intermediate",
      portfolio: data.portfolio_url ? [data.portfolio_url] : [],
      rating: parseFloat(data.success_rate || "0") * 5 / 100,
      reviewCount: 0,
      totalEarnings: parseFloat(data.total_earnings || "0"),
      completedProjects: data.completed_projects || 0,
      availability:
        (data.availability as "available" | "busy" | "unavailable") ||
        "available",
      languages: Array.isArray(data.languages) ? data.languages : [],
      education: Array.isArray(data.education) ? data.education : [],
      certifications: Array.isArray(data.certifications)
        ? data.certifications
        : [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private static mapJobData(data: any): JobPosting {
    return {
      id: data.id,
      clientId: data.client_id,
      title: data.title,
      description: data.description,
      category: data.category,
      subcategory: data.subcategory,
      skills: Array.isArray(data.skills) ? data.skills : [],
      budget: {
        type: (data.budget_type as "fixed" | "hourly") || "fixed",
        amount: data.budget_amount,
        range:
          data.budget_min && data.budget_max
            ? { min: data.budget_min, max: data.budget_max }
            : undefined,
      },
      duration: data.duration,
      experience: (data.experience_level as "entry" | "intermediate" | "expert") || "intermediate",
      status: (data.status as JobPosting["status"]) || "active",
      postedDate: new Date(data.posted_date),
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      applicationsCount: data.applications_count || 0,
      proposals: [],
      attachments: data.attachments || [],
      location: data.location,
      isRemote: data.is_remote || false,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private static mapProposalData(data: any): Proposal {
    return {
      id: data.id,
      jobId: data.project_id,
      freelancerId: data.freelancer_id,
      coverLetter: data.cover_letter,
      proposedRate: data.proposed_budget
        ? parseFloat(data.proposed_budget.toString())
        : undefined,
      proposedDuration: data.estimated_duration,
      attachments: data.attachments || [],
      status: (data.status as Proposal["status"]) || "pending",
      submittedDate: new Date(data.created_at),
    };
  }

  private static mapProjectData(data: any): Project {
    return {
      id: data.id,
      jobId: data.job_id,
      clientId: data.client_id,
      freelancerId: data.freelancer_id || "",
      title: data.title,
      description: data.description,
      budget: data.budget_min ? parseFloat(data.budget_min.toString()) : 0,
      status: (data.status as Project["status"]) || "pending",
      startDate: data.start_date ? new Date(data.start_date) : new Date(),
      endDate: data.completion_date ? new Date(data.completion_date) : undefined,
      milestones: [],
      contractTerms: "",
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private static mapMilestoneData(data: any): Milestone {
    return {
      id: data.id,
      projectId: data.project_id,
      title: data.title,
      description: data.description,
      amount: parseFloat(data.amount || "0"),
      dueDate: new Date(data.due_date),
      status: (data.status as Milestone["status"]) || "pending",
      submissionDate: data.submission_date ? new Date(data.submission_date) : undefined,
      approvalDate: data.approval_date ? new Date(data.approval_date) : undefined,
    };
  }
}

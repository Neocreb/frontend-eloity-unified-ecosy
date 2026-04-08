import { supabase } from '@/lib/supabase/client';

export interface JobMatchingScore {
  id: string;
  freelancer_id: string;
  project_id: string;
  skills_match_percentage: number;
  experience_match_percentage: number;
  budget_match_percentage: number;
  availability_match_percentage: number;
  past_success_percentage: number;
  overall_match_score: number;
  score_breakdown: {
    skills: { required: string[]; matched: string[]; missing: string[] };
    experience: { required_level: string; freelancer_level: string };
    budget: { min: number; max: number; freelancer_rate: number };
    past_success: { completion_rate: number; rating: number };
  };
  recommendation_reason: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * FreelanceJobMatchingService
 * Provides smart job matching and recommendations
 * Matches freelancers with relevant jobs based on multiple factors
 */

export class FreelanceJobMatchingService {
  /**
   * Calculate match score between a freelancer and a job
   */
  static async calculateMatchScore(
    freelancerId: string,
    projectId: string
  ): Promise<JobMatchingScore | null> {
    try {
      // Get freelancer profile and stats
      const freelancer = await this.getFreelancerProfile(freelancerId);
      if (!freelancer) return null;

      // Get project details
      const project = await this.getProjectDetails(projectId);
      if (!project) return null;

      // Calculate individual match percentages
      const skillsMatch = this.calculateSkillsMatch(
        freelancer.skills || [],
        project.skills_required || []
      );

      const experienceMatch = this.calculateExperienceMatch(
        freelancer.experience_level,
        project.experience_level
      );

      const budgetMatch = this.calculateBudgetMatch(
        freelancer.hourly_rate,
        project.budget_min,
        project.budget_max,
        project.budget_type
      );

      const availabilityMatch = this.calculateAvailabilityMatch(
        freelancer.availability,
        project.project_duration
      );

      const pastSuccessMatch = this.calculatePastSuccessMatch(
        freelancer.success_rate,
        freelancer.average_rating,
        freelancer.completed_projects
      );

      // Calculate weighted overall score (40-30-15-10-5)
      const overallScore =
        skillsMatch * 0.4 +
        experienceMatch * 0.3 +
        pastSuccessMatch * 0.15 +
        budgetMatch * 0.1 +
        availabilityMatch * 0.05;

      // Generate recommendation reason
      const reason = this.generateRecommendationReason(
        skillsMatch,
        experienceMatch,
        budgetMatch,
        availabilityMatch,
        pastSuccessMatch,
        freelancer,
        project
      );

      // Save to database
      const scoreBreakdown = {
        skills: this.getSkillsBreakdown(freelancer.skills || [], project.skills_required || []),
        experience: {
          required_level: project.experience_level,
          freelancer_level: freelancer.experience_level,
        },
        budget: {
          min: project.budget_min,
          max: project.budget_max,
          freelancer_rate: freelancer.hourly_rate,
        },
        past_success: {
          completion_rate: freelancer.success_rate,
          rating: freelancer.average_rating,
        },
      };

      const { data, error } = await supabase
        .from('job_matching_scores')
        .upsert(
          {
            freelancer_id: freelancerId,
            project_id: projectId,
            skills_match_percentage: skillsMatch,
            experience_match_percentage: experienceMatch,
            budget_match_percentage: budgetMatch,
            availability_match_percentage: availabilityMatch,
            past_success_percentage: pastSuccessMatch,
            overall_match_score: overallScore,
            score_breakdown: scoreBreakdown,
            recommendation_reason: reason,
            is_active: true,
          },
          { onConflict: 'freelancer_id,project_id' }
        )
        .select()
        .single();

      if (error) {
        console.error('Error saving match score:', error);
        return null;
      }

      return data as JobMatchingScore;
    } catch (error) {
      console.error('Error in calculateMatchScore:', error);
      return null;
    }
  }

  /**
   * Get recommended jobs for a freelancer
   */
  static async getRecommendedJobs(
    freelancerId: string,
    limit: number = 10,
    minMatchScore: number = 50
  ): Promise<JobMatchingScore[]> {
    try {
      const { data, error } = await supabase
        .from('job_matching_scores')
        .select('*')
        .eq('freelancer_id', freelancerId)
        .eq('is_active', true)
        .gte('overall_match_score', minMatchScore)
        .order('overall_match_score', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recommended jobs:', error);
        return [];
      }

      return data as JobMatchingScore[];
    } catch (error) {
      console.error('Error in getRecommendedJobs:', error);
      return [];
    }
  }

  /**
   * Get recommended freelancers for a job
   */
  static async getRecommendedFreelancers(
    projectId: string,
    limit: number = 10,
    minMatchScore: number = 50
  ): Promise<JobMatchingScore[]> {
    try {
      const { data, error } = await supabase
        .from('job_matching_scores')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .gte('overall_match_score', minMatchScore)
        .order('overall_match_score', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recommended freelancers:', error);
        return [];
      }

      return data as JobMatchingScore[];
    } catch (error) {
      console.error('Error in getRecommendedFreelancers:', error);
      return [];
    }
  }

  /**
   * Calculate match scores for all freelancers for a project
   * Run this when a new project is posted
   */
  static async calculateMatchesForProject(projectId: string): Promise<number> {
    try {
      // Get all active freelancers
      const freelancers = await this.getAllActiveFreelancers();

      let successCount = 0;

      // Calculate match score for each freelancer
      for (const freelancer of freelancers) {
        const score = await this.calculateMatchScore(freelancer.id, projectId);
        if (score) successCount++;
      }

      return successCount;
    } catch (error) {
      console.error('Error in calculateMatchesForProject:', error);
      return 0;
    }
  }

  /**
   * Bulk calculate matches for new freelancer
   */
  static async calculateMatchesForFreelancer(freelancerId: string): Promise<number> {
    try {
      // Get all open projects
      const projects = await this.getAllOpenProjects();

      let successCount = 0;

      // Calculate match score for each project
      for (const project of projects) {
        const score = await this.calculateMatchScore(freelancerId, project.id);
        if (score) successCount++;
      }

      return successCount;
    } catch (error) {
      console.error('Error in calculateMatchesForFreelancer:', error);
      return 0;
    }
  }

  /**
   * Get top matches for a job
   */
  static async getTopMatchesForJob(
    projectId: string,
    limit: number = 5
  ): Promise<JobMatchingScore[]> {
    try {
      const { data, error } = await supabase
        .from('job_matching_scores')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('overall_match_score', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching top matches:', error);
        return [];
      }

      return data as JobMatchingScore[];
    } catch (error) {
      console.error('Error in getTopMatchesForJob:', error);
      return [];
    }
  }

  /**
   * Get match score between specific freelancer and project
   */
  static async getMatchScore(
    freelancerId: string,
    projectId: string
  ): Promise<JobMatchingScore | null> {
    try {
      const { data, error } = await supabase
        .from('job_matching_scores')
        .select('*')
        .eq('freelancer_id', freelancerId)
        .eq('project_id', projectId)
        .single();

      if (error?.code === 'PGRST116') {
        // Not found - calculate it
        return await this.calculateMatchScore(freelancerId, projectId);
      }

      if (error) {
        console.error('Error fetching match score:', error);
        return null;
      }

      return data as JobMatchingScore;
    } catch (error) {
      console.error('Error in getMatchScore:', error);
      return null;
    }
  }

  /**
   * Matching algorithm helper methods
   */

  private static calculateSkillsMatch(
    freelancerSkills: string[],
    requiredSkills: string[]
  ): number {
    if (requiredSkills.length === 0) return 100;

    const normalizedFreelancerSkills = freelancerSkills.map(s => s.toLowerCase());
    const normalizedRequiredSkills = requiredSkills.map(s => s.toLowerCase());

    const matchedSkills = normalizedRequiredSkills.filter(skill =>
      normalizedFreelancerSkills.some(fs => fs.includes(skill) || skill.includes(fs))
    );

    return (matchedSkills.length / normalizedRequiredSkills.length) * 100;
  }

  private static calculateExperienceMatch(
    freelancerLevel: string,
    requiredLevel: string
  ): number {
    const levelOrder: Record<string, number> = {
      beginner: 1,
      intermediate: 2,
      expert: 3,
    };

    const freelancerScore = levelOrder[freelancerLevel?.toLowerCase() || 'beginner'] || 1;
    const requiredScore = levelOrder[requiredLevel?.toLowerCase() || 'intermediate'] || 2;

    if (freelancerScore >= requiredScore) {
      return 100;
    } else if (freelancerScore === requiredScore - 1) {
      return 75;
    }

    return 50;
  }

  private static calculateBudgetMatch(
    freelancerRate: number,
    budgetMin: number,
    budgetMax: number,
    budgetType: string
  ): number {
    if (budgetType === 'fixed' || !freelancerRate) {
      return 80; // Good match for fixed budget projects
    }

    if (freelancerRate <= budgetMax && freelancerRate >= budgetMin) {
      return 100; // Perfect rate match
    } else if (freelancerRate <= budgetMax * 1.2) {
      return 75; // Slightly above max but acceptable
    }

    return 50; // Significant rate difference
  }

  private static calculateAvailabilityMatch(
    freelancerAvailability: string,
    projectDuration: string
  ): number {
    const durationMonths = this.parseDuration(projectDuration);

    if (freelancerAvailability === 'available') {
      return 100;
    } else if (freelancerAvailability === 'partially_available') {
      return durationMonths <= 2 ? 85 : 60;
    } else if (freelancerAvailability === 'unavailable') {
      return 20;
    }

    return 75;
  }

  private static calculatePastSuccessMatch(
    successRate: number,
    averageRating: number,
    completedProjects: number
  ): number {
    // Weighted combination of success metrics
    const successScore = (successRate || 0) / 100; // 0-1
    const ratingScore = (averageRating || 0) / 5; // 0-1
    const experienceBonus = Math.min(completedProjects / 10, 1); // 0-1, caps at 10 projects

    return (successScore * 0.5 + ratingScore * 0.35 + experienceBonus * 0.15) * 100;
  }

  private static parseDuration(durationStr: string): number {
    // Parse duration string like "2 weeks" or "3 months"
    const match = durationStr?.match(/(\d+)\s*(week|month|day)/i);
    if (!match) return 1;

    const value = parseInt(match[1]);
    const unit = match[2]?.toLowerCase();

    switch (unit) {
      case 'week':
        return value / 4;
      case 'month':
        return value;
      case 'day':
        return value / 30;
      default:
        return 1;
    }
  }

  private static getSkillsBreakdown(
    freelancerSkills: string[],
    requiredSkills: string[]
  ): { required: string[]; matched: string[]; missing: string[] } {
    const normalizedFreelancerSkills = freelancerSkills.map(s => s.toLowerCase());

    const matched = requiredSkills.filter(skill =>
      normalizedFreelancerSkills.some(fs =>
        fs.includes(skill.toLowerCase()) || skill.toLowerCase().includes(fs)
      )
    );

    const missing = requiredSkills.filter(skill => !matched.includes(skill));

    return {
      required: requiredSkills,
      matched,
      missing,
    };
  }

  private static generateRecommendationReason(
    skillsMatch: number,
    experienceMatch: number,
    budgetMatch: number,
    availabilityMatch: number,
    pastSuccessMatch: number,
    freelancer: any,
    project: any
  ): string {
    const strengths: string[] = [];

    if (skillsMatch >= 80) strengths.push('Strong skill match');
    if (experienceMatch === 100) strengths.push('Perfect experience level');
    if (budgetMatch >= 80) strengths.push('Competitive rate');
    if (availabilityMatch >= 80) strengths.push('Excellent availability');
    if (pastSuccessMatch >= 80) strengths.push('Proven track record');

    if (strengths.length === 0) {
      return 'Potential candidate for this project';
    }

    return `Great match! ${strengths.join(', ')}`;
  }

  /**
   * Helper methods to fetch data
   */

  private static async getFreelancerProfile(freelancerId: string): Promise<any> {
    const { data } = await supabase
      .from('freelance_profiles')
      .select(`
        *,
        stats:freelance_stats(*)
      `)
      .eq('user_id', freelancerId)
      .single();

    return data;
  }

  private static async getProjectDetails(projectId: string): Promise<any> {
    const { data } = await supabase
      .from('freelance_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    return data;
  }

  private static async getAllActiveFreelancers(): Promise<any[]> {
    const { data } = await supabase
      .from('freelance_profiles')
      .select('*')
      .eq('is_available', true)
      .limit(1000);

    return data || [];
  }

  private static async getAllOpenProjects(): Promise<any[]> {
    const { data } = await supabase
      .from('freelance_projects')
      .select('*')
      .eq('status', 'open')
      .limit(1000);

    return data || [];
  }
}

export default FreelanceJobMatchingService;

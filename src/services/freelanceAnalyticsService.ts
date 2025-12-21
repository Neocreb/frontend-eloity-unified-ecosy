import { supabase } from '@/lib/supabase/client';

export interface FreelanceAnalytics {
  id: string;
  user_id: string;
  date: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  total_earnings: number;
  projects_posted: number;
  projects_completed: number;
  projects_in_progress: number;
  proposals_sent: number;
  proposals_accepted: number;
  acceptance_rate: number;
  average_project_value: number;
  average_rating: number;
  client_reviews_count: number;
  repeat_client_percentage: number;
  completion_rate: number;
  on_time_percentage: number;
  budget_adherence_percentage: number;
  projected_monthly_earnings: number;
  trends_data: {
    previous_period_earnings: number;
    growth_percentage: number;
    trending_up: boolean;
  };
  created_at: string;
  updated_at: string;
}

/**
 * FreelanceAnalyticsService
 * Provides comprehensive analytics for freelance performance
 * Tracks earnings, completion rates, ratings, and projections
 */

export class FreelanceAnalyticsService {
  /**
   * Record analytics for a user
   */
  static async recordAnalytics(
    userId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily',
    date: Date = new Date()
  ): Promise<FreelanceAnalytics | null> {
    try {
      // Calculate all metrics for the period
      const metrics = await this.calculateMetrics(userId, period, date);
      if (!metrics) return null;

      // Save to database
      const { data, error } = await supabase
        .from('freelance_analytics')
        .upsert(
          {
            user_id: userId,
            date: date.toISOString(),
            period,
            ...metrics,
          },
          { onConflict: 'user_id,date,period' }
        )
        .select()
        .single();

      if (error) {
        console.error('Error recording analytics:', error);
        return null;
      }

      return data as FreelanceAnalytics;
    } catch (error) {
      console.error('Error in recordAnalytics:', error);
      return null;
    }
  }

  /**
   * Get analytics for a specific period
   */
  static async getAnalytics(
    userId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    date?: Date
  ): Promise<FreelanceAnalytics | null> {
    try {
      const queryDate = date ? new Date(date).toISOString() : new Date().toISOString();

      const { data, error } = await supabase
        .from('freelance_analytics')
        .select('*')
        .eq('user_id', userId)
        .eq('period', period)
        .eq('date', queryDate)
        .single();

      if (error?.code === 'PGRST116') {
        // Not found - calculate it
        return await this.recordAnalytics(userId, period, date);
      }

      if (error) {
        console.error('Error fetching analytics:', error);
        return null;
      }

      return data as FreelanceAnalytics;
    } catch (error) {
      console.error('Error in getAnalytics:', error);
      return null;
    }
  }

  /**
   * Get earnings trend for a user
   */
  static async getEarningsTrend(
    userId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly',
    months: number = 12
  ): Promise<FreelanceAnalytics[]> {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const { data, error } = await supabase
        .from('freelance_analytics')
        .select('*')
        .eq('user_id', userId)
        .eq('period', period)
        .gte('date', startDate.toISOString())
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching earnings trend:', error);
        return [];
      }

      return data as FreelanceAnalytics[];
    } catch (error) {
      console.error('Error in getEarningsTrend:', error);
      return [];
    }
  }

  /**
   * Get current month analytics
   */
  static async getCurrentMonthAnalytics(userId: string): Promise<FreelanceAnalytics | null> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return this.getAnalytics(userId, 'monthly', startOfMonth);
  }

  /**
   * Get current year analytics
   */
  static async getCurrentYearAnalytics(userId: string): Promise<FreelanceAnalytics | null> {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    return this.getAnalytics(userId, 'yearly', startOfYear);
  }

  /**
   * Get all-time earnings
   */
  static async getAllTimeEarnings(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('freelance_analytics')
        .select('total_earnings')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching all-time earnings:', error);
        return 0;
      }

      if (!data || data.length === 0) return 0;

      return data.reduce((sum: number, record: any) => sum + (record.total_earnings || 0), 0);
    } catch (error) {
      console.error('Error in getAllTimeEarnings:', error);
      return 0;
    }
  }

  /**
   * Get projected monthly earnings
   */
  static async getProjectedMonthlyEarnings(userId: string): Promise<number> {
    try {
      const analytics = await this.getCurrentMonthAnalytics(userId);
      return analytics?.projected_monthly_earnings || 0;
    } catch (error) {
      console.error('Error in getProjectedMonthlyEarnings:', error);
      return 0;
    }
  }

  /**
   * Get performance summary
   */
  static async getPerformanceSummary(userId: string): Promise<{
    completion_rate: number;
    on_time_percentage: number;
    average_rating: number;
    client_reviews_count: number;
    repeat_client_percentage: number;
  } | null> {
    try {
      const currentMonth = await this.getCurrentMonthAnalytics(userId);
      if (!currentMonth) return null;

      return {
        completion_rate: currentMonth.completion_rate,
        on_time_percentage: currentMonth.on_time_percentage,
        average_rating: currentMonth.average_rating,
        client_reviews_count: currentMonth.client_reviews_count,
        repeat_client_percentage: currentMonth.repeat_client_percentage,
      };
    } catch (error) {
      console.error('Error in getPerformanceSummary:', error);
      return null;
    }
  }

  /**
   * Get earnings comparison (current vs previous period)
   */
  static async getEarningsComparison(
    userId: string,
    period: 'weekly' | 'monthly' | 'yearly' = 'monthly'
  ): Promise<{
    current_earnings: number;
    previous_earnings: number;
    growth_percentage: number;
    trending_up: boolean;
  } | null> {
    try {
      const current = await this.getAnalytics(userId, period);
      if (!current) return null;

      const previousDate = this.getPreviousPeriodDate(current.date, period);
      const previous = await this.getAnalytics(userId, period, previousDate);

      const currentEarnings = current.total_earnings || 0;
      const previousEarnings = previous?.total_earnings || 0;

      const growth =
        previousEarnings > 0
          ? ((currentEarnings - previousEarnings) / previousEarnings) * 100
          : 0;

      return {
        current_earnings: currentEarnings,
        previous_earnings: previousEarnings,
        growth_percentage: Math.round(growth * 100) / 100,
        trending_up: currentEarnings > previousEarnings,
      };
    } catch (error) {
      console.error('Error in getEarningsComparison:', error);
      return null;
    }
  }

  /**
   * Calculate metric s for analytics
   */
  private static async calculateMetrics(
    userId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    date: Date
  ): Promise<Omit<FreelanceAnalytics, 'id' | 'user_id' | 'date' | 'period' | 'created_at' | 'updated_at'> | null> {
    try {
      const dateRange = this.getDateRange(period, date);

      // Get projects data
      const projects = await this.getProjectsInRange(userId, dateRange.start, dateRange.end);
      const completedProjects = projects.filter(p => p.status === 'completed').length;
      const inProgressProjects = projects.filter(p => p.status === 'in_progress').length;
      const totalEarnings = projects.reduce((sum: number, p: any) => sum + (p.budget || 0), 0);

      // Get proposals data
      const proposals = await this.getProposalsInRange(userId, dateRange.start, dateRange.end);
      const acceptedProposals = proposals.filter(p => p.status === 'accepted').length;
      const proposalsSent = proposals.length;
      const acceptanceRate = proposalsSent > 0 ? (acceptedProposals / proposalsSent) * 100 : 0;

      // Get reviews and ratings
      const { averageRating, reviewCount } = await this.getAverageRating(userId);

      // Get project metrics
      const completionRate = projects.length > 0 ? (completedProjects / projects.length) * 100 : 0;
      const onTimePercentage = await this.getOnTimePercentage(userId, dateRange.start, dateRange.end);
      const budgetAdherencePercentage = await this.getBudgetAdherence(userId, dateRange.start, dateRange.end);
      const repeatClientPercentage = await this.getRepeatClientPercentage(userId, dateRange.start, dateRange.end);

      // Calculate averages
      const averageProjectValue = projects.length > 0 ? totalEarnings / projects.length : 0;

      // Get previous period earnings for projection
      const previousDateRange = this.getPreviousDateRange(period, date);
      const previousProjects = await this.getProjectsInRange(userId, previousDateRange.start, previousDateRange.end);
      const previousEarnings = previousProjects.reduce((sum: number, p: any) => sum + (p.budget || 0), 0);

      // Project monthly earnings
      let projectedMonthlyEarnings = totalEarnings;
      if (period === 'daily') {
        projectedMonthlyEarnings = totalEarnings * 30;
      } else if (period === 'weekly') {
        projectedMonthlyEarnings = totalEarnings * 4.33;
      }

      return {
        total_earnings: totalEarnings,
        projects_posted: projects.filter(p => p.visibility === 'public').length,
        projects_completed: completedProjects,
        projects_in_progress: inProgressProjects,
        proposals_sent: proposalsSent,
        proposals_accepted: acceptedProposals,
        acceptance_rate: Math.round(acceptanceRate * 100) / 100,
        average_project_value: Math.round(averageProjectValue * 100) / 100,
        average_rating: Math.round(averageRating * 100) / 100,
        client_reviews_count: reviewCount,
        repeat_client_percentage: Math.round(repeatClientPercentage * 100) / 100,
        completion_rate: Math.round(completionRate * 100) / 100,
        on_time_percentage: Math.round(onTimePercentage * 100) / 100,
        budget_adherence_percentage: Math.round(budgetAdherencePercentage * 100) / 100,
        projected_monthly_earnings: Math.round(projectedMonthlyEarnings * 100) / 100,
        trends_data: {
          previous_period_earnings: previousEarnings,
          growth_percentage: previousEarnings > 0 ? ((totalEarnings - previousEarnings) / previousEarnings) * 100 : 0,
          trending_up: totalEarnings > previousEarnings,
        },
      };
    } catch (error) {
      console.error('Error calculating metrics:', error);
      return null;
    }
  }

  /**
   * Helper methods
   */

  private static getDateRange(
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    date: Date
  ): { start: string; end: string } {
    const start = new Date(date);
    const end = new Date(date);

    switch (period) {
      case 'daily':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        start.setDate(date.getDate() - date.getDay());
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'monthly':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'yearly':
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(11, 31);
        end.setHours(23, 59, 59, 999);
        break;
    }

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  }

  private static getPreviousDateRange(
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    date: Date
  ): { start: string; end: string } {
    const previous = new Date(date);

    switch (period) {
      case 'daily':
        previous.setDate(previous.getDate() - 1);
        break;
      case 'weekly':
        previous.setDate(previous.getDate() - 7);
        break;
      case 'monthly':
        previous.setMonth(previous.getMonth() - 1);
        break;
      case 'yearly':
        previous.setFullYear(previous.getFullYear() - 1);
        break;
    }

    return this.getDateRange(period, previous);
  }

  private static getPreviousPeriodDate(
    date: string,
    period: 'weekly' | 'monthly' | 'yearly'
  ): Date {
    const d = new Date(date);

    switch (period) {
      case 'weekly':
        d.setDate(d.getDate() - 7);
        break;
      case 'monthly':
        d.setMonth(d.getMonth() - 1);
        break;
      case 'yearly':
        d.setFullYear(d.getFullYear() - 1);
        break;
    }

    return d;
  }

  private static async getProjectsInRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<any[]> {
    const { data } = await supabase
      .from('freelance_projects')
      .select('*')
      .eq('client_id', userId)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    return data || [];
  }

  private static async getProposalsInRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<any[]> {
    const { data } = await supabase
      .from('freelance_proposals')
      .select('*')
      .eq('freelancer_id', userId)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    return data || [];
  }

  private static async getAverageRating(userId: string): Promise<{ averageRating: number; reviewCount: number }> {
    const { data } = await supabase
      .from('freelance_reviews')
      .select('rating')
      .eq('freelancer_id', userId);

    if (!data || data.length === 0) {
      return { averageRating: 0, reviewCount: 0 };
    }

    const average = data.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / data.length;
    return { averageRating: average, reviewCount: data.length };
  }

  private static async getOnTimePercentage(userId: string, startDate: string, endDate: string): Promise<number> {
    const { data } = await supabase
      .from('freelance_contracts')
      .select('*')
      .eq('freelancer_id', userId)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (!data || data.length === 0) return 100;

    const onTime = data.filter((c: any) => new Date(c.end_date) >= new Date(c.updated_at)).length;
    return (onTime / data.length) * 100;
  }

  private static async getBudgetAdherence(userId: string, startDate: string, endDate: string): Promise<number> {
    const { data } = await supabase
      .from('freelance_contracts')
      .select('*')
      .eq('freelancer_id', userId)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (!data || data.length === 0) return 100;

    const adherent = data.filter((c: any) => !c.budget_overrun).length;
    return (adherent / data.length) * 100;
  }

  private static async getRepeatClientPercentage(userId: string, startDate: string, endDate: string): Promise<number> {
    const { data } = await supabase
      .from('freelance_projects')
      .select('client_id')
      .eq('freelancer_id', userId)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (!data || data.length === 0) return 0;

    const clientCounts = data.reduce((acc: any, p: any) => {
      acc[p.client_id] = (acc[p.client_id] || 0) + 1;
      return acc;
    }, {});

    const repeatClients = Object.values(clientCounts).filter((count: any) => count > 1).length;
    return (repeatClients / Object.keys(clientCounts).length) * 100;
  }
}

export default FreelanceAnalyticsService;

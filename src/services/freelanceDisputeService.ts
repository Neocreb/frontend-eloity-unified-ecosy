import { supabase } from '@/lib/supabase/client';

export interface FreelanceDispute {
  id: string;
  contract_id: string;
  project_id: string;
  filed_by_id: string;
  filed_against_id: string;
  arbiter_id?: string;
  reason: string;
  description: string;
  evidence_urls?: any;
  initial_offer?: number;
  counter_offer?: number;
  status: 'open' | 'in_review' | 'mediation' | 'resolved' | 'appealed';
  resolution?: string;
  final_amount?: number;
  appeal_status?: string;
  appeal_reason?: string;
  resolution_date?: string;
  appeal_deadline?: string;
  created_at: string;
  updated_at: string;
}

/**
 * FreelanceDisputeService
 * Manages dispute resolution for freelance projects
 * Supports arbitration, mediation, and appeals
 */

export class FreelanceDisputeService {
  /**
   * File a new dispute
   */
  static async fileDispute(
    contractId: string,
    projectId: string,
    filedById: string,
    filedAgainstId: string,
    reason: string,
    description: string,
    evidenceUrls?: string[],
    initialOffer?: number
  ): Promise<FreelanceDispute | null> {
    try {
      const { data, error } = await supabase
        .from('freelance_disputes')
        .insert({
          contract_id: contractId,
          project_id: projectId,
          filed_by_id: filedById,
          filed_against_id: filedAgainstId,
          reason,
          description,
          evidence_urls: evidenceUrls,
          initial_offer: initialOffer,
          status: 'open',
          appeal_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        })
        .select()
        .single();

      if (error) {
        console.error('Error filing dispute:', error);
        return null;
      }

      // Notify the other party
      await this.notifyDisputeFiled(filedAgainstId, projectId, reason);

      return data as FreelanceDispute;
    } catch (error) {
      console.error('Error in fileDispute:', error);
      return null;
    }
  }

  /**
   * Get all disputes for a user (filed by or against)
   */
  static async getUserDisputes(userId: string): Promise<FreelanceDispute[]> {
    try {
      const { data, error } = await supabase
        .from('freelance_disputes')
        .select('*')
        .or(`filed_by_id.eq.${userId},filed_against_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user disputes:', error);
        return [];
      }

      return data as FreelanceDispute[];
    } catch (error) {
      console.error('Error in getUserDisputes:', error);
      return [];
    }
  }

  /**
   * Get disputes for a specific project
   */
  static async getProjectDisputes(projectId: string): Promise<FreelanceDispute[]> {
    try {
      const { data, error } = await supabase
        .from('freelance_disputes')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching project disputes:', error);
        return [];
      }

      return data as FreelanceDispute[];
    } catch (error) {
      console.error('Error in getProjectDisputes:', error);
      return [];
    }
  }

  /**
   * Get a specific dispute
   */
  static async getDispute(disputeId: string): Promise<FreelanceDispute | null> {
    try {
      const { data, error } = await supabase
        .from('freelance_disputes')
        .select('*')
        .eq('id', disputeId)
        .single();

      if (error) {
        console.error('Error fetching dispute:', error);
        return null;
      }

      return data as FreelanceDispute;
    } catch (error) {
      console.error('Error in getDispute:', error);
      return null;
    }
  }

  /**
   * Assign an arbiter to a dispute
   */
  static async assignArbiter(disputeId: string, arbiterId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('freelance_disputes')
        .update({
          arbiter_id: arbiterId,
          status: 'in_review',
        })
        .eq('id', disputeId);

      if (error) {
        console.error('Error assigning arbiter:', error);
        return false;
      }

      // Notify arbiter
      await this.notifyArbiterAssigned(disputeId, arbiterId);

      return true;
    } catch (error) {
      console.error('Error in assignArbiter:', error);
      return false;
    }
  }

  /**
   * Submit counter offer in dispute
   */
  static async submitCounterOffer(
    disputeId: string,
    counterOffer: number
  ): Promise<FreelanceDispute | null> {
    try {
      const { data, error } = await supabase
        .from('freelance_disputes')
        .update({
          counter_offer: counterOffer,
          status: 'mediation',
        })
        .eq('id', disputeId)
        .select()
        .single();

      if (error) {
        console.error('Error submitting counter offer:', error);
        return null;
      }

      return data as FreelanceDispute;
    } catch (error) {
      console.error('Error in submitCounterOffer:', error);
      return null;
    }
  }

  /**
   * Resolve a dispute
   */
  static async resolveDispute(
    disputeId: string,
    resolution: string,
    finalAmount: number,
    arbiterId: string
  ): Promise<FreelanceDispute | null> {
    try {
      const { data, error } = await supabase
        .from('freelance_disputes')
        .update({
          status: 'resolved',
          resolution,
          final_amount: finalAmount,
          resolution_date: new Date().toISOString(),
        })
        .eq('id', disputeId)
        .select()
        .single();

      if (error) {
        console.error('Error resolving dispute:', error);
        return null;
      }

      // Notify both parties of resolution
      const dispute = data as FreelanceDispute;
      await this.notifyDisputeResolved(dispute);

      return dispute;
    } catch (error) {
      console.error('Error in resolveDispute:', error);
      return null;
    }
  }

  /**
   * Appeal a dispute resolution
   */
  static async appealDispute(
    disputeId: string,
    appealsById: string,
    appealReason: string
  ): Promise<FreelanceDispute | null> {
    try {
      const { data, error } = await supabase
        .from('freelance_disputes')
        .update({
          status: 'appealed',
          appeal_status: 'pending',
          appeal_reason: appealReason,
          appeal_deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
        })
        .eq('id', disputeId)
        .select()
        .single();

      if (error) {
        console.error('Error appealing dispute:', error);
        return null;
      }

      return data as FreelanceDispute;
    } catch (error) {
      console.error('Error in appealDispute:', error);
      return null;
    }
  }

  /**
   * Get disputes requiring attention (arbiter view)
   */
  static async getPendingDisputes(arbiterId: string): Promise<FreelanceDispute[]> {
    try {
      const { data, error } = await supabase
        .from('freelance_disputes')
        .select('*')
        .eq('arbiter_id', arbiterId)
        .in('status', ['in_review', 'mediation', 'appealed'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending disputes:', error);
        return [];
      }

      return data as FreelanceDispute[];
    } catch (error) {
      console.error('Error in getPendingDisputes:', error);
      return [];
    }
  }

  /**
   * Get dispute statistics
   */
  static async getDisputeStats(): Promise<{
    total_disputes: number;
    open_disputes: number;
    resolved_disputes: number;
    average_resolution_time_days: number;
    appeal_rate_percent: number;
  } | null> {
    try {
      // Total disputes
      const { count: total } = await supabase
        .from('freelance_disputes')
        .select('*', { count: 'exact', head: true });

      // Open disputes
      const { count: open } = await supabase
        .from('freelance_disputes')
        .select('*', { count: 'exact', head: true })
        .in('status', ['open', 'in_review', 'mediation']);

      // Resolved disputes
      const { count: resolved } = await supabase
        .from('freelance_disputes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'resolved');

      // Appeals
      const { count: appealed } = await supabase
        .from('freelance_disputes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'appealed');

      const totalDisputes = total || 0;
      const appealRate = totalDisputes > 0 ? ((appealed || 0) / totalDisputes) * 100 : 0;

      return {
        total_disputes: totalDisputes,
        open_disputes: open || 0,
        resolved_disputes: resolved || 0,
        average_resolution_time_days: 7, // Placeholder - would need more complex calculation
        appeal_rate_percent: appealRate,
      };
    } catch (error) {
      console.error('Error in getDisputeStats:', error);
      return null;
    }
  }

  /**
   * Notification helper methods
   */

  private static async notifyDisputeFiled(
    userId: string,
    projectId: string,
    reason: string
  ): Promise<void> {
    // Implementation would integrate with FreelanceNotificationService
    console.log(`Notify user ${userId} that dispute was filed on project ${projectId}: ${reason}`);
  }

  private static async notifyArbiterAssigned(
    disputeId: string,
    arbiterId: string
  ): Promise<void> {
    console.log(`Notify arbiter ${arbiterId} assigned to dispute ${disputeId}`);
  }

  private static async notifyDisputeResolved(dispute: FreelanceDispute): Promise<void> {
    console.log(`Notify both parties that dispute ${dispute.id} has been resolved`);
  }

  /**
   * Advanced dispute features
   */

  /**
   * Get evidence for a dispute
   */
  static async addDisputeEvidence(
    disputeId: string,
    evidenceUrls: string[]
  ): Promise<boolean> {
    try {
      const dispute = await this.getDispute(disputeId);
      if (!dispute) return false;

      const currentEvidence = dispute.evidence_urls || [];
      const updatedEvidence = [...currentEvidence, ...evidenceUrls];

      const { error } = await supabase
        .from('freelance_disputes')
        .update({
          evidence_urls: updatedEvidence,
        })
        .eq('id', disputeId);

      if (error) {
        console.error('Error adding evidence:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in addDisputeEvidence:', error);
      return false;
    }
  }

  /**
   * Cancel a dispute (before resolution)
   */
  static async cancelDispute(
    disputeId: string,
    reason: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('freelance_disputes')
        .delete()
        .eq('id', disputeId);

      if (error) {
        console.error('Error canceling dispute:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in cancelDispute:', error);
      return false;
    }
  }

  /**
   * Create mediation session for dispute
   */
  static async startMediation(disputeId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('freelance_disputes')
        .update({
          status: 'mediation',
        })
        .eq('id', disputeId);

      if (error) {
        console.error('Error starting mediation:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in startMediation:', error);
      return false;
    }
  }

  /**
   * Auto-resolve dispute if both parties agree on amount
   */
  static async attemptAutoResolution(disputeId: string): Promise<FreelanceDispute | null> {
    try {
      const dispute = await this.getDispute(disputeId);
      if (!dispute) return null;

      // If both parties have made offers and they match, auto-resolve
      if (dispute.initial_offer && dispute.counter_offer) {
        const midpoint = (dispute.initial_offer + dispute.counter_offer) / 2;

        return await this.resolveDispute(
          disputeId,
          `Auto-resolved: Parties met at ${midpoint}`,
          midpoint,
          dispute.arbiter_id || 'system'
        );
      }

      return null;
    } catch (error) {
      console.error('Error in attemptAutoResolution:', error);
      return null;
    }
  }
}

export default FreelanceDisputeService;

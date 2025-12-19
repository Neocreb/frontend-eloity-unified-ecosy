import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";

export interface Partnership {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  commission_rate: number;
  is_featured: boolean;
  status: "active" | "inactive" | "archived";
}

export interface UserPartnership {
  id: string;
  user_id: string;
  partnership_id: string;
  partnership_name?: string;
  partnership_icon?: string;
  partnership_category?: string;
  status: "active" | "pending" | "rejected" | "paused";
  commission_rate: number;
  total_earned: number;
  total_referrals: number;
  successful_referrals: number;
  applied_at: string;
  approval_date?: string;
  rejection_reason?: string;
}

export interface PartnershipStats {
  totalPartnerships: number;
  activePartnerships: number;
  totalEarned: number;
  totalReferrals: number;
}

interface UsePartnershipStatsReturn {
  availablePartnerships: Partnership[];
  userPartnerships: UserPartnership[];
  stats: PartnershipStats | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  applyForPartnership: (partnershipId: string) => Promise<boolean>;
  getPartnershipsByStatus: (status: string) => UserPartnership[];
}

export function usePartnershipStats(): UsePartnershipStatsReturn {
  const { user } = useAuth();
  const [availablePartnerships, setAvailablePartnerships] = useState<Partnership[]>([]);
  const [userPartnerships, setUserPartnerships] = useState<UserPartnership[]>([]);
  const [stats, setStats] = useState<PartnershipStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch available partnerships
      const { data: availableData, error: availableError } = await supabase
        .from("available_partnerships")
        .select("*")
        .eq("status", "active")
        .order("is_featured", { ascending: false });

      if (availableError) {
        console.warn("Available partnerships table not found or inaccessible:", availableError.message);
        setAvailablePartnerships([]);
      } else {
        setAvailablePartnerships((availableData || []) as Partnership[]);
      }

      // Fetch user's partnerships with partner details
      const { data: userPartnershipsData, error: userPartnershipsError } = await supabase
        .from("user_partnerships")
        .select(`
          *,
          partnership:available_partnerships(name, icon, category)
        `)
        .eq("user_id", user.id)
        .order("applied_at", { ascending: false });

      if (userPartnershipsError) {
        console.warn("User partnerships table not found or inaccessible:", userPartnershipsError.message);
        setUserPartnerships([]);
      } else {
        // Transform user partnerships to include partnership details
        const transformedPartnerships = (userPartnershipsData || []).map((up: any) => ({
          ...up,
          partnership_name: up.partnership?.name,
          partnership_icon: up.partnership?.icon,
          partnership_category: up.partnership?.category,
        })) as UserPartnership[];

        setUserPartnerships(transformedPartnerships);
      }

      // Fetch stats
      const { data: statsData, error: statsError } = await supabase.rpc(
        "get_user_partnership_stats",
        { p_user_id: user.id }
      );

      if (statsError) {
        console.warn("Partnership stats RPC not found or inaccessible:", statsError.message);
        setStats(null);
      } else if (statsData && statsData.length > 0) {
        setStats({
          totalPartnerships: statsData[0].total_partnerships || 0,
          activePartnerships: statsData[0].active_partnerships || 0,
          totalEarned: parseFloat(statsData[0].total_earned || 0),
          totalReferrals: statsData[0].total_referrals || 0,
        });
      }

      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch partnership data";
      setError(err instanceof Error ? err : new Error(errorMessage));
      console.error("Error fetching partnership data:", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const applyForPartnership = async (partnershipId: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      // Check if already applied
      const { data: existing } = await supabase
        .from("user_partnerships")
        .select("id")
        .eq("user_id", user.id)
        .eq("partnership_id", partnershipId)
        .single();

      if (existing) {
        setError(new Error("You've already applied for this partnership"));
        return false;
      }

      // Get partnership details for commission rate
      const partnership = availablePartnerships.find((p) => p.id === partnershipId);
      if (!partnership) return false;

      const { error } = await supabase.from("user_partnerships").insert([
        {
          user_id: user.id,
          partnership_id: partnershipId,
          status: "pending",
          commission_rate: partnership.commission_rate,
          applied_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      await fetchData();
      return true;
    } catch (err) {
      console.error("Error applying for partnership:", err);
      setError(err instanceof Error ? err : new Error("Failed to apply for partnership"));
      return false;
    }
  };

  const getPartnershipsByStatus = (status: string): UserPartnership[] => {
    return userPartnerships.filter((p) => p.status === status);
  };

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  return {
    availablePartnerships,
    userPartnerships,
    stats,
    isLoading,
    error,
    refresh: fetchData,
    applyForPartnership,
    getPartnershipsByStatus,
  };
}

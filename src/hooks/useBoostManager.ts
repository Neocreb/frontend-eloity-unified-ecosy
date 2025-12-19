import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";

export interface BoostPackage {
  id: string;
  name: string;
  icon: string;
  price: number;
  duration_days: number;
  estimated_reach: string;
  features: string[];
  is_popular: boolean;
  tier_level: number;
}

export interface UserBoost {
  id: string;
  user_id: string;
  boost_package_id: string;
  boost_name: string;
  status: "active" | "paused" | "completed" | "cancelled";
  price_paid: number;
  start_date: string;
  end_date: string;
  content_type?: string;
  content_id?: string;
  reach_achieved: number;
  engagement_achieved: number;
  analytics: Record<string, any>;
}

export interface BoostStats {
  activeBoostsCount: number;
  totalSpent: number;
  totalReach: number;
  totalEngagement: number;
}

interface UseBoostManagerReturn {
  packages: BoostPackage[];
  activeBoosts: UserBoost[];
  stats: BoostStats | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  createBoost: (packageId: string, contentId?: string) => Promise<UserBoost | null>;
  updateBoost: (boostId: string, updates: Partial<UserBoost>) => Promise<boolean>;
  cancelBoost: (boostId: string) => Promise<boolean>;
}

export function useBoostManager(): UseBoostManagerReturn {
  const { user } = useAuth();
  const [packages, setPackages] = useState<BoostPackage[]>([]);
  const [activeBoosts, setActiveBoosts] = useState<UserBoost[]>([]);
  const [stats, setStats] = useState<BoostStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch boost packages
      const { data: packagesData, error: packagesError } = await supabase
        .from("boost_packages")
        .select("*")
        .order("tier_level", { ascending: true });

      if (packagesError) {
        console.warn("Boost packages table not found or inaccessible:", packagesError.message);
        setPackages([]);
      } else {
        setPackages((packagesData || []) as BoostPackage[]);
      }

      // Fetch active boosts for user
      const { data: boostsData, error: boostsError } = await supabase
        .from("user_boosts")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["active", "paused"])
        .order("created_at", { ascending: false });

      if (boostsError) {
        console.warn("User boosts table not found or inaccessible:", boostsError.message);
        setActiveBoosts([]);
      } else {
        setActiveBoosts((boostsData || []) as UserBoost[]);
      }

      // Fetch stats
      const { data: statsData, error: statsError } = await supabase.rpc(
        "get_user_boost_stats",
        { p_user_id: user.id }
      );

      if (statsError) {
        console.warn("Boost stats RPC not found or inaccessible:", statsError.message);
        setStats(null);
      } else if (statsData && statsData.length > 0) {
        setStats({
          activeBoostsCount: statsData[0].active_boosts_count || 0,
          totalSpent: parseFloat(statsData[0].total_spent || 0),
          totalReach: parseInt(statsData[0].total_reach || 0),
          totalEngagement: parseInt(statsData[0].total_engagement || 0),
        });
      }

      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch boost data";
      setError(err instanceof Error ? err : new Error(errorMessage));
      console.error("Error fetching boost data:", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const createBoost = async (packageId: string, contentId?: string): Promise<UserBoost | null> => {
    if (!user?.id) return null;

    try {
      const pkg = packages.find((p) => p.id === packageId);
      if (!pkg) return null;

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + pkg.duration_days);

      const { data, error } = await supabase
        .from("user_boosts")
        .insert([
          {
            user_id: user.id,
            boost_package_id: packageId,
            boost_name: pkg.name,
            status: "active",
            price_paid: pkg.price,
            start_date: new Date().toISOString(),
            end_date: endDate.toISOString(),
            content_id: contentId,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setActiveBoosts([...(data as UserBoost[]), ...activeBoosts]);
      await fetchData();
      return data as UserBoost;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create boost";
      console.error("Error creating boost:", errorMessage);
      return null;
    }
  };

  const updateBoost = async (boostId: string, updates: Partial<UserBoost>): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from("user_boosts")
        .update(updates)
        .eq("id", boostId)
        .eq("user_id", user.id);

      if (error) throw error;

      await fetchData();
      return true;
    } catch (err) {
      console.error("Error updating boost:", err);
      return false;
    }
  };

  const cancelBoost = async (boostId: string): Promise<boolean> => {
    return updateBoost(boostId, { status: "cancelled" });
  };

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  return {
    packages,
    activeBoosts,
    stats,
    isLoading,
    error,
    refresh: fetchData,
    createBoost,
    updateBoost,
    cancelBoost,
  };
}

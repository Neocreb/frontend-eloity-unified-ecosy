import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";

export interface Invitation {
  id: string;
  referrer_user_id: string;
  referred_email: string;
  referred_user_id?: string;
  invitation_code: string;
  status: "pending" | "accepted" | "converted" | "expired";
  reward_amount: number;
  reward_currency: string;
  conversion_date?: string;
  created_at: string;
}

export interface InvitationStats {
  totalInvites: number;
  convertedInvites: number;
  pendingInvites: number;
  totalReward: number;
  conversionRate: number;
}

interface UseInvitationStatsReturn {
  invitations: Invitation[];
  stats: InvitationStats | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  sendInvitation: (email: string) => Promise<string | null>;
  getInvitationsByStatus: (status: string) => Invitation[];
}

export function useInvitationStats(): UseInvitationStatsReturn {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [stats, setStats] = useState<InvitationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const generateInvitationCode = (): string => {
    return `INVITE${Date.now().toString(36).toUpperCase()}${Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()}`;
  };

  const fetchData = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch user's invitations
      const { data: invitationsData, error: invitationsError } = await supabase
        .from("user_invitations")
        .select("*")
        .eq("referrer_user_id", user.id)
        .order("created_at", { ascending: false });

      if (invitationsError) {
        console.warn("User invitations table not found or inaccessible:", invitationsError.message);
        setInvitations([]);
        setStats({
          totalInvites: 0,
          convertedInvites: 0,
          pendingInvites: 0,
          totalReward: 0,
          conversionRate: 0,
        });
      } else {
        const invites = (invitationsData || []) as Invitation[];
        setInvitations(invites);

        // Calculate stats
        const converted = invites.filter((i) => i.status === "converted").length;
        const pending = invites.filter((i) => i.status === "pending").length;
        const totalReward = invites
          .filter((i) => i.status === "converted")
          .reduce((sum, i) => sum + i.reward_amount, 0);

        const conversionRate =
          invites.length > 0 ? Math.round((converted / invites.length) * 100) : 0;

        setStats({
          totalInvites: invites.length,
          convertedInvites: converted,
          pendingInvites: pending,
          totalReward,
          conversionRate,
        });
      }

      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch invitation data";
      setError(err instanceof Error ? err : new Error(errorMessage));
      console.error("Error fetching invitation data:", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const sendInvitation = async (email: string): Promise<string | null> => {
    if (!user?.id) return null;

    try {
      // Validate email format
      if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        setError(new Error("Invalid email address"));
        return null;
      }

      const code = generateInvitationCode();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30); // 30 days expiry

      const { data, error } = await supabase
        .from("user_invitations")
        .insert([
          {
            referrer_user_id: user.id,
            referred_email: email,
            invitation_code: code,
            status: "pending",
            reward_amount: 50,
            reward_currency: "USD",
            expires_at: expiryDate.toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        if (error.message.includes("duplicate")) {
          setError(new Error("This email has already been invited"));
        } else {
          throw error;
        }
        return null;
      }

      await fetchData();
      return code;
    } catch (err) {
      console.error("Error sending invitation:", err);
      setError(err instanceof Error ? err : new Error("Failed to send invitation"));
      return null;
    }
  };

  const getInvitationsByStatus = (status: string): Invitation[] => {
    return invitations.filter((i) => i.status === status);
  };

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  return {
    invitations,
    stats,
    isLoading,
    error,
    refresh: fetchData,
    sendInvitation,
    getInvitationsByStatus,
  };
}

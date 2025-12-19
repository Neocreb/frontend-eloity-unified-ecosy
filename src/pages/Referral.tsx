import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Referral Page
 * 
 * This page serves as the unified entry point for the referral program.
 * It redirects to the Rewards page with the referrals tab active.
 * 
 * In the future, this can be expanded into a dedicated Growth Hub page
 * that consolidates Invite Friends, Referrals, and Partnerships features.
 */
export default function Referral() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the referrals tab in rewards page
    navigate("/app/rewards?tab=referrals", { replace: true });
  }, [navigate]);

  // Show loading state while redirect happens
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-600 to-blue-600 dark:from-purple-900 dark:to-blue-900 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-lg font-medium">Loading referral program...</p>
      </div>
    </div>
  );
}

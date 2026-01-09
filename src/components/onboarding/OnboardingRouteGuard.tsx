import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface OnboardingRouteGuardProps {
  children: React.ReactNode;
}

/**
 * OnboardingRouteGuard component handles route protection for /onboarding
 * 
 * Rules:
 * - Authenticated users are redirected to /app/feed (they've already completed onboarding)
 * - Unauthenticated users are allowed to access the onboarding flow
 * - Loading state is handled gracefully
 */
export const OnboardingRouteGuard: React.FC<OnboardingRouteGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading onboarding...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, redirect to feed (they shouldn't be onboarding)
  if (isAuthenticated) {
    return <Navigate to="/app/feed" replace />;
  }

  // User is not authenticated - allow access to onboarding flow
  return <>{children}</>;
};

export default OnboardingRouteGuard;

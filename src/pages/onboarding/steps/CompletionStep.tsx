import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Rocket,
  Users,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  MessageCircle,
  Check,
  ArrowRight,
  Heart,
  AlertCircle,
} from 'lucide-react';

const CompletionStep: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data } = useOnboarding();
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [showAuthError, setShowAuthError] = useState(false);

  // Check authentication and redirect
  useEffect(() => {
    if (authLoading) return; // Wait for auth to load

    // If not authenticated after onboarding, something went wrong
    if (!isAuthenticated || !user) {
      setShowAuthError(true);
      return;
    }

    // Start countdown and redirect to feed
    const timer = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          navigate('/app/feed', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, authLoading, isAuthenticated, user]);

  const handleNavigateToFeed = () => {
    navigate('/app/feed', { replace: true });
  };

  const nextSteps = [
    {
      icon: Users,
      title: 'Find Your Community',
      description: 'Connect with people who share your interests and passions',
      action: () => navigate('/app/friends'),
    },
    {
      icon: ShoppingBag,
      title: 'Explore Marketplace',
      description: 'Discover amazing products and great deals from trusted sellers',
      action: () => navigate('/app/marketplace'),
    },
    {
      icon: Sparkles,
      title: 'Discover Content',
      description: 'Browse content tailored to your interests in your personalized feed',
      action: () => navigate('/app/feed'),
    },
    {
      icon: TrendingUp,
      title: 'Start Earning',
      description: 'Begin earning rewards for your activities and referrals',
      action: () => navigate('/app/rewards'),
    },
    {
      icon: MessageCircle,
      title: 'Send Your First Message',
      description: 'Connect with friends and start conversations',
      action: () => navigate('/app/messages'),
    },
  ];

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Finalizing your account...</p>
        </div>
      </div>
    );
  }

  // Show error if authentication failed
  if (showAuthError || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
        </div>

        <div className="w-full max-w-2xl relative z-10">
          <div className="text-center mb-8">
            <div className="inline-block mb-6 p-6 rounded-full bg-red-500 bg-opacity-20 border-2 border-red-500">
              <AlertCircle className="text-red-400" size={48} />
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">Account Setup Error</h1>
            <p className="text-red-300 mb-4">
              We encountered an issue finalizing your account. Please try again or contact support.
            </p>
          </div>

          <Card className="bg-slate-800 border-slate-700 p-6 mb-6">
            <p className="text-slate-300 mb-4">
              Your account may have been created successfully, but we're having trouble confirming it.
              Please try logging in with your credentials.
            </p>
            <div className="flex flex-col md:flex-row gap-4">
              <Button
                onClick={() => navigate('/auth', { replace: true })}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3"
              >
                Try Logging In
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Reload Page
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-3xl relative z-10">
        {/* Celebration Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-block mb-6 p-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 shadow-2xl">
            <Rocket className="text-white" size={48} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Welcome to Eloity!
          </h1>
          <p className="text-xl text-purple-300 mb-2">
            {user?.name || 'Friend'}, your account is ready
          </p>
          <p className="text-slate-400 text-sm md:text-base">
            Your account has been successfully created and verified
          </p>
        </div>

        {/* Achievement Stats */}
        <Card className="bg-gradient-to-r from-purple-900 to-blue-900 border-purple-700 p-6 md:p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-300 mb-1">
                {data.selectedInterests?.length || 0}
              </div>
              <p className="text-sm text-purple-200">Interests Selected</p>
            </div>
            <div className="text-center border-l border-r border-purple-600 md:border-l md:border-r">
              <div className="text-3xl font-bold text-blue-300 mb-1">
                {data.kycCompleted ? '✓' : '○'}
              </div>
              <p className="text-sm text-blue-200">Identity {data.kycCompleted ? 'Verified' : 'Pending'}</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-300 mb-1">100%</div>
              <p className="text-sm text-pink-200">Profile Complete</p>
            </div>
            <div className="text-center border-l border-purple-600 md:border-l">
              <div className="text-3xl font-bold text-yellow-300 mb-1">0</div>
              <p className="text-sm text-yellow-200">Days with us</p>
            </div>
          </div>
        </Card>

        {/* What's Next Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Heart size={24} className="text-pink-500" />
            What's Next?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nextSteps.map((step, index) => (
              <Card
                key={index}
                className="bg-slate-800 border-slate-700 hover:border-purple-500 hover:bg-slate-750 transition-all cursor-pointer group overflow-hidden"
                onClick={step.action}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-3">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 group-hover:shadow-lg group-hover:shadow-purple-500/50 transition-all">
                      <step.icon className="text-white" size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
                        {step.title}
                      </h3>
                      <p className="text-sm text-slate-400 mt-1">{step.description}</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <ArrowRight
                      size={18}
                      className="text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Pro Tips */}
        <Card className="bg-slate-800 border-slate-700 p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Sparkles size={20} className="text-yellow-400" />
            Pro Tips
          </h3>
          <ul className="space-y-3 text-slate-300">
            <li className="flex items-start gap-3">
              <Check size={16} className="text-green-400 flex-shrink-0 mt-1" />
              <span>
                Complete your KYC verification to unlock higher transaction limits and exclusive features
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Check size={16} className="text-green-400 flex-shrink-0 mt-1" />
              <span>
                Update your profile picture and bio to help others get to know you better
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Check size={16} className="text-green-400 flex-shrink-0 mt-1" />
              <span>
                Check out our help center if you need any assistance getting started
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Check size={16} className="text-green-400 flex-shrink-0 mt-1" />
              <span>
                Invite your friends and earn referral bonuses for each successful signup
              </span>
            </li>
          </ul>
        </Card>

        {/* CTA Buttons */}
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Button
            onClick={handleNavigateToFeed}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-8 flex items-center justify-center gap-2"
          >
            Explore Feed <ArrowRight size={18} />
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/app/settings')}
            className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white font-semibold py-3 px-8"
          >
            Go to Settings
          </Button>
        </div>

        {/* Auto-redirect Info */}
        <div className="text-center mt-8 text-slate-400 text-sm">
          <p>Redirecting to your feed in {redirectCountdown}s...</p>
          <p className="text-xs mt-2">Click any button above to skip</p>
        </div>
      </div>

      {/* Confetti effect CSS animation */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes animationDelayPulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.6s ease-out;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default CompletionStep;

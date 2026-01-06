import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

// Import step components
import SignUpStep from './steps/SignUpStep';
import ProfileStep from './steps/ProfileStep';
import InterestsStep from './steps/InterestsStep';
import KYCStep from './steps/KYCStep';
import ConfirmationStep from './steps/ConfirmationStep';
import CompletionStep from './steps/CompletionStep';

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentStep,
    previousStep,
    nextStep,
    error,
    completionPercentage,
    canProceedToNextStep,
    getStepIndex,
    isLoading
  } = useOnboarding();

  const [isTransitioning, setIsTransitioning] = useState(false);

  const STEPS = ['signup', 'profile', 'interests', 'kyc', 'confirmation', 'complete'];
  const stepIndex = getStepIndex();
  const isLastStep = currentStep === 'complete';

  useEffect(() => {
    // If already complete, redirect to feed after 5 seconds (handled by CompletionStep)
    if (currentStep === 'complete') {
      const timer = setTimeout(() => {
        navigate('/app/feed');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, navigate]);

  const handlePrevious = async () => {
    setIsTransitioning(true);
    previousStep();
    setIsTransitioning(false);
  };

  const handleNext = async () => {
    if (!canProceedToNextStep()) {
      return;
    }

    setIsTransitioning(true);
    nextStep();
    setIsTransitioning(false);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'signup':
        return <SignUpStep />;
      case 'profile':
        return <ProfileStep />;
      case 'interests':
        return <InterestsStep />;
      case 'kyc':
        return <KYCStep />;
      case 'confirmation':
        return <ConfirmationStep />;
      case 'complete':
        return <CompletionStep />;
      default:
        return <SignUpStep />;
    }
  };

  const getStepLabel = (step: string) => {
    const labels: Record<string, string> = {
      signup: 'Create Account',
      profile: 'Profile',
      interests: 'Interests',
      kyc: 'Verification',
      confirmation: 'Confirm',
      complete: 'Complete',
    };
    return labels[step] || step;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-50 flex items-center justify-center p-4 py-8 md:py-12 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top right blob */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full opacity-40 blur-3xl"></div>

        {/* Bottom left blob */}
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-200 to-pink-200 rounded-full opacity-40 blur-3xl"></div>

        {/* Center accent */}
        <div className="absolute top-1/2 right-1/4 w-60 h-60 bg-gradient-to-bl from-indigo-100 to-blue-100 rounded-full opacity-30 blur-3xl"></div>

        {/* Decorative curved lines */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="curve-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(99, 102, 241, 0.08)" />
              <stop offset="100%" stopColor="rgba(139, 92, 246, 0.08)" />
            </linearGradient>
          </defs>
          {/* Curved lines */}
          <path d="M 0,100 Q 300,50 600,150 T 1200,100" stroke="url(#curve-gradient)" strokeWidth="2" fill="none" />
          <path d="M 0,200 Q 400,100 800,200 T 1600,150" stroke="url(#curve-gradient)" strokeWidth="1.5" fill="none" opacity="0.5" />
          <path d="M 0,300 Q 250,250 500,350 T 1000,300" stroke="url(#curve-gradient)" strokeWidth="1" fill="none" opacity="0.3" />
        </svg>

        {/* Small floating shapes */}
        <div className="absolute top-20 left-10 w-16 h-16 bg-gradient-to-br from-blue-300 to-indigo-300 rounded-3xl opacity-10 blur-2xl animate-pulse"></div>
        <div className="absolute top-1/3 right-20 w-20 h-20 bg-gradient-to-bl from-purple-300 to-pink-300 rounded-2xl opacity-10 blur-2xl" style={{ animation: 'float 6s ease-in-out infinite' }}></div>
        <div className="absolute bottom-1/4 left-1/4 w-24 h-24 bg-gradient-to-tr from-indigo-200 to-blue-200 rounded-full opacity-5 blur-3xl"></div>
      </div>
      <div className="w-full max-w-2xl relative z-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-block mb-4 p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl">
            <div className="text-4xl">✨</div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Welcome to Eloity
          </h1>
          <p className="text-slate-600 text-lg font-medium">
            Let&apos;s get you set up in just a few steps
          </p>
        </div>

        {/* Progress Bar - Desktop */}
        <div className="hidden md:block mb-10 px-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-600 text-sm font-semibold">
              Step {stepIndex + 1} of {STEPS.length - 1}
            </span>
            <span className="text-slate-700 text-sm font-semibold">
              {completionPercentage}% Complete
            </span>
          </div>
          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-500 rounded-full shadow-lg"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Progress Indicators - Mobile */}
        <div className="md:hidden mb-10 flex gap-2 overflow-x-auto justify-center">
          {STEPS.map((step, idx) => (
            <div
              key={step}
              className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all shadow-md ${
                idx < stepIndex
                  ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white scale-110'
                  : idx === stepIndex
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white ring-4 ring-blue-200 scale-110'
                  : 'bg-slate-200 text-slate-500'
              }`}
              title={getStepLabel(step)}
            >
              {idx < stepIndex ? (
                <CheckCircle2 size={20} />
              ) : (
                idx + 1
              )}
            </div>
          ))}
        </div>

        {/* Step Indicators - Desktop */}
        <div className="hidden md:flex gap-2 mb-10 px-6">
          {STEPS.map((step, idx) => (
            <div key={step} className="flex items-center flex-1">
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center font-bold transition-all ${
                  idx < stepIndex
                    ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg'
                    : idx === stepIndex
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white ring-4 ring-blue-200 shadow-lg'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {idx < stepIndex ? (
                  <CheckCircle2 size={20} />
                ) : (
                  idx + 1
                )}
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-2 mx-2 rounded-full transition-all ${
                    idx < stepIndex ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Content Card */}
        <Card className="bg-white/80 backdrop-blur-sm border-2 border-slate-100 shadow-2xl rounded-3xl">
          <div className="p-6 md:p-10">
            {isTransitioning ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-500"></div>
              </div>
            ) : (
              renderStepContent()
            )}
          </div>

          {/* Navigation Buttons - Not shown on completion step */}
          {currentStep !== 'complete' && (
            <div className="px-6 md:px-10 pb-6 md:pb-8 flex gap-3 justify-between border-t border-slate-100">
              <Button
                onClick={handlePrevious}
                disabled={stepIndex === 0 || isLoading}
                variant="outline"
                className="flex-1 md:flex-none border-2 border-slate-300 hover:border-slate-400 text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                <ArrowLeft size={18} className="mr-2" />
                Back
              </Button>

              <Button
                onClick={handleNext}
                disabled={!canProceedToNextStep() || isLoading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    {stepIndex === STEPS.length - 2 ? 'Complete' : 'Next'}
                    <ArrowRight size={18} className="ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}
        </Card>

        {/* Footer Help Text */}
        <div className="mt-8 text-center text-slate-600 text-sm">
          <p>
            By signing up, you agree to our{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-semibold underline">
              Terms of Service
            </a>
            {' '}and{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-semibold underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }
      `}</style>
    </div>
  );
};

export default OnboardingPage;

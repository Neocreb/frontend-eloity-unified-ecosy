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
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Welcome to Eloity
          </h1>
          <p className="text-purple-200 text-lg">
            Let&apos;s get you set up in just a few steps
          </p>
        </div>

        {/* Progress Bar - Desktop */}
        <div className="hidden md:block mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-purple-200 text-sm font-medium">
              Step {stepIndex + 1} of {STEPS.length - 1}
            </span>
            <span className="text-purple-300 text-sm font-medium">
              {completionPercentage}% Complete
            </span>
          </div>
          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Progress Indicators - Mobile */}
        <div className="md:hidden mb-8 flex gap-2 overflow-x-auto">
          {STEPS.map((step, idx) => (
            <div
              key={step}
              className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                idx < stepIndex
                  ? 'bg-green-500 text-white'
                  : idx === stepIndex
                  ? 'bg-purple-500 text-white ring-2 ring-purple-300'
                  : 'bg-slate-700 text-slate-400'
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
        <div className="hidden md:flex gap-3 mb-8">
          {STEPS.map((step, idx) => (
            <div key={step} className="flex items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  idx < stepIndex
                    ? 'bg-green-500 text-white'
                    : idx === stepIndex
                    ? 'bg-purple-500 text-white ring-2 ring-purple-300'
                    : 'bg-slate-700 text-slate-400'
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
                  className={`flex-1 h-1 mx-2 rounded-full transition-all ${
                    idx < stepIndex ? 'bg-green-500' : 'bg-slate-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex gap-3">
            <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Content Card */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <div className="p-6 md:p-8">
            {isTransitioning ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500" />
              </div>
            ) : (
              renderStepContent()
            )}
          </div>

          {/* Navigation Buttons - Not shown on completion step */}
          {currentStep !== 'complete' && (
            <div className="px-6 md:px-8 pb-6 md:pb-8 flex gap-3 justify-between">
              <Button
                onClick={handlePrevious}
                disabled={stepIndex === 0 || isLoading}
                variant="outline"
                className="flex-1 md:flex-none"
              >
                <ArrowLeft size={18} className="mr-2" />
                Back
              </Button>

              <Button
                onClick={handleNext}
                disabled={!canProceedToNextStep() || isLoading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2" />
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
        <div className="mt-6 text-center text-purple-300 text-sm">
          <p>
            By signing up, you agree to our{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">
              Terms of Service
            </a>
            {' '}and{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;

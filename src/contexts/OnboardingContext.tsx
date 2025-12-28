import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

export type OnboardingStep =
  | 'signup'
  | 'profile'
  | 'interests'
  | 'kyc'
  | 'confirmation'
  | 'complete';

export interface OnboardingData {
  // Signup Step
  email?: string;
  password?: string;
  name?: string;
  referralCode?: string;

  // Profile Step
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  profession?: string;

  // Interests Step
  selectedInterests?: string[];
  selectedCategories?: string[];

  // KYC Step
  kycCompleted?: boolean;
  kycVerified?: boolean;
  kycDocuments?: {
    idType?: string;
    idNumber?: string;
    expiryDate?: string;
    proofOfAddress?: string;
    documentImages?: string[];
  };

  // Additional
  consentGiven?: boolean;
  marketingOptIn?: boolean;
}

interface OnboardingContextType {
  currentStep: OnboardingStep;
  data: OnboardingData;
  isLoading: boolean;
  error: string | null;
  completionPercentage: number;

  // Navigation methods
  goToStep: (step: OnboardingStep) => void;
  nextStep: () => void;
  previousStep: () => void;
  skipKYC: () => void;

  // Data methods
  updateData: (updates: Partial<OnboardingData>) => void;
  saveProgress: () => Promise<void>;
  completeOnboarding: () => Promise<void>;

  // Getters
  isStepCompleted: (step: OnboardingStep) => boolean;
  canProceedToNextStep: () => boolean;
  getStepIndex: () => number;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const STEP_ORDER: OnboardingStep[] = ['signup', 'profile', 'interests', 'kyc', 'confirmation', 'complete'];

const STEP_REQUIREMENTS: Record<OnboardingStep, (keyof OnboardingData)[]> = {
  signup: ['email', 'password', 'name'],
  profile: ['avatar', 'bio', 'location'],
  interests: ['selectedInterests', 'selectedCategories'],
  kyc: [], // KYC is optional, can be skipped
  confirmation: ['consentGiven'],
  complete: [],
};

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('signup');
  const [data, setData] = useState<OnboardingData>({
    selectedInterests: [],
    selectedCategories: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStepIndex = useCallback(() => {
    return STEP_ORDER.indexOf(currentStep);
  }, [currentStep]);

  const getCompletionPercentage = useCallback(() => {
    const completedSteps = STEP_ORDER.filter(step => {
      if (step === 'kyc') return data.kycCompleted !== false; // Optional
      if (step === 'complete') return false; // Not counted in percentage
      const requirements = STEP_REQUIREMENTS[step];
      return requirements.every(req => data[req]);
    }).length;

    return Math.round((completedSteps / (STEP_ORDER.length - 1)) * 100);
  }, [data]);

  const isStepCompleted = useCallback((step: OnboardingStep) => {
    if (step === 'kyc') return data.kycCompleted === true;
    if (step === 'complete') return data.kycCompleted !== undefined;

    const requirements = STEP_REQUIREMENTS[step];
    return requirements.length === 0 || requirements.every(req => data[req]);
  }, [data]);

  const canProceedToNextStep = useCallback(() => {
    return isStepCompleted(currentStep);
  }, [currentStep, isStepCompleted]);

  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
    setError(null);
  }, []);

  const goToStep = useCallback((step: OnboardingStep) => {
    const stepIndex = STEP_ORDER.indexOf(step);
    const currentIndex = STEP_ORDER.indexOf(currentStep);

    // Can go back to any previous step, but can only go forward if current step is complete
    if (stepIndex < currentIndex || isStepCompleted(currentStep)) {
      setCurrentStep(step);
      setError(null);
    } else {
      setError(`Please complete the ${currentStep} step before proceeding`);
    }
  }, [currentStep, isStepCompleted]);

  const nextStep = useCallback(() => {
    if (!canProceedToNextStep()) {
      setError(`Please complete all required fields in the ${currentStep} step`);
      return;
    }

    const currentIndex = getStepIndex();
    if (currentIndex < STEP_ORDER.length - 1) {
      setCurrentStep(STEP_ORDER[currentIndex + 1]);
      setError(null);
    }
  }, [canProceedToNextStep, currentStep, getStepIndex]);

  const previousStep = useCallback(() => {
    const currentIndex = getStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(STEP_ORDER[currentIndex - 1]);
      setError(null);
    }
  }, [getStepIndex]);

  const skipKYC = useCallback(() => {
    setData(prev => ({ ...prev, kycCompleted: false }));
    goToStep('confirmation');
  }, [goToStep]);

  const saveProgress = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Save to localStorage for now
      localStorage.setItem('onboarding_progress', JSON.stringify({
        currentStep,
        data,
        timestamp: new Date().toISOString(),
      }));

      // TODO: Integrate with backend API to save progress
      // await saveOnboardingProgress(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save progress');
    } finally {
      setIsLoading(false);
    }
  }, [currentStep, data]);

  const completeOnboarding = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate all required steps are complete
      if (!data.email || !data.password || !data.name) {
        throw new Error('Signup information is incomplete');
      }
      if (!data.avatar || !data.bio) {
        throw new Error('Profile information is incomplete');
      }
      if (!data.selectedInterests?.length || !data.selectedCategories?.length) {
        throw new Error('Please select your interests and categories');
      }
      if (!data.consentGiven) {
        throw new Error('Please accept the terms and conditions');
      }

      // TODO: Send to backend to complete registration
      // const result = await completeOnboardingAPI(data);

      // Clear localStorage on successful completion
      localStorage.removeItem('onboarding_progress');

      setCurrentStep('complete');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete onboarding';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [data]);

  const value: OnboardingContextType = {
    currentStep,
    data,
    isLoading,
    error,
    completionPercentage: getCompletionPercentage(),
    goToStep,
    nextStep,
    previousStep,
    skipKYC,
    updateData,
    saveProgress,
    completeOnboarding,
    isStepCompleted,
    canProceedToNextStep,
    getStepIndex,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
};

export default OnboardingContext;

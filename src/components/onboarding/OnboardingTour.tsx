import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Play,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  X,
  Lightbulb,
  Target,
  Users,
  DollarSign,
  TrendingUp,
  MessageSquare,
  Star,
  Gift,
  Zap,
  BookOpen,
  Video,
  Mic,
  Shield,
  Settings,
  Camera,
  Globe,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string;
  position: "top" | "bottom" | "left" | "right";
  icon: React.ReactNode;
  action?: () => void;
}

interface OnboardingPath {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  steps: TourStep[];
  estimatedTime: string;
}

const onboardingPaths: OnboardingPath[] = [
  {
    id: "social",
    title: "Social Creator",
    description: "Learn to create engaging content and build your following",
    icon: <Camera className="w-6 h-6" />,
    color: "bg-pink-500",
    estimatedTime: "5 mins",
    steps: [
      {
        id: "profile",
        title: "Complete Your Profile",
        description:
          "Add a photo, bio, and skills to make a great first impression",
        target: "[data-tour='profile-setup']",
        position: "bottom",
        icon: <Users className="w-4 h-4" />,
      },
      {
        id: "create-post",
        title: "Create Your First Post",
        description:
          "Share your thoughts, photos, or videos with the community",
        target: "[data-tour='create-post']",
        position: "bottom",
        icon: <Camera className="w-4 h-4" />,
      },
      {
        id: "engage",
        title: "Engage with Others",
        description:
          "Like, comment, and follow other creators to build connections",
        target: "[data-tour='feed']",
        position: "right",
        icon: <MessageSquare className="w-4 h-4" />,
      },
    ],
  },
  {
    id: "freelancer",
    title: "Freelancer",
    description: "Set up your professional profile and start earning",
    icon: <Zap className="w-6 h-6" />,
    color: "bg-blue-500",
    estimatedTime: "8 mins",
    steps: [
      {
        id: "skills",
        title: "Add Your Skills",
        description: "List your expertise to attract the right clients",
        target: "[data-tour='skills-section']",
        position: "right",
        icon: <Star className="w-4 h-4" />,
      },
      {
        id: "portfolio",
        title: "Build Your Portfolio",
        description: "Showcase your best work to potential clients",
        target: "[data-tour='portfolio']",
        position: "bottom",
        icon: <BookOpen className="w-4 h-4" />,
      },
      {
        id: "rates",
        title: "Set Your Rates",
        description: "Configure your hourly rate and availability",
        target: "[data-tour='rates-settings']",
        position: "left",
        icon: <DollarSign className="w-4 h-4" />,
      },
    ],
  },
  {
    id: "trader",
    title: "Crypto Trader",
    description: "Learn to trade safely and manage your portfolio",
    icon: <TrendingUp className="w-6 h-6" />,
    color: "bg-green-500",
    estimatedTime: "10 mins",
    steps: [
      {
        id: "kyc",
        title: "Complete KYC Verification",
        description: "Verify your identity to unlock higher trading limits",
        target: "[data-tour='kyc-verification']",
        position: "top",
        icon: <Shield className="w-4 h-4" />,
      },
      {
        id: "portfolio",
        title: "Set Up Your Portfolio",
        description: "Learn about portfolio management and risk assessment",
        target: "[data-tour='crypto-portfolio']",
        position: "right",
        icon: <Target className="w-4 h-4" />,
      },
      {
        id: "first-trade",
        title: "Make Your First Trade",
        description: "Execute a small trade to understand the interface",
        target: "[data-tour='trading-interface']",
        position: "left",
        icon: <TrendingUp className="w-4 h-4" />,
      },
    ],
  },
  {
    id: "seller",
    title: "Marketplace Seller",
    description: "Start selling products and grow your business",
    icon: <Gift className="w-6 h-6" />,
    color: "bg-purple-500",
    estimatedTime: "7 mins",
    steps: [
      {
        id: "store-setup",
        title: "Set Up Your Store",
        description: "Create your store profile and business information",
        target: "[data-tour='store-setup']",
        position: "bottom",
        icon: <Globe className="w-4 h-4" />,
      },
      {
        id: "list-product",
        title: "List Your First Product",
        description: "Add photos, descriptions, and pricing for your products",
        target: "[data-tour='product-listing']",
        position: "right",
        icon: <Gift className="w-4 h-4" />,
      },
      {
        id: "payments",
        title: "Set Up Payments",
        description: "Configure payment methods and shipping options",
        target: "[data-tour='payment-setup']",
        position: "top",
        icon: <DollarSign className="w-4 h-4" />,
      },
    ],
  },
];

interface OnboardingTourProps {
  forcePath?: string;
  onComplete?: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  forcePath,
  onComplete,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPath, setSelectedPath] = useState<OnboardingPath | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [showPathSelection, setShowPathSelection] = useState(true);

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem("onboarding-completed");
    const userOnboardingData = localStorage.getItem(`onboarding-${user?.id}`);

    if (!hasCompletedOnboarding && user && !forcePath) {
      // Show onboarding on both desktop and mobile
      const isMobile = window.innerWidth < 768;
      const delay = isMobile ? 1500 : 1000; // Slightly longer delay on mobile
      setTimeout(() => setIsOpen(true), delay);
    }

    if (userOnboardingData) {
      setCompletedSteps(JSON.parse(userOnboardingData));
    }

    if (forcePath) {
      const path = onboardingPaths.find((p) => p.id === forcePath);
      if (path) {
        setSelectedPath(path);
        setShowPathSelection(false);
        setIsOpen(true);
      }
    }
  }, [user, forcePath]);

  const selectPath = (path: OnboardingPath) => {
    setSelectedPath(path);
    setShowPathSelection(false);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (!selectedPath) return;

    const step = selectedPath.steps[currentStep];
    if (step) {
      setCompletedSteps((prev) => [...prev, step.id]);

      // Execute step action if available
      if (step.action) {
        step.action();
      }
    }

    if (currentStep < selectedPath.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTour = () => {
    setIsOpen(false);
    localStorage.setItem("onboarding-completed", "true");
    if (onComplete) onComplete();
  };

  const completeTour = () => {
    setIsOpen(false);
    localStorage.setItem("onboarding-completed", "true");
    localStorage.setItem(
      `onboarding-${user?.id}`,
      JSON.stringify(completedSteps),
    );

    toast({
      title: "🎉 Onboarding Complete!",
      description: `Welcome to ${selectedPath?.title} on Eloity! You're ready to get started.`,
    });

    if (onComplete) onComplete();
  };

  const restartTour = () => {
    setShowPathSelection(true);
    setSelectedPath(null);
    setCurrentStep(0);
    setCompletedSteps([]);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-2xl h-auto max-h-[90vh] overflow-y-auto mx-2 sm:mx-4">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-6 w-6 sm:h-8 sm:w-8 z-10"
          onClick={() => setIsOpen(false)}
        >
          <X className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Lightbulb className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
            {showPathSelection
              ? "Welcome to Eloity!"
              : `${selectedPath?.title} Guide`}
          </DialogTitle>
        </DialogHeader>

        {showPathSelection ? (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Choose your journey to get personalized guidance
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {onboardingPaths.map((path) => (
                <Card
                  key={path.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => selectPath(path)}
                >
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-start gap-2 md:gap-3">
                      <div
                        className={`p-1.5 md:p-2 rounded-lg ${path.color} text-white flex-shrink-0`}
                      >
                        {React.cloneElement(path.icon as React.ReactElement, {
                          className: "w-4 h-4 md:w-6 md:h-6",
                        })}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1 text-sm md:text-base truncate">
                          {path.title}
                        </h3>
                        <p className="text-xs md:text-sm text-muted-foreground mb-2 line-clamp-2">
                          {path.description}
                        </p>
                        <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {path.steps.length} steps
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {path.estimatedTime}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:justify-between">
              <Button
                variant="outline"
                onClick={skipTour}
                className="w-full sm:w-auto"
              >
                Skip for now
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="w-full sm:w-auto"
              >
                I'll explore on my own
              </Button>
            </div>
          </div>
        ) : selectedPath ? (
          <div className="space-y-6">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  Step {currentStep + 1} of {selectedPath.steps.length}
                </span>
                <span>
                  {Math.round(
                    ((currentStep + 1) / selectedPath.steps.length) * 100,
                  )}
                  % Complete
                </span>
              </div>
              <Progress
                value={((currentStep + 1) / selectedPath.steps.length) * 100}
              />
            </div>

            {/* Current Step */}
            <div className="text-center space-y-3 md:space-y-4">
              <div
                className={`inline-flex p-2 md:p-3 rounded-full ${selectedPath.color} text-white`}
              >
                {React.cloneElement(
                  selectedPath.steps[currentStep]?.icon as React.ReactElement,
                  {
                    className: "w-5 h-5 md:w-6 md:h-6",
                  },
                )}
              </div>

              <div>
                <h3 className="text-lg md:text-xl font-semibold mb-2">
                  {selectedPath.steps[currentStep]?.title}
                </h3>
                <p className="text-sm md:text-base text-muted-foreground">
                  {selectedPath.steps[currentStep]?.description}
                </p>
              </div>

              {/* Visual Guide */}
              <div className="bg-muted rounded-lg p-3 md:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Play className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Quick Tip</span>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Look for the highlighted elements on the page to complete this
                  step.
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  onClick={restartTour}
                  className="flex-1 sm:flex-none text-sm"
                >
                  <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Change Path
                </Button>
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    className="flex-1 sm:flex-none text-sm"
                  >
                    Previous
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={skipTour}
                  className="flex-1 sm:flex-none text-sm"
                >
                  Skip
                </Button>
                <Button
                  onClick={nextStep}
                  className="flex-1 sm:flex-none text-sm"
                >
                  {currentStep === selectedPath.steps.length - 1 ? (
                    <>
                      Complete
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

// Feature Discovery Tooltip Component
interface FeatureTooltipProps {
  feature: string;
  title: string;
  description: string;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}

export const FeatureTooltip: React.FC<FeatureTooltipProps> = ({
  feature,
  title,
  description,
  children,
  side = "top",
}) => {
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    const shownFeatures = JSON.parse(
      localStorage.getItem("shown-features") || "[]",
    );
    setHasShown(shownFeatures.includes(feature));
  }, [feature]);

  const markAsShown = () => {
    const shownFeatures = JSON.parse(
      localStorage.getItem("shown-features") || "[]",
    );
    if (!shownFeatures.includes(feature)) {
      shownFeatures.push(feature);
      localStorage.setItem("shown-features", JSON.stringify(shownFeatures));
    }
    setHasShown(true);
  };

  return (
    <TooltipProvider>
      <Tooltip open={!hasShown} onOpenChange={markAsShown}>
        <TooltipTrigger asChild onClick={markAsShown}>
          {children}
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              <span className="font-medium">{title}</span>
            </div>
            <p className="text-sm">{description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Progressive Disclosure Component
interface ProgressiveDisclosureProps {
  level: "beginner" | "intermediate" | "advanced";
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProgressiveDisclosure: React.FC<ProgressiveDisclosureProps> = ({
  level,
  children,
  fallback,
}) => {
  const { user } = useAuth();
  const [userLevel, setUserLevel] = useState<string>("beginner");

  useEffect(() => {
    // Determine user level based on activity, features used, etc.
    const calculateUserLevel = () => {
      const completedActions = parseInt(
        localStorage.getItem("completed-actions") || "0",
      );
      const featuresUsed = JSON.parse(
        localStorage.getItem("features-used") || "[]",
      ).length;

      if (completedActions > 50 && featuresUsed > 15) return "advanced";
      if (completedActions > 20 && featuresUsed > 8) return "intermediate";
      return "beginner";
    };

    setUserLevel(calculateUserLevel());
  }, [user]);

  const shouldShow = () => {
    const levels = ["beginner", "intermediate", "advanced"];
    const userLevelIndex = levels.indexOf(userLevel);
    const requiredLevelIndex = levels.indexOf(level);

    return userLevelIndex >= requiredLevelIndex;
  };

  if (!shouldShow()) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

export default OnboardingTour;

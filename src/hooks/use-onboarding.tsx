"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { api } from "~/trpc/react";

export interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  current?: boolean;
}

interface OnboardingContextType {
  steps: OnboardingStep[];
  currentStep: number;
  completedSteps: number[];
  totalSteps: number;
  isLoading: boolean;
  isComplete: boolean;
  completionPercentage: number;
  setCurrentStep: (stepId: number) => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined,
);

const defaultSteps: OnboardingStep[] = [
  {
    id: 1,
    title: "Provide Bank Details",
    description:
      "Add your bank account information to receive payouts from subscriptions",
    completed: false,
  },
  {
    id: 2,
    title: "Create Publication",
    description:
      "Set up your publication with a name and description for your subscribers",
    completed: false,
  },
  {
    id: 3,
    title: "Setup Payment Plans",
    description: "Configure your monthly and annual subscription pricing",
    completed: false,
  },
  {
    id: 4,
    title: "Connect Kit (Optional)",
    description:
      "Optionally connect your Kit account to automatically sync paying subscribers",
    completed: false,
  },
];

interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [currentStep, setCurrentStep] = useState(1);

  // Fetch creator data - this is our single source of truth
  const { data: creator, isLoading } = api.creator.get.useQuery();

  // Calculate steps based on server data - no local state manipulation
  const steps = defaultSteps.map((step) => {
    if (!creator) return { ...step, completed: false };

    let completed = false;
    switch (step.id) {
      case 1:
        completed = creator.hasBankInfo;
        break;
      case 2:
        completed = Boolean(creator.hasCompletedPublicationSetup);
        break;
      case 3:
        completed = Boolean(creator.hasCompletedPaymentPlansSetup);
        break;
      case 4:
        // Kit integration is optional - mark as completed if either:
        // 1. User has set up Kit integration, OR
        // 2. User has completed all essential steps (indicating they can skip Kit)
        completed =
          creator.hasKitApiKey ||
          (creator.hasBankInfo &&
            creator.hasCompletedPublicationSetup &&
            creator.hasCompletedPaymentPlansSetup);
        break;
    }
    return { ...step, completed };
  });

  // Auto-advance to first incomplete step whenever server data changes
  useEffect(() => {
    if (!creator) {
      setCurrentStep(1);
      return;
    }

    // Check if all essential steps are completed (steps 1-3)
    const essentialStepsCompleted =
      creator.hasBankInfo &&
      creator.hasCompletedPublicationSetup &&
      creator.hasCompletedPaymentPlansSetup;

    // Find first incomplete step among essential steps
    const firstIncompleteEssentialStep = steps
      .slice(0, 3)
      .find((step) => !step.completed);

    if (firstIncompleteEssentialStep) {
      // Still have essential steps to complete
      setCurrentStep(firstIncompleteEssentialStep.id);
    } else if (essentialStepsCompleted && !creator.hasKitApiKey) {
      // All essential steps done, Kit not set up - show Kit step
      setCurrentStep(4);
    }
    // If all steps are complete, stay on the current step (don't auto-advance away)
  }, [creator, steps]);

  // Calculate derived values
  const completedSteps = steps
    .filter((step) => step.completed)
    .map((step) => step.id);

  const totalSteps = steps.length;

  // Consider onboarding complete when essential steps (1-3) are done
  const essentialStepsCompleted = creator
    ? creator.hasBankInfo &&
      creator.hasCompletedPublicationSetup &&
      creator.hasCompletedPaymentPlansSetup
    : false;

  const isComplete = essentialStepsCompleted;

  // Calculate completion percentage based on essential steps + optional kit
  const essentialStepsCount = 3;
  const completedEssentialSteps = completedSteps.filter((id) => id <= 3).length;
  const kitCompleted = completedSteps.includes(4) ? 1 : 0;

  const completionPercentage = Math.round(
    ((completedEssentialSteps + kitCompleted * 0.25) /
      (essentialStepsCount + 0.25)) *
      100,
  );

  // Add current indicator to steps
  const stepsWithCurrent = steps.map((step) => ({
    ...step,
    current: step.id === currentStep && !step.completed,
  }));

  const resetOnboarding = () => {
    setCurrentStep(1);
    console.log("Reset onboarding state");
  };

  const contextValue: OnboardingContextType = {
    steps: stepsWithCurrent,
    currentStep,
    completedSteps,
    totalSteps,
    isComplete,
    completionPercentage,
    setCurrentStep,
    resetOnboarding,
    isLoading,
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}

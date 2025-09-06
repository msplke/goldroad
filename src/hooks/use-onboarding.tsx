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
    title: "Setup ConvertKit",
    description: "Add your ConvertKit API key (encrypted)",
    completed: false,
  },
  {
    id: 2,
    title: "Provide Bank Details",
    description: "Bank and account number for payouts",
    completed: false,
  },
  {
    id: 3,
    title: "Create Publication",
    description: "Set up your publication name and description",
    completed: false,
  },
  {
    id: 4,
    title: "Setup Payment Plans",
    description: "Configure monthly and annual subscription plans",
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
        completed = creator.hasKitApiKey;
        break;
      case 2:
        completed = creator.hasBankInfo;
        break;
      case 3:
        completed = Boolean(creator.hasCompletedPublicationSetup);
        break;
      case 4:
        completed = Boolean(creator.hasCompletedPaymentPlansSetup);
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

    // Find first incomplete step
    const firstIncompleteStep = steps.find((step) => !step.completed);
    if (firstIncompleteStep) {
      setCurrentStep(firstIncompleteStep.id);
    }
    // If all steps are complete, stay on the last step
  }, [creator, steps]);

  // Calculate derived values
  const completedSteps = steps
    .filter((step) => step.completed)
    .map((step) => step.id);

  const totalSteps = steps.length;
  const isComplete = completedSteps.length === totalSteps;
  const completionPercentage = Math.round(
    (completedSteps.length / totalSteps) * 100,
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

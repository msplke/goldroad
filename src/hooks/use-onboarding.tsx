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
  current?: boolean; // Indicates if this is the active step
}

interface OnboardingContextType {
  steps: OnboardingStep[];
  currentStep: number;
  completedSteps: number[];
  totalSteps: number;
  isLoading: boolean;
  isComplete: boolean;
  completionPercentage: number;
  // Methods for managing state
  markStepComplete: (stepId: number) => void;
  markStepIncomplete: (stepId: number) => void;
  setCurrentStep: (stepId: number) => void;
  resetOnboarding: () => void;
  getNextIncompleteStep: () => number | null;
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
  const [steps, setSteps] = useState<OnboardingStep[]>(defaultSteps);
  const [currentStep, setCurrentStepState] = useState(1);

  // Fetch creator data to get onboarding progress
  const { data: creator, isLoading } = api.creator.get.useQuery();

  // Update steps based on creator data
  useEffect(() => {
    if (creator) {
      // Creator exists, update steps based on their progress
      const updatedSteps = defaultSteps.map((step) => {
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

      setSteps(updatedSteps);

      // Set current step to first incomplete step
      const incompleteStep = updatedSteps.find((step) => !step.completed);
      const firstIncomplete = incompleteStep ? incompleteStep.id : null;
      if (firstIncomplete) {
        setCurrentStepState(firstIncomplete);
      }
    } else if (creator === null) {
      // Creator doesn't exist yet, reset to default (all incomplete)
      setSteps(defaultSteps);
      setCurrentStepState(1);
    }
    // If creator is undefined, we're still loading
  }, [creator]);

  const markStepComplete = (stepId: number) => {
    setSteps((prevSteps) => {
      const updatedSteps = prevSteps.map((step) =>
        step.id === stepId ? { ...step, completed: true } : step,
      );

      setCurrentStepState((prevCurrentStep) => {
        // Auto-advance to next incomplete step
        const nextStep = getNextIncompleteStepFromSteps(updatedSteps);
        const newCurrentStep = nextStep || prevCurrentStep;
        return newCurrentStep;
      });

      return updatedSteps;
    });
  };

  const markStepIncomplete = (stepId: number) => {
    setSteps((prevSteps) => {
      const updatedSteps = prevSteps.map((step) =>
        step.id === stepId ? { ...step, completed: false } : step,
      );

      setCurrentStepState((_prevCurrentStep) => {
        // Set current step to the first incomplete step
        const firstIncomplete = getNextIncompleteStepFromSteps(updatedSteps);
        const newCurrentStep = firstIncomplete ?? 1;
        return newCurrentStep;
      });

      return updatedSteps;
    });
  };

  const setCurrentStep = (stepId: number) => {
    setCurrentStepState(stepId);
  };

  const resetOnboarding = () => {
    const resetSteps = defaultSteps.map((step) => ({
      ...step,
      completed: false,
    }));
    setSteps(resetSteps);
    setCurrentStepState(1);
    console.log("Reset onboarding state");
  };

  const getNextIncompleteStepFromSteps = (
    stepsArray: OnboardingStep[],
  ): number | null => {
    const incompleteStep = stepsArray.find((step) => !step.completed);
    return incompleteStep ? incompleteStep.id : null;
  };

  const getNextIncompleteStep = (): number | null => {
    return getNextIncompleteStepFromSteps(steps);
  };

  // Calculate derived values
  const completedSteps = steps
    .filter((step) => step.completed)
    .map((step) => step.id);
  const totalSteps = steps.length;
  const isComplete = completedSteps.length === totalSteps;
  const completionPercentage = Math.round(
    (completedSteps.length / totalSteps) * 100,
  );

  // Update steps with current indicator
  const stepsWithCurrent = steps.map((step) => ({
    ...step,
    current: step.id === currentStep && !step.completed,
  }));

  const contextValue: OnboardingContextType = {
    steps: stepsWithCurrent,
    currentStep,
    completedSteps,
    totalSteps,
    isComplete,
    completionPercentage,
    markStepComplete,
    markStepIncomplete,
    setCurrentStep,
    resetOnboarding,
    getNextIncompleteStep,
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

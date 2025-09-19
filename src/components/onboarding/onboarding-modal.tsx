"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CheckCircle2, ExternalLink, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { AddBankInfoForm } from "~/components/forms/add-bank-info-form";
import { AddKitApiKeyForm } from "~/components/forms/add-kit-api-key-form";
import { AddPaymentPlanForm } from "~/components/forms/add-payment-plan-form";
import { AddPublicationForm } from "~/components/forms/add-publication-form";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { stepConfigs } from "~/config/onboarding";
import { useOnboarding } from "~/hooks/use-onboarding";
import { cn } from "~/lib/utils";
import {
  type Step1FormData,
  type Step2FormData,
  type Step3FormData,
  type Step4FormData,
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
} from "~/lib/validators/onboarding";
import { api } from "~/trpc/react";

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialStep?: number;
}

export function OnboardingModal({
  open,
  onOpenChange,
  initialStep,
}: OnboardingModalProps) {
  const {
    currentStep,
    steps,
    totalSteps,
    completedSteps,
    setCurrentStep,
    isComplete,
  } = useOnboarding();

  const [publicationId, setPublicationId] = useState<string | null>(null);
  const utils = api.useUtils();

  // Set initial step when modal opens
  useEffect(() => {
    if (open && initialStep) {
      setCurrentStep(initialStep);
    }
  }, [open, initialStep, setCurrentStep]);

  // Close modal when onboarding is complete
  useEffect(() => {
    if (isComplete) {
      onOpenChange(false);
    }
  }, [isComplete, onOpenChange]);

  // tRPC mutations - simplified to only handle server updates
  const addKitApiKey = api.creator.addOrUpdateKitApiKey.useMutation({
    onSuccess: () => {
      toast.success("Kit integration completed successfully!");
      // The useOnboarding hook will automatically advance when creator data refetches
      utils.creator.get.invalidate();
    },
    onError: () => {
      toast.error(
        "Failed to save Kit API key. Please ensure your Kit API key is valid and try again.",
      );
    },
  });

  const addBankInfo = api.creator.addBankAccountInfo.useMutation({
    onSuccess: () => {
      toast.success("Bank account information saved successfully!");
      utils.creator.get.invalidate();
    },
    onError: () => {
      toast.error(
        "Failed to save bank account details. Please ensure they are valid and try again.",
      );
    },
  });

  const createPublication = api.publication.create.useMutation({
    onSuccess: (createdPublicationId) => {
      toast.success("Publication created successfully!");
      setPublicationId(createdPublicationId);
      utils.creator.get.invalidate();
    },
    onError: () => {
      toast.error("Failed to create publication. Please try again.");
    },
  });

  const createPlans = api.plan.createMonthlyAndYearlyPlans.useMutation({
    onSuccess: () => {
      toast.success("Payment plans created successfully! Setup complete!");
      utils.creator.get.invalidate();
      // Modal will close automatically via isComplete useEffect
    },
    onError: () => {
      toast.error("Failed to create payment plans. Please try again.");
    },
  });

  // Form instances for each step
  const step1Form = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    defaultValues: { bankCode: "", accountNumber: "", accountName: "" },
  });

  const step2Form = useForm<Step2FormData>({
    resolver: zodResolver(step2Schema),
    defaultValues: { publicationName: "", publicationDescription: "" },
  });

  const step3Form = useForm<Step3FormData>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      publicationId: "",
      monthlyAmount: 200,
      annualAmount: 2000,
    },
  });

  const step4Form = useForm<Step4FormData>({
    resolver: zodResolver(step4Schema),
    defaultValues: { apiKey: "" },
  });

  // Update step 3 form when publication is created
  useEffect(() => {
    if (publicationId) {
      step3Form.setValue("publicationId", publicationId);
    }
  }, [publicationId, step3Form]);

  const currentStepConfig = stepConfigs.find((step) => step.id === currentStep);
  const isLastStep = currentStep === totalSteps;

  const canAccessStep = (stepId: number) => {
    const stepConfig = stepConfigs.find((s) => s.id === stepId);
    if (!stepConfig?.content.requiresPrevious) return true;

    return stepConfig.content.requiresPrevious.every((requiredStep) =>
      completedSteps.includes(requiredStep),
    );
  };

  // Form submission handlers - simplified with completion checks
  const handleStep1Submit = (data: Step1FormData) => {
    if (completedSteps.includes(1)) {
      toast.info(
        "Bank account information is already saved and can only be modified from the settings page.",
      );
      return;
    }
    addBankInfo.mutate({
      settlement_bank: data.bankCode,
      account_number: data.accountNumber,
      business_name: data.accountName,
    });
  };

  const handleStep2Submit = (data: Step2FormData) => {
    if (completedSteps.includes(2)) {
      toast.info(
        "Publication is already created and can only be modified from the settings page.",
      );
      return;
    }
    createPublication.mutate({
      name: data.publicationName,
      description: data.publicationDescription,
    });
  };

  const handleStep3Submit = (data: Step3FormData) => {
    if (completedSteps.includes(3)) {
      toast.info("Payment plans are already set up!");
      return;
    }
    if (!publicationId) {
      toast.error("Publication ID is missing. Please complete step 2 first.");
      return;
    }
    createPlans.mutate({
      publicationId,
      monthlyAmount: data.monthlyAmount,
      annualAmount: data.annualAmount,
    });
  };

  const handleStep4Submit = (data: Step4FormData) => {
    if (completedSteps.includes(4)) {
      toast.info(
        "Kit integration is already set up and can only be modified from the settings page.",
      );
      return;
    }

    // If API key is empty, skip Kit integration
    if (!data.apiKey || data.apiKey.trim() === "") {
      toast.success(
        "Onboarding completed! Kit integration can be added later from settings.",
      );
      utils.creator.get.invalidate(); // This will trigger isComplete to be true
      return;
    }

    // Otherwise, set up Kit integration
    addKitApiKey.mutate({ kitApiKey: data.apiKey });
  };

  if (!currentStepConfig) return null;

  const StepIcon = currentStepConfig.icon;
  const stepAccessible = canAccessStep(currentStep);
  const isLoading =
    addKitApiKey.isPending ||
    addBankInfo.isPending ||
    createPublication.isPending ||
    createPlans.isPending;
  const error =
    addKitApiKey.error ||
    addBankInfo.error ||
    createPublication.error ||
    createPlans.error;

  const handleSkip = () => {
    if (currentStep === 4) {
      // Skip Kit integration - trigger completion
      toast.success(
        "Onboarding completed! Kit integration can be added later from settings.",
      );
      utils.creator.get.invalidate();
    } else {
      // For other steps, just close the modal
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StepIcon className="h-5 w-5 text-primary" />
            Setup Your Creator Dashboard
          </DialogTitle>
          <DialogDescription>
            Step {currentStep} of {totalSteps}: Complete your account setup to
            start accepting payments
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                    step.completed
                      ? "border-primary bg-primary text-primary-foreground"
                      : step.id === currentStep
                        ? "border-primary text-primary"
                        : "border-muted text-muted-foreground",
                  )}
                >
                  {step.completed ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <span className="font-medium text-sm">{step.id}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "mx-2 h-0.5 w-12 transition-colors",
                      step.completed ? "bg-primary" : "bg-muted",
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StepIcon className="h-5 w-5" />
                {currentStepConfig.content.title}
              </CardTitle>
              <CardDescription>
                {currentStepConfig.content.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {!stepAccessible ? (
                <div className="py-8 text-center">
                  <Shield className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="mb-4 text-muted-foreground text-sm">
                    Complete the previous steps to access this section.
                  </p>
                </div>
              ) : (
                <>
                  {/* Show completion state for completed steps */}
                  {completedSteps.includes(currentStep) ? (
                    <div className="py-8 text-center">
                      <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-primary" />
                      <p className="mb-4 font-medium text-primary">
                        This step is already completed!
                      </p>
                      <p className="text-muted-foreground text-sm">
                        This information is locked to prevent duplicate
                        submissions. To make changes, please visit the settings
                        page.
                      </p>
                    </div>
                  ) : null}

                  {currentStep === 1 && (
                    <AddBankInfoForm
                      step1Form={step1Form}
                      handleStep1SubmitAction={handleStep1Submit}
                    />
                  )}

                  {currentStep === 2 && (
                    <AddPublicationForm
                      step2Form={step2Form}
                      handleStep2SubmitAction={handleStep2Submit}
                    />
                  )}

                  {currentStep === 3 && (
                    <AddPaymentPlanForm
                      step3Form={step3Form}
                      handleStep3SubmitAction={handleStep3Submit}
                    />
                  )}

                  {currentStep === 4 && (
                    <AddKitApiKeyForm
                      step4Form={step4Form}
                      handleStep4SubmitAction={handleStep4Submit}
                    />
                  )}
                </>
              )}

              {error && (
                <div className="rounded-lg bg-destructive/15 p-3">
                  <p className="text-destructive text-sm">
                    Error: {error.message}
                  </p>
                </div>
              )}

              {currentStepConfig.content.helpText && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-muted-foreground text-sm">
                    {currentStepConfig.content.helpText}
                  </p>
                  {currentStepConfig.content.helpLink && (
                    <Button
                      variant="link"
                      size="sm"
                      className="mt-1 h-auto p-0"
                      asChild
                    >
                      <a
                        href={currentStepConfig.content.helpLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open Documentation{" "}
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            {/* Empty div for flex spacing */}
            <div />

            <div className="flex items-center gap-2">
              {currentStep === 4 && (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  disabled={isLoading}
                >
                  Skip for now
                </Button>
              )}
              <Button
                onClick={() => {
                  switch (currentStep) {
                    case 1:
                      step1Form.handleSubmit(handleStep1Submit)();
                      break;
                    case 2:
                      step2Form.handleSubmit(handleStep2Submit)();
                      break;
                    case 3:
                      step3Form.handleSubmit(handleStep3Submit)();
                      break;
                    case 4:
                      step4Form.handleSubmit(handleStep4Submit)();
                      break;
                  }
                }}
                disabled={isLoading || !stepAccessible}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  "Processing..."
                ) : completedSteps.includes(currentStep) ? (
                  "View Details"
                ) : isLastStep ? (
                  "Complete Setup"
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

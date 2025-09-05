"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Shield,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { AddBankInfoForm } from "~/components/forms/add-bank-info-form";
import { AddKitApiKeyForm } from "~/components/forms/add-kit-api-key-form";
import { AddPaymentPlanForm } from "~/components/forms/add-payment-plan-form ";
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
    markStepComplete,
    steps,
    totalSteps,
    getNextIncompleteStep,
    completedSteps,
  } = useOnboarding();

  const [activeStep, setActiveStep] = useState(initialStep || currentStep);
  const [publicationId, setPublicationId] = useState<string | null>(null);
  const utils = api.useUtils();

  // tRPC mutations with proper error handling
  const addKitApiKey = api.creator.addOrUpdateKitApiKey.useMutation({
    onSuccess: () => {
      toast.success("Success. Kit API Key successfully added.");
      utils.creator.get.invalidate();
      markStepComplete(1);
      advanceToNextStep();
    },

    onError: () => {
      toast.error("Failed to add Kit API Key. Please try again.");
    },
  });

  const addBankInfo = api.creator.addOrUpdateBankAccountInfo.useMutation({
    onSuccess: () => {
      toast.success("Success. Bank details successfully added.");
      utils.creator.get.invalidate();
      markStepComplete(2);
      advanceToNextStep();
    },

    onError: () => {
      toast.error("Failed to add Bank Details. Please try again.");
    },
  });

  const createPublication = api.publication.create.useMutation({
    onSuccess: (createdPublicationId) => {
      toast.success("Success. Publication successfully created.");
      setPublicationId(createdPublicationId);
      utils.creator.get.invalidate();
      markStepComplete(3);
      advanceToNextStep(); // Advance to step 4 for plan creation
    },

    onError: () => {
      toast.error("Failed to create Publication. Please try again.");
    },
  });

  const createPlans = api.plan.create.useMutation({
    onSuccess: () => {
      toast.success("Success. Payment plans successfully created.");
      utils.creator.get.invalidate();
      markStepComplete(4);
      onOpenChange(false); // Close modal after final step
    },

    onError: () => {
      toast.error("Failed to create Payment Plans. Please try again.");
    },
  });

  // Form instances for each step
  const step1Form = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    defaultValues: { apiKey: "" },
  });

  const step2Form = useForm<Step2FormData>({
    resolver: zodResolver(step2Schema),
    defaultValues: { bankCode: "", accountNumber: "", accountName: "" },
  });

  const step3Form = useForm<Step3FormData>({
    resolver: zodResolver(step3Schema),
    defaultValues: { publicationName: "", publicationDescription: "" },
  });

  const step4Form = useForm<Step4FormData>({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      publicationId: "",
      monthlyAmount: 200,
      annualAmount: 2000,
    },
  });

  const advanceToNextStep = () => {
    const nextStep = getNextIncompleteStep();
    if (nextStep && nextStep <= totalSteps) {
      setActiveStep(nextStep);
    } else {
      onOpenChange(false);
    }
  };

  // Update step 4 form when publication is created
  useEffect(() => {
    if (publicationId) {
      step4Form.setValue("publicationId", publicationId);
    }
  }, [publicationId, step4Form]);

  // Update active step when modal opens with a specific step
  useEffect(() => {
    if (open && initialStep) {
      setActiveStep(initialStep);
    }
  }, [open, initialStep]);

  const currentStepConfig = stepConfigs.find((step) => step.id === activeStep);
  const isLastStep = activeStep === totalSteps;
  const canGoPrev = activeStep > 1;

  const canAccessStep = (stepId: number) => {
    const stepConfig = stepConfigs.find((s) => s.id === stepId);
    if (!stepConfig?.content.requiresPrevious) return true;

    return stepConfig.content.requiresPrevious.every((requiredStep) =>
      completedSteps.includes(requiredStep),
    );
  };

  // Form submission handlers
  const handleStep1Submit = (data: Step1FormData) => {
    addKitApiKey.mutate({ kitApiKey: data.apiKey });
  };

  const handleStep2Submit = (data: Step2FormData) => {
    addBankInfo.mutate({
      settlement_bank: data.bankCode,
      account_number: data.accountNumber,
      business_name: data.accountName,
    });
  };

  const handleStep3Submit = (data: Step3FormData) => {
    createPublication.mutate({
      name: data.publicationName,
      description: data.publicationDescription,
    });
  };

  const handleStep4Submit = (data: Step4FormData) => {
    if (!publicationId) {
      toast.error("Publication ID is missing. Please complete step 3 first.");
      return;
    }
    createPlans.mutate({
      publicationId,
      monthlyAmount: data.monthlyAmount,
      annualAmount: data.annualAmount,
    });
  };

  if (!currentStepConfig) return null;

  const StepIcon = currentStepConfig.icon;
  const stepAccessible = canAccessStep(activeStep);
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

  const handlePrev = () => {
    if (canGoPrev) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
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
            Step {activeStep} of {totalSteps}: Complete your account setup to
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
                      : step.id === activeStep
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
                  {activeStep === 1 && (
                    <AddKitApiKeyForm
                      step1Form={step1Form}
                      handleStep1SubmitAction={handleStep1Submit}
                    />
                  )}

                  {activeStep === 2 && (
                    <AddBankInfoForm
                      step2Form={step2Form}
                      handleStep2SubmitAction={handleStep2Submit}
                    />
                  )}

                  {activeStep === 3 && (
                    <AddPublicationForm
                      step3Form={step3Form}
                      handleStep3SubmitAction={handleStep3Submit}
                    />
                  )}

                  {activeStep === 4 && (
                    <AddPaymentPlanForm
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
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={!canGoPrev || isLoading}
              className="flex items-center gap-2 bg-transparent"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={handleSkip} disabled={isLoading}>
                Skip for now
              </Button>
              <Button
                onClick={() => {
                  switch (activeStep) {
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
                ) : isLastStep ? (
                  "Complete Setup"
                ) : (
                  <>
                    Next
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

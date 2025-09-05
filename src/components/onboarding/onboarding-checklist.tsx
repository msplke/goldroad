"use client";

import { AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { useOnboarding } from "~/hooks/use-onboarding";
import { cn } from "~/lib/utils";

interface OnboardingChecklistProps {
  onOpenModal?: (stepId: number) => void;
}

export function OnboardingChecklist({ onOpenModal }: OnboardingChecklistProps) {
  const {
    steps,
    completedSteps,
    totalSteps,
    completionPercentage,
    isComplete,
    isLoading,
  } = useOnboarding();

  // Don't show if onboarding is complete
  if (isComplete) return null;

  // Show loading state
  if (isLoading) {
    return (
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
        <CardContent className="p-8">
          <div className="text-center text-amber-700">
            Loading your onboarding progress...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-amber-900 text-lg">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Complete Setup
            </CardTitle>

            <CardDescription className="text-amber-700">
              {completedSteps.length} of {totalSteps} steps completed
            </CardDescription>
          </div>

          <div className="text-right">
            <div className="font-bold text-2xl text-amber-600">
              {completionPercentage}%
            </div>
            <div className="text-amber-600/70 text-xs">Complete</div>
          </div>
        </div>

        <div className="mt-3 h-2 w-full rounded-full bg-amber-200">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300 ease-out"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {steps.map((step, _index) => (
          <div
            key={step.id}
            className={cn(
              "flex items-center gap-3 rounded-xl p-4 transition-all duration-200",
              step.completed
                ? "border border-green-200 bg-green-50"
                : step.current
                  ? "border-2 border-amber-300 bg-white shadow-sm"
                  : "border border-amber-100 bg-white/50",
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-colors",
                step.completed
                  ? "bg-green-500 text-white"
                  : step.current
                    ? "bg-amber-500 text-white"
                    : "bg-gray-200 text-gray-500",
              )}
            >
              {step.completed ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <span className="font-semibold text-xs">{step.id}</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div
                className={cn(
                  "font-medium text-sm",
                  step.completed
                    ? "text-green-800"
                    : step.current
                      ? "text-amber-900"
                      : "text-gray-600",
                )}
              >
                {step.title}
              </div>

              <div
                className={cn(
                  "mt-1 text-xs",
                  step.completed
                    ? "text-green-600"
                    : step.current
                      ? "text-amber-700"
                      : "text-gray-500",
                )}
              >
                {step.description}
              </div>
            </div>

            {step.current && (
              <Button
                size="sm"
                className="flex-shrink-0 bg-amber-500 text-white shadow-sm hover:bg-amber-600"
                onClick={() => onOpenModal?.(step.id)}
              >
                Continue
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

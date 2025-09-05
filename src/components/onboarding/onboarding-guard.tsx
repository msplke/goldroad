"use client";

import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { useOnboarding } from "~/hooks/use-onboarding";

interface OnboardingGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function OnboardingGuard({ children, fallback }: OnboardingGuardProps) {
  const { isComplete, isLoading } = useOnboarding();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isComplete) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Card className="mx-auto max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <AlertCircle className="h-6 w-6 text-amber-600" />
          </div>
          <CardTitle>Complete Your Setup</CardTitle>
          <CardDescription>
            You need to complete the onboarding process to access this feature.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground text-sm">
            This section requires you to have set up your ConvertKit
            integration, bank details, publication, and payment plans.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" asChild className="flex-1">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Overview
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}

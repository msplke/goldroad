"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";

import { OverviewKPIs } from "~/components/dashboard/overview-kpis";
import { SubscribersTableWithData } from "~/components/dashboard/subscribers-table";
import { OnboardingChecklist } from "~/components/onboarding/onboarding-checklist";
import { OnboardingModal } from "~/components/onboarding/onboarding-modal";
import { useOnboarding } from "~/hooks/use-onboarding";

export default function DashboardPage() {
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [modalInitialStep, setModalInitialStep] = useState<number>();
  const { isComplete } = useOnboarding();

  const handleOpenModal = (stepId: number) => {
    setModalInitialStep(stepId);
    setShowOnboardingModal(true);
  };

  return (
    <div className="fade-in-0 animate-in space-y-8 duration-500">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text font-bold text-3xl tracking-tight">
            Overview
          </h1>
          {isComplete && (
            <div className="slide-in-from-right-5 flex animate-in items-center gap-1 rounded-full border border-green-200 bg-gradient-to-r from-green-500/10 to-emerald-500/10 px-3 py-1 duration-700">
              <Sparkles className="h-3 w-3 text-green-600" />
              <span className="font-medium text-green-700 text-xs">
                Setup Complete
              </span>
            </div>
          )}
        </div>
        <p className="text-lg text-muted-foreground">
          Welcome to your creator dashboard. Track your recurring revenue and
          manage subscribers.
        </p>
      </div>

      <div className="space-y-6">
        {!isComplete && (
          <div className="slide-in-from-top-5 animate-in delay-100 duration-500">
            <OnboardingChecklist onOpenModal={handleOpenModal} />
          </div>
        )}

        <div className="slide-in-from-bottom-5 animate-in delay-200 duration-500">
          <OverviewKPIs />
        </div>

        <div className="slide-in-from-bottom-5 animate-in delay-300 duration-500">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-xl">Recent Subscribers</h2>
            </div>
            <SubscribersTableWithData />
          </div>
        </div>
      </div>

      <OnboardingModal
        open={showOnboardingModal}
        onOpenChange={setShowOnboardingModal}
        initialStep={modalInitialStep}
      />
    </div>
  );
}

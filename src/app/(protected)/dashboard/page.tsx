"use client";

import { useState } from "react";

import { columns } from "~/app/(protected)/dashboard/columns";
import { DataTable } from "~/app/(protected)/dashboard/data-table";
import { OnboardingChecklist } from "~/components/onboarding/onboarding-checklist";
import { OnboardingModal } from "~/components/onboarding/onboarding-modal";
import { useOnboarding } from "~/hooks/use-onboarding";
import { api } from "~/trpc/react";

export default function DashboardPage() {
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [modalInitialStep, setModalInitialStep] = useState<number>();
  const { isComplete } = useOnboarding();
  const { data, error, isLoading } = api.subscriber.get.useQuery();

  const handleOpenModal = (stepId: number) => {
    setModalInitialStep(stepId);
    setShowOnboardingModal(true);
  };

  if (error) {
    alert(error.message);
    return <div>Error loading subscribers</div>;
  }

  return (
    <div className="fade-in-0 animate-in space-y-8 duration-500">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text font-bold text-3xl tracking-tight">
            Overview
          </h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Welcome to your creator dashboard. Track your recurring revenue and
          manage subscribers.
        </p>
      </div>

      <div className="space-y-6">
        {!isComplete ? (
          <div className="slide-in-from-top-5 animate-in delay-100 duration-500">
            <OnboardingChecklist onOpenModal={handleOpenModal} />
          </div>
        ) : (
          <div>
            {isLoading ? (
              <div>Loading subscribers...</div>
            ) : (
              <div>
                <h2 className="mb-4 scroll-m-20 border-b pb-2 font-semibold text-2xl tracking-tight transition-colors first:mt-0">
                  Subscribers
                </h2>
                {data ? (
                  <DataTable columns={columns} data={data} />
                ) : (
                  "No subscribers"
                )}
              </div>
            )}
          </div>
        )}

        {/* <div className="slide-in-from-bottom-5 animate-in delay-200 duration-500">
          <OverviewKPIs />
        </div> */}

        {/* <div className="slide-in-from-bottom-5 animate-in delay-300 duration-500">
          <KPICharts />
        </div> */}
      </div>

      <OnboardingModal
        open={showOnboardingModal}
        onOpenChange={setShowOnboardingModal}
        initialStep={modalInitialStep}
      />
    </div>
  );
}

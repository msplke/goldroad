"use client";

import { OnboardingGuard } from "~/components/onboarding/onboarding-guard";

function PublicationContent() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-bold text-3xl tracking-tight">
          Publication Settings
        </h1>
        <p className="text-lg text-muted-foreground">
          Manage your publication details, pricing, and subscriber benefits.
        </p>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-4 font-semibold text-lg">Publication Details</h3>
          <div className="text-muted-foreground">
            Edit your publication name, description, and settings here.
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-4 font-semibold text-lg">Payment Plans</h3>
          <div className="text-muted-foreground">
            Configure your monthly and annual subscription pricing.
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-4 font-semibold text-lg">Subscriber Benefits</h3>
          <div className="text-muted-foreground">
            Define what benefits subscribers get with their paid plans.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PublicationPage() {
  return (
    <OnboardingGuard>
      <PublicationContent />
    </OnboardingGuard>
  );
}

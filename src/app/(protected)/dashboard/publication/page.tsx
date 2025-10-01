"use client";

import { AlertCircle, Loader2 } from "lucide-react";

import { EditPublicationForm } from "~/components/forms/edit-publication-form";
import { OnboardingGuard } from "~/components/onboarding/onboarding-guard";
import { PublicationBenefits } from "~/components/publication/publication-benefits";
import { PublicationPlans } from "~/components/publication/publication-plans";
import { PublicationShareLink } from "~/components/publication/publication-share-link";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { api } from "~/trpc/react";

function PublicationContent() {
  const {
    data: publication,
    isLoading,
    error,
  } = api.publication.getForEdit.useQuery();

  if (isLoading) {
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

        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-muted-foreground">
              Loading publication details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
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

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Publication</AlertTitle>
          <AlertDescription>
            {error.message ||
              "Failed to load publication details. Please try again."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!publication) {
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

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Publication Found</AlertTitle>
          <AlertDescription>
            You haven't created a publication yet. Please complete the
            onboarding process to set up your publication.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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
        {/* Publication Details Form */}
        <EditPublicationForm publication={publication} />

        {/* Publication Share Link */}
        <PublicationShareLink publicationSlug={publication.slug} />

        {/* Payment Plans */}
        <PublicationPlans publicationId={publication.id} />

        {/* Subscriber Benefits */}
        <PublicationBenefits
          publicationId={publication.id}
          publicationName={publication.name}
        />
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

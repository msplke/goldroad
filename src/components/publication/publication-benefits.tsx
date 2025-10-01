import { AddBenefitForm } from "~/components/forms/add-benefit-form";
import { ClearBenefitsDialog } from "~/components/forms/clear-benefits-dialog";
import { DeleteBenefitDialog } from "~/components/forms/delete-benefit-dialog";
import { EditBenefitForm } from "~/components/forms/edit-benefit-form";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { MAX_BENEFITS_PER_PLAN } from "~/lib/constants";
import { api } from "~/trpc/react";

interface PublicationPlansProps {
  publicationId: string;
  publicationName: string;
}

function Header() {
  return (
    <CardHeader>
      <CardTitle>Publication Benefits</CardTitle>
      <CardDescription>
        Describe the benefits subscribers will receive with this publication.
        You can add up to {MAX_BENEFITS_PER_PLAN} benefits.
      </CardDescription>
    </CardHeader>
  );
}

export function PublicationBenefits({
  publicationId,
  publicationName,
}: PublicationPlansProps) {
  const {
    data: benefits,
    isLoading,
    error,
  } = api.publication.getBenefits.useQuery({
    publicationId,
  });

  if (isLoading) {
    return (
      <Card>
        <Header />
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Header />
        <CardContent>
          <div className="py-8 text-center">
            <p className="text-muted-foreground">Failed to load benefits</p>
            <p className="text-muted-foreground text-sm">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Header />
      <CardContent>
        <div className="space-y-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              {benefits && benefits.length > 0 && (
                <Badge variant="outline" className="w-fit">
                  {benefits.length}/{MAX_BENEFITS_PER_PLAN}
                </Badge>
              )}
            </div>

            <div className="hidden sm:flex sm:gap-2">
              <AddBenefitForm
                publicationId={publicationId}
                publicationName={publicationName}
                currentBenefitCount={benefits?.length ?? 0}
              />
              {benefits && benefits.length > 0 && (
                <ClearBenefitsDialog
                  publicationId={publicationId}
                  publicationName={publicationName}
                  benefitCount={benefits.length}
                />
              )}
            </div>
          </div>

          {benefits && benefits.length > 0 ? (
            <div className="space-y-4">
              {benefits.map((benefit) => (
                <div
                  key={benefit.id}
                  className="flex items-start justify-between gap-3 rounded-md bg-muted/50 p-3"
                >
                  <p className="flex-1 text-sm">{benefit.description}</p>
                  <div className="flex items-center gap-1">
                    <EditBenefitForm
                      benefitId={benefit.id}
                      currentDescription={benefit.description}
                    />
                    <DeleteBenefitDialog
                      benefitId={benefit.id}
                      benefitDescription={benefit.description}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-muted-foreground text-sm">
              No benefits added yet.
            </p>
          )}
          <div className="flex items-center justify-end gap-2 sm:hidden">
            <AddBenefitForm
              publicationId={publicationId}
              publicationName={publicationName}
              currentBenefitCount={benefits?.length ?? 0}
            />
            {benefits && benefits.length > 0 && (
              <ClearBenefitsDialog
                publicationId={publicationId}
                publicationName={publicationName}
                benefitCount={benefits.length}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

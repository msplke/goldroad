"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";

import { AddBenefitForm } from "~/components/forms/add-benefit-form";
import { ClearBenefitsDialog } from "~/components/forms/clear-benefits-dialog";
import { DeleteBenefitDialog } from "~/components/forms/delete-benefit-dialog";
import { EditBenefitForm } from "~/components/forms/edit-benefit-form";
import { EditPlanPricingForm } from "~/components/forms/edit-plan-pricing-form";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";

interface PublicationPlansProps {
  publicationId: string;
}

export function PublicationPlans({ publicationId }: PublicationPlansProps) {
  const {
    data: plans,
    isLoading,
    error,
  } = api.plan.getByPublication.useQuery(
    { publicationId },
    { enabled: !!publicationId },
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Plans</CardTitle>
          <CardDescription>
            Configure your monthly and annual subscription pricing.
          </CardDescription>
        </CardHeader>
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
        <CardHeader>
          <CardTitle>Payment Plans</CardTitle>
          <CardDescription>
            Configure your monthly and annual subscription pricing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <p className="text-muted-foreground">Failed to load plans</p>
            <p className="text-muted-foreground text-sm">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Plans</CardTitle>
          <CardDescription>
            Configure your monthly and annual subscription pricing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <p className="mb-4 text-muted-foreground">
              No payment plans have been created yet.
            </p>
            <p className="mb-4 text-muted-foreground text-sm">
              Plans are typically created during the onboarding process. If you
              need to create or modify plans, please contact support.
            </p>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatInterval = (interval: string) => {
    return interval === "monthly" ? "Monthly" : "Annual";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Plans</CardTitle>
        <CardDescription>
          Manage your subscription plans. Click the edit icon to update pricing.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {plans.map((plan) => (
          <div key={plan.id} className="space-y-4 rounded-lg border p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                  <h4 className="font-medium">{plan.name}</h4>
                  <Badge variant="secondary" className="w-fit">
                    {formatInterval(plan.interval)}
                  </Badge>
                </div>
                <EditPlanPricingForm
                  plan={{
                    id: plan.id,
                    name: plan.name,
                    amount: plan.amount,
                    interval: plan.interval,
                  }}
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <a
                    href={`https://paystack.com/pay/${plan.paystackPaymentPageUrlSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Page
                  </a>
                </Button>
              </div>
            </div>

            {/* Benefits Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="font-medium text-sm">Plan Benefits</h5>
                <div className="flex gap-2">
                  <AddBenefitForm
                    planId={plan.id}
                    planName={plan.name}
                    currentBenefitCount={plan.planBenefits?.length ?? 0}
                  />
                  {plan.planBenefits && plan.planBenefits.length > 0 && (
                    <ClearBenefitsDialog
                      planId={plan.id}
                      planName={plan.name}
                      benefitCount={plan.planBenefits.length}
                    />
                  )}
                </div>
              </div>

              {plan.planBenefits && plan.planBenefits.length > 0 ? (
                <div className="space-y-2">
                  {plan.planBenefits.map((benefit) => (
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
                  No benefits added yet. Add some benefits to describe what
                  subscribers get with this plan.
                </p>
              )}
            </div>
          </div>
        ))}

        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-muted-foreground text-sm">
            <strong>Note:</strong> Pricing changes are automatically synced with
            Paystack and will apply to new subscribers. Existing subscribers
            will continue with their current pricing until they renew their
            subscription. Each plan can have up to 4 benefits.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

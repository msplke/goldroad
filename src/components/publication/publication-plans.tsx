"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";

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

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatInterval = (interval: string) => {
    return interval === "monthly" ? "Monthly" : "Annual";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Plans</CardTitle>
        <CardDescription>
          Your active subscription plans. Subscribers can choose from these
          options.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-1">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                <h4 className="font-medium">{plan.name}</h4>
                <Badge variant="secondary" className="w-fit">
                  {formatInterval(plan.interval)}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                {formatAmount(plan.amount)} per{" "}
                {plan.interval === "monthly" ? "month" : "year"}
              </p>
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
        ))}

        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-muted-foreground text-sm">
            <strong>Note:</strong> Plan pricing and details are configured
            during setup and cannot be modified directly. Contact support if you
            need to make changes to your plans.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

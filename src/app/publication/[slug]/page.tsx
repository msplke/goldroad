import { CheckIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Icons } from "~/components/icons";
import { MaxWidthWrapper } from "~/components/max-width-wrapper";
import { ModeToggle } from "~/components/mode-toggle";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { constructMetadata } from "~/lib/utils";
import { db } from "~/server/db";
import { api } from "~/trpc/server";

type Params = {
  slug: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;

  const foundPublication = await db.query.publication.findFirst({
    where: (publication, { eq }) => eq(publication.slug, slug),
    columns: { name: true },
  });

  return constructMetadata({
    title: foundPublication
      ? `Subscribe to ${foundPublication.name}`
      : "Publication not found",
  });
}

export default async function PublicationSubscriptionPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;

  try {
    const data = await api.publication.getBySlug({ slug });

    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <MaxWidthWrapper className="absolute top-0 flex justify-end p-4">
            <ModeToggle />
          </MaxWidthWrapper>
          <PublicationHeader
            name={data.publication.name}
            creator={data.creatorName}
            description={data.publication.description}
          />
          <Plans plans={data.plans} benefits={data.publication.benefits} />
          <Footer />
        </div>
      </div>
    );
  } catch (_error) {
    notFound();
  }
}

function Footer() {
  return (
    <div className="mt-8 text-center text-sm">
      Powered by{" "}
      <Link href="/" className="underline">
        Goldroad
      </Link>
    </div>
  );
}

type PublicationHeaderProps = {
  name: string;
  description: string | null;
  creator: string;
};

function PublicationHeader({
  description,
  name,
  creator,
}: PublicationHeaderProps) {
  return (
    <div className="mb-12 text-center">
      <Icons.logo className="mx-auto mb-4 h-10 w-10" />
      <h1 className="mb-2 font-bold text-4xl">{name}</h1>
      <p className="text-lg text-muted-foreground">by {creator}</p>
      {description && (
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}

type Plan = {
  name: string;
  id: string;
  interval: "hourly" | "daily" | "monthly" | "annually";
  amount: number;
  paystackPaymentPageUrlSlug: string;
};

type Benefit = {
  id: string;
  description: string;
  createdAt: Date;
  updatedAt: Date | null;
  publicationId: string;
};

type PlansProps = {
  plans: Plan[];
  benefits: Benefit[];
};

function Plans({ plans, benefits }: PlansProps) {
  const annualPlanPrice = plans.find(
    (plan) => plan.interval === "annually",
  )?.amount;
  const monthlyPlanPrice = plans.find(
    (plan) => plan.interval === "monthly",
  )?.amount;

  const savingsWithAnnual = monthlyPlanPrice
    ? monthlyPlanPrice * 12 - (annualPlanPrice ?? 0)
    : 0;

  const percentageSaved = monthlyPlanPrice
    ? Math.round((savingsWithAnnual / (monthlyPlanPrice * 12)) * 100)
    : 0;

  // The daily and hourly plans are not displayed in the UI. They are mainly for testing purposes.
  const monthlyPlan = plans.find((plan) => plan.interval === "monthly");
  const yearlyPlan = plans.find((plan) => plan.interval === "annually");

  if (plans.length === 0) {
    return <p className="text-center">No subscription plans available.</p>;
  }

  return (
    <>
      <div className="mb-8 text-center">
        <h2 className="font-bold text-3xl">Choose a subscription plan</h2>
      </div>
      <div className="flex justify-center">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {monthlyPlan && (
            <PlanCard
              plan={monthlyPlan}
              benefits={benefits}
              savingsWithAnnual={savingsWithAnnual}
              percentageSaved={percentageSaved}
            />
          )}
          {yearlyPlan && (
            <PlanCard
              plan={yearlyPlan}
              benefits={benefits}
              savingsWithAnnual={savingsWithAnnual}
              percentageSaved={percentageSaved}
            />
          )}
        </div>
      </div>
    </>
  );
}

type PlanCardProps = {
  plan: Plan;
  benefits: Benefit[];
  savingsWithAnnual: number;
  percentageSaved: number;
};

function PlanCard({
  plan,
  benefits,
  savingsWithAnnual,
  percentageSaved,
}: PlanCardProps) {
  return (
    <Card key={plan.id} className="min-w-[280px] max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="capitalize">
          {plan.interval === "annually" ? "annual" : plan.interval}
        </CardTitle>
        <CardDescription>
          <span className="font-bold text-2xl text-foreground">
            Ksh. {plan.amount}
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {benefits.map((benefit) => (
          <div key={benefit.id} className="flex items-start gap-2">
            <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
            <span className="text-sm">{benefit.description}</span>
          </div>
        ))}
        {plan.interval === "annually" && savingsWithAnnual > 0 && (
          <div className="mt-2 flex items-start gap-2">
            <Icons.payments className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-500" />
            <span className="text-sm">
              Save Ksh. {savingsWithAnnual} ({percentageSaved}%) compared to the
              monthly plan
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="h-full items-end">
        <Button asChild className="w-full">
          <Link
            href={`https://paystack.com/pay/${plan.paystackPaymentPageUrlSlug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Subscribe
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

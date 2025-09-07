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

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const foundPublication = await db.query.publication.findFirst({
    where: (publication, { eq }) => eq(publication.slug, params.slug),
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
}: PageProps) {
  try {
    const data = await api.publication.getBySlug({ slug: params.slug });

    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <MaxWidthWrapper className="flex absolute top-0 p-4 justify-end">
            <ModeToggle />
          </MaxWidthWrapper>
          {/* Header */}
          <div className="mb-12 text-center">
            <Icons.logo className="mx-auto mb-4 h-10 w-10" />
            <h1 className="mb-2 font-bold text-4xl">{data.publication.name}</h1>
            <p className="text-lg text-muted-foreground">
              by {data.creatorName}
            </p>
            {data.publication.description && (
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                {data.publication.description}
              </p>
            )}
          </div>

          {/* Subscription Plans */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold">Choose a subscription plan</h2>
          </div>

          {/* Plans Grid */}
          <div className="flex justify-center">
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
              {data.plans.map((plan, index) => (
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
                    {plan.planBenefits.map((benefit) => (
                      <div key={benefit.id} className="flex items-start gap-2">
                        <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                        <span className="text-sm">{benefit.description}</span>
                      </div>
                    ))}
                  </CardContent>

                  <CardFooter>
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
              ))}
            </div>
          </div>
          {/* Back Link */}
          <div className="mt-8 text-center text-sm">
            Powered by{" "}
            <Link href="/" className="underline">
              Goldroad
            </Link>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    notFound();
  }
}

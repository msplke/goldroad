import { eq } from "drizzle-orm";
import type z from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { creator, paidSubscriber, plan, publication } from "~/server/db/schema";
import type {
  PlanInterval,
  SubscriptionStatus,
} from "~/server/fetch-clients/paystack";

export type SubscriberListItem = {
  subscriber: {
    id: string;
    email: string;
    firstName: string | null;
    status: SubscriptionStatus;
    nextPaymentDate: Date | null;
    totalRevenue: number;
    createdAt: Date;
  };
  plan: {
    id: string;
    amount: number;
    interval: z.infer<PlanInterval>;
  };
  publication: {
    id: string;
    name: string;
  };
};

export const subscriberRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    // Get subscribers for these plans
    const subscribers = await ctx.db
      .select({
        subscriber: {
          id: paidSubscriber.id,
          email: paidSubscriber.email,
          firstName: paidSubscriber.firstName,
          status: paidSubscriber.status,
          nextPaymentDate: paidSubscriber.nextPaymentDate,
          totalRevenue: paidSubscriber.totalRevenue,
          createdAt: paidSubscriber.createdAt,
        },
        plan: {
          id: plan.id,
          amount: plan.amount,
          interval: plan.interval,
        },
        publication: {
          id: publication.id,
          name: publication.name,
        },
      })
      .from(paidSubscriber)
      .innerJoin(plan, eq(paidSubscriber.planId, plan.id))
      .innerJoin(publication, eq(plan.publicationId, publication.id))
      .innerJoin(creator, eq(publication.creatorId, creator.id))
      .where(eq(creator.userId, ctx.session.user.id));

    console.log("subscribers", subscribers);
    return subscribers;
  }),
});

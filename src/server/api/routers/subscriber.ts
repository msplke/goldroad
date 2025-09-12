import { eq } from "drizzle-orm";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { creator, paidSubscriber, plan, publication } from "~/server/db/schema";

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

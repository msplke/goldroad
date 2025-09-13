import { count, desc, eq, sum } from "drizzle-orm";

import { getCreator } from "~/server/actions/trpc/creator";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import {
  paidSubscriber,
  plan,
  publication,
} from "~/server/db/schema/app-schema";

export const subscriberRouter = createTRPCRouter({
  // Get all subscribers for the current creator
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const creatorInfo = await getCreator(ctx.db, ctx.session.user.id);

    const subscribers = await db
      .select({
        id: paidSubscriber.id,
        email: paidSubscriber.email,
        firstName: paidSubscriber.firstName,
        status: paidSubscriber.status,
        nextPaymentDate: paidSubscriber.nextPaymentDate,
        totalRevenue: paidSubscriber.totalRevenue,
        createdAt: paidSubscriber.createdAt,
        planName: plan.name,
        planAmount: plan.amount,
        planInterval: plan.interval,
        publicationName: publication.name,
      })
      .from(paidSubscriber)
      .innerJoin(plan, eq(paidSubscriber.planId, plan.id))
      .innerJoin(publication, eq(plan.publicationId, publication.id))
      .where(eq(publication.creatorId, creatorInfo.id))
      .orderBy(desc(paidSubscriber.createdAt));

    return subscribers;
  }),

  // Get subscriber statistics for KPIs
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const creatorInfo = await getCreator(ctx.db, ctx.session.user.id);

    // Get active subscriber count
    const activeSubscriberCount = await db
      .select({ count: count() })
      .from(paidSubscriber)
      .innerJoin(plan, eq(paidSubscriber.planId, plan.id))
      .innerJoin(publication, eq(plan.publicationId, publication.id))
      .where(eq(publication.creatorId, creatorInfo.id))
      .then((result) => result[0]?.count ?? 0);

    // Get total revenue
    const totalRevenue = await db
      .select({ total: sum(paidSubscriber.totalRevenue) })
      .from(paidSubscriber)
      .innerJoin(plan, eq(paidSubscriber.planId, plan.id))
      .innerJoin(publication, eq(plan.publicationId, publication.id))
      .where(eq(publication.creatorId, creatorInfo.id))
      .then((result) => Number(result[0]?.total ?? 0));

    // Calculate monthly recurring revenue (simplified - assumes all subscriptions are monthly)
    const monthlyRevenue = await db
      .select({
        amount: plan.amount,
        interval: plan.interval,
      })
      .from(paidSubscriber)
      .innerJoin(plan, eq(paidSubscriber.planId, plan.id))
      .innerJoin(publication, eq(plan.publicationId, publication.id))
      .where(eq(publication.creatorId, creatorInfo.id));

    const mrr = monthlyRevenue.reduce((total, sub) => {
      if (sub.interval === "monthly") {
        return total + sub.amount;
      } else if (sub.interval === "annually") {
        return total + sub.amount / 12;
      }
      return total;
    }, 0);

    return {
      activeSubscribers: activeSubscriberCount,
      totalRevenue,
      monthlyRecurringRevenue: Math.round(mrr),
    };
  }),
});

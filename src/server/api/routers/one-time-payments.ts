import { desc, eq } from "drizzle-orm";
import z from "zod";

import { getCreator } from "~/server/actions/trpc/creator";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { publication, successfulOneTimePayment } from "~/server/db/schema";

const MIN_RECENT_RECORDS = 1;
const MAX_RECENT_RECORDS = 30;
const DEFAULT_RECENT_RECORDS = 5;

const limitQuerySchema = z
  .int()
  .min(MIN_RECENT_RECORDS)
  .max(MAX_RECENT_RECORDS);

export const oneTimePaymentsRouter = createTRPCRouter({
  /** Gets the most recent one-time payments for the current creator
   * (the number is determined by the `NO_OF_RECENT_RECORDS` constant in ~/lib/constants (default 5))
   * */
  getRecent: protectedProcedure
    .input(
      z.object({
        limit: limitQuerySchema.optional().default(DEFAULT_RECENT_RECORDS),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { id: creatorId } = await getCreator(ctx.db, ctx.session.user.id);

      const payments = await ctx.db
        .select({
          id: successfulOneTimePayment.id,
          paystackPaymentReference:
            successfulOneTimePayment.paystackPaymentReference,
          publicationId: publication.id,
          publicationName: publication.name,
          email: successfulOneTimePayment.email,
          firstName: successfulOneTimePayment.firstName,
          lastName: successfulOneTimePayment.lastName,
          amount: successfulOneTimePayment.amount,
          channel: successfulOneTimePayment.channel,
          createdAt: successfulOneTimePayment.createdAt,
        })
        .from(publication)
        .where(eq(publication.creatorId, creatorId))
        .leftJoin(
          successfulOneTimePayment,
          eq(successfulOneTimePayment.publicationId, publication.id),
        )
        .orderBy(desc(successfulOneTimePayment.createdAt))
        .limit(input.limit);

      return payments;
    }),
});

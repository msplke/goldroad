import { z } from "zod";

import { env } from "~/env";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { paid_subscriber } from "~/server/db/schema";
import {
  kitClient,
  kitSubscriberCreateSchema,
} from "~/server/fetch-clients/kit";

export const subscriberRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        subscriberInfo: kitSubscriberCreateSchema,
        paystackInfo: z.object({
          subscriptionCode: z.string(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Create subscriber on Kit. The API upserts the user if they exist.
      const { data: createSubscriberRes } = await kitClient(
        "@post/subscribers/",
        {
          body: input.subscriberInfo,
          throws: true,
        },
      );

      if (createSubscriberRes === null) throw new Error("No data");

      const subscriber = createSubscriberRes.subscriber;

      // Get the id of the tag that shows that a payment has been done
      // For now, it is done by just using an environment variable

      // Tag the created user appropriately
      const { data: tagSubscriberRes } = await kitClient(
        "@post/tags/:tagId/subscribers/:subscriberId",
        {
          params: {
            tagId: env.KIT_PAID_TAG_ID,
            subscriberId: subscriber.id.toString(),
          },
          throws: true,
        },
      );

      if (!tagSubscriberRes) {
        throw new Error("No data");
      }

      // Add the subscriber to the database
      await ctx.db
        .insert(paid_subscriber)
        .values({
          email: subscriber.email_address,
          firstName: subscriber.first_name ?? "",
          paystackSubscriptionCode: input.paystackInfo.subscriptionCode,
          kitSubscriberId: subscriber.id,
          status: env.KIT_PAID_TAG_NAME,
        })
        .onConflictDoNothing({
          target: [
            paid_subscriber.kitSubscriberId,
            paid_subscriber.paystackSubscriptionCode,
          ],
        });
    }),
});

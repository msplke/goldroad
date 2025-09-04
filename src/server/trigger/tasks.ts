import { logger, schemaTask } from "@trigger.dev/sdk";
import z from "zod";

import {
  createSubscriber,
  getSubscriberInfoBySubscriptionCode,
} from "~/server/actions/webhooks/paystack";
import { db } from "~/server/db";
import { kitSubscriberCreateSchema } from "~/server/fetch-clients/kit";

export const createSubscriberTask = schemaTask({
  id: "webhook:create-subscriber",
  schema: z.object({
    subscriberInfo: kitSubscriberCreateSchema,
    subscriptionCode: z.string(),
    planCode: z.string(),
  }),
  // Set an optional maxDuration to prevent tasks from running indefinitely
  maxDuration: 420, // Stop executing after 420 secs (7 mins) of compute
  run: async (payload, { ctx }) => {
    logger.log("Creating subscriber...", { ctx });

    try {
      // Check if subscriber exists on DB
      const subscriberExists = await getSubscriberInfoBySubscriptionCode(
        db,
        payload.subscriptionCode,
      );

      if (subscriberExists) {
        return { message: "Subscriber already exists." };
      }

      await createSubscriber(
        db,
        payload.subscriberInfo,
        payload.subscriptionCode,
        payload.planCode,
      );

      return { message: "Successfully created subscriber" };
    } catch (error) {
      console.error(error);
      logger.error("Error occurred, unable to create subscriber", { error });
      throw error;
    }
  },
});

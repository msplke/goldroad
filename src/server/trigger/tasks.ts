import { logger, schemaTask } from "@trigger.dev/sdk";
import z from "zod";

import {
  createSubscriber,
  getSubscriberInfoBySubscriptionCode,
  handleSubscriptionCancelled,
  handleSubscriptionDisabled,
  updateOnFailedSubsequentPayment,
  updateOnSuccessfulSubsequentPayment,
} from "~/server/actions/webhooks/paystack";
import { db } from "~/server/db";
import { kitSubscriberCreateSchema } from "~/server/fetch-clients/kit";

export const createSubscriberTask = schemaTask({
  id: "webhook:create-subscriber",
  schema: z.object({
    subscriberInfo: kitSubscriberCreateSchema,
    subscriptionCode: z.string(),
    planCode: z.string(),
    nextPaymentDate: z.date(),
    amount: z.number(),
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
        payload.amount,
        payload.nextPaymentDate,
      );

      return { message: "Successfully created subscriber" };
    } catch (error) {
      logger.error("Error occurred, unable to create subscriber", { error });
      throw error;
    }
  },
});

export const subscriptionDisabledTask = schemaTask({
  id: "webhook:handle-subscription-disabled",
  schema: z.object({
    subscriptionCode: z.string(),
    planCode: z.string(),
  }),
  run: async (payload, { ctx }) => {
    logger.log("Handling subscription.disabled...", { ctx });
    try {
      await handleSubscriptionDisabled(
        db,
        payload.subscriptionCode,
        payload.planCode,
      );
    } catch (error) {
      logger.error("Error occurred, unable to handle subscription.disabled", {
        error,
      });
      throw error;
    }
  },
});

export const subscriptionCancelledTask = schemaTask({
  id: "webhook:handle-subscription-cancelled",
  schema: z.object({
    subscriptionCode: z.string(),
    planCode: z.string(),
  }),
  run: async (payload, { ctx }) => {
    logger.log("Handling subscription.cancelled...", { ctx });
    try {
      await handleSubscriptionCancelled(
        db,
        payload.subscriptionCode,
        payload.planCode,
      );
    } catch (error) {
      logger.error("Error occurred, unable to handle subscription.cancelled", {
        error,
      });
      throw error;
    }
  },
});

export const updateOnSuccessfulSubsequentPaymentTask = schemaTask({
  id: "webhook:update-on-subsequent-payment",
  schema: z.object({
    subscriptionCode: z.string(),
    planCode: z.string(),
    nextPaymentDate: z.date(),
    amount: z.number(),
  }),
  run: async (payload, { ctx }) => {
    logger.log("Updating subscriber on subsequent payment...", { ctx });
    try {
      await updateOnSuccessfulSubsequentPayment(
        db,
        payload.subscriptionCode,
        payload.planCode,
        payload.nextPaymentDate,
        payload.amount,
      );

      return { message: "Subscriber updated successfully" };
    } catch (error) {
      logger.error(
        "Error occurred, unable to update subscriber on subsequent payment",
        {
          error,
        },
      );
      throw error;
    }
  },
});

export const updateOnFailedSubsequentPaymentTask = schemaTask({
  id: "webhook:update-on-failed-subsequent-payment",
  schema: z.object({
    subscriptionCode: z.string(),
    planCode: z.string(),
  }),
  run: async (payload, { ctx }) => {
    logger.log("Updating subscriber on failed subsequent payment...", { ctx });
    try {
      // Implement the logic to handle failed subsequent payments if needed
      await updateOnFailedSubsequentPayment(
        db,
        payload.subscriptionCode,
        payload.planCode,
      );
      return { message: "Handled failed subsequent payment" };
    } catch (error) {
      logger.error(
        "Error occurred, unable to handle failed subsequent payment",
        {
          error,
        },
      );
      throw error;
    }
  },
});

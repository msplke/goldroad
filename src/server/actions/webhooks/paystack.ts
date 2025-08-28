import "server-only";

/** These are actions that are to be executed only in Paystack webhooks */

import type z from "zod";

import { env } from "~/env";
import { db } from "~/server/db";
import { paidSubscriber } from "~/server/db/schema/app-schema";
import {
  kitClient,
  type kitSubscriberCreateSchema,
} from "~/server/fetch-clients/kit";

export async function createSubscriber(
  subscriberInfo: z.infer<typeof kitSubscriberCreateSchema>,
  subscriptionCode: string,
) {
  // Create subscriber on Kit. The API upserts the user if they exist.
  const { data: createSubscriberRes } = await kitClient("@post/subscribers/", {
    body: subscriberInfo,
    throws: true,
  });

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
  await db
    .insert(paidSubscriber)
    .values({
      email: subscriber.email_address,
      firstName: subscriber.first_name ?? "",
      paystackSubscriptionCode: subscriptionCode,
      kitSubscriberId: subscriber.id,
      status: env.KIT_PAID_TAG_NAME,
    })
    .onConflictDoNothing({
      target: paidSubscriber.kitSubscriberId,
    });
}

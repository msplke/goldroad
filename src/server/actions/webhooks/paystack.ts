import { eq } from "drizzle-orm";
import "server-only";

/** These are actions that are to be executed only in Paystack webhooks */

import type z from "zod";

import { decryptSecret } from "~/server/crypto/kit-secrets";
import type { DbType } from "~/server/db";
import {
  creator,
  paidSubscriber,
  plan,
  publication,
  tagInfo,
} from "~/server/db/schema/app-schema";
import {
  kitClient,
  type kitSubscriberCreateSchema,
} from "~/server/fetch-clients/kit";

/** This function is currently stale. Some updates need to be made for it to
 * be usable
 */
export async function createSubscriber(
  db: DbType,
  subscriberInfo: z.infer<typeof kitSubscriberCreateSchema>,
  subscriptionCode: string,
  planCode: string,
) {
  // Get the id of the tag that shows that a payment has been done
  const { intervalTag, statusTag, publicationTag, planId, kitApiKey } =
    await getCreatorInfoFromPlanCode(db, planCode);

  if (!kitApiKey) {
    // This ideally should never be called, since at this point the creator should
    // have filled out all the required details, and thus the Kit API key should be set.
    throw new Error(
      "Unable to create subscriber. Creator Kit API Key not set!",
    );
  }

  // Create subscriber on Kit. The API upserts the user if they exist.
  const { data: createSubscriberKitRes } = await kitClient(
    "@post/subscribers/",
    {
      body: subscriberInfo,
      throws: true,
      headers: {
        "X-Kit-Api-Key": decryptSecret(kitApiKey),
      },
    },
  );

  if (createSubscriberKitRes === null)
    throw new Error("Unable to create subscriber on Kit");

  const kitSubscriber = createSubscriberKitRes.subscriber;

  // Tag the created user appropriately (failures will have to be resolved manually)
  // This could be simplified by using the bulk tag addition Kit API endpoint, but
  // that requires implementing Kit OAuth, which has not been done yet.
  const tagResults = await Promise.all([
    await tagSubscriberOnKit(
      intervalTag.toString(),
      kitSubscriber.id.toString(),
      kitApiKey,
    ),
    await tagSubscriberOnKit(
      publicationTag.toString(),
      kitSubscriber.id.toString(),
      kitApiKey,
    ),
    await tagSubscriberOnKit(
      statusTag.toString(),
      kitSubscriber.id.toString(),
      kitApiKey,
    ),
  ]);

  console.log("Tag results:", tagResults);

  // Add the subscriber to the database
  await db
    .insert(paidSubscriber)
    .values({
      planId,
      email: subscriberInfo.email_address,
      firstName: subscriberInfo.first_name ?? "",
      paystackSubscriptionCode: subscriptionCode,
      kitSubscriberId: kitSubscriber.id,
      status: "active",
    })
    .onConflictDoNothing({
      target: paidSubscriber.paystackSubscriptionCode,
    });
}

export async function getSubscriberInfoBySubscriptionCode(
  db: DbType,
  paystackSubscriptionCode: string,
) {
  // Check if subscriber exists in app db
  const foundSubscriber = await db.query.paidSubscriber.findFirst({
    where: eq(
      paidSubscriber.paystackSubscriptionCode,
      paystackSubscriptionCode,
    ),
  });

  return foundSubscriber;
}

async function getCreatorInfoFromPlanCode(
  db: DbType,
  paystackPlanCode: string,
) {
  const foundPlan = await db.query.plan.findFirst({
    where: eq(plan.paystackPlanCode, paystackPlanCode),
    columns: {
      id: true,
      publicationId: true,
      interval: true,
    },
  });

  if (!foundPlan) {
    throw new Error("Could not find corresponding plan on the DB");
  }

  const foundPublication = await db.query.publication.findFirst({
    where: eq(publication.id, foundPlan.publicationId),
    columns: {
      creatorId: true,
      kitPublicationTagId: true,
    },
  });

  if (!foundPublication) {
    throw new Error("Unable to find creator for this plan");
  }

  const creatorInfo = await db.query.creator.findFirst({
    where: eq(creator.id, foundPublication.creatorId),
    columns: {
      kitApiKey: true,
    },
  });

  if (!creatorInfo) {
    throw new Error("Unable to find creator for publication");
  }

  const foundTagInfo = await db.query.tagInfo.findFirst({
    where: eq(tagInfo.creatorId, foundPublication.creatorId),
  });

  if (!foundTagInfo) {
    throw new Error("Unable to retrieve tag info");
  }

  let intervalTag: number;

  switch (foundPlan.interval) {
    case "annually":
      intervalTag = foundTagInfo.kitAnnualSubscriberTag;
      break;
    case "monthly":
      intervalTag = foundTagInfo.kitMonthlySubscriberTag;
      break;
    case "daily":
      intervalTag = foundTagInfo.kitDailySubscriberTag;
      break;
    case "hourly":
      intervalTag = foundTagInfo.kitHourlySubscriberTag;
      break;
  }

  return {
    intervalTag,
    publicationTag: foundPublication.kitPublicationTagId,
    statusTag: foundTagInfo.kitActiveTagId,
    planId: foundPlan.id,
    kitApiKey: creatorInfo.kitApiKey,
  };
}

async function tagSubscriberOnKit(
  tag: string,
  subscriberId: string,
  kitApiKey: string,
) {
  const { data: tagSubscriberRes } = await kitClient(
    "@post/tags/:tagId/subscribers/:subscriberId",
    {
      params: {
        tagId: tag,
        subscriberId: subscriberId,
      },
      headers: {
        "X-Kit-Api-Key": decryptSecret(kitApiKey),
      },
      throws: true,
    },
  );

  if (!tagSubscriberRes) {
    throw new Error("No data");
  }

  return tagSubscriberRes;
}

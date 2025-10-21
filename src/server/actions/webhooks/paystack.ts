import { eq, sql } from "drizzle-orm";
import "server-only";

/** These are actions that are to be executed only in Paystack webhooks */

import type z from "zod";

import { decryptSecret } from "~/server/crypto/kit-secrets";
import type { DbType } from "~/server/db";
import {
  creator,
  type InsertSuccessfulOneTimePayment,
  oneTimePaymentPage,
  paidSubscriber,
  plan,
  publication,
  successfulOneTimePayment,
  tagInfo,
} from "~/server/db/schema/app-schema";
import {
  KIT_API_KEY_HEADER,
  kitClient,
  type kitSubscriberCreateSchema,
} from "~/server/fetch-clients/kit";

export async function createSubscriber(
  db: DbType,
  subscriberInfo: z.infer<typeof kitSubscriberCreateSchema>,
  subscriptionCode: string,
  planCode: string,
  amount: number,
  nextPaymentDate: Date,
) {
  // Get the id of the tag that shows that a payment has been done
  const { intervalTag, statusTag, publicationTag, planId, kitApiKey } =
    await getCreatorInfoFromPlanCode(db, planCode);

  let kitSubscriberId: number | null = null;

  // Only attempt Kit integration if API key is present and tag info is available
  if (kitApiKey && intervalTag !== null && statusTag !== null) {
    try {
      // Create subscriber on Kit. The API upserts the user if they exist.
      const { data: createSubscriberKitRes } = await kitClient(
        "@post/subscribers/",
        {
          body: subscriberInfo,
          throws: true,
          headers: {
            [KIT_API_KEY_HEADER]: decryptSecret(kitApiKey),
          },
        },
      );

      if (createSubscriberKitRes === null) {
        console.warn("Failed to create subscriber on Kit");
      } else {
        const kitSubscriber = createSubscriberKitRes.subscriber;
        kitSubscriberId = kitSubscriber.id;

        // Tag the created user appropriately (failures will have to be resolved manually)
        // This could be simplified by using the bulk tag addition Kit API endpoint, but
        // that requires implementing Kit OAuth, which has not been done yet.
        const tagPromises = [
          tagSubscriberOnKit(
            intervalTag.toString(),
            kitSubscriber.id.toString(),
            kitApiKey,
          ),
          tagSubscriberOnKit(
            statusTag.toString(),
            kitSubscriber.id.toString(),
            kitApiKey,
          ),
        ];

        // Only add publication tag if it exists
        if (publicationTag !== null) {
          tagPromises.push(
            tagSubscriberOnKit(
              publicationTag.toString(),
              kitSubscriber.id.toString(),
              kitApiKey,
            ),
          );
        }

        const tagResults = await Promise.all(tagPromises);

        console.log("Tag results:", tagResults);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("Kit integration failed, continuing without it:", msg);
      // Don't throw - we can still create the subscriber without Kit integration
    }
  } else {
    console.log(
      "Kit API key not found, creating subscriber without Kit integration",
    );
  }

  // Add the subscriber to the database (with or without Kit subscriber ID)
  await db
    .insert(paidSubscriber)
    .values({
      planId,
      email: subscriberInfo.email_address,
      firstName: subscriberInfo.first_name ?? "",
      paystackSubscriptionCode: subscriptionCode,
      kitSubscriberId, // Will be null if Kit integration is not set up
      status: "active",
      totalRevenue: amount,
      nextPaymentDate,
    })
    .onConflictDoNothing({
      target: paidSubscriber.paystackSubscriptionCode,
    });
}

export async function handleSubscriptionCancelled(
  db: DbType,
  subscriptionCode: string,
  planCode: string,
) {
  const foundSubscriber = await getSubscriberInfoBySubscriptionCode(
    db,
    subscriptionCode,
  );

  if (!foundSubscriber) {
    console.log(
      `No subscriber found for subscription code ${subscriptionCode}`,
    );
    return;
  }

  const { kitApiKey, creatorId, planId } = await getCreatorInfoFromPlanCode(
    db,
    planCode,
  );

  if (foundSubscriber.planId !== planId) {
    throw new Error(
      `Plan ID mismatch for subscriber. Subscriber plan ID: ${foundSubscriber.planId}, Plan ID from Paystack webhook: ${planId}`,
    );
  }

  // Update the subscriber status on the app db
  await db
    .update(paidSubscriber)
    .set({
      status: "non-renewing",
      nextPaymentDate: null,
    })
    .where(eq(paidSubscriber.id, foundSubscriber.id));

  // Only update Kit if integration is set up and subscriber has Kit ID
  if (kitApiKey && foundSubscriber.kitSubscriberId) {
    try {
      const decryptedKitApiKey = decryptSecret(kitApiKey);

      const foundTagInfo = await db.query.tagInfo.findFirst({
        where: eq(tagInfo.creatorId, creatorId),
      });

      if (!foundTagInfo) {
        console.warn("Tag info not found, skipping Kit tag updates");
        return;
      }

      // Remove the current active tag from the subscriber
      await kitClient("@delete/tags/:tagId/subscribers/:subscriberId", {
        params: {
          tagId: foundTagInfo.kitActiveTagId.toString(),
          subscriberId: foundSubscriber.kitSubscriberId.toString(),
        },
        headers: {
          [KIT_API_KEY_HEADER]: decryptedKitApiKey,
        },
        throws: true,
      });

      // Add the non-renewing tag to the subscriber
      await kitClient("@post/tags/:tagId/subscribers/:subscriberId", {
        params: {
          tagId: foundTagInfo.kitNonRenewingTagId.toString(),
          subscriberId: foundSubscriber.kitSubscriberId.toString(),
        },
        headers: {
          [KIT_API_KEY_HEADER]: decryptedKitApiKey,
        },
        throws: true,
      });
    } catch (error) {
      console.error(
        "Failed to update Kit tags for cancelled subscription:",
        error,
      );
      // Don't throw - we've already updated the database
    }
  } else {
    console.log("Kit integration not available, skipping Kit tag updates");
  }
}

export async function handleSubscriptionDisabled(
  db: DbType,
  subscriptionCode: string,
  planCode: string,
) {
  const foundSubscriber = await getSubscriberInfoBySubscriptionCode(
    db,
    subscriptionCode,
  );

  if (!foundSubscriber) {
    console.log(
      `No subscriber found for subscription code ${subscriptionCode}`,
    );
    return;
  }

  const { kitApiKey } = await getCreatorInfoFromPlanCode(db, planCode);

  // Update the subscriber status on the app db
  await db
    .update(paidSubscriber)
    .set({
      status: "cancelled",
    })
    .where(eq(paidSubscriber.id, foundSubscriber.id));

  // Only unsubscribe on Kit if integration is set up and subscriber has Kit ID
  if (kitApiKey && foundSubscriber.kitSubscriberId) {
    try {
      // Unsubscribe the subscriber on Kit
      // There's currently no way to delete a subscriber on Kit through the API. Additionally
      // the API does not allow one to resubscribe a deleted subscriber.
      // (https://developers.kit.com/api-reference/subscribers/create-a-subscriber)
      // This means that once a subscriber is unsubscribed, manual action will be required
      // from the creator if they would like to resubscribe them.
      await kitClient("@post/subscribers/:subscriberId/unsubscribe", {
        params: {
          subscriberId: foundSubscriber.kitSubscriberId.toString(),
        },
        headers: {
          [KIT_API_KEY_HEADER]: decryptSecret(kitApiKey),
        },
        throws: true,
      });
    } catch (error) {
      console.error("Failed to unsubscribe on Kit:", error);
      // Don't throw - we've already updated the database
    }
  } else {
    console.log("Kit integration not available, skipping Kit unsubscribe");
  }
}

export async function updateOnSuccessfulSubsequentPayment(
  db: DbType,
  subscriptionCode: string,
  planCode: string,
  nextPaymentDate: Date,
  amount: number,
) {
  const foundSubscriber = await db.query.paidSubscriber.findFirst({
    where: eq(paidSubscriber.paystackSubscriptionCode, subscriptionCode),
  });

  if (!foundSubscriber) {
    throw new Error(
      `Subscriber with subscription code ${subscriptionCode} not found`,
    );
  }

  const { planId } = await getCreatorInfoFromPlanCode(db, planCode);

  if (foundSubscriber.planId !== planId) {
    throw new Error(
      `Plan ID mismatch for subscriber. Subscriber plan ID: ${foundSubscriber.planId}, Plan ID from Paystack webhook: ${planId}`,
    );
  }

  // The status tag on Kit at this point should already be set to `active` from the initial subscription creation.

  await db
    .update(paidSubscriber)
    .set({
      status: "active",
      totalRevenue: sql`${paidSubscriber.totalRevenue} + ${amount}`,
      nextPaymentDate,
    })
    .where(eq(paidSubscriber.id, foundSubscriber.id));
}

export async function updateOnFailedSubsequentPayment(
  db: DbType,
  subscriptionCode: string,
  planCode: string,
) {
  const foundSubscriber = await db.query.paidSubscriber.findFirst({
    where: eq(paidSubscriber.paystackSubscriptionCode, subscriptionCode),
  });

  if (!foundSubscriber) {
    throw new Error(
      `Subscriber with subscription code ${subscriptionCode} not found`,
    );
  }

  const { planId } = await getCreatorInfoFromPlanCode(db, planCode);

  if (foundSubscriber.planId !== planId) {
    throw new Error(
      `Plan ID mismatch for subscriber. Subscriber plan ID: ${foundSubscriber.planId}, Plan ID from Paystack webhook: ${planId}`,
    );
  }

  // Update the subscriber status on the app db
  await db
    .update(paidSubscriber)
    .set({
      status: "attention",
      nextPaymentDate: null,
    })
    .where(eq(paidSubscriber.id, foundSubscriber.id));

  // Tag the subscriber as needing attention on Kit (if Kit integration is available)
  const { kitApiKey, creatorId } = await getCreatorInfoFromPlanCode(
    db,
    planCode,
  );

  if (kitApiKey && foundSubscriber.kitSubscriberId) {
    try {
      const decryptedKitApiKey = decryptSecret(kitApiKey);
      const foundTagInfo = await db.query.tagInfo.findFirst({
        where: eq(tagInfo.creatorId, creatorId),
      });

      if (!foundTagInfo) {
        console.warn("Tag info not found, skipping Kit tag updates");
        return;
      }

      // Remove the current active tag from the subscriber
      await kitClient("@delete/tags/:tagId/subscribers/:subscriberId", {
        params: {
          tagId: foundTagInfo.kitActiveTagId.toString(),
          subscriberId: foundSubscriber.kitSubscriberId.toString(),
        },
        headers: {
          [KIT_API_KEY_HEADER]: decryptedKitApiKey,
        },
        throws: true,
      });

      // Add the attention tag to the subscriber
      await kitClient("@post/tags/:tagId/subscribers/:subscriberId", {
        params: {
          tagId: foundTagInfo.kitAttentionTagId.toString(),
          subscriberId: foundSubscriber.kitSubscriberId.toString(),
        },
        headers: {
          [KIT_API_KEY_HEADER]: decryptedKitApiKey,
        },
        throws: true,
      });
    } catch (error) {
      console.error("Failed to update Kit tags for failed payment:", error);
      // Don't throw - we've already updated the database
    }
  } else {
    console.log("Kit integration not available, skipping Kit tag updates");
  }
}

/** Records information on a successful one-time payment onto the DB.
 * @param paymentPageSlug - This is used to determine which publication
 * the one-time payment was for. It works because the application is currently setup
 * to use Paystack payment pages, and for some reason (fortunately for me),
 * the payment page url is returned as metadata with the
 * event denoting a successful payment (`charge.success`).
 */
export async function addSuccessfulOneTimePayment(
  db: DbType,
  paymentPageSlug: string,
  oneTimePaymentData: Omit<InsertSuccessfulOneTimePayment, "publicationId">,
) {
  await db.transaction(async (tx) => {
    const foundPage = await tx.query.oneTimePaymentPage.findFirst({
      where: eq(oneTimePaymentPage.paystackPaymentPageUrlSlug, paymentPageSlug),
      columns: { publicationId: true },
    });

    if (!foundPage) {
      throw new Error("No associated publication found");
    }

    await tx.insert(successfulOneTimePayment).values({
      ...oneTimePaymentData,
      publicationId: foundPage.publicationId,
    });
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

  // If no tag info is found, it means Kit integration is not set up
  if (!foundTagInfo) {
    return {
      intervalTag: null,
      creatorId: foundPublication.creatorId,
      publicationTag: foundPublication.kitPublicationTagId,
      statusTag: null,
      planId: foundPlan.id,
      kitApiKey: creatorInfo.kitApiKey,
    };
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
    default:
      throw new Error("Unknown plan interval");
  }

  return {
    intervalTag,
    creatorId: foundPublication.creatorId,
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
        [KIT_API_KEY_HEADER]: decryptSecret(kitApiKey),
      },
      throws: true,
    },
  );

  if (!tagSubscriberRes) {
    throw new Error("No data");
  }

  return tagSubscriberRes;
}

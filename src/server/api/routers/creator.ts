import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import z from "zod";

import { SUBACCOUNT_PERCENTAGE_CHARGE } from "~/lib/constants";
import { checkCreatorExists, getCreator } from "~/server/actions/trpc/creator";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { decryptSecret, encryptSecret } from "~/server/crypto/kit-secrets";
import { db } from "~/server/db";
import {
  creator,
  plan,
  publication,
  tagInfo,
} from "~/server/db/schema/app-schema";
import { KIT_API_KEY_HEADER, kitClient } from "~/server/fetch-clients/kit";
import { paystackClient } from "~/server/fetch-clients/paystack/client";
import { planIntervalEnum } from "~/server/fetch-clients/paystack/schemas/plan";
import { createSubaccountSchema } from "~/server/fetch-clients/paystack/schemas/subaccount";
import { subscriptionStatusEnum } from "~/server/fetch-clients/paystack/schemas/subscription";
import { paystackApiService } from "~/server/services/paystack/paystack-api";

type SubaccountCreationInfo = z.infer<typeof createSubaccountSchema>;

const kitTagEnum = z.union([subscriptionStatusEnum, planIntervalEnum]);
export type KitTag = z.infer<typeof kitTagEnum>;

const kitTagList = [
  ...subscriptionStatusEnum.options,
  ...planIntervalEnum.options,
];

export const creatorRouter = createTRPCRouter({
  create: protectedProcedure.mutation(async ({ ctx }) => {
    if (await checkCreatorExists(ctx.db, ctx.session.user.id)) {
      throw new TRPCError({
        message: "This user is already a creator",
        code: "BAD_REQUEST",
      });
    }

    console.log("Adding creator to DB...");

    const result = await db
      .insert(creator)
      .values({
        userId: ctx.session.user.id,
      })
      .returning({ id: creator.id });

    const newCreator = result[0];
    if (!newCreator) {
      throw new TRPCError({
        message: "Unable to add creator to db",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
    console.log("Added creator successfully!");
    return newCreator;
  }),

  /**Returns `null` if a creator is not found. */
  get: protectedProcedure.query(async ({ ctx }) => {
    const c = await checkCreatorExists(ctx.db, ctx.session.user.id);

    if (!c) return null;

    // Check if creator has publications (infer publication setup completion)
    const hasPublications = await ctx.db.query.publication.findFirst({
      where: eq(publication.creatorId, c.id),
    });

    // Check if creator has plans (infer payment plans setup completion)
    let hasPlans = false;
    if (hasPublications) {
      const planExists = await ctx.db.query.plan.findFirst({
        where: eq(plan.publicationId, hasPublications.id),
      });
      hasPlans = !!planExists;
    }

    return {
      id: c.id,
      userId: c.userId,
      hasKitApiKey: Boolean(c.kitApiKey),
      hasBankInfo: Boolean(c.paystackSubaccountCode),
      hasCompletedPublicationSetup: Boolean(hasPublications),
      hasCompletedPaymentPlansSetup: hasPlans,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }),

  addOrUpdateKitApiKey: protectedProcedure
    .input(z.object({ kitApiKey: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 1. Perform a test request to see if the API key is valid or not
      console.log("Verifying Kit API key is valid...");
      const { error } = await kitClient("@get/tags/", {
        query: { per_page: 1 },
        headers: {
          [KIT_API_KEY_HEADER]: input.kitApiKey,
        },
      });

      if (error) {
        console.error(
          `Kit API validation error: ${error.status} - ${error.statusText}`,
        );
        if (error.status === 401) {
          throw new TRPCError({
            message:
              "Kit API key is invalid. Please check your API key and try again.",
            code: "BAD_REQUEST",
          });
        } else {
          throw new TRPCError({
            message: `Kit API error: ${
              error.statusText || "Unable to validate API key"
            }`,
            code: "INTERNAL_SERVER_ERROR",
          });
        }
      }

      // 2. Check if tag info already exists for this creator with the given api key
      const { id: creatorId, kitApiKey: creatorKitApiKey } = await getCreator(
        ctx.db,
        ctx.session.user.id,
      );

      let decryptedKitApiKey: string | null = null;

      if (creatorKitApiKey) {
        try {
          decryptedKitApiKey = decryptSecret(creatorKitApiKey);
        } catch (error) {
          console.warn(
            "Failed to decrypt existing Kit API key, will update with new one:",
            error,
          );
          // If decryption fails, we'll treat it as if there's no existing key
          decryptedKitApiKey = null;
        }
      }

      if (
        decryptedKitApiKey !== null &&
        input.kitApiKey === decryptedKitApiKey
      ) {
        // No changes needed, return early with success message
        console.log("No changes needed, API key is already up to date...");
        return { message: "API key is already up to date" };
      }

      // 3. Add subscription status and interval tags to the Kit
      console.log("Adding subscription status and interval tags to kit...");

      let tagIdMap: Record<KitTag, number>;
      try {
        tagIdMap = await addStatusAndTierTagsToKit(input.kitApiKey);
      } catch (error) {
        console.error("Failed to create Kit tags:", error);
        throw new TRPCError({
          message: "Failed to create tags in Kit.",
          code: "INTERNAL_SERVER_ERROR",
        });
      }

      console.log("Adding kit tag ids to tag info table...");
      // 4. Add tags to the tag info table, linking them to the creator
      // Check if tag info already exists for this creator
      try {
        const existingTagInfo = await ctx.db.query.tagInfo.findFirst({
          where: eq(tagInfo.creatorId, creatorId),
        });

        const values = {
          creatorId,
          kitActiveTagId: tagIdMap.active,
          kitNonRenewingTagId: tagIdMap["non-renewing"],
          kitAttentionTagId: tagIdMap.attention,
          kitCompletedTagId: tagIdMap.completed,
          kitCancelledTagId: tagIdMap.cancelled,
          kitMonthlySubscriberTag: tagIdMap.monthly,
          kitAnnualSubscriberTag: tagIdMap.annually,
          kitDailySubscriberTag: tagIdMap.daily,
          kitHourlySubscriberTag: tagIdMap.hourly,
        };

        if (existingTagInfo) {
          await ctx.db.update(tagInfo).set(values);
        } else {
          await ctx.db.insert(tagInfo).values(values);
        }

        // 5. Update creator with encrypted API key
        await ctx.db
          .update(creator)
          .set({
            kitApiKey: encryptSecret(input.kitApiKey),
          })
          .where(eq(creator.id, creatorId));
      } catch (error) {
        console.error("Failed to update database:", error);
        throw new TRPCError({
          message: "Failed to save Kit integration settings to database.",
          code: "INTERNAL_SERVER_ERROR",
        });
      }

      console.log("Successfully added tags and API key.");
      console.log("Successfully added creator!");

      return { message: "Kit API key updated successfully" };
    }),

  addBankAccountInfo: protectedProcedure
    .input(createSubaccountSchema.omit({ percentage_charge: true }))
    .mutation(async ({ ctx, input }) => {
      const { id: creatorId, paystackSubaccountCode } = await getCreator(
        ctx.db,
        ctx.session.user.id,
      );

      // Check if subaccount already exists
      if (paystackSubaccountCode) {
        console.log("Subaccount already exists, skipping creation.");
        return;
      }

      console.log("Creating subaccount...");
      // 1. Create Paystack subaccount
      const subaccountCode = await createPaystackSubaccount({
        ...input,
        percentage_charge: SUBACCOUNT_PERCENTAGE_CHARGE,
      });

      // 2. Create transaction split
      const { splitCode } = await paystackApiService.split.create({
        name: `Goldroad: Split for creator - ${input.business_name}`,
        currency: "KES",
        type: "percentage",
        subaccounts: [
          {
            subaccount: subaccountCode,
            share: 100 - SUBACCOUNT_PERCENTAGE_CHARGE,
          },
        ],
        bearer_type: "subaccount",
        bearer_subaccount: subaccountCode,
      });

      // 3. Update db with subaccount code and split code
      await ctx.db
        .update(creator)
        .set({
          paystackSubaccountCode: subaccountCode,
          splitCode: splitCode,
        })
        .where(eq(creator.id, creatorId));
    }),
});

async function createPaystackSubaccount(
  subaccountCreationInfo: SubaccountCreationInfo,
) {
  const { data: response, error } = await paystackClient("@post/subaccount", {
    body: subaccountCreationInfo,
  });

  if (error) {
    throw new TRPCError({
      message: `subaccount creation error: ${error.message}`,
      code: "INTERNAL_SERVER_ERROR",
    });
  }

  return response.data.subaccount_code;
}

async function addStatusAndTierTagsToKit(
  kitApiKey: string,
): Promise<Record<KitTag, number>> {
  // The bulk create endpoint on the Kit API requires OAuth,
  // which is not implemented currently,
  // hence the API calls over a loop
  let tagIdMap: Record<string, number> | null = null;

  for (const name of kitTagList) {
    try {
      const { data, error } = await kitClient("@post/tags/", {
        body: { name },
        headers: {
          [KIT_API_KEY_HEADER]: kitApiKey,
        },
      });

      if (error) {
        console.error(`Failed to create tag "${name}":`, error);
        // Continue to next tag instead of failing completely
        continue;
      }

      if (data?.tag?.id) {
        if (!tagIdMap) {
          tagIdMap = {
            [name]: data.tag.id,
          };
        } else {
          tagIdMap[name] = data.tag.id;
        }
      }
    } catch (error) {
      console.error(`Error creating tag "${name}":`, error);
    }
  }

  if (!tagIdMap || Object.keys(tagIdMap).length === 0) {
    throw new TRPCError({
      message:
        "Could not create any tags in Kit. Please check your API key has the necessary permissions.",
      code: "INTERNAL_SERVER_ERROR",
    });
  }

  // Ensure we have all required tags
  const missingTags = kitTagList.filter((tag) => !(tag in tagIdMap));
  if (missingTags.length > 0) {
    console.warn(`Some tags could not be created: ${missingTags.join(", ")}`);
  }

  return tagIdMap as Record<KitTag, number>;
}

import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import z from "zod";

import { checkCreatorExists, getCreator } from "~/server/actions/trpc/creator";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import {
  creator,
  plan,
  publication,
  tagInfo,
} from "~/server/db/schema/app-schema";
import { KIT_API_KEY_HEADER, kitClient } from "~/server/fetch-clients/kit";
import {
  createSubaccountSchema,
  paystackClient,
  planIntervalEnum,
  subscriptionStatusEnum,
} from "~/server/fetch-clients/paystack";

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

      if (error?.status === 401) {
        console.error(`${error.statusText}`);
        throw new TRPCError({
          message: `Kit API key is invalid`,
          code: "BAD_REQUEST",
        });
      }

      // 2. Check if tag info already exists for this creator with the given
      //    api key
      const { id: creatorId, kitApiKey: creatorKitApiKey } = await getCreator(
        ctx.db,
        ctx.session.user.id
      );
      if (input.kitApiKey === creatorKitApiKey) {
        // No changes needed, return early
        console.log("No changes needed, returning early...");
        return;
      }

      // 3. Add subscription status and interval tags to the Kit
      console.log("Adding subscription status and interval tags to kit...");

      const tagIdMap = await addStatusAndTierTagsToKit(input.kitApiKey);

      console.log("Adding kit tag ids to tag info table...");
      // 4. Add tags to the tag info table, linking them to the creator
      // Check if tag info already exists for this creator
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

      // 4. Update creator with encrypted API key
      await ctx.db
        .update(creator)
        .set({
          kitApiKey: input.kitApiKey, // TODO: Encrypt this
        })
        .where(eq(creator.id, creatorId));

      console.log("Successfully added tags and API key.");
      console.log("Successfully added creator!");
    }),

  addOrUpdateBankAccountInfo: protectedProcedure
    .input(createSubaccountSchema)
    .mutation(async ({ ctx, input }) => {
      const { id: creatorId } = await getCreator(ctx.db, ctx.session.user.id);
      console.log("Creating subaccount...");
      // 1. Create Paystack subaccount
      const code = await createPaystackSubaccount(input);
      // 2. Update db with subaccount code only
      await ctx.db
        .update(creator)
        .set({
          paystackSubaccountCode: code,
        })
        .where(eq(creator.id, creatorId));
    }),
});

async function createPaystackSubaccount(
  subaccountCreationInfo: SubaccountCreationInfo
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
  kitApiKey: string
): Promise<Record<KitTag, number>> {
  // The bulk create endpoint on the Kit API requires OAuth,
  // which is not implemented currently,
  // hence the API calls over a loop
  let tagIdMap: Record<string, number> | null = null;
  for (const name of kitTagList) {
    const { data, error } = await kitClient("@post/tags/", {
      body: { name },
      headers: {
        [KIT_API_KEY_HEADER]: kitApiKey,
      },
    });

    if (!error) {
      if (!tagIdMap) {
        tagIdMap = {
          [name]: data.tag.id,
        };
      } else {
        tagIdMap[name] = data.tag.id;
      }
    }
  }
  if (!tagIdMap) {
    throw new TRPCError({
      message: "Could not create tags",
      code: "INTERNAL_SERVER_ERROR",
    });
  }

  return tagIdMap;
}

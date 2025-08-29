import { TRPCError } from "@trpc/server";
import z from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { creator, tagInfo } from "~/server/db/schema/app-schema";
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
  create: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        kitApiKey: z.string(),
        subaccountCreationInfo: createSubaccountSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      console.log("Creating subaccount...");
      // 1. Create Paystack subaccount
      const subaccountCode = await createPaystackSubaccount(
        input.subaccountCreationInfo,
      );

      console.log("Created subaccount!");

      // 2. Add creator to the database
      console.log("Adding creator to DB...");

      const ids = await ctx.db
        .insert(creator)
        .values({
          userId: input.userId,
          kitApiKey: input.kitApiKey,
          paystackSubaccountCode: subaccountCode,
        })
        .returning({ id: creator.id });

      const creatorId = ids[0]?.id;
      if (!creatorId) {
        throw new TRPCError({
          message: "Unable to add creator to db",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
      console.log("Added creator successfully!");

      // 3. Add subscription status and interval tags to the Kit
      console.log("Adding subscription status and interval tags to kit...");

      const tagIdMap = await addStatusAndTierTagsToKit(input.kitApiKey);

      console.log("Adding kit tag ids to tag info table...");
      // 4. Add tags to the tag info table, linking them to the creator
      await ctx.db.insert(tagInfo).values({
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
      });
      console.log("Successfully added tags.");
      console.log("Successfully added creator!");
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

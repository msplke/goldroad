import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import z from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import type { DbType } from "~/server/db";
import {
  creator,
  plan,
  publication,
  // tagInfo,
} from "~/server/db/schema/app-schema";
import { kitClient } from "~/server/fetch-clients/kit";
import {
  type createPaymentPageSchema,
  type createPlanSchema,
  // type PlanInterval,
  paystackClient,
} from "~/server/fetch-clients/paystack";

const CreatePublicationInfoSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

type CreatePaystackPlanInfo = z.infer<typeof createPlanSchema>;
type CreatePaystackPaymentPageInfo = z.infer<typeof createPaymentPageSchema>;

/** Packages the arguments required for the `createPlan` function below */
type PlanCreationData = {
  paystackSubaccountCode: string;
  createPaystackPlanInfo: CreatePaystackPlanInfo;
  publicationId: string;
  creatorId: string;
};

const DEFAULT_MONTHLY_PLAN_PRICE_IN_KSH = 200;
const DEFAULT_ANNUAL_PLAN_PRICE_IN_KSH = 1500;

export const publicationRouter = createTRPCRouter({
  /** Creates a publication, along with the default monthly and yearly plans for it.
   * Currently, any failure of the steps in between must be cleaned up manually. Ideally,
   * when one step fails, every subsequent step should be undone (both database and external API calls).
   * This will be handled later.
   */
  create: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        publicationInfo: CreatePublicationInfoSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const foundCreator = await getCreator(ctx.db, input.userId);
      // Create a Kit tag for the publication
      console.log("Creating a tag for the publication on Kit...");
      const tag = await createKitTag(
        input.publicationInfo.name,
        foundCreator.kitApiKey,
      );

      // Create the publication on the DB
      console.log("Creating the publication on the DB...");
      const publicationId = await createPublication(
        ctx.db,
        foundCreator.id,
        tag.id,
        input.publicationInfo,
      );

      // Create the default monthly and yearly plans
      const monthlyPlanCreationInfo: CreatePaystackPlanInfo = {
        name: `${input.publicationInfo.name} - Monthly Plan`,
        interval: "monthly",
        amount: DEFAULT_MONTHLY_PLAN_PRICE_IN_KSH,
      };

      const annuallyPlanCreationInfo: CreatePaystackPlanInfo = {
        name: `${input.publicationInfo.name} - Annual Plan`,
        interval: "annually",
        amount: DEFAULT_ANNUAL_PLAN_PRICE_IN_KSH,
      };

      console.log("Creating plans...");
      await createPlan(ctx.db, {
        createPaystackPlanInfo: monthlyPlanCreationInfo,
        publicationId,
        paystackSubaccountCode: foundCreator.paystackSubaccountCode,
        creatorId: foundCreator.id,
      });

      console.log("Created monthly plan.");
      await createPlan(ctx.db, {
        createPaystackPlanInfo: annuallyPlanCreationInfo,
        publicationId,
        paystackSubaccountCode: foundCreator.paystackSubaccountCode,
        creatorId: foundCreator.id,
      });

      console.log("Created annual plan...");
      console.log("Finished publication creation.");
      return publicationId;
    }),
});

async function createPublication(
  db: DbType,
  creatorId: string,
  kitPublicationTagId: number,
  publicationInfo: z.infer<typeof CreatePublicationInfoSchema>,
) {
  const result = await db
    .insert(publication)
    .values({
      name: publicationInfo.name,
      kitPublicationTagId,
      creatorId: creatorId,
      description: publicationInfo.description,
    })
    .returning({ id: publication.id });

  const publicationId = result[0]?.id;

  if (!publicationId) {
    throw new TRPCError({
      message: "Could not create publication",
      code: "INTERNAL_SERVER_ERROR",
    });
  }

  return publicationId;
}

async function createPlan(db: DbType, data: PlanCreationData) {
  // 1. Create a Paystack Plan
  console.log(
    `Creating Paystack Plan for '${data.createPaystackPlanInfo.name}'...`,
  );
  const planData = await createPaystackPlan(data.createPaystackPlanInfo);

  // 2. Create a Paystack Payment Page for that plan
  // Create the payment page
  console.log(
    `Creating Paystack Payment Page for '${data.createPaystackPlanInfo.name}...'`,
  );
  const paymentPageData = await createPaymentPage({
    name: data.createPaystackPlanInfo.name,
    type: "subscription",
    // 3. Link the plan and the creator's subaccount to the payment page
    plan: planData.id,
    split_code: data.paystackSubaccountCode,
  });

  // 4. Add the plan to the database
  await db.insert(plan).values({
    name: data.createPaystackPlanInfo.name,
    interval: data.createPaystackPlanInfo.interval,
    paystackPaymentPageId: paymentPageData.id,
    paystackPaymentPageUrlSlug: paymentPageData.slug,
    paystackPlanCode: planData.plan_code,
    publicationId: data.publicationId,
  });
}

// async function getCreatorTags(db: DbType, creatorId: string) {
//   const tags = await db.query.tagInfo.findFirst({
//     where: eq(tagInfo.creatorId, creatorId),
//   });

//   if (!tags) {
//     throw new TRPCError({
//       message: "Could not find tags for creator",
//       code: "INTERNAL_SERVER_ERROR",
//     });
//   }

//   return tags;
// }

async function createKitTag(name: string, kitApiKey: string) {
  const { data: tagData, error } = await kitClient("@post/tags/", {
    body: { name },
    headers: { "X-Kit-Api-Key": kitApiKey },
  });
  if (error) {
    throw new TRPCError({
      message: error.message,
      code: "INTERNAL_SERVER_ERROR",
    });
  }

  return tagData.tag;
}

async function createPaymentPage(
  createPaymentPageInfo: CreatePaystackPaymentPageInfo,
) {
  const { data: response, error } = await paystackClient("@post/page", {
    body: createPaymentPageInfo,
  });

  if (error) {
    throw new TRPCError({
      message: error.message,
      code: "INTERNAL_SERVER_ERROR",
    });
  }

  return response.data;
}

async function createPaystackPlan(createPlanInfo: CreatePaystackPlanInfo) {
  const amountInSubunits = createPlanInfo.amount * 100;
  const { data: response, error } = await paystackClient("@post/plan", {
    body: { ...createPlanInfo, amount: amountInSubunits },
  });

  if (error) {
    throw new TRPCError({
      message: error.message,
      code: "INTERNAL_SERVER_ERROR",
    });
  }

  return response.data;
}

async function getCreator(db: DbType, userId: string) {
  const result = await db.query.creator.findFirst({
    where: eq(creator.userId, userId),
  });

  if (!result) {
    throw new TRPCError({
      message: "Could not create publication",
      code: "INTERNAL_SERVER_ERROR",
    });
  }

  return result;
}

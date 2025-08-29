import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import z from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { creator, plan } from "~/server/db/schema";
import { kitClient } from "~/server/fetch-clients/kit";
import {
  type createPaymentPageSchema,
  createPlanSchema,
  paystackClient,
} from "~/server/fetch-clients/paystack";

type CreatePlanInfo = z.infer<typeof createPlanSchema>;

type CreatePaymentPageInfo = z.infer<typeof createPaymentPageSchema>;

export const planRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ createPlanInfo: createPlanSchema }))
    .mutation(async ({ ctx, input }) => {
      const info = input.createPlanInfo;

      // 1. Create a Paystack Plan
      const planData = await createPaystackPlan(info);

      // 2. Create a Paystack Payment Page for that plan
      // Prepare data for the payment page
      const paystackSubaccountCode = await getPaystackSubaccountCode(
        ctx.session.user.id
      );

      if (!paystackSubaccountCode) {
        throw new TRPCError({
          message: "Unable ",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
      // Create the payment page
      const paymentPageData = await createPaymentPage({
        name: info.name,
        // 3. Link the creator's subaccount to the payment page
        split_code: paystackSubaccountCode,
      });

      // 4. Create a tag at Kit corresponding to the plan name
      const { data: tagData, error } = await kitClient("@post/tags/", {
        body: { name: info.name },
      });
      if (error) {
        throw new TRPCError({
          message: error.message,
          code: "INTERNAL_SERVER_ERROR",
        });
      }

      // 5. Add the plan to the database
      await db.insert(plan).values({
        name: "",
        interval: "hourly",
        kitPlanNameTagId: tagData.tag.id,
        paystackPaymentPageId: paymentPageData.id,
        paystackPaymentPageUrlSlug: paymentPageData.slug,
        paystackPlanCode: planData.plan_code,
      });
    }),
});

async function getPaystackSubaccountCode(userId: string) {
  const result = await db.query.creator.findFirst({
    where: eq(creator.userId, userId),
    columns: {
      paystackSubaccountCode: true,
    },
  });

  return result?.paystackSubaccountCode;
}

async function createPaymentPage(createPaymentPageInfo: CreatePaymentPageInfo) {
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

async function createPaystackPlan(createPlanInfo: CreatePlanInfo) {
  const { data: response, error } = await paystackClient("@post/plan", {
    body: createPlanInfo,
  });

  if (error) {
    throw new TRPCError({
      message: error.message,
      code: "INTERNAL_SERVER_ERROR",
    });
  }

  return response.data;
}

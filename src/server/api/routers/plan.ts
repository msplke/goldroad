import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import z from "zod";

import { getCreator } from "~/server/actions/trpc/creator";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { plan, publication } from "~/server/db/schema/app-schema";
import type { createPlanSchema } from "~/server/fetch-clients/paystack/schemas/plan";
import { paystackApiService } from "~/server/services/paystack/paystack-api";
import type { PaystackApiService } from "~/server/services/paystack/paystack-api-service";

const CreatePlanInfoSchema = z.object({
  publicationId: z.uuid("Invalid publication ID"),
  monthlyAmount: z
    .number()
    .min(100, "Monthly amount must be at least Ksh. 100"),
  annualAmount: z
    .number()
    .min(1000, "Annual amount must be at least Ksh. 1000"),
});

const UpdatePlanInfoSchema = z.object({
  planId: z.uuid("Invalid plan ID"),
  amount: z.number().min(100, "Amount must be at least Ksh. 100"),
});

type CreatePaystackPlanInfo = z.infer<typeof createPlanSchema>;

/** Packages the arguments required to create a plan and a payment page linked to the created plan */
type PlanAndPaymentPageCreationData = {
  splitCode: string;
  createPaystackPlanInfo: CreatePaystackPlanInfo;
};

export const planRouter = createTRPCRouter({
  /** Creates monthly and annual plans for a publication */
  createMonthlyAndYearlyPlans: protectedProcedure
    .input(CreatePlanInfoSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        const foundCreator = await getCreator(tx, ctx.session.user.id);

        if (!foundCreator.splitCode) {
          throw new TRPCError({
            message: "Creator's bank information is not set",
            code: "BAD_REQUEST",
          });
        }

        const splitCode = foundCreator.splitCode;

        // Verify the publication belongs to this creator
        const publicationResult = await tx.query.publication.findFirst({
          where: eq(publication.id, input.publicationId),
        });

        if (
          !publicationResult ||
          publicationResult.creatorId !== foundCreator.id
        ) {
          throw new TRPCError({
            message: "Publication not found or access denied",
            code: "NOT_FOUND",
          });
        }

        // Check whether plans already exist for this publication
        const existingPlans = await tx.query.plan.findMany({
          where: eq(plan.publicationId, input.publicationId),
        });

        if (existingPlans.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Plans already exist for this publication",
          });
        }

        // Create the default monthly and yearly plans
        const monthlyPlanCreationInfo: CreatePaystackPlanInfo = {
          name: `${publicationResult.name} - Monthly Plan`,
          interval: "monthly",
          amount: input.monthlyAmount,
        };

        const annuallyPlanCreationInfo: CreatePaystackPlanInfo = {
          name: `${publicationResult.name} - Annual Plan`,
          interval: "annually",
          amount: input.annualAmount,
        };

        const paystackPlanCreationInfoArray = [
          monthlyPlanCreationInfo,
          annuallyPlanCreationInfo,
        ];

        const dbPlans = paystackPlanCreationInfoArray.map(
          async (creationInfo) => {
            console.log(`Creating plan '${creationInfo.name}' on Paystack...`);
            const data = await createPaystackPlanAndPaymentPage(
              paystackApiService,
              {
                createPaystackPlanInfo: creationInfo,
                splitCode,
              },
            );
            const result = await tx
              .insert(plan)
              .values({
                ...data,
                publicationId: publicationResult.id,
              })
              .returning();
            return result[0];
          },
        );

        console.log("Plans created successfully.");

        return {
          monthlyPlan: dbPlans[0],
          annualPlan: dbPlans[1],
        };
      });
    }),

  /** Get all plans for a publication */
  getByPublication: protectedProcedure
    .input(z.object({ publicationId: z.uuid() }))
    .query(async ({ ctx, input }) => {
      const foundCreator = await getCreator(ctx.db, ctx.session.user.id);

      // Verify the publication belongs to this creator
      const publicationResult = await ctx.db.query.publication.findFirst({
        where: eq(publication.id, input.publicationId),
      });

      if (
        !publicationResult ||
        publicationResult.creatorId !== foundCreator.id
      ) {
        throw new TRPCError({
          message: "Publication not found or access denied",
          code: "NOT_FOUND",
        });
      }

      const plans = await ctx.db.query.plan.findMany({
        where: eq(plan.publicationId, input.publicationId),
        orderBy: plan.interval,
      });

      return plans;
    }),

  /** Update a plan's pricing */
  updatePricing: protectedProcedure
    .input(UpdatePlanInfoSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        const foundCreator = await getCreator(tx, ctx.session.user.id);

        // Get the plan and verify ownership
        const foundPlan = await tx.query.plan.findFirst({
          where: eq(plan.id, input.planId),
          with: {
            publication: true,
          },
        });

        if (!foundPlan) {
          throw new TRPCError({
            message: "Plan not found",
            code: "NOT_FOUND",
          });
        }

        // Verify the plan's publication belongs to this creator
        if (foundPlan.publication.creatorId !== foundCreator.id) {
          throw new TRPCError({
            message: "You don't have permission to edit this plan",
            code: "FORBIDDEN",
          });
        }

        // Update the plan on Paystack first
        console.log(
          `Updating Paystack plan ${foundPlan.paystackPlanCode} with new amount ${input.amount}...`,
        );

        await paystackApiService.plan.update(foundPlan.paystackPlanCode, {
          amount: input.amount,
        });

        // Update the plan in our database
        await tx
          .update(plan)
          .set({
            amount: input.amount,
          })
          .where(eq(plan.id, input.planId));

        console.log(
          "Plan updated successfully on both Paystack and local database",
        );
        return { success: true };
      });
    }),
});

/** Creates a Paystack plan and its associated payment page */
async function createPaystackPlanAndPaymentPage(
  paystackApiService: PaystackApiService<unknown>,
  data: PlanAndPaymentPageCreationData,
) {
  // 1. Create a Paystack Plan
  console.log(
    `Creating Paystack Plan for '${data.createPaystackPlanInfo.name}'...`,
  );

  const planData = await paystackApiService.plan.create(
    data.createPaystackPlanInfo,
  );

  // 2. Create a Paystack Payment Page for that plan
  console.log(
    `Creating Paystack Payment Page for '${data.createPaystackPlanInfo.name}...'`,
  );

  const paymentPageData = await paystackApiService.paymentPage.create({
    name: data.createPaystackPlanInfo.name,
    type: "subscription",
    // 3. Link the plan and the creator's subaccount to the payment page
    plan: planData.id,
    split_code: data.splitCode,
  });

  return {
    name: data.createPaystackPlanInfo.name,
    interval: data.createPaystackPlanInfo.interval,
    amount: data.createPaystackPlanInfo.amount,
    paystackPaymentPageId: paymentPageData.id,
    paystackPaymentPageUrlSlug: paymentPageData.slug,
    paystackPlanCode: planData.planCode,
  };
}

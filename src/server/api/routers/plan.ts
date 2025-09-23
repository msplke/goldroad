import { TRPCError } from "@trpc/server";
import { count, eq } from "drizzle-orm";
import z from "zod";

import { getCreator } from "~/server/actions/trpc/creator";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import type { DbType } from "~/server/db";
import { plan, planBenefit, publication } from "~/server/db/schema/app-schema";
import {
  type createPaymentPageSchema,
  type createPlanSchema,
  paystackClient,
} from "~/server/fetch-clients/paystack";

const MAX_BENEFITS_PER_PLAN = 4;

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

const AddBenefitSchema = z.object({
  planId: z.uuid("Invalid plan ID"),
  description: z
    .string()
    .min(1, "Benefit description is required")
    .max(500, "Benefit description must be less than 500 characters"),
});

const UpdateBenefitSchema = z.object({
  benefitId: z.uuid("Invalid benefit ID"),
  description: z
    .string()
    .min(1, "Benefit description is required")
    .max(500, "Benefit description must be less than 500 characters"),
});

const DeleteBenefitSchema = z.object({
  benefitId: z.uuid("Invalid benefit ID"),
});

const ClearBenefitsSchema = z.object({
  planId: z.uuid("Invalid plan ID"),
});

type CreatePaystackPlanInfo = z.infer<typeof createPlanSchema>;
type CreatePaystackPaymentPageInfo = z.infer<typeof createPaymentPageSchema>;

/** Packages the arguments required for the `createPlan` function */
type PlanCreationData = {
  paystackSubaccountCode: string;
  createPaystackPlanInfo: CreatePaystackPlanInfo;
  publicationId: string;
  creatorId: string;
};

export const planRouter = createTRPCRouter({
  /** Creates monthly and annual plans for a publication */
  createMonthlyAndYearlyPlans: protectedProcedure
    .input(CreatePlanInfoSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        const foundCreator = await getCreator(tx, ctx.session.user.id);

        if (!foundCreator.paystackSubaccountCode) {
          throw new TRPCError({
            message: "Creator's bank information is not set",
            code: "BAD_REQUEST",
          });
        }

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

        console.log("Creating monthly plan...");
        const monthlyPlan = await createPlan(tx, {
          createPaystackPlanInfo: monthlyPlanCreationInfo,
          publicationId: input.publicationId,
          paystackSubaccountCode: foundCreator.paystackSubaccountCode,
          creatorId: foundCreator.id,
        });

        console.log("Creating annual plan...");
        const annualPlan = await createPlan(tx, {
          createPaystackPlanInfo: annuallyPlanCreationInfo,
          publicationId: input.publicationId,
          paystackSubaccountCode: foundCreator.paystackSubaccountCode,
          creatorId: foundCreator.id,
        });

        console.log("Plans created successfully.");
        return {
          monthlyPlan,
          annualPlan,
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
        with: {
          planBenefits: {
            orderBy: planBenefit.createdAt,
          },
        },
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
        const amountInSubunits = input.amount * 100;
        const { data: paystackResponse, error: paystackError } =
          await paystackClient("@put/plan/:id_or_code", {
            params: { id_or_code: foundPlan.paystackPlanCode },
            body: {
              amount: amountInSubunits,
            },
          });

        if (paystackError || !paystackResponse) {
          throw new TRPCError({
            message: `Failed to update plan on Paystack: ${paystackError?.message || "Unknown error"}`,
            code: "INTERNAL_SERVER_ERROR",
          });
        }

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

  /** Add a benefit to a plan (max 4 benefits per plan) */
  addBenefit: protectedProcedure
    .input(AddBenefitSchema)
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

        // Check current benefit count
        const benefitCountResult = await tx
          .select({ count: count() })
          .from(planBenefit)
          .where(eq(planBenefit.planId, input.planId));

        const benefitCount = benefitCountResult[0]?.count ?? 0;

        if (benefitCount >= MAX_BENEFITS_PER_PLAN) {
          throw new TRPCError({
            message: `A plan can have a maximum of ${MAX_BENEFITS_PER_PLAN} benefits`,
            code: "BAD_REQUEST",
          });
        }

        // Add the benefit
        const result = await tx
          .insert(planBenefit)
          .values({
            planId: input.planId,
            description: input.description,
          })
          .returning();

        return result[0];
      });
    }),

  /** Update a benefit description */
  updateBenefit: protectedProcedure
    .input(UpdateBenefitSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        const foundCreator = await getCreator(tx, ctx.session.user.id);

        // Get the benefit and verify ownership through plan
        const foundBenefit = await tx.query.planBenefit.findFirst({
          where: eq(planBenefit.id, input.benefitId),
          with: {
            plan: {
              with: {
                publication: true,
              },
            },
          },
        });

        if (!foundBenefit) {
          throw new TRPCError({
            message: "Benefit not found",
            code: "NOT_FOUND",
          });
        }

        // Verify ownership
        if (foundBenefit.plan.publication.creatorId !== foundCreator.id) {
          throw new TRPCError({
            message: "You don't have permission to edit this benefit",
            code: "FORBIDDEN",
          });
        }

        // Update the benefit
        await tx
          .update(planBenefit)
          .set({
            description: input.description,
          })
          .where(eq(planBenefit.id, input.benefitId));

        return { success: true };
      });
    }),

  /** Delete a benefit */
  deleteBenefit: protectedProcedure
    .input(DeleteBenefitSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        const foundCreator = await getCreator(tx, ctx.session.user.id);

        // Get the benefit and verify ownership through plan
        const foundBenefit = await tx.query.planBenefit.findFirst({
          where: eq(planBenefit.id, input.benefitId),
          with: {
            plan: {
              with: {
                publication: true,
              },
            },
          },
        });

        if (!foundBenefit) {
          throw new TRPCError({
            message: "Benefit not found",
            code: "NOT_FOUND",
          });
        }

        // Verify ownership
        if (foundBenefit.plan.publication.creatorId !== foundCreator.id) {
          throw new TRPCError({
            message: "You don't have permission to delete this benefit",
            code: "FORBIDDEN",
          });
        }

        // Delete the benefit
        await tx.delete(planBenefit).where(eq(planBenefit.id, input.benefitId));

        return { success: true };
      });
    }),

  /** Clear all benefits for a plan */
  clearBenefits: protectedProcedure
    .input(ClearBenefitsSchema)
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

        // Delete all benefits for this plan
        await tx
          .delete(planBenefit)
          .where(eq(planBenefit.planId, input.planId));

        return { success: true };
      });
    }),
});

async function createPlan(db: DbType, data: PlanCreationData) {
  // 1. Create a Paystack Plan
  console.log(
    `Creating Paystack Plan for '${data.createPaystackPlanInfo.name}'...`,
  );
  const planData = await createPaystackPlan(data.createPaystackPlanInfo);

  // 2. Create a Paystack Payment Page for that plan
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
  const result = await db
    .insert(plan)
    .values({
      name: data.createPaystackPlanInfo.name,
      interval: data.createPaystackPlanInfo.interval,
      amount: data.createPaystackPlanInfo.amount,
      paystackPaymentPageId: paymentPageData.id,
      paystackPaymentPageUrlSlug: paymentPageData.slug,
      paystackPlanCode: planData.plan_code,
      publicationId: data.publicationId,
    })
    .returning();

  return result[0];
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
    body: { ...createPlanInfo, amount: amountInSubunits, currency: "KES" },
  });

  if (error) {
    throw new TRPCError({
      message: error.message,
      code: "INTERNAL_SERVER_ERROR",
    });
  }

  return response.data;
}

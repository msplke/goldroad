import z from "zod";

import {
  baseResponseSchema,
  paginationMetaSchema,
} from "~/server/fetch-clients/paystack/schemas/common";
import {
  createPlanSchema,
  planIntervalEnum,
  planSchema,
} from "~/server/fetch-clients/paystack/schemas/plan";
import { subscriptionStatusEnum } from "~/server/fetch-clients/paystack/schemas/subscription";

const getPlanQuerySchema = z.object({
  perPage: z.coerce.number().optional().describe("Number of records to return"),
  page: z.coerce.number().optional().describe("Page number to return"),
  status: subscriptionStatusEnum.optional().describe("Filter plans by status"),
  interval: planIntervalEnum.optional().describe("Filter plans by interval"),
  amount: z.coerce.number().optional().describe("Filter plans by amount"),
});

const planRouteParamsSchema = z.object({
  id_or_code: z.string().describe("ID or code of the plan"),
});

export const planRoutes = {
  // Create Plan
  "@post/plan": {
    input: createPlanSchema,
    output: baseResponseSchema.extend({
      data: planSchema,
    }),
  },

  // List Plans
  "@get/plan": {
    query: getPlanQuerySchema.optional(),
    output: baseResponseSchema.extend({
      data: z.array(planSchema),
      meta: paginationMetaSchema,
    }),
  },

  // Fetch Plan
  "@get/plan/:id_or_code": {
    params: planRouteParamsSchema,
    output: baseResponseSchema.extend({
      data: planSchema,
    }),
  },

  // Update Plan
  "@put/plan/:id_or_code": {
    params: planRouteParamsSchema,
    input: createPlanSchema.partial(),
    output: baseResponseSchema,
  },
};

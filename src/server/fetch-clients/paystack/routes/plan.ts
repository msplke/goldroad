import type { FetchSchemaRoutes } from "@better-fetch/fetch";
import z from "zod";

import {
  baseResponseSchema,
  createPlanSchema,
  planIntervalEnum,
  planSchema,
  subscriptionStatusEnum,
} from "~/server/fetch-clients/paystack/schemas";

export const planRoutes: FetchSchemaRoutes = {
  // Create Plan
  "@post/plan": {
    input: createPlanSchema,
    output: baseResponseSchema.extend({
      data: planSchema,
    }),
  },

  // List Plans
  "@get/plan": {
    query: z
      .object({
        perPage: z.number().optional().describe("Number of records to return"),
        page: z.number().optional().describe("Page number to return"),
        status: subscriptionStatusEnum
          .optional()
          .describe("Filter plans by status"),
        interval: planIntervalEnum
          .optional()
          .describe("Filter plans by interval"),
        amount: z.number().optional().describe("Filter plans by amount"),
      })
      .optional(),
    output: baseResponseSchema.extend({
      data: z.array(planSchema),
      meta: z.object({
        total: z.number(),
        skipped: z.number(),
        perPage: z.number(),
        page: z.number(),
        pageCount: z.number(),
      }),
    }),
  },

  // Fetch Plan
  "@get/plan/:id_or_code": {
    params: z.object({
      id_or_code: z.string().describe("ID or code of the plan"),
    }),
    output: baseResponseSchema.extend({
      data: planSchema,
    }),
  },

  // Update Plan
  "@put/plan/:id_or_code": {
    params: z.object({
      id_or_code: z.string().describe("ID or code of the plan"),
    }),
    input: z.object({
      name: z.string().optional().describe("Name of the plan"),
      amount: z
        .number()
        .optional()
        .describe("Amount to be charged in subunits"),
      interval: planIntervalEnum.optional().describe("Interval for the plan"),
      description: z.string().optional().describe("Description of the plan"),
      send_invoices: z
        .boolean()
        .optional()
        .describe(
          "Set to false if you don't want invoices to be sent to your customers",
        ),
      send_sms: z
        .boolean()
        .optional()
        .describe(
          "Set to false if you don't want text messages to be sent to your customers",
        ),
      currency: z
        .string()
        .optional()
        .describe("Currency in which amount is set"),
      invoice_limit: z
        .number()
        .optional()
        .describe("Number of invoices to raise during subscription"),
    }),
    output: baseResponseSchema,
  },
};

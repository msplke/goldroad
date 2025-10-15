import type { FetchSchemaRoutes } from "@better-fetch/fetch";
import z from "zod";

import {
  baseResponseSchema,
  subscriptionSchema,
} from "~/server/fetch-clients/paystack/schemas";

export const subscriptionRoutes: FetchSchemaRoutes = {
  // List Subscriptions
  "@get/subscription": {
    query: z
      .object({
        perPage: z.number().optional(),
        page: z.number().optional(),
        customer: z.string().optional(),
        plan: z.string().optional(),
      })
      .optional(),
    output: baseResponseSchema.extend({
      data: z.array(subscriptionSchema),
      meta: z.object({
        total: z.number(),
        skipped: z.number(),
        perPage: z.number(),
        page: z.number(),
        pageCount: z.number(),
      }),
    }),
  },

  // Fetch a Subscription
  "@get/subscription/:id_or_code": {
    params: z.object({
      // Subscription id or code
      id_or_code: z.string(),
    }),
    output: baseResponseSchema.extend({
      data: subscriptionSchema,
    }),
  },

  // Create Subscription
  "@post/subscription": {
    input: z.object({
      customer: z
        .string()
        .describe("Customer's email address or customer code"),
      plan: z.string().describe("Plan code"),
      authorization: z
        .string()
        .optional()
        .describe("Authorization code to charge"),
      start_date: z
        .string()
        .optional()
        .describe("Set the date for the first debit. (ISO 8601 format)"),
    }),
    output: baseResponseSchema.extend({
      data: subscriptionSchema,
    }),
  },

  // Enable Subscription
  "@post/subscription/enable": {
    input: z.object({
      code: z.string().describe("Subscription code"),
      token: z.string().describe("Email token"),
    }),
    output: baseResponseSchema.extend({
      data: subscriptionSchema,
    }),
  },

  // Disable Subscription
  "@post/subscription/disable": {
    input: z.object({
      code: z.string().describe("Subscription code"),
      token: z.string().describe("Email token"),
    }),
    output: baseResponseSchema.extend({
      data: subscriptionSchema,
    }),
  },
};

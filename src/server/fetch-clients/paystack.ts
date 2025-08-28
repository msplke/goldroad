import { createFetch, createSchema } from "@better-fetch/fetch";
import { z } from "zod";

import { env } from "~/env";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

// Common response shapes
const customerSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  email: z.email(),
  phone: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  customer_code: z.string(),
});

const planSchema = z.object({
  name: z.string(),
  plan_code: z.string(),
  description: z.string().optional(),
  amount: z.number(),
  interval: z.enum([
    "hourly",
    "daily",
    "weekly",
    "monthly",
    "quarterly",
    "biannually",
    "annually",
  ]),
  integration: z.number(),
});

const authorizationSchema = z.object({
  authorization_code: z.string(),
  bin: z.string(),
  last4: z.string(),
  exp_month: z.string(),
  exp_year: z.string(),
  channel: z.string(),
  card_type: z.string(),
  bank: z.string(),
  country_code: z.string(),
  brand: z.string(),
  reusable: z.boolean(),
  signature: z.string(),
  account_name: z.string().optional(),
});

// Complete subscription object
const subscriptionSchema = z.object({
  id: z.number(),
  customer: customerSchema,
  plan: planSchema,
  integration: z.number(),
  subscription_code: z.string(),
  email_token: z.string(),
  amount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  authorization: authorizationSchema,
  cron_expression: z.string().optional(),
  next_payment_date: z.string(),
  open_invoice: z.boolean().optional(),
  status: z.enum(["active", "cancelled", "paused", "completed"]),
});

// Standard API response format
const baseResponseSchema = z.object({
  status: z.boolean(),
  message: z.string(),
});

const paystackSchema = createSchema({
  // === SUBSCRIPTION ENDPOINTS ===

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
  "@get/subscription/:code": {
    params: z.object({
      code: z.string(),
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

  // === PLAN ENDPOINTS ===

  // Create Plan
  "@post/plan": {
    input: z.object({
      name: z.string().describe("Name of the plan"),
      amount: z.number().describe("Amount to be charged in cents"),
      interval: z
        .enum([
          "hourly",
          "daily",
          "weekly",
          "monthly",
          "quarterly",
          "biannually",
          "annually",
        ])
        .describe("Interval for the plan"),
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
        status: z
          .enum(["active", "cancelled", "paused", "completed"])
          .optional()
          .describe("Filter plans by status"),
        interval: z
          .enum([
            "hourly",
            "daily",
            "weekly",
            "monthly",
            "quarterly",
            "biannually",
            "annually",
          ])
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
      amount: z.number().optional().describe("Amount to be charged in cents"),
      interval: z
        .enum([
          "hourly",
          "daily",
          "weekly",
          "monthly",
          "quarterly",
          "biannually",
          "annually",
        ])
        .optional()
        .describe("Interval for the plan"),
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
    output: baseResponseSchema.extend({
      data: planSchema,
    }),
  },
});

export const paystackClient = createFetch({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
  schema: paystackSchema,
  strict: true,
});

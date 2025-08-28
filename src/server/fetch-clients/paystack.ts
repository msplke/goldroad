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

const planIntervalEnum = z.enum([
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "biannually",
  "annually",
]);

const subscriptionStatusEnum = z.enum([
  "active",
  "non-renewing",
  "attention",
  "cancelled",
  "completed",
]);

const planSchema = z.object({
  name: z.string(),
  plan_code: z.string(),
  description: z.string().optional(),
  amount: z.number(),
  interval: planIntervalEnum.describe("Interval for the plan"),
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
  status: subscriptionStatusEnum,
});

// Bank schema for the list banks endpoint
const bankSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  code: z.string(),
  longcode: z.string(),
  gateway: z.string().nullable(),
  pay_with_bank: z.boolean(),
  active: z.boolean(),
  country: z.string(),
  currency: z.string(),
  type: z.string(),
  is_deleted: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
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

  // === PLAN ENDPOINTS ===

  // Create Plan
  "@post/plan": {
    input: z.object({
      name: z.string().describe("Name of the plan"),
      amount: z.number().describe("Amount to be charged in subunits"),
      interval: planIntervalEnum.describe("Interval for the plan"),
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
    output: baseResponseSchema.extend({
      data: planSchema,
    }),
  },
  // List banks
  "@get/bank": {
    query: z
      .object({
        country: z
          .string()
          .optional()
          .describe(
            "The country to obtain the list of supported banks. e.g country=ghana or country=nigeria",
          ),
        use_cursor: z
          .boolean()
          .optional()
          .describe("Use cursor for pagination"),
        perPage: z
          .number()
          .optional()
          .describe("Number of records to return per page"),
        pay_with_bank_transfer: z
          .boolean()
          .optional()
          .describe("Only return banks that support bank transfer"),
        pay_with_bank: z
          .boolean()
          .optional()
          .describe("Only return banks that support pay with bank"),
        enabled_for_verification: z
          .boolean()
          .optional()
          .describe("Only return banks that support account verification"),
        next: z.string().optional().describe("Cursor for the next page"),
        previous: z
          .string()
          .optional()
          .describe("Cursor for the previous page"),
      })
      .optional(),
    output: baseResponseSchema.extend({
      data: z.array(bankSchema),
      meta: z
        .object({
          next: z.string().nullable(),
          previous: z.string().nullable(),
          perPage: z.number(),
        })
        .optional(),
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

import z from "zod";

import type { planIntervalEnum } from "~/server/fetch-clients/paystack/schemas/plan";
import type { subscriptionStatusEnum } from "~/server/fetch-clients/paystack/schemas/subscription";

// ==== Enums ====
export const countryEnum = z.enum([
  "ghana",
  "kenya",
  "nigeria",
  "south africa",
]);

export const currencyEnum = z.enum(["XOF", "NGN", "KES", "GHS", "ZAR"]);
export const channelEnum = z.enum([
  "card",
  "bank",
  "apple_pay",
  "ussd",
  "qr",
  "mobile_money",
  "bank_transfer",
  "eft",
  "payattitude",
]);

export type PaymentChannel = z.infer<typeof channelEnum>;
export type PlanInterval = z.infer<typeof planIntervalEnum>;
export type SubscriptionStatus = z.infer<typeof subscriptionStatusEnum>;

// === Common Schemas for Paystack API ====

// Standard API response format
export const baseResponseSchema = z.object({
  status: z.boolean(),
  message: z.string(),
});

export const baseQueryParamsSchema = z.object({
  perPage: z.coerce.number().optional().describe("Number of records to return"),
  page: z.coerce.number().optional().describe("Page number to return"),
});

export const metadataSchema = z.record(z.string(), z.unknown()).nullish();

export const customerSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  email: z.email(),
  phone: z.string().optional(),
  metadata: metadataSchema,
  customer_code: z.string(),
});

export const paginationMetaSchema = z
  .object({
    total: z.number(),
    skipped: z.number(),
    perPage: z.number(),
    page: z.number(),
    pageCount: z.number(),
  })
  .optional();

export const authorizationSchema = z.object({
  authorization_code: z.string(),
  bin: z.string(),
  last4: z.string(),
  exp_month: z.string(),
  exp_year: z.string(),
  channel: channelEnum,
  card_type: z.string(),
  bank: z.string(),
  country_code: z.string(),
  brand: z.string(),
  reusable: z.boolean(),
  signature: z.string(),
  account_name: z.string().optional(),
});

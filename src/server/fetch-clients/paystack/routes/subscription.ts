import z from "zod";

import {
  baseResponseSchema,
  paginationMetaSchema,
} from "~/server/fetch-clients/paystack/schemas/common";
import { subscriptionSchema } from "~/server/fetch-clients/paystack/schemas/subscription";

const getSubscriptionSchemas = {
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
    meta: paginationMetaSchema,
  }),
};

const getSubscriptionByIdSchemas = {
  params: z.object({
    id_or_code: z.string().describe("ID or code of the subscription"),
  }),
  output: baseResponseSchema.extend({
    data: subscriptionSchema,
  }),
};

const createSubscriptionSchemas = {
  input: z.object({
    customer: z.string().describe("Customer's email address or customer code"),
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
};

const enableSubscriptionSchemas = {
  input: z.object({
    code: z.string().describe("Subscription code"),
    token: z.string().describe("Email token"),
  }),
  output: baseResponseSchema.extend({
    data: subscriptionSchema,
  }),
};

const disableSubscriptionSchemas = {
  input: z.object({
    code: z.string().describe("Subscription code"),
    token: z.string().describe("Email token"),
  }),
  output: baseResponseSchema.extend({
    data: subscriptionSchema,
  }),
};

export const subscriptionRoutes = {
  // List Subscriptions
  "@get/subscription": getSubscriptionSchemas,
  // Fetch a Subscription
  "@get/subscription/:id_or_code": getSubscriptionByIdSchemas,
  // Create Subscription
  "@post/subscription": createSubscriptionSchemas,
  // Enable Subscription
  "@post/subscription/enable": enableSubscriptionSchemas,
  // Disable Subscription
  "@post/subscription/disable": disableSubscriptionSchemas,
};

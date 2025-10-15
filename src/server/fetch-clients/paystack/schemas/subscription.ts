import z from "zod";

import {
  authorizationSchema,
  customerSchema,
} from "~/server/fetch-clients/paystack/schemas/common";
import { planSchema } from "~/server/fetch-clients/paystack/schemas/plan";

export const subscriptionStatusEnum = z.enum([
  "active",
  "non-renewing",
  "attention",
  "cancelled",
  "completed",
]);

export const subscriptionSchema = z.object({
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

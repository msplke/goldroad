import z from "zod";

import { currencyEnum } from "~/server/fetch-clients/paystack/schemas/common";

// The application will mainly be concerned with the
// "monthly" and annually" plans, but the "hourly", "daily" and "weekly"
// will be supported for testing
export const planIntervalEnum = z.enum([
  "hourly",
  "daily",
  // "weekly",
  "monthly",
  // "quarterly",
  // "biannually",
  "annually",
]);

export const planSchema = z.object({
  id: z.coerce.string(),
  name: z.string(),
  plan_code: z.string(),
  description: z.string().nullable().optional(),
  amount: z.number(),
  interval: planIntervalEnum.describe("Interval for the plan"),
  integration: z.number().optional(),
});

export const createPlan = planSchema
  .omit({
    id: true,
    integration: true,
  })
  .extend({
    currency: currencyEnum
      .optional()
      .describe("Currency in which amount is set"),
    invoice_limit: z
      .number()
      .optional()
      .describe("Number of invoices to raise during subscription"),
  });

export const createPlanSchema = z.object({
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
  currency: z.string().optional().describe("Currency in which amount is set"),
  invoice_limit: z
    .number()
    .optional()
    .describe("Number of invoices to raise during subscription"),
});

import type { FetchSchemaRoutes } from "@better-fetch/fetch";
import z from "zod";

import {
  baseResponseSchema,
  createSubaccountSchema,
  subaccountSchema,
} from "~/server/fetch-clients/paystack/schemas";

export const subaccountRoutes: FetchSchemaRoutes = {
  // Create Subaccount
  "@post/subaccount": {
    input: createSubaccountSchema,
    output: baseResponseSchema.extend({
      data: subaccountSchema,
    }),
  },

  // Update Subaccount
  "@put/subaccount/:id_or_code": {
    params: z.object({
      id_or_code: z.string().describe("Subaccount ID or code"),
    }),
    input: z.object({
      business_name: z
        .string()
        .optional()
        .describe("Name of business for subaccount"),
      settlement_bank: z.string().optional().describe("Bank code for the bank"),
      account_number: z.string().optional().describe("Bank account number"),
      active: z
        .boolean()
        .optional()
        .describe("Activate or deactivate a subaccount"),
      percentage_charge: z
        .number()
        .optional()
        .describe(
          "The default percentage charged when receiving on behalf of this subaccount",
        ),
      description: z
        .string()
        .optional()
        .describe("A description for this subaccount"),
      primary_contact_email: z
        .email()
        .optional()
        .describe("A contact email for the subaccount"),
      primary_contact_name: z
        .string()
        .optional()
        .describe("A name for the contact person for this subaccount"),
      primary_contact_phone: z
        .string()
        .optional()
        .describe("A phone number to call for this subaccount"),
      settlement_schedule: z
        .enum(["auto", "weekly", "monthly", "manual"])
        .optional()
        .describe("Any of auto, weekly, monthly, manual"),
      metadata: z
        .record(z.string(), z.unknown())
        .optional()
        .describe("Stringified JSON object of custom data"),
    }),
    output: baseResponseSchema.extend({
      data: subaccountSchema,
    }),
  },
};

import type { FetchSchemaRoutes } from "@better-fetch/fetch";
import z from "zod";

import {
  baseResponseSchema,
  paginationMetaSchema,
} from "~/server/fetch-clients/paystack/schemas/common";
import { bankSchema } from "~/server/fetch-clients/paystack/schemas/misc";

const getBankQuerySchema = z.object({
  country: z
    .string()
    .optional()
    .describe(
      "The country to obtain the list of supported banks. e.g country=ghana or country=nigeria",
    ),
  currency: z.string().optional().describe("Currency e.g GHS, NGN"),
  use_cursor: z.boolean().optional().describe("Use cursor for pagination"),
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
  previous: z.string().optional().describe("Cursor for the previous page"),
});

export const bankRoute: FetchSchemaRoutes = {
  // List banks
  "@get/bank": {
    query: getBankQuerySchema.optional(),
    output: baseResponseSchema.extend({
      data: z.array(bankSchema),
      meta: paginationMetaSchema,
    }),
  },
};

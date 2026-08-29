import z from "zod";

import {
  baseResponseSchema,
  countryEnum,
  currencyEnum,
  paginationMetaSchema,
} from "~/server/fetch-clients/paystack/schemas/common";
import { bankSchema } from "~/server/fetch-clients/paystack/schemas/misc";

const listBanksQuerySchema = z.object({
  country: countryEnum
    .optional()
    .describe(
      "The country to obtain the list of supported banks. e.g country=ghana or country=nigeria",
    ),
  currency: currencyEnum.optional().describe("Filter banks by currency"),
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

export type ListBanksQueryParams = z.infer<typeof listBanksQuerySchema>;

export const bankRoute = {
  // List banks
  "@get/bank": {
    query: listBanksQuerySchema.optional(),
    output: baseResponseSchema.extend({
      data: z.array(bankSchema),
      meta: paginationMetaSchema,
    }),
  },
};

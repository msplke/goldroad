import z from "zod";

import {
  baseQueryParamsSchema,
  currencyEnum,
} from "~/server/fetch-clients/paystack/schemas/common";
import { subaccountSchema } from "~/server/fetch-clients/paystack/schemas/subaccount";

const subaccountShareSchema = z.object({
  subaccount: z.string().describe("Subaccount ID"),
  share: z.number().describe("Share of the transaction split"),
});

const splitTypeEnum = z.enum(["percentage", "flat"]);
const splitBearerTypeEnum = z.enum([
  "account",
  "subaccount",
  "all-proportional",
  "all",
]);

export const transactionSplitSchema = z.object({
  id: z.number().describe("ID of the transaction split"),
  name: z.string().describe("Name of the transaction split"),
  type: splitTypeEnum,
  currency: currencyEnum.describe("Currency of the transaction split"),
  subaccounts: z.array(
    z.object({
      subaccount: subaccountSchema.pick({
        id: true,
        subaccount_code: true,
        account_number: true,
        settlement_bank: true,
        metadata: true,
      }),
      share: z.number().describe("Share of the transaction split"),
    }),
  ),
  active: z.boolean().describe("Whether the transaction split is active"),
  split_code: z.string().describe("Code of the transaction split"),
  bearer_type: splitBearerTypeEnum,
  total_subaccounts: z.int().describe("Total number of subaccounts"),
  createdAt: z.string().describe("Creation timestamp"),
  updatedAt: z.string().describe("Last update timestamp"),
});

export const createTransactionSplitSchema = transactionSplitSchema
  .pick({
    name: true,
    type: true,
    currency: true,
    bearer_type: true,
  })
  .extend({
    subaccounts: z
      .array(subaccountShareSchema)
      .describe("Subaccounts and their shares"),
    bearer_subaccount: z
      .string()
      .describe(
        "The subaccount bearing the Paystack charges. It is required if bearer_type is 'subaccount', and the subaccount must be one of those in the subaccounts array.",
      ),
  });

export type TransactionSplitCreationInfo = z.infer<
  typeof createTransactionSplitSchema
>;

export const transactionSplitQueryParamsSchema = baseQueryParamsSchema
  .extend({
    active: z.coerce.boolean().optional().describe("Filter by active status"),
  })
  .optional();

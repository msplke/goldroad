import z from "zod";

import {
  baseResponseSchema,
  paginationMetaSchema,
} from "~/server/fetch-clients/paystack/schemas/common";
import {
  createTransactionSplitSchema,
  transactionSplitQueryParamsSchema,
  transactionSplitSchema,
} from "~/server/fetch-clients/paystack/schemas/transaction-split";

export const transactionSplitRoutes = {
  "@post/split": {
    input: createTransactionSplitSchema,
    output: baseResponseSchema.extend({
      data: transactionSplitSchema,
    }),
  },
  "@get/split": {
    query: transactionSplitQueryParamsSchema,
    output: baseResponseSchema.extend({
      data: z.array(transactionSplitSchema),
      meta: paginationMetaSchema,
    }),
  },
  "@get/split/:id": {
    params: z.object({
      id: z.string().describe("Transaction split ID"),
    }),
    output: baseResponseSchema.extend({
      data: transactionSplitSchema,
    }),
  },
};

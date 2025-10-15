import type { FetchSchemaRoutes } from "@better-fetch/fetch";
import z from "zod";

import { baseResponseSchema } from "~/server/fetch-clients/paystack/schemas/common";
import {
  createSubaccountSchema,
  subaccountSchema,
} from "~/server/fetch-clients/paystack/schemas/subaccount";

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
    input: subaccountSchema.partial(),
    output: baseResponseSchema.extend({
      data: subaccountSchema,
    }),
  },
};

/** For endpoints categorised as miscellaneous on the Paystack API */
import z from "zod";

import { currencyEnum } from "~/server/fetch-clients/paystack/schemas/common";

export const bankSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  code: z.string(),
  longcode: z.string(),
  gateway: z.string().nullable(),
  pay_with_bank: z.boolean(),
  active: z.boolean(),
  country: z.string(),
  currency: currencyEnum.describe("The currency the bank operates in"),
  type: z.string(),
  is_deleted: z.boolean(),
});

/** For endpoints categorised as miscellaneous on the Paystack API */
import z from "zod";

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
  currency: z.string(),
  type: z.string(),
  is_deleted: z.boolean(),
});

import z from "zod";

import { metadataSchema } from "~/server/fetch-clients/paystack/schemas/common";

export const paymentPageTypeEnum = z.enum([
  "payment",
  "subscription",
  "product",
  "plan",
]);

export const paymentPageSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  amount: z.number().optional(),
  slug: z.string(),
  currency: z.string(),
  type: paymentPageTypeEnum.optional(),
  split_code: z.string().nullish(),
  redirect_url: z.string().optional(),
  success_message: z.string().optional(),
  collect_phone: z.boolean(),
  active: z.boolean(),
  published: z.boolean(),
  migrate: z.boolean().optional(),
  notification_email: z.string().optional(),
  custom_fields: z
    .array(
      z.object({
        display_name: z.string(),
        variable_name: z.string(),
        required: z.boolean(),
      }),
    )
    .optional(),
  metadata: metadataSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createPaymentPageSchema = paymentPageSchema
  .omit({
    id: true,
    slug: true,
    currency: true,
    success_message: true,
    collect_phone: true,
    active: true,
    published: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    plan: z.string().optional(),
  });

export type CreatePaymentPageInput = z.infer<typeof createPaymentPageSchema>;
export type PaymentPage = z.infer<typeof paymentPageSchema>;

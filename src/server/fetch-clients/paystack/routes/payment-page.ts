import {
  baseResponseSchema,
  createPaymentPageSchema,
  paymentPageSchema,
} from "~/server/fetch-clients/paystack/schemas";

export const paymentPageRoutes = {
  // Create Payment Page
  "@post/page": {
    input: createPaymentPageSchema,
    output: baseResponseSchema.extend({
      data: paymentPageSchema,
    }),
  },
};

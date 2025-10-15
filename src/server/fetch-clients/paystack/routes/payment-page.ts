import { baseResponseSchema } from "~/server/fetch-clients/paystack/schemas/common";
import {
  createPaymentPageSchema,
  paymentPageSchema,
} from "~/server/fetch-clients/paystack/schemas/payment-page";

export const paymentPageRoutes = {
  // Create Payment Page
  "@post/page": {
    input: createPaymentPageSchema,
    output: baseResponseSchema.extend({
      data: paymentPageSchema,
    }),
  },
};

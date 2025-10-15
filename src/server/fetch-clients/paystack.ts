import { createFetch, createSchema } from "@better-fetch/fetch";

import { env } from "~/env";
import { PAYSTACK_BASE_URL } from "~/lib/constants";
import { bankRoute } from "~/server/fetch-clients/paystack/routes/misc";
import { paymentPageRoutes } from "~/server/fetch-clients/paystack/routes/payment-page";
import { planRoutes } from "~/server/fetch-clients/paystack/routes/plan";
import { subaccountRoutes } from "~/server/fetch-clients/paystack/routes/subaccount";
import { subscriptionRoutes } from "~/server/fetch-clients/paystack/routes/subscription";

const paystackSchema = createSchema({
  ...subscriptionRoutes,
  ...planRoutes,
  ...bankRoute,
  ...subaccountRoutes,
  ...paymentPageRoutes,
});

export const paystackClient = createFetch({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
  },
  schema: paystackSchema,
  strict: true,
});

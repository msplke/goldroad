import "server-only";

import type { BetterFetch } from "@better-fetch/fetch";

import {
  paystackClient,
  type paystackSchema,
} from "~/server/fetch-clients/paystack/client";
import type { CreatePaymentPageInput } from "~/server/fetch-clients/paystack/schemas/payment-page";
import type {
  PaymentPageEndpoints,
  PaystackApiService,
} from "~/server/services/paystack/paystack-api-service";

type FetchClient = BetterFetch<{
  schema: typeof paystackSchema;
}>;

class BetterFetchPaystackApiService implements PaystackApiService<FetchClient> {
  $fetch: FetchClient;

  constructor(fetchClient: FetchClient) {
    this.$fetch = fetchClient;
  }

  paymentPage: PaymentPageEndpoints = {
    create: async (input: CreatePaymentPageInput) => {
      const response = await this.$fetch("@post/page", {
        throw: true,
        body: input,
      });

      return { id: response.data.id, slug: response.data.slug };
    },
  };
}

export const paystackApiService: PaystackApiService<FetchClient> =
  new BetterFetchPaystackApiService(paystackClient);

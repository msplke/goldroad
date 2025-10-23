import "server-only";

import type { BetterFetch } from "@better-fetch/fetch";

import {
  paystackClient,
  type paystackSchema,
} from "~/server/fetch-clients/paystack/client";
import type {
  MiscellaneousEndpoints,
  PaymentPageEndpoints,
  PaystackApiService,
  SubaccountEndpoints,
  TransactionSplitEndpoints,
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
    create: async (input) => {
      const response = await this.$fetch("@post/page", {
        throw: true,
        body: input,
      });

      return { id: response.data.id, slug: response.data.slug };
    },
  };
  split: TransactionSplitEndpoints = {
    create: async (input) => {
      const response = await this.$fetch("@post/split", {
        throw: true,
        body: input,
      });

      return { splitCode: response.data.split_code };
    },
  };
  subaccount: SubaccountEndpoints = {
    create: async (input) => {
      const response = await this.$fetch("@post/subaccount", {
        throw: true,
        body: input,
      });

      return { subaccountCode: response.data.subaccount_code };
    },
  };
  miscellaneous: MiscellaneousEndpoints = {
    listBanks: async (query) => {
      const response = await this.$fetch("@get/bank", {
        throw: true,
        query,
      });

      return response.data.map((bank) => ({
        id: bank.id,
        name: bank.name,
        code: bank.code,
      }));
    },
  };
}

export const paystackApiService: PaystackApiService<FetchClient> =
  new BetterFetchPaystackApiService(paystackClient);

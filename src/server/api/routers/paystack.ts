import z from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import {
  countryEnum,
  currencyEnum,
} from "~/server/fetch-clients/paystack/schemas/common";
import { paystackApiService } from "~/server/services/paystack/paystack-api";

export const paystackRouter = createTRPCRouter({
  bank: publicProcedure
    .input(
      z.object({
        country: countryEnum.default("kenya"),
        currency: currencyEnum.default("KES"),
      }),
    )
    .query(async ({ input }) => {
      const bankData = await paystackApiService.miscellaneous.listBanks({
        country: input.country,
        currency: input.currency,
      });

      return bankData;
    }),
});

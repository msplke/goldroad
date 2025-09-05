import { TRPCError } from "@trpc/server";
import z from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import {
  countryEnum,
  currencyEnum,
  paystackClient,
} from "~/server/fetch-clients/paystack";

export const paystackRouter = createTRPCRouter({
  bank: publicProcedure
    .input(
      z.object({
        country: countryEnum.default("kenya"),
        currency: currencyEnum.default("KES"),
      })
    )
    .query(async ({ input }) => {
      const { data: response, error } = await paystackClient("@get/bank", {
        cache: "no-store", // disables caching for this request
        query: {
          country: input.country,
          currency: input.currency,
        },
        throws: true,
      });

      if (!response) {
        throw new TRPCError({
          message: error.message || "Failed to fetch banks",
          code: "INTERNAL_SERVER_ERROR",
        });
      }

      return response.data;
    }),
});

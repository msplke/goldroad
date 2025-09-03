"use server";

import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

import type { DbType } from "~/server/db";
import { creator } from "~/server/db/schema";

export async function getCreator(db: DbType, userId: string) {
  const foundCreator = await db.query.creator.findFirst({
    where: eq(creator.userId, userId),
  });

  if (!foundCreator) {
    throw new TRPCError({
      message: "The current user is not a creator",
      code: "BAD_REQUEST",
    });
  }

  return foundCreator;
}

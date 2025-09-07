import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { user } from "~/server/db/schema/auth-schema";

const updatePersonalDetailsSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  email: z.email("Please enter a valid email address"),
});

export const userRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    const userData = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(eq(user.id, ctx.session.user.id))
      .limit(1);

    if (!userData.length) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return userData[0];
  }),

  updatePersonalDetails: protectedProcedure
    .input(updatePersonalDetailsSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if email is being changed and if it already exists for another user
        if (input.email !== ctx.session.user.email) {
          const existingUser = await db
            .select({ id: user.id })
            .from(user)
            .where(eq(user.email, input.email))
            .limit(1);

          if (
            existingUser.length > 0 &&
            existingUser[0]?.id !== ctx.session.user.id
          ) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "An account with this email address already exists",
            });
          }
        }

        const updatedUser = await db
          .update(user)
          .set({
            name: input.name,
            email: input.email,
            updatedAt: new Date(),
          })
          .where(eq(user.id, ctx.session.user.id))
          .returning({
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            emailVerified: user.emailVerified,
            updatedAt: user.updatedAt,
          });

        if (!updatedUser.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        return updatedUser[0];
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error("Error updating user personal details:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update personal details",
        });
      }
    }),
});

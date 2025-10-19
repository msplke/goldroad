import { TRPCError } from "@trpc/server";
import { and, count, eq } from "drizzle-orm";
import z from "zod";

import { MAX_BENEFITS_PER_PLAN } from "~/lib/constants";
import { generateSlugFromName } from "~/lib/utils";
import { getCreator } from "~/server/actions/trpc/creator";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { decryptSecret } from "~/server/crypto/kit-secrets";
import type { DbType } from "~/server/db";
import { user } from "~/server/db/schema";
import {
  creator,
  oneTimePaymentPage,
  plan,
  publication,
  publicationBenefit,
} from "~/server/db/schema/app-schema";
import { kitClient } from "~/server/fetch-clients/kit";
import { paystackApiService } from "~/server/services/paystack/paystack-api";

const CreatePublicationInfoSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9\s\-_]+$/, "Invalid characters in name"),
  description: z.string().max(500).optional(),
});

const UpdatePublicationInfoSchema = z.object({
  id: z.uuid("Invalid publication ID"),
  name: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9\s\-_]+$/, "Invalid characters in name"),
  description: z.string().max(500).optional(),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(100, "Slug must be less than 100 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens",
    )
    .refine((slug) => !slug.startsWith("-") && !slug.endsWith("-"), {
      message: "Slug cannot start or end with a hyphen",
    })
    .refine((slug) => !slug.includes("--"), {
      message: "Slug cannot contain consecutive hyphens",
    }),
});

const AddBenefitSchema = z.object({
  publicationId: z.uuid("Invalid publication ID"),
  description: z
    .string()
    .min(1, "Benefit description is required")
    .max(500, "Benefit description must be less than 500 characters"),
});

const UpdateBenefitSchema = z.object({
  benefitId: z.uuid("Invalid benefit ID"),
  description: z
    .string()
    .min(1, "Benefit description is required")
    .max(500, "Benefit description must be less than 500 characters"),
});

const DeleteBenefitSchema = z.object({
  benefitId: z.uuid("Invalid benefit ID"),
});

const ClearBenefitsSchema = z.object({
  publicationId: z.uuid("Invalid publication ID"),
});

// TODO: Use one validation schema on front and back end

export const publicationRouter = createTRPCRouter({
  /** Creates a publication with an optional Kit tag. Plans are created separately via the plan router. */
  create: protectedProcedure
    .input(CreatePublicationInfoSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        const foundCreator = await getCreator(tx, ctx.session.user.id);
        console.log("Checking for existing publication...");
        const existingPublication = await checkForExistingPublication(
          tx,
          foundCreator.id,
          input.name,
        );

        if (existingPublication) {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "A publication with this name from current creator already exists",
          });
        }

        let kitPublicationTagId: number | null = null;

        // Only create Kit tag if API key is available
        if (foundCreator.kitApiKey) {
          try {
            // Create a Kit tag for the publication
            console.log("Creating a tag for the publication on Kit...");
            const tag = await createKitTag(
              input.name,
              decryptSecret(foundCreator.kitApiKey),
            );
            kitPublicationTagId = tag.id;
          } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error(
              "Failed to create Kit tag, continuing without it:",
              msg,
            );
            // Don't throw - we can create the publication without Kit integration
          }
        } else {
          console.log(
            "Kit API key not available, creating publication without Kit tag",
          );
        }

        // Create the publication on the DB
        console.log("Creating the publication on the DB...");
        const publicationId = await createPublication(
          tx,
          foundCreator.id,
          kitPublicationTagId,
          input,
        );

        const { id: paymentPageId, slug } =
          await paystackApiService.paymentPage.create({
            name: `${input.name} - One-Time Payment`,
            description: `One-time payment page for ${input.name} publication`,
          });

        await tx.insert(oneTimePaymentPage).values({
          publicationId,
          paystackPaymentPageId: paymentPageId,
          paystackPaymentPageUrlSlug: slug,
        });

        console.log("Finished publication creation.");
        return publicationId;
      });
    }),

  /** Update publication details */
  update: protectedProcedure
    .input(UpdatePublicationInfoSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        const foundCreator = await getCreator(tx, ctx.session.user.id);

        // Check if publication exists and belongs to the current creator
        const existingPublication = await tx.query.publication.findFirst({
          where: and(
            eq(publication.id, input.id),
            eq(publication.creatorId, foundCreator.id),
          ),
        });

        if (!existingPublication) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message:
              "Publication not found or you don't have permission to edit it",
          });
        }

        // Check if another publication with the same name exists (excluding current one)
        if (input.name !== existingPublication.name) {
          const duplicatePublication = await tx.query.publication.findFirst({
            where: and(
              eq(publication.creatorId, foundCreator.id),
              eq(publication.name, input.name),
            ),
          });

          if (duplicatePublication) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "A publication with this name already exists",
            });
          }
        }

        // Check if another publication with the same slug exists (excluding current one)
        if (input.slug !== existingPublication.slug) {
          const duplicateSlugPublication = await tx.query.publication.findFirst(
            {
              where: eq(publication.slug, input.slug),
            },
          );

          if (duplicateSlugPublication) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "A publication with this slug already exists",
            });
          }
        }

        // Update the publication
        await tx
          .update(publication)
          .set({
            name: input.name,
            description: input.description,
            slug: input.slug,
          })
          .where(eq(publication.id, input.id));

        return { success: true };
      });
    }),

  /** Get current creator's publication (for editing) */
  getForEdit: protectedProcedure.query(async ({ ctx }) => {
    const foundCreator = await getCreator(ctx.db, ctx.session.user.id);

    const foundPublication = await ctx.db.query.publication.findFirst({
      where: eq(publication.creatorId, foundCreator.id),
    });

    if (!foundPublication) {
      throw new TRPCError({
        message: "No publication found for this creator",
        code: "NOT_FOUND",
      });
    }

    return foundPublication;
  }),

  /** Get all publications for the current creator */
  getByCreator: protectedProcedure.query(async ({ ctx }) => {
    const foundCreator = await getCreator(ctx.db, ctx.session.user.id);

    const publications = await ctx.db.query.publication.findMany({
      where: eq(publication.creatorId, foundCreator.id),
      orderBy: publication.createdAt,
    });

    return publications;
  }),

  /** Get a publication by its slug (public endpoint) */
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string().min(4, "Slug is required") }))
    .query(async ({ ctx, input }) => {
      const foundPublication = await ctx.db.query.publication.findFirst({
        where: eq(publication.slug, input.slug),
        with: {
          benefits: true,
        },
      });

      if (!foundPublication) {
        throw new TRPCError({
          message: "Publication not found",
          code: "NOT_FOUND",
        });
      }

      const foundCreator = await ctx.db.query.creator.findFirst({
        where: eq(creator.id, foundPublication.creatorId),
        columns: { id: true, userId: true },
      });

      if (!foundCreator) {
        throw new TRPCError({
          message: "Creator for publication not found",
          code: "NOT_FOUND",
        });
      }

      const foundUser = await ctx.db.query.user.findFirst({
        where: eq(user.id, foundCreator.userId),
        columns: { name: true },
      });

      if (!foundUser) {
        throw new TRPCError({
          message: "User for creator not found",
          code: "NOT_FOUND",
        });
      }

      const plans = await ctx.db.query.plan.findMany({
        where: eq(plan.publicationId, foundPublication.id),
        columns: {
          id: true,
          name: true,
          interval: true,
          amount: true,
          paystackPaymentPageUrlSlug: true,
        },
      });

      if (plans.length === 0) {
        throw new TRPCError({
          message: "Plans for publication not found",
          code: "NOT_FOUND",
        });
      }

      return {
        creatorName: foundUser.name,
        publication: {
          name: foundPublication.name,
          description: foundPublication.description,
          benefits: foundPublication.benefits,
          slug: foundPublication.slug,
          createdAt: foundPublication.createdAt,
        },
        plans,
      };
    }),

  getBenefits: protectedProcedure
    .input(z.object({ publicationId: z.uuid("Invalid publication ID") }))
    .query(async ({ ctx, input }) => {
      const foundCreator = await getCreator(ctx.db, ctx.session.user.id);

      // Verify the publication belongs to this creator
      const publicationResult = await ctx.db.query.publication.findFirst({
        where: eq(publication.id, input.publicationId),
      });

      if (
        !publicationResult ||
        publicationResult.creatorId !== foundCreator.id
      ) {
        throw new TRPCError({
          message: "Publication not found or access denied",
          code: "NOT_FOUND",
        });
      }

      const benefits = await ctx.db.query.publicationBenefit.findMany({
        where: eq(publicationBenefit.publicationId, input.publicationId),
        orderBy: publicationBenefit.createdAt,
      });

      return benefits;
    }),
  /** Add a benefit to a plan (max 4 benefits per plan) */
  addBenefit: protectedProcedure
    .input(AddBenefitSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        const foundCreator = await getCreator(tx, ctx.session.user.id);

        // Get publication and verify ownership
        const foundPublication = await tx.query.publication.findFirst({
          where: eq(publication.id, input.publicationId),
        });

        if (!foundPublication) {
          throw new TRPCError({
            message: "Publication not found",
            code: "NOT_FOUND",
          });
        }

        // Verify the publication belongs to this creator
        if (foundPublication.creatorId !== foundCreator.id) {
          throw new TRPCError({
            message: "You don't have permission to edit this publication",
            code: "FORBIDDEN",
          });
        }

        // Check current benefit count
        const benefitCountResult = await tx
          .select({ count: count() })
          .from(publicationBenefit)
          .where(eq(publicationBenefit.publicationId, input.publicationId));

        const benefitCount = benefitCountResult[0]?.count ?? 0;

        if (benefitCount >= MAX_BENEFITS_PER_PLAN) {
          throw new TRPCError({
            message: `A publication can have a maximum of ${MAX_BENEFITS_PER_PLAN} benefits`,
            code: "BAD_REQUEST",
          });
        }

        // Add the benefit
        const result = await tx
          .insert(publicationBenefit)
          .values({
            publicationId: input.publicationId,
            description: input.description,
          })
          .returning();

        return result[0];
      });
    }),

  /** Update a benefit description */
  updateBenefit: protectedProcedure
    .input(UpdateBenefitSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        const foundCreator = await getCreator(tx, ctx.session.user.id);

        // Get the benefit and verify ownership through publication
        const foundBenefit = await tx.query.publicationBenefit.findFirst({
          where: eq(publicationBenefit.id, input.benefitId),
          with: {
            publication: true,
          },
        });

        if (!foundBenefit) {
          throw new TRPCError({
            message: "Benefit not found",
            code: "NOT_FOUND",
          });
        }

        // Verify ownership
        if (foundBenefit.publication.creatorId !== foundCreator.id) {
          throw new TRPCError({
            message: "You don't have permission to edit this benefit",
            code: "FORBIDDEN",
          });
        }

        // Update the benefit
        await tx
          .update(publicationBenefit)
          .set({
            description: input.description,
          })
          .where(eq(publicationBenefit.id, input.benefitId));

        return { success: true };
      });
    }),

  /** Delete a benefit */
  deleteBenefit: protectedProcedure
    .input(DeleteBenefitSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        const foundCreator = await getCreator(tx, ctx.session.user.id);

        // Get the benefit and verify ownership through publication
        const foundBenefit = await tx.query.publicationBenefit.findFirst({
          where: eq(publicationBenefit.id, input.benefitId),
          with: {
            publication: true,
          },
        });

        if (!foundBenefit) {
          throw new TRPCError({
            message: "Benefit not found",
            code: "NOT_FOUND",
          });
        }

        // Verify ownership
        if (foundBenefit.publication.creatorId !== foundCreator.id) {
          throw new TRPCError({
            message: "You don't have permission to delete this benefit",
            code: "FORBIDDEN",
          });
        }

        // Delete the benefit
        await tx
          .delete(publicationBenefit)
          .where(eq(publicationBenefit.id, input.benefitId));

        return { success: true };
      });
    }),

  /** Clear all benefits for a plan */
  clearBenefits: protectedProcedure
    .input(ClearBenefitsSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        const foundCreator = await getCreator(tx, ctx.session.user.id);

        // Get publication and verify ownership
        const foundPublication = await tx.query.publication.findFirst({
          where: eq(publication.id, input.publicationId),
        });

        if (!foundPublication) {
          throw new TRPCError({
            message: "Publication not found",
            code: "NOT_FOUND",
          });
        }

        // Verify the publication belongs to this creator
        if (foundPublication.creatorId !== foundCreator.id) {
          throw new TRPCError({
            message: "You don't have permission to edit this publication",
            code: "FORBIDDEN",
          });
        }

        // Delete all benefits for this plan
        await tx
          .delete(publicationBenefit)
          .where(eq(publicationBenefit.publicationId, input.publicationId));

        return { success: true };
      });
    }),
});

/**Returns an empty Promise. Throws an error if a publication with the
 * provided creator id and publication name exists.
 */
async function checkForExistingPublication(
  db: DbType,
  creatorId: string,
  publicationName: string,
) {
  const existingPublication = await db.query.publication.findFirst({
    where: and(
      eq(publication.creatorId, creatorId),
      eq(publication.name, publicationName),
    ),
  });

  return existingPublication;
}

async function createPublication(
  db: DbType,
  creatorId: string,
  kitPublicationTagId: number | null,
  publicationInfo: z.infer<typeof CreatePublicationInfoSchema>,
) {
  // Generate a URL-friendly slug from the publication name
  const baseSlug = generateSlugFromName(publicationInfo.name);

  // Ensure slug uniqueness by checking existing publications and appending a number if needed
  const uniqueSlug = await ensureUniqueSlug(db, baseSlug);

  const result = await db
    .insert(publication)
    .values({
      name: publicationInfo.name,
      description: publicationInfo.description,
      slug: uniqueSlug,
      kitPublicationTagId,
      creatorId: creatorId,
    })
    .returning({ id: publication.id });

  const publicationId = result[0]?.id;

  if (!publicationId) {
    throw new TRPCError({
      message: "Could not create publication",
      code: "INTERNAL_SERVER_ERROR",
    });
  }

  return publicationId;
}

async function createKitTag(name: string, kitApiKey: string) {
  const { data: tagData, error } = await kitClient("@post/tags/", {
    body: { name },
    headers: { "X-Kit-Api-Key": kitApiKey },
  });
  if (error) {
    throw new TRPCError({
      message: error.message,
      code: "INTERNAL_SERVER_ERROR",
    });
  }

  return tagData.tag;
}

async function ensureUniqueSlug(db: DbType, baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existingPublication = await db.query.publication.findFirst({
      where: eq(publication.slug, slug),
    });

    if (!existingPublication) {
      return slug; // Slug is unique, we can use it
    }

    // If slug exists, try with a number suffix
    slug = `${baseSlug}-${counter}`;
    counter++;

    // Prevent infinite loops by setting a reasonable limit
    if (counter > 1000) {
      throw new TRPCError({
        message: "Unable to generate unique slug after 1000 attempts",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }
}

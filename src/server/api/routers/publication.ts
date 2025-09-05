import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import z from "zod";

import { getCreator } from "~/server/actions/trpc/creator";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import type { DbType } from "~/server/db";
import { publication } from "~/server/db/schema/app-schema";
import { kitClient } from "~/server/fetch-clients/kit";

const CreatePublicationInfoSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9\s\-_]+$/, "Invalid characters in name"),
  description: z.string().min(1).max(500).optional(),
});

export const publicationRouter = createTRPCRouter({
  /** Creates a publication with a Kit tag. Plans are created separately via the plan router. */
  create: protectedProcedure
    .input(CreatePublicationInfoSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        const foundCreator = await getCreator(tx, ctx.session.user.id);
        console.log("Checking for existing publication...");
        const existingPublication = await checkForExistingPublication(
          ctx.db,
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

        if (!foundCreator.kitApiKey) {
          throw new TRPCError({
            message: "Creator's Kit API Key is not set",
            code: "BAD_REQUEST",
          });
        }

        // Create a Kit tag for the publication
        console.log("Creating a tag for the publication on Kit...");
        const tag = await createKitTag(input.name, foundCreator.kitApiKey);

        // Create the publication on the DB
        console.log("Creating the publication on the DB...");
        const publicationId = await createPublication(
          tx,
          foundCreator.id,
          tag.id,
          input,
        );

        console.log("Finished publication creation.");
        return publicationId;
      });
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
  getBySlug: protectedProcedure
    .input(z.object({ slug: z.string().min(4, "Slug is required") }))
    .query(async ({ ctx, input }) => {
      const foundPublication = await ctx.db.query.publication.findFirst({
        where: eq(publication.slug, input.slug),
      });

      if (!foundPublication) {
        throw new TRPCError({
          message: "Publication not found",
          code: "NOT_FOUND",
        });
      }

      return foundPublication;
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
  kitPublicationTagId: number,
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

function generateSlugFromName(name: string): string {
  let slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  // Handle edge case where name results in empty slug or very short slug
  if (slug.length === 0) {
    slug = "publication";
  } else if (slug.length < 3) {
    slug = `publication-${slug}`;
  }

  return slug;
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

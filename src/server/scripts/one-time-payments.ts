// Run with
// `bun src/server/scripts/one-time-payments.ts`
// or `ts-node src/server/scripts/one-time-payments.ts`

import { and, eq } from "drizzle-orm";

import { type DbType, db } from "~/server/db";
import { oneTimePaymentPage, publication } from "~/server/db/schema";
import { paystackApiService } from "~/server/services/paystack/paystack-api";

async function getCreatorsWithPublicationsWithoutOneTimePaymentPages(
  db: DbType,
) {
  const creators = await db.query.creator.findMany({
    columns: {
      splitCode: true,
    },
    where: (creators, { isNotNull, exists }) =>
      and(
        isNotNull(creators.splitCode),
        exists(
          db
            .select()
            .from(publication)
            .where(eq(publication.creatorId, creators.id)),
        ),
      ),
    with: {
      publications: {
        columns: {
          id: true,
          name: true,
        },
        with: {
          oneTimePaymentPage: true,
        },
        where: (publications, { notExists }) =>
          notExists(
            db
              .select()
              .from(oneTimePaymentPage)
              .where(eq(oneTimePaymentPage.publicationId, publications.id)),
          ),
      },
    },
  });
  return creators.filter((creator) => creator.publications.length > 0);
}

async function createOneTimePaymentPageForPublication(
  db: DbType,
  publicationId: string,
  publicationName: string,
  creatorSplitCode: string,
) {
  console.log(
    "Creating one-time payment page for publication:",
    publicationName,
  );
  const { id: paymentPageId, slug } =
    await paystackApiService.paymentPage.create({
      name: `${publicationName} - One-Time Payment`,
      description: `One-time payment page for ${publicationName} publication`,
      split_code: creatorSplitCode,
    });
  await db.insert(oneTimePaymentPage).values({
    publicationId,
    paystackPaymentPageId: paymentPageId,
    paystackPaymentPageUrlSlug: slug,
  });
  console.log(
    `Created one-time payment page for publication '${publicationName}' with Paystack Payment Page ID: ${paymentPageId}`,
  );
}

async function main() {
  await db.transaction(async (tx) => {
    const creators =
      await getCreatorsWithPublicationsWithoutOneTimePaymentPages(tx);
    console.log(
      `Found ${creators.length} creators without one-time payment pages for their publications.`,
    );
    for (const creator of creators) {
      console.dir(creator, { depth: 2 });
      for (const publication of creator.publications) {
        if (!creator.splitCode) {
          console.warn(
            `Skipping publication '${publication.name}' because creator has no split code.`,
          );
          continue;
        }
        await createOneTimePaymentPageForPublication(
          tx,
          publication.id,
          publication.name,
          creator.splitCode,
        );
      }
    }
  });
}

main()
  .then(() => {
    console.log("One-time payment script completed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error running one-time payment script:", error);
    process.exit(1);
  });

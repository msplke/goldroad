import { BetterFetchError } from "@better-fetch/fetch";
import { and, eq, isNull, not } from "drizzle-orm";

import { env } from "~/env";
import { SUBACCOUNT_PERCENTAGE_CHARGE } from "~/lib/constants";
import { type DbType, db } from "~/server/db";
import { creator, plan } from "~/server/db/schema";
import { paystackClient } from "~/server/fetch-clients/paystack/client";

const currentDomain = env.PAYSTACK_SECRET_KEY.split("_")[1];
const alternateDomain = currentDomain === "test" ? "live" : "test";

async function getCreatorsWithSplitCodes(db: DbType) {
  const creators = await db.query.creator.findMany({
    columns: { id: true, paystackSubaccountCode: true, splitCode: true },
    where: and(
      isNull(creator.splitCode),
      not(isNull(creator.paystackSubaccountCode)),
    ),
    with: {
      user: {
        columns: { name: true },
      },
      publications: {
        with: {
          plans: {
            columns: {
              id: true,
              paystackPlanCode: true,
              name: true,
              interval: true,
              amount: true,
            },
          },
        },
      },
    },
  });

  console.log(`Found ${creators.length} creators.`);
  console.log(creators);

  return creators;
}

// 2. Create a split group if they have a paystack subaccount code but no split code
async function createSplitGroup(
  creatorId: string,
  userName: string,
  subaccountCode: string,
) {
  console.log(`Creating split for creator ${creatorId}...`);

  try {
    const { data } = await paystackClient("@post/split", {
      throw: true,
      body: {
        name: `Goldroad Creator Split - ${userName}`,
        currency: "KES",
        type: "percentage",
        subaccounts: [
          {
            subaccount: subaccountCode,
            share: 100 - SUBACCOUNT_PERCENTAGE_CHARGE,
          },
        ],
        bearer_type: "subaccount",
        bearer_subaccount: subaccountCode,
      },
    });

    console.log(
      `Created split with code ${data.split_code} for creator ${creatorId}.`,
    );

    return data.split_code;
  } catch (error) {
    if (
      error instanceof BetterFetchError &&
      error.status === 400 &&
      error.error?.message?.includes("subaccount does not exist")
    ) {
      console.error(`Subaccount ${subaccountCode} does not exist.`);
      console.error(
        `Maybe it was deleted on Paystack? Or is present in different domain (${alternateDomain})?`,
      );
      throw error;
    }

    console.error(
      `Error creating split for creator ${creatorId} with subaccount: ${subaccountCode}`,
    );

    throw error;
  }
}

// 3. Update the creator with the new split code
async function updateCreatorSplitCode(
  tx: DbType,
  creatorId: string,
  splitCode: string,
) {
  console.log(`Updating creator ${creatorId} with split code...`);
  await tx.update(creator).set({ splitCode }).where(eq(creator.id, creatorId));
}

async function getPaystackPlanDetails(planCode: string) {
  const { data } = await paystackClient("@get/plan/:id_or_code", {
    throw: true,
    params: { id_or_code: planCode },
  });
  console.log(data);
  return data;
}

// 4. Create new payment page for a plan with the split code
async function createPaymentPageForPlan(
  tx: DbType,
  planId: string,
  planCode: string,
  planName: string,
  splitCode: string,
) {
  const paystackPlanDetails = await getPaystackPlanDetails(planCode);
  if (!paystackPlanDetails) {
    console.log(`Plan ${planCode} not found on Paystack. Skipping...`);
    return;
  }
  console.log(`Creating new payment page for plan ${planCode}...`);
  const { data: paymentPageData } = await paystackClient("@post/page", {
    throw: true,
    body: {
      name: planName,
      type: "subscription",
      plan: paystackPlanDetails.id,
      split_code: splitCode,
    },
  });

  console.log(
    `Created payment page with ID ${paymentPageData.id} for plan ${planCode}. Updating db...`,
  );
  await tx
    .update(plan)
    .set({
      paystackPaymentPageId: paymentPageData.id,
      paystackPaymentPageUrlSlug: paymentPageData.slug,
    })
    .where(eq(plan.id, planId));
}

// 4. Create new payment pages for all plans in publications
async function updatePaymentPagesForPublications(
  tx: DbType,
  publications: Array<{
    plans: Array<{ id: string; paystackPlanCode: string; name: string }>;
  }>,
  splitCode: string,
) {
  await Promise.all(
    publications.flatMap((pub) =>
      pub.plans.map(async (p) =>
        createPaymentPageForPlan(
          tx,
          p.id,
          p.paystackPlanCode,
          p.name,
          splitCode,
        ),
      ),
    ),
  );
}

/** This function takes existing creators and puts them into split groups and updates their payment pages with the split codes */
async function subaccountToSplitUpdate() {
  console.log("Starting subaccount to split update...");
  await db.transaction(async (tx) => {
    const creators = await getCreatorsWithSplitCodes(tx);
    for (const c of creators) {
      if (!c.paystackSubaccountCode) {
        console.log(
          `Skipping creator ${c.id} as they have no subaccount code.`,
        );
        continue;
      }
      let splitCode = c.splitCode;
      if (!splitCode) {
        splitCode = await createSplitGroup(
          c.id,
          c.user.name,
          c.paystackSubaccountCode,
        );
        await updateCreatorSplitCode(tx, c.id, splitCode);
      }
      await updatePaymentPagesForPublications(tx, c.publications, splitCode);
    }
  });

  console.log("Subaccount to split update completed.");
}

function main() {
  console.log(`Current domain: ${currentDomain}`);
  subaccountToSplitUpdate()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error("Error during subaccount to split update:");
      console.error(err);
      process.exit(1);
    });
}

main();

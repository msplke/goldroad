import { relations } from "drizzle-orm";
import { unique } from "drizzle-orm/pg-core";

import { user } from "~/server/db/schema/auth-schema";
import { createdAt, createTable, updatedAt } from "~/server/db/schema/utils";
import type {
  PlanInterval,
  SubscriptionStatus,
} from "~/server/fetch-clients/paystack";

export const paidSubscriber = createTable("paid_subscriber", (d) => ({
  id: d.uuid().primaryKey().defaultRandom(),
  email: d.text().unique().notNull(),
  firstName: d.text(),
  paystackSubscriptionCode: d.text().unique().notNull(),
  kitSubscriberId: d.bigint({ mode: "number" }).unique().notNull(),
  status: d
    .varchar({ length: 20 })
    .$type<SubscriptionStatus>()
    .default("active")
    .notNull(),
  planId: d
    .uuid()
    .references(() => plan.id, { onDelete: "cascade" })
    .notNull(),
  nextPaymentDate: d.timestamp({ mode: "date", withTimezone: true }),
  totalRevenue: d.integer().notNull(), // Amount in Ksh.
  createdAt,
  updatedAt,
}));

export const tagInfo = createTable("tag_info", (d) => ({
  id: d.uuid().defaultRandom().primaryKey(),
  creatorId: d
    .uuid()
    .notNull()
    .references(() => creator.id, { onDelete: "cascade" }),
  kitActiveTagId: d.bigint({ mode: "number" }).notNull(),
  kitNonRenewingTagId: d.bigint({ mode: "number" }).notNull(),
  kitAttentionTagId: d.bigint({ mode: "number" }).notNull(),
  kitCompletedTagId: d.bigint({ mode: "number" }).notNull(),
  kitCancelledTagId: d.bigint({ mode: "number" }).notNull(),
  kitMonthlySubscriberTag: d.bigint({ mode: "number" }).notNull(),
  kitAnnualSubscriberTag: d.bigint({ mode: "number" }).notNull(),
  // The following subscriber tags are mainly to expedite testing
  kitDailySubscriberTag: d.bigint({ mode: "number" }).notNull(),
  kitHourlySubscriberTag: d.bigint({ mode: "number" }).notNull(),
  createdAt,
  updatedAt,
}));

export const creator = createTable("creator", (d) => ({
  id: d.uuid().defaultRandom().primaryKey(),
  userId: d
    .text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  // To be encrypted
  kitApiKey: d.text(),
  paystackSubaccountCode: d.text(),
  createdAt,
  updatedAt,
}));

export const creatorRelations = relations(creator, ({ one }) => ({
  tagInfo: one(tagInfo),
}));

export const publication = createTable("publication", (d) => ({
  id: d.uuid().primaryKey().defaultRandom(),
  name: d.text().notNull(),
  description: d.text(),
  slug: d.text().unique().notNull(), // For /p/[publication-slug] URLs
  kitPublicationTagId: d.bigint({ mode: "number" }).notNull(),
  creatorId: d
    .uuid()
    .notNull()
    .references(() => creator.id, { onDelete: "cascade" }),
  createdAt,
  updatedAt,
}));

export const plan = createTable(
  "plan",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    name: d.text().notNull(),
    interval: d.text().$type<PlanInterval>().notNull(),
    amount: d.integer().notNull(), // Plan amount in Ksh.
    publicationId: d
      .uuid()
      .notNull()
      .references(() => publication.id, { onDelete: "cascade" }),
    // kitPlanNameTagId: d.bigint({ mode: "number" }).notNull(),
    // kitIntervalTagId: d.bigint({ mode: "number" }).notNull(),
    paystackPlanCode: d.text().notNull(),
    paystackPaymentPageId: d.bigint({ mode: "number" }).notNull(),
    paystackPaymentPageUrlSlug: d.text().notNull(),
    createdAt,
    updatedAt,
  }),
  (t) => [
    unique("unique_publication_interval").on(t.publicationId, t.interval),
  ],
);

export const planBenefit = createTable("plan_benefit", (d) => ({
  id: d.uuid().primaryKey().defaultRandom(),
  planId: d
    .uuid()
    .notNull()
    .references(() => plan.id, { onDelete: "cascade" }),
  description: d.text().notNull(),
  createdAt,
  updatedAt,
}));

export const planRelations = relations(plan, ({ many, one }) => ({
  planBenefits: many(planBenefit),
  publication: one(publication, {
    fields: [plan.publicationId],
    references: [publication.id],
  }),
}));

export const planBenefitRelations = relations(planBenefit, ({ one }) => ({
  plan: one(plan, {
    fields: [planBenefit.planId],
    references: [plan.id],
  }),
}));

// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

// db/schema.ts
import { relations } from "drizzle-orm";

import { user } from "~/server/db/schema/auth-schema";
import { createdAt, createTable, updatedAt } from "~/server/db/schema/utils";
import type {
  PlanInterval,
  SubscriptionStatus,
} from "~/server/fetch-clients/paystack";

export const paidSubscriber = createTable("paid_subscriber", (d) => ({
  id: d.uuid().primaryKey().defaultRandom(),
  email: d.text("email").unique().notNull(),
  firstName: d.text("first_name"),
  paystackSubscriptionCode: d
    .text("paystack_subscription_code")
    .unique()
    .notNull(),
  kitSubscriberId: d
    .bigint("kit_subscriber_id", { mode: "number" })
    .unique()
    .notNull(),
  status: d
    .varchar("status", { length: 20 })
    .$type<SubscriptionStatus>()
    .default("active")
    .notNull(),
  createdAt,
  updatedAt,
}));

export const tagInfo = createTable("tag_info", (d) => ({
  id: d.uuid().defaultRandom().primaryKey(),
  creatorId: d
    .uuid()
    .notNull()
    .references(() => creator.id),
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
    .references(() => user.id),
  // To be encrypted
  kitApiKey: d.text().notNull(),
  paystackSubaccountCode: d.text().notNull(),
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
  kitPublicationTagId: d.bigint({ mode: "number" }).notNull(),
  creatorId: d
    .uuid()
    .notNull()
    .references(() => creator.id, { onDelete: "cascade" }),
}));

export const plan = createTable("plan", (d) => ({
  id: d.uuid().primaryKey().defaultRandom(),
  name: d.text().notNull(),
  interval: d.text().$type<PlanInterval>().notNull(),
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
}));

export const planBenefit = createTable("plan_benefit", (d) => ({
  id: d.uuid().primaryKey().defaultRandom(),
  planId: d
    .uuid()
    .notNull()
    .references(() => plan.id, { onDelete: "cascade" }),
  description: d.text().notNull(),
}));

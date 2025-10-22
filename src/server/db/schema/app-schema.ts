import { relations } from "drizzle-orm";
import { unique } from "drizzle-orm/pg-core";

import { user } from "~/server/db/schema/auth-schema";
import { createdAt, createTable, updatedAt } from "~/server/db/schema/utils";
import type {
  PaymentChannel,
  PlanInterval,
  SubscriptionStatus,
} from "~/server/fetch-clients/paystack/schemas/common";

export const paidSubscriber = createTable("paid_subscriber", (d) => ({
  id: d.uuid().primaryKey().defaultRandom(),
  email: d.text().unique().notNull(),
  firstName: d.text(),
  paystackSubscriptionCode: d.text().unique().notNull(),
  kitSubscriberId: d.bigint({ mode: "number" }).unique(), // Optional for creators without Kit integration
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
  kitApiKey: d.text(), // Stored as encrypted value
  paystackSubaccountCode: d.text(),
  splitCode: d.text(),
  createdAt,
  updatedAt,
}));

export const publication = createTable("publication", (d) => ({
  id: d.uuid().primaryKey().defaultRandom(),
  name: d.text().notNull(),
  description: d.text(),
  slug: d.text().unique().notNull(), // For /p/[publication-slug] URLs
  kitPublicationTagId: d.bigint({ mode: "number" }), // Optional for creators without Kit integration
  creatorId: d
    .uuid()
    .notNull()
    .references(() => creator.id, { onDelete: "cascade" }),
  createdAt,
  updatedAt,
}));

export const successfulOneTimePayment = createTable(
  "successful_one_time_payment",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    publicationId: d
      .uuid()
      .notNull()
      .references(() => publication.id, { onDelete: "cascade" }),
    paystackPaymentReference: d.text().notNull(),
    firstName: d.text(),
    lastName: d.text(),
    email: d.text().notNull(),
    amount: d.integer().notNull(), // Amount in Ksh.
    channel: d.text().$type<PaymentChannel>().notNull(),
    createdAt,
  }),
);

export type InsertSuccessfulOneTimePayment =
  typeof successfulOneTimePayment.$inferInsert;
export type SelectSuccessfulOneTimePayment =
  typeof successfulOneTimePayment.$inferSelect;

export const oneTimePaymentPage = createTable("one_time_payment_page", (d) => ({
  id: d.uuid().primaryKey().defaultRandom(),
  publicationId: d
    .uuid()
    .notNull()
    .references(() => publication.id, { onDelete: "cascade" }),
  paystackPaymentPageId: d.bigint({ mode: "number" }).notNull(),
  paystackPaymentPageUrlSlug: d.text().notNull(),
  amount: d.integer(), // Can be null for variable amount pages, amount in Ksh.
  minAmount: d.integer(), // Minimum amount for variable amount pages, in Ksh.
  maxAmount: d.integer(), // Maximum amount for variable amount pages, in Ksh.
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

export const creatorRelations = relations(creator, ({ many, one }) => ({
  user: one(user, {
    fields: [creator.userId],
    references: [user.id],
  }),
  publications: many(publication),
  oneTimePaymentPages: many(oneTimePaymentPage),
  tagInfo: one(tagInfo, {
    fields: [creator.id],
    references: [tagInfo.creatorId],
  }),
}));

export const publicationBenefit = createTable("publication_benefit", (d) => ({
  id: d.uuid().primaryKey().defaultRandom(),
  publicationId: d
    .uuid()
    .notNull()
    .references(() => publication.id, { onDelete: "cascade" }),
  description: d.text().notNull(),
  createdAt,
  updatedAt,
}));

export const publicationRelations = relations(publication, ({ many, one }) => ({
  plans: many(plan),
  benefits: many(publicationBenefit),
  creator: one(creator, {
    fields: [publication.creatorId],
    references: [creator.id],
  }),
  oneTimePayments: many(successfulOneTimePayment),
  oneTimePaymentPage: many(oneTimePaymentPage),
}));

export const planRelations = relations(plan, ({ one }) => ({
  publication: one(publication, {
    fields: [plan.publicationId],
    references: [publication.id],
  }),
}));

export const publicationBenefitRelations = relations(
  publicationBenefit,
  ({ one }) => ({
    publication: one(publication, {
      fields: [publicationBenefit.publicationId],
      references: [publication.id],
    }),
  }),
);

export const successfulOneTimePaymentRelations = relations(
  successfulOneTimePayment,
  ({ one }) => ({
    publication: one(publication, {
      fields: [successfulOneTimePayment.publicationId],
      references: [publication.id],
    }),
  }),
);

export const oneTimePaymentPageRelations = relations(
  oneTimePaymentPage,
  ({ one }) => ({
    publication: one(publication, {
      fields: [oneTimePaymentPage.publicationId],
      references: [publication.id],
    }),
  }),
);

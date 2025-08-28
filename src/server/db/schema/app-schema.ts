// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

// db/schema.ts
import { relations } from "drizzle-orm";

import type { PaymentStatus } from "~/env";
import { user } from "~/server/db/schema/auth-schema";
import { createdAt, createTable, updatedAt } from "~/server/db/schema/utils";

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
    .$type<PaymentStatus>()
    .default("paid")
    .notNull(),
  createdAt,
  updatedAt,
}));

export const tagInfo = createTable("tag_info", (d) => ({
  id: d.uuid().defaultRandom().primaryKey(),
  creatorId: d
    .text()
    .notNull()
    .references(() => creator.id),
  kit_active_tag_id: d.bigint({ mode: "number" }).notNull(),
  kit_non_renewing_tag_id: d.bigint({ mode: "number" }).notNull(),
  kit_attention_tag_id: d.bigint({ mode: "number" }).notNull(),
  kit_completed_tag_id: d.bigint({ mode: "number" }).notNull(),
  kit_cancelled_tag_id: d.bigint({ mode: "number" }).notNull(),
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
  paystackSubaccountId: d.bigint({ mode: "number" }).notNull(),
  createdAt,
  updatedAt,
}));

export const creatorRelations = relations(creator, ({ one }) => ({
  tagInfo: one(tagInfo),
}));

// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

// db/schema.ts
import type { PaymentStatus } from "~/env";
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

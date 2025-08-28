// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

// db/schema.ts
import type { PaymentStatus } from "~/env";
import { createdAt, createTable, updatedAt } from "~/server/db/schema/utils";

export const paid_subscriber = createTable("paid_subscribers", (d) => ({
  id: d.uuid().primaryKey().defaultRandom(),
  email: d.text("email"),
  firstName: d.text("first_name").default(""),
  paystackSubscriptionCode: d.text("paystack_subscription_code"),
  kitSubscriberId: d.bigint("kit_subscriber_id", { mode: "number" }),
  status: d.varchar("status", { length: 20 }).$type<PaymentStatus>(),
  createdAt,
  updatedAt,
}));

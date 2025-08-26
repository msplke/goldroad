// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { index } from "drizzle-orm/pg-core";
import { createdAt, createTable, updatedAt } from "~/server/db/schema/utils";

export const posts = createTable(
  "post",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }),
    createdAt,
    updatedAt,
  }),
  (t) => [index("name_idx").on(t.name)],
);

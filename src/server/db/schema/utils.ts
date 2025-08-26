import { pgTableCreator, timestamp } from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `goldroad_${name}`);

export const createdAt = timestamp("created_at", { withTimezone: true })
  .defaultNow()
  .notNull();
export const updatedAt = timestamp("updated_at", {
  withTimezone: true,
}).$onUpdate(() => new Date());

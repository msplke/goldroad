import { createdAt, createTable, updatedAt } from "~/server/db/schema/utils";

export const user = createTable("user", (d) => ({
  id: d.text().primaryKey(),
  name: d.text().notNull(),
  email: d.text().notNull().unique(),
  emailVerified: d.boolean().notNull(),
  image: d.text(),
  createdAt,
  updatedAt,
}));

export const session = createTable("session", (d) => ({
  id: d.text().primaryKey(),
  token: d.text().notNull().unique(),
  expiresAt: d.timestamp().notNull(),
  ipAddress: d.text(),
  userAgent: d.text(),
  createdAt,
  updatedAt,

  userId: d
    .text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
}));

export const account = createTable("account", (d) => ({
  id: d.text().primaryKey(),
  accountId: d.text().notNull(),
  providerId: d.text().notNull(),
  accessToken: d.text(),
  refreshToken: d.text(),
  accessTokenExpiresAt: d.timestamp(),
  refreshTokenExpiresAt: d.timestamp(),
  scope: d.text(),
  idToken: d.text(),
  password: d.text(),
  createdAt,
  updatedAt,

  userId: d
    .text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
}));

export const verification = createTable("verification", (d) => ({
  id: d.text().primaryKey(),
  identifier: d.text().notNull(),
  value: d.text().notNull(),
  expiresAt: d.timestamp().notNull(),
  createdAt,
  updatedAt,
}));

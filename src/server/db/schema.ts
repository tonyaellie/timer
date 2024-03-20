// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { relations, sql } from "drizzle-orm";
import {
  bigint,
  char,
  mysqlTableCreator,
  primaryKey,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = mysqlTableCreator((name) => `timer_${name}`);

export const groups = createTable(
  "groups",
  {
    id: char("id", { length: 12 }).notNull(),
    name: varchar("name", { length: 256 }).notNull(),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (groups) => ({
    groups_pkey: primaryKey({
      columns: [groups.id],
    }),
  }),
);

export const groupRelations = relations(groups, ({ many }) => ({
  timers: many(timers),
  members: many(members),
}));

export const timers = createTable(
  "timers",
  {
    id: char("id", { length: 12 }).notNull(),
    label: varchar("name", { length: 50 }),
    startsAt: timestamp("starts_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    length: bigint("length", {
      mode: "number",
    }).notNull(), // in seconds
    pausedAt: timestamp("paused_at"), // time the timer was paused (if it was paused)
    totalPaused: bigint("total_paused", { mode: "number" }).notNull(), // total time the timer was paused (not including the current pause)
    groupId: bigint("group_id", { mode: "number" }).notNull(),
  },
  (timers) => ({
    timers_pkey: primaryKey({
      columns: [timers.id],
    }),
  }),
);

export const timersRelations = relations(timers, ({ one }) => ({
  group: one(groups, {
    fields: [timers.groupId],
    references: [groups.id],
  }),
}));

export const members = createTable("members", {
  id: varchar("id", { length: 36 }).primaryKey(),
  groupId: char("group_id", { length: 12 }).notNull(),
});

export const memberRelations = relations(members, ({ one }) => ({
  group: one(groups, {
    fields: [members.groupId],
    references: [groups.id],
  }),
}));

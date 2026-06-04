import { pgTable, serial, integer, timestamp, unique } from "drizzle-orm/pg-core";

export const followsTable = pgTable("follows", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  artistId: integer("artist_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [unique().on(t.userId, t.artistId)]);

export type Follow = typeof followsTable.$inferSelect;

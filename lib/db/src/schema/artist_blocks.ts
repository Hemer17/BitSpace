import { pgTable, serial, integer, timestamp, unique } from "drizzle-orm/pg-core";

export const artistBlocksTable = pgTable("artist_blocks", {
  id: serial("id").primaryKey(),
  artistId: integer("artist_id").notNull(),
  blockedUserId: integer("blocked_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [unique().on(t.artistId, t.blockedUserId)]);

export type ArtistBlock = typeof artistBlocksTable.$inferSelect;

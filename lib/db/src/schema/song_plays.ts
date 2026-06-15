import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const songPlaysTable = pgTable("song_plays", {
  id: serial("id").primaryKey(),
  songId: integer("song_id").notNull(),
  artistId: integer("artist_id").notNull(),
  playedAt: timestamp("played_at").defaultNow().notNull(),
});

export type SongPlay = typeof songPlaysTable.$inferSelect;

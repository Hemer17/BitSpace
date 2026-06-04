import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const songsTable = pgTable("songs", {
  id: serial("id").primaryKey(),
  artistId: integer("artist_id").notNull(),
  title: text("title").notNull(),
  duration: text("duration").notNull().default("0:00"),
  genre: text("genre").notNull().default(""),
  coverUrl: text("cover_url"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export type Song = typeof songsTable.$inferSelect;

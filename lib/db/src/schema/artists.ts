import { pgTable, serial, text, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const artistsTable = pgTable("artists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  genre: text("genre").notNull(),
  city: text("city").notNull(),
  followers: integer("followers").notNull().default(0),
  verified: boolean("verified").notNull().default(false),
  avatarInitials: text("avatar_initials").notNull(),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  userId: integer("user_id"),
  plays: integer("plays").notNull().default(0),
  banned: boolean("banned").notNull().default(false),
});

export const insertArtistSchema = createInsertSchema(artistsTable).omit({ id: true });
export type InsertArtist = z.infer<typeof insertArtistSchema>;
export type Artist = typeof artistsTable.$inferSelect;

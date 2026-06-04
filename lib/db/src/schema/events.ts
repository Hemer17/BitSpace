import { pgTable, serial, text, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const eventsTable = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  artistName: text("artist_name").notNull(),
  artistId: integer("artist_id"),
  city: text("city").notNull(),
  venue: text("venue").notNull(),
  date: text("date").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  price: real("price").notNull(),
  ticketsLeft: integer("tickets_left").notNull().default(100),
  imageUrl: text("image_url").notNull(),
  genre: text("genre").notNull().default(""),
  isTrending: boolean("is_trending").notNull().default(false),
});

export const insertEventSchema = createInsertSchema(eventsTable).omit({ id: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof eventsTable.$inferSelect;

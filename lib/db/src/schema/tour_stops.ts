import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tourStopsTable = pgTable("tour_stops", {
  id: serial("id").primaryKey(),
  artistName: text("artist_name").notNull(),
  artistId: integer("artist_id"),
  city: text("city").notNull(),
  venue: text("venue").notNull(),
  date: text("date").notNull(),
  status: text("status").notNull().default("on_sale"),
});

export const insertTourStopSchema = createInsertSchema(tourStopsTable).omit({ id: true });
export type InsertTourStop = z.infer<typeof insertTourStopSchema>;
export type TourStop = typeof tourStopsTable.$inferSelect;

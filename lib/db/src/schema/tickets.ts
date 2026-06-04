import { pgTable, serial, text, integer, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ticketsTable = pgTable("tickets", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id"),
  eventTitle: text("event_title").notNull(),
  artistName: text("artist_name").notNull(),
  artistId: integer("artist_id"),
  city: text("city").notNull(),
  venue: text("venue").notNull(),
  date: text("date").notNull(),
  price: real("price").notNull(),
  originalPrice: real("original_price"),
  status: text("status").notNull().default("confirmed"),
  qrCode: text("qr_code").notNull(),
  ownerUserId: integer("owner_user_id"),
  forSale: boolean("for_sale").notNull().default(false),
  resalePrice: real("resale_price"),
});

export const insertTicketSchema = createInsertSchema(ticketsTable).omit({ id: true });
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof ticketsTable.$inferSelect;

import { pgTable, serial, text, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const merchTable = pgTable("merch", {
  id: serial("id").primaryKey(),
  artistId: integer("artist_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  price: real("price").notNull(),
  stock: integer("stock").notNull().default(0),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  badge: text("badge").notNull().default(""),
});

export const insertMerchSchema = createInsertSchema(merchTable).omit({ id: true });
export type InsertMerch = z.infer<typeof insertMerchSchema>;
export type Merch = typeof merchTable.$inferSelect;

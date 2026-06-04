import { pgTable, serial, text, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const postsTable = pgTable("posts", {
  id: serial("id").primaryKey(),
  artistId: integer("artist_id").notNull(),
  artistName: text("artist_name").notNull(),
  artistGenre: text("artist_genre").notNull(),
  artistAvatarUrl: text("artist_avatar_url"),
  artistAvatarInitials: text("artist_avatar_initials").notNull(),
  type: text("type").notNull().default("story"),
  content: text("content").notNull(),
  likes: integer("likes").notNull().default(0),
  reposts: integer("reposts").notNull().default(0),
  comments: integer("comments").notNull().default(0),
  timeAgo: text("time_ago").notNull(),
});

export const commentsTable = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  author: text("author").notNull(),
  content: text("content").notNull(),
  timeAgo: text("time_ago").notNull().default("just now"),
});

export const insertPostSchema = createInsertSchema(postsTable).omit({ id: true });
export const insertCommentSchema = createInsertSchema(commentsTable).omit({ id: true });
export type InsertPost = z.infer<typeof insertPostSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Post = typeof postsTable.$inferSelect;
export type Comment = typeof commentsTable.$inferSelect;

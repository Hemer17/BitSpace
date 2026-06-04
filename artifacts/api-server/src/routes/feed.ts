import { Router } from "express";
import { db } from "@workspace/db";
import { postsTable, commentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/feed", async (req, res) => {
  try {
    const { type } = req.query as { type?: string };
    let posts = await db.select().from(postsTable);
    if (type && type !== "all") {
      posts = posts.filter((p) => p.type === type);
    }
    res.json(posts.map((p) => ({ ...p, liked: false, meta: null })));
  } catch (err) {
    req.log.error({ err }, "Failed to get feed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/feed/summary", async (req, res) => {
  try {
    const posts = await db.select().from(postsTable);
    const releases = posts.filter((p) => p.type === "release").length;
    const tourPosts = posts.filter((p) => p.type === "tour").length;
    res.json({
      newAnnouncements: posts.length,
      newReleases: releases,
      newTourDates: tourPosts,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get feed summary");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/posts/:id/like", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id));
    if (!post) return res.status(404).json({ error: "Not found" });
    const newLikes = post.likes + 1;
    await db.update(postsTable).set({ likes: newLikes }).where(eq(postsTable.id, id));
    res.json({ liked: true, likes: newLikes });
  } catch (err) {
    req.log.error({ err }, "Failed to like post");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/posts/:id/comments", async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const { content } = req.body as { content: string };
    if (!content) return res.status(400).json({ error: "Content is required" });
    const [comment] = await db
      .insert(commentsTable)
      .values({ postId, author: "Luca Ferri", content, timeAgo: "just now" })
      .returning();
    await db
      .update(postsTable)
      .set({ comments: (await db.select().from(postsTable).where(eq(postsTable.id, postId)))[0].comments + 1 })
      .where(eq(postsTable.id, postId));
    res.status(201).json(comment);
  } catch (err) {
    req.log.error({ err }, "Failed to create comment");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

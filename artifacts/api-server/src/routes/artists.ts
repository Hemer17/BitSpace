import { Router } from "express";
import { db } from "@workspace/db";
import { artistsTable } from "@workspace/db";
import { eq, like, ilike } from "drizzle-orm";

const router = Router();

router.get("/artists", async (req, res) => {
  try {
    const { genre, search } = req.query as { genre?: string; search?: string };
    let artists = await db.select().from(artistsTable);
    if (genre) artists = artists.filter((a) => a.genre.toLowerCase().includes(genre.toLowerCase()));
    if (search) artists = artists.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));
    const withFollow = artists.map((a) => ({ ...a, isFollowed: false }));
    res.json(withFollow);
  } catch (err) {
    req.log.error({ err }, "Failed to list artists");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/artists/trending", async (req, res) => {
  try {
    const artists = await db.select().from(artistsTable).limit(6);
    res.json(artists.map((a) => ({ ...a, isFollowed: false })));
  } catch (err) {
    req.log.error({ err }, "Failed to get trending artists");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/artists/followed", async (req, res) => {
  try {
    const artists = await db.select().from(artistsTable).limit(5);
    res.json(artists.map((a) => ({ ...a, isFollowed: true })));
  } catch (err) {
    req.log.error({ err }, "Failed to get followed artists");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/artists/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [artist] = await db.select().from(artistsTable).where(eq(artistsTable.id, id));
    if (!artist) return res.status(404).json({ error: "Not found" });
    res.json({ ...artist, isFollowed: false });
  } catch (err) {
    req.log.error({ err }, "Failed to get artist");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/artists/:id/follow", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [artist] = await db.select().from(artistsTable).where(eq(artistsTable.id, id));
    if (!artist) return res.status(404).json({ error: "Not found" });
    const newFollowers = artist.followers + 1;
    await db.update(artistsTable).set({ followers: newFollowers }).where(eq(artistsTable.id, id));
    res.json({ following: true, followers: newFollowers });
  } catch (err) {
    req.log.error({ err }, "Failed to follow artist");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

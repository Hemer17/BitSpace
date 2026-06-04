import { Router } from "express";
import { db } from "@workspace/db";
import { artistsTable, followsTable, usersTable, artistBlocksTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";

const router = Router();

function getUser(req: any) {
  return (req.session as any)?.user as { id: number; username: string; email: string; role: string } | undefined;
}

async function enrichWithFollow(artists: any[], userId?: number) {
  if (!userId) return artists.map((a) => ({ ...a, isFollowed: false }));
  const follows = await db.select().from(followsTable).where(eq(followsTable.userId, userId));
  const followedIds = new Set(follows.map((f) => f.artistId));
  return artists.map((a) => ({ ...a, isFollowed: followedIds.has(a.id) }));
}

// My artist profile (for logged-in artists)
router.get("/artists/me", async (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    const [artist] = await db.select().from(artistsTable).where(eq(artistsTable.userId, user.id));
    if (!artist) return res.status(404).json({ error: "No artist profile linked" });
    res.json(artist);
  } catch (err) {
    req.log.error({ err }, "Failed to get my artist");
    res.status(500).json({ error: "Internal server error" });
  }
});

// List followers of the current artist
router.get("/artists/me/followers", async (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    const [artist] = await db.select().from(artistsTable).where(eq(artistsTable.userId, user.id));
    if (!artist) return res.status(404).json({ error: "No artist profile" });

    const follows = await db.select().from(followsTable).where(eq(followsTable.artistId, artist.id));
    if (!follows.length) return res.json([]);

    const userIds = follows.map((f) => f.userId);
    const users = await db
      .select({ id: usersTable.id, username: usersTable.username, email: usersTable.email })
      .from(usersTable)
      .where(inArray(usersTable.id, userIds));

    res.json(users);
  } catch (err) {
    req.log.error({ err }, "Failed to get followers");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Block a follower: remove follow + prevent seeing posts
router.post("/artists/me/block/:userId", async (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    const [artist] = await db.select().from(artistsTable).where(eq(artistsTable.userId, user.id));
    if (!artist) return res.status(404).json({ error: "No artist profile" });

    const targetUserId = parseInt(req.params.userId);

    // Remove follow if exists
    await db
      .delete(followsTable)
      .where(and(eq(followsTable.userId, targetUserId), eq(followsTable.artistId, artist.id)));

    // Recalculate follower count
    const remaining = await db.select().from(followsTable).where(eq(followsTable.artistId, artist.id));
    await db.update(artistsTable).set({ followers: remaining.length }).where(eq(artistsTable.id, artist.id));

    // Add to blocks (ignore duplicate)
    try {
      await db.insert(artistBlocksTable).values({ artistId: artist.id, blockedUserId: targetUserId });
    } catch { /* unique constraint — already blocked */ }

    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to block user");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/artists", async (req, res) => {
  try {
    const user = getUser(req);
    const { genre, search } = req.query as { genre?: string; search?: string };
    let artists = await db.select().from(artistsTable).where(eq(artistsTable.banned, false));
    if (genre) artists = artists.filter((a) => a.genre.toLowerCase().includes(genre.toLowerCase()));
    if (search) artists = artists.filter(
      (a) => a.name.toLowerCase().includes(search.toLowerCase()) || a.genre.toLowerCase().includes(search.toLowerCase())
    );
    res.json(await enrichWithFollow(artists, user?.id));
  } catch (err) {
    req.log.error({ err }, "Failed to list artists");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/artists/trending", async (req, res) => {
  try {
    const user = getUser(req);
    const artists = await db.select().from(artistsTable).where(eq(artistsTable.banned, false));
    const sorted = [...artists].sort((a, b) => b.followers - a.followers).slice(0, 6);
    res.json(await enrichWithFollow(sorted, user?.id));
  } catch (err) {
    req.log.error({ err }, "Failed to get trending artists");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/artists/followed", async (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return res.json([]);
    const follows = await db.select().from(followsTable).where(eq(followsTable.userId, user.id));
    if (!follows.length) return res.json([]);
    const artistIds = follows.map((f) => f.artistId);
    const artists = await db.select().from(artistsTable).where(inArray(artistsTable.id, artistIds));
    res.json(artists.map((a) => ({ ...a, isFollowed: true })));
  } catch (err) {
    req.log.error({ err }, "Failed to get followed artists");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/artists/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const user = getUser(req);
    const [artist] = await db.select().from(artistsTable).where(eq(artistsTable.id, id));
    if (!artist) return res.status(404).json({ error: "Not found" });
    const [enriched] = await enrichWithFollow([artist], user?.id);
    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "Failed to get artist");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/artists/:id/follow", async (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    const id = parseInt(req.params.id);
    const [artist] = await db.select().from(artistsTable).where(eq(artistsTable.id, id));
    if (!artist) return res.status(404).json({ error: "Not found" });

    const [existing] = await db
      .select()
      .from(followsTable)
      .where(and(eq(followsTable.userId, user.id), eq(followsTable.artistId, id)));

    if (existing) {
      await db.delete(followsTable).where(eq(followsTable.id, existing.id));
      const newFollowers = Math.max(0, artist.followers - 1);
      await db.update(artistsTable).set({ followers: newFollowers }).where(eq(artistsTable.id, id));
      return res.json({ following: false, followers: newFollowers });
    } else {
      await db.insert(followsTable).values({ userId: user.id, artistId: id });
      const newFollowers = artist.followers + 1;
      await db.update(artistsTable).set({ followers: newFollowers }).where(eq(artistsTable.id, id));
      return res.json({ following: true, followers: newFollowers });
    }
  } catch (err) {
    req.log.error({ err }, "Failed to follow artist");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

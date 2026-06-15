import { Router } from "express";
import { db } from "@workspace/db";
import { songsTable, artistsTable, postsTable, songPlaysTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function getUser(req: any) {
  return (req.session as any)?.user as { id: number; username: string; role: string } | undefined;
}

// Get current artist's own songs
router.get("/songs/me", async (req, res) => {
  try {
    const user = getUser(req);
    if (!user || user.role !== "artist") return res.status(403).json({ error: "Solo gli artisti" });
    const [artist] = await db.select().from(artistsTable).where(eq(artistsTable.userId, user.id));
    if (!artist) return res.status(404).json({ error: "Artista non trovato" });
    const songs = await db.select().from(songsTable).where(eq(songsTable.artistId, artist.id));
    res.json(songs);
  } catch (err) {
    req.log.error({ err }, "Failed to list my songs");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/songs/:artistId", async (req, res) => {
  try {
    const artistId = parseInt(req.params.artistId);
    const songs = await db.select().from(songsTable).where(eq(songsTable.artistId, artistId));
    res.json(songs);
  } catch (err) {
    req.log.error({ err }, "Failed to list songs");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/songs", async (req, res) => {
  try {
    const user = getUser(req);
    if (!user || user.role !== "artist") return res.status(403).json({ error: "Solo gli artisti possono caricare canzoni" });

    const [artist] = await db.select().from(artistsTable).where(eq(artistsTable.userId, user.id));
    if (!artist) return res.status(404).json({ error: "Profilo artista non trovato" });

    const { title, duration, genre, coverUrl, fileUrl, externalUrl } = req.body as {
      title: string; duration?: string; genre?: string; coverUrl?: string;
      fileUrl?: string; externalUrl?: string;
    };
    if (!title?.trim()) return res.status(400).json({ error: "Titolo obbligatorio" });

    const [song] = await db
      .insert(songsTable)
      .values({
        artistId: artist.id,
        title: title.trim(),
        duration: duration ?? "0:00",
        genre: genre ?? artist.genre,
        coverUrl: coverUrl ?? null,
        fileUrl: fileUrl ?? null,
        externalUrl: externalUrl ?? null,
      })
      .returning();

    // Increment plays (simulate upload = track available)
    await db.update(artistsTable).set({ plays: (artist.plays ?? 0) + 1000 }).where(eq(artistsTable.id, artist.id));

    // Auto-create a "release" post for this song
    const songLink = externalUrl ?? fileUrl ?? null;
    await db.insert(postsTable).values({
      artistId: artist.id,
      artistName: artist.name,
      artistGenre: artist.genre,
      artistAvatarUrl: artist.avatarUrl ?? null,
      artistAvatarInitials: artist.avatarInitials,
      type: "release",
      content: `Nuova uscita: ${song.title}${genre ? ` — ${genre}` : ""}`,
      likes: 0,
      reposts: 0,
      comments: 0,
      timeAgo: "adesso",
      userId: user.id,
      username: user.username,
      isShared: false,
      songUrl: songLink,
      songTitle: song.title,
      songId: song.id,
    });

    res.status(201).json(song);
  } catch (err) {
    req.log.error({ err }, "Failed to upload song");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Track a song play/click
router.post("/songs/:id/play", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [song] = await db.select().from(songsTable).where(eq(songsTable.id, id));
    if (!song) return res.status(404).json({ error: "Not found" });
    await db.insert(songPlaysTable).values({ songId: id, artistId: song.artistId });
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to track song play");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/songs/:id", async (req, res) => {
  try {
    const user = getUser(req);
    if (!user || user.role !== "artist") return res.status(403).json({ error: "Accesso negato" });
    const id = parseInt(req.params.id);
    await db.delete(songsTable).where(eq(songsTable.id, id));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete song");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

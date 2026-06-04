import { Router } from "express";
import { db } from "@workspace/db";
import { songsTable, artistsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function getUser(req: any) {
  return (req.session as any)?.user as { id: number; username: string; role: string } | undefined;
}

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

    const { title, duration, genre, coverUrl } = req.body as {
      title: string; duration?: string; genre?: string; coverUrl?: string;
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
      })
      .returning();

    // Increment plays (simulate upload = track available)
    await db.update(artistsTable).set({ plays: (artist.plays ?? 0) + 1000 }).where(eq(artistsTable.id, artist.id));

    res.status(201).json(song);
  } catch (err) {
    req.log.error({ err }, "Failed to upload song");
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

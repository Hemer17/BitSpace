import { Router } from "express";
import { db } from "@workspace/db";
import { merchTable, artistsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function getUser(req: any) {
  return (req.session as any)?.user as { id: number; username: string; role: string } | undefined;
}

router.get("/merch", async (req, res) => {
  try {
    const { artistId } = req.query as { artistId?: string };
    let items = await db.select().from(merchTable);
    if (artistId) items = items.filter((m) => m.artistId === parseInt(artistId));
    res.json(items);
  } catch (err) {
    req.log.error({ err }, "Failed to list merch");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/merch", async (req, res) => {
  try {
    const user = getUser(req);
    if (!user || user.role !== "artist") return res.status(403).json({ error: "Solo gli artisti possono aggiungere merch" });

    const [artist] = await db.select().from(artistsTable).where(eq(artistsTable.userId, user.id));
    if (!artist) return res.status(404).json({ error: "Profilo artista non trovato" });

    const { name, category, price, stock, description, imageUrl, badge } = req.body;
    if (!name || !category || price === undefined || stock === undefined || !description) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const [item] = await db
      .insert(merchTable)
      .values({
        artistId: artist.id,
        name,
        category,
        price: parseFloat(price),
        stock: parseInt(stock),
        description,
        imageUrl: imageUrl || "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80",
        badge: badge || "Nuovo",
      })
      .returning();
    res.status(201).json(item);
  } catch (err) {
    req.log.error({ err }, "Failed to create merch item");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/merch/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(merchTable).where(eq(merchTable.id, id));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete merch item");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

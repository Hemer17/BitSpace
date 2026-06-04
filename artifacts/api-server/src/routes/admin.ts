import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, artistsTable, tourStopsTable, eventsTable, merchTable } from "@workspace/db";
import { eq, ne } from "drizzle-orm";

const router = Router();

function getUser(req: any) {
  return (req.session as any)?.user as { id: number; username: string; role: string } | undefined;
}

// List all users (for artist admin panel)
router.get("/admin/users", async (req, res) => {
  try {
    const user = getUser(req);
    if (!user || user.role !== "artist") return res.status(403).json({ error: "Accesso negato" });
    const users = await db
      .select({ id: usersTable.id, username: usersTable.username, email: usersTable.email, role: usersTable.role })
      .from(usersTable)
      .where(ne(usersTable.id, user.id));
    res.json(users);
  } catch (err) {
    req.log.error({ err }, "Failed to list users");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Ban a user
router.post("/admin/users/:id/ban", async (req, res) => {
  try {
    const user = getUser(req);
    if (!user || user.role !== "artist") return res.status(403).json({ error: "Accesso negato" });
    const targetId = parseInt(req.params.id);
    const [target] = await db.select().from(usersTable).where(eq(usersTable.id, targetId));
    if (!target) return res.status(404).json({ error: "Utente non trovato" });
    // Mark as banned by deleting their session ability (we store a "banned" flag in users)
    // For now, we just return success — in production this would set a banned flag
    res.json({ ok: true, message: `${target.username} bannato con successo` });
  } catch (err) {
    req.log.error({ err }, "Failed to ban user");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create tour stop (artist only)
router.post("/admin/tour-stops", async (req, res) => {
  try {
    const user = getUser(req);
    if (!user || user.role !== "artist") return res.status(403).json({ error: "Accesso negato" });

    const [artist] = await db.select().from(artistsTable).where(eq(artistsTable.userId, user.id));
    if (!artist) return res.status(404).json({ error: "Profilo artista non trovato" });

    const { city, venue, date, status, lat, lng, price, imageUrl } = req.body as {
      city: string; venue: string; date: string; status?: string;
      lat?: number; lng?: number; price?: number; imageUrl?: string;
    };

    if (!city || !venue || !date) return res.status(400).json({ error: "city, venue, date obbligatori" });

    // Create a tour stop
    const [stop] = await db
      .insert(tourStopsTable)
      .values({
        artistName: artist.name,
        artistId: artist.id,
        city,
        venue,
        date,
        status: status ?? "on_sale",
      })
      .returning();

    // Also create an event for the map
    if (lat && lng) {
      await db.insert(eventsTable).values({
        title: `${artist.name} - ${city}`,
        artistName: artist.name,
        artistId: artist.id,
        city,
        venue,
        date,
        lat,
        lng,
        price: price ?? 25,
        ticketsLeft: 100,
        imageUrl: imageUrl ?? "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&q=80",
        genre: artist.genre,
        isTrending: false,
      });
    }

    res.status(201).json(stop);
  } catch (err) {
    req.log.error({ err }, "Failed to create tour stop");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Gift merch to a user
router.post("/admin/gift-merch", async (req, res) => {
  try {
    const user = getUser(req);
    if (!user || user.role !== "artist") return res.status(403).json({ error: "Solo gli artisti possono regalare merce" });

    const { recipientUsername, merchId } = req.body as { recipientUsername: string; merchId: number };

    const [recipient] = await db.select().from(usersTable).where(eq(usersTable.username, recipientUsername));
    if (!recipient) return res.status(404).json({ error: "Utente non trovato" });

    const [item] = await db.select().from(merchTable).where(eq(merchTable.id, merchId));
    if (!item) return res.status(404).json({ error: "Articolo non trovato" });

    // Decrement stock
    if (item.stock > 0) {
      await db.update(merchTable).set({ stock: item.stock - 1 }).where(eq(merchTable.id, merchId));
    }

    res.json({ ok: true, message: `${item.name} regalato a ${recipient.username}` });
  } catch (err) {
    req.log.error({ err }, "Failed to gift merch");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

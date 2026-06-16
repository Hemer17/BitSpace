import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, artistsTable, tourStopsTable, eventsTable, merchTable } from "@workspace/db";
import { eq, ne } from "drizzle-orm";

const router = Router();

function getUser(req: any) {
  return (req.session as any)?.user as { id: number; username: string; role: string } | undefined;
}

async function geocodeCity(city: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "BitSpace/1.0 (music platform)" },
    });
    if (!res.ok) return null;
    const data = await res.json() as any[];
    if (!data || data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
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
    res.json({ ok: true, message: `${target.username} bannato con successo` });
  } catch (err) {
    req.log.error({ err }, "Failed to ban user");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create tour stop (artist only) — always creates an event so it appears in the Shop & Map
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

    // Create the tour stop record
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

    // Resolve coordinates: use provided values or geocode the city automatically
    let resolvedLat = lat;
    let resolvedLng = lng;
    if (!resolvedLat || !resolvedLng) {
      const geo = await geocodeCity(`${venue}, ${city}`);
      if (geo) {
        resolvedLat = geo.lat;
        resolvedLng = geo.lng;
      } else {
        // fallback: try just the city
        const geo2 = await geocodeCity(city);
        if (geo2) {
          resolvedLat = geo2.lat;
          resolvedLng = geo2.lng;
        }
      }
    }

    // Always create an event so the date appears in the Shop and on the Map
    await db.insert(eventsTable).values({
      title: `${artist.name} - ${city}`,
      artistName: artist.name,
      artistId: artist.id,
      city,
      venue,
      date,
      lat: resolvedLat ?? 41.9028,
      lng: resolvedLng ?? 12.4964,
      price: price ?? 25,
      ticketsLeft: 100,
      imageUrl: imageUrl ?? "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&q=80",
      genre: artist.genre,
      isTrending: false,
    });

    res.status(201).json(stop);
  } catch (err) {
    req.log.error({ err }, "Failed to create tour stop");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a tour stop (and its associated event)
router.delete("/admin/tour-stops/:id", async (req, res) => {
  try {
    const user = getUser(req);
    if (!user || user.role !== "artist") return res.status(403).json({ error: "Accesso negato" });

    const id = parseInt(req.params.id);
    const [stop] = await db.select().from(tourStopsTable).where(eq(tourStopsTable.id, id));
    if (!stop) return res.status(404).json({ error: "Data tour non trovata" });

    const [artist] = await db.select().from(artistsTable).where(eq(artistsTable.userId, user.id));
    if (!artist || stop.artistId !== artist.id) return res.status(403).json({ error: "Non autorizzato" });

    await db.delete(tourStopsTable).where(eq(tourStopsTable.id, id));
    // Also remove the associated event (same artist + city + date)
    const events = await db.select().from(eventsTable).where(eq(eventsTable.artistId, stop.artistId!));
    const matching = events.find((e) => e.city === stop.city && e.date === stop.date);
    if (matching) await db.delete(eventsTable).where(eq(eventsTable.id, matching.id));

    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete tour stop");
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

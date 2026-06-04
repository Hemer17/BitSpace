import { Router } from "express";
import { db } from "@workspace/db";
import { eventsTable, tourStopsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

router.get("/events", async (req, res) => {
  try {
    const { city, genre } = req.query as { city?: string; genre?: string };
    let events = await db.select().from(eventsTable);
    if (city) events = events.filter((e) => e.city.toLowerCase().includes(city.toLowerCase()));
    if (genre) events = events.filter((e) => e.genre.toLowerCase().includes(genre.toLowerCase()));
    res.json(events);
  } catch (err) {
    req.log.error({ err }, "Failed to list events");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/events/nearby", async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = parseFloat((req.query.radius as string) || "50");
    if (isNaN(lat) || isNaN(lng)) return res.status(400).json({ error: "lat and lng are required" });
    const events = await db.select().from(eventsTable);
    const nearby = events
      .map((e) => ({ event: e, distanceKm: haversineKm(lat, lng, e.lat, e.lng) }))
      .filter((r) => r.distanceKm <= radius)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .map((r) => ({ ...r, distanceKm: Math.round(r.distanceKm * 10) / 10 }));
    res.json(nearby);
  } catch (err) {
    req.log.error({ err }, "Failed to list nearby events");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/events/trending", async (req, res) => {
  try {
    const events = await db.select().from(eventsTable).where(eq(eventsTable.isTrending, true));
    res.json(events);
  } catch (err) {
    req.log.error({ err }, "Failed to list trending events");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/events/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, id));
    if (!event) return res.status(404).json({ error: "Not found" });
    res.json(event);
  } catch (err) {
    req.log.error({ err }, "Failed to get event");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/tour-stops", async (req, res) => {
  try {
    const stops = await db.select().from(tourStopsTable);
    res.json(stops);
  } catch (err) {
    req.log.error({ err }, "Failed to list tour stops");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

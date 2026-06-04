import { Router } from "express";
import { db } from "@workspace/db";
import { ticketsTable, eventsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/tickets", async (req, res) => {
  try {
    const tickets = await db.select().from(ticketsTable);
    res.json(tickets);
  } catch (err) {
    req.log.error({ err }, "Failed to list tickets");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/tickets/purchase", async (req, res) => {
  try {
    const { eventId } = req.body as { eventId: number };
    if (!eventId) return res.status(400).json({ error: "eventId is required" });
    const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, eventId));
    if (!event) return res.status(404).json({ error: "Event not found" });
    const qrCode = `BS-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const [ticket] = await db
      .insert(ticketsTable)
      .values({
        eventId,
        eventTitle: event.title,
        artistName: event.artistName,
        city: event.city,
        venue: event.venue,
        date: event.date,
        price: event.price,
        status: "confirmed",
        qrCode,
      })
      .returning();
    res.status(201).json(ticket);
  } catch (err) {
    req.log.error({ err }, "Failed to purchase ticket");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

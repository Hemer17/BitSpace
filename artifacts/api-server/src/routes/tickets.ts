import { Router } from "express";
import { db } from "@workspace/db";
import { ticketsTable, eventsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

function getUser(req: any) {
  return (req.session as any)?.user as { id: number; username: string; email: string; role: string } | undefined;
}

// My tickets
router.get("/tickets", async (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    const tickets = await db.select().from(ticketsTable).where(eq(ticketsTable.ownerUserId, user.id));
    res.json(tickets);
  } catch (err) {
    req.log.error({ err }, "Failed to list tickets");
    res.status(500).json({ error: "Internal server error" });
  }
});

// All tickets for sale (resale marketplace)
router.get("/tickets/resale", async (req, res) => {
  try {
    const tickets = await db.select().from(ticketsTable).where(eq(ticketsTable.forSale, true));
    res.json(tickets);
  } catch (err) {
    req.log.error({ err }, "Failed to list resale tickets");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Purchase a primary ticket
router.post("/tickets/purchase", async (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Not authenticated" });

    const { eventId } = req.body as { eventId: number };
    if (!eventId) return res.status(400).json({ error: "eventId is required" });

    const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, eventId));
    if (!event) return res.status(404).json({ error: "Event not found" });
    if (event.ticketsLeft <= 0) return res.status(400).json({ error: "Biglietti esauriti" });

    // Artists cannot buy tickets for their own concerts
    if (user.role === "artist" && event.artistId) {
      const { artistsTable } = await import("@workspace/db");
      const [myArtist] = await db.select().from(artistsTable).where(eq(artistsTable.userId, user.id));
      if (myArtist && myArtist.id === event.artistId) {
        return res.status(403).json({ error: "Non puoi acquistare biglietti per il tuo stesso concerto" });
      }
    }

    // Decrement ticketsLeft
    await db
      .update(eventsTable)
      .set({ ticketsLeft: event.ticketsLeft - 1 })
      .where(eq(eventsTable.id, eventId));

    const qrCode = `BS-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const [ticket] = await db
      .insert(ticketsTable)
      .values({
        eventId,
        eventTitle: event.title,
        artistName: event.artistName,
        artistId: event.artistId,
        city: event.city,
        venue: event.venue,
        date: event.date,
        price: event.price,
        originalPrice: event.price,
        status: "confirmed",
        qrCode,
        ownerUserId: user.id,
        forSale: false,
      })
      .returning();

    res.status(201).json(ticket);
  } catch (err) {
    req.log.error({ err }, "Failed to purchase ticket");
    res.status(500).json({ error: "Internal server error" });
  }
});

// List my ticket for resale
router.post("/tickets/:id/resale", async (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Not authenticated" });

    const id = parseInt(req.params.id);
    const { resalePrice } = req.body as { resalePrice: number };

    const [ticket] = await db.select().from(ticketsTable).where(eq(ticketsTable.id, id));
    if (!ticket) return res.status(404).json({ error: "Not found" });
    if (ticket.ownerUserId !== user.id) return res.status(403).json({ error: "Non sei il proprietario" });

    const maxPrice = ticket.originalPrice ?? ticket.price;
    if (resalePrice > maxPrice) {
      return res.status(400).json({ error: `Prezzo massimo di rivendita: €${maxPrice.toFixed(2)}` });
    }

    const [updated] = await db
      .update(ticketsTable)
      .set({ forSale: true, resalePrice })
      .where(eq(ticketsTable.id, id))
      .returning();

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to list for resale");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Cancel resale
router.post("/tickets/:id/resale/cancel", async (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    const id = parseInt(req.params.id);
    const [ticket] = await db.select().from(ticketsTable).where(eq(ticketsTable.id, id));
    if (!ticket || ticket.ownerUserId !== user.id) return res.status(403).json({ error: "Accesso negato" });
    const [updated] = await db
      .update(ticketsTable)
      .set({ forSale: false, resalePrice: null })
      .where(eq(ticketsTable.id, id))
      .returning();
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to cancel resale");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Buy a resale ticket
router.post("/tickets/:id/resale/buy", async (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    const id = parseInt(req.params.id);
    const [ticket] = await db.select().from(ticketsTable).where(eq(ticketsTable.id, id));
    if (!ticket || !ticket.forSale) return res.status(404).json({ error: "Biglietto non in vendita" });
    if (ticket.ownerUserId === user.id) return res.status(400).json({ error: "Non puoi comprare il tuo stesso biglietto" });

    const [updated] = await db
      .update(ticketsTable)
      .set({ ownerUserId: user.id, forSale: false, resalePrice: null, price: ticket.resalePrice ?? ticket.price })
      .where(eq(ticketsTable.id, id))
      .returning();

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to buy resale ticket");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Gift ticket (artist only)
router.post("/tickets/gift", async (req, res) => {
  try {
    const user = getUser(req);
    if (!user || user.role !== "artist") return res.status(403).json({ error: "Solo gli artisti possono regalare biglietti" });

    const { eventId, recipientUsername } = req.body as { eventId: number; recipientUsername: string };

    const { usersTable } = await import("@workspace/db");
    const { eq: drizzleEq } = await import("drizzle-orm");
    const [recipient] = await db.select().from(usersTable).where(drizzleEq(usersTable.username, recipientUsername));
    if (!recipient) return res.status(404).json({ error: "Utente non trovato" });

    const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, eventId));
    if (!event) return res.status(404).json({ error: "Evento non trovato" });

    const qrCode = `BS-GIFT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const [ticket] = await db
      .insert(ticketsTable)
      .values({
        eventId,
        eventTitle: event.title,
        artistName: event.artistName,
        artistId: event.artistId,
        city: event.city,
        venue: event.venue,
        date: event.date,
        price: 0,
        originalPrice: event.price,
        status: "gift",
        qrCode,
        ownerUserId: recipient.id,
        forSale: false,
      })
      .returning();

    res.status(201).json({ ticket, recipientUsername });
  } catch (err) {
    req.log.error({ err }, "Failed to gift ticket");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

import { Router } from "express";
import { db } from "@workspace/db";
import { eventsTable, merchTable } from "@workspace/db";

const router = Router();

// Shop: all events + all merch
router.get("/shop", async (req, res) => {
  try {
    const events = await db.select().from(eventsTable);
    const merch = await db.select().from(merchTable);
    res.json({ events, merch });
  } catch (err) {
    req.log.error({ err }, "Failed to load shop");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

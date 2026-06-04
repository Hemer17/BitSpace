import { Router } from "express";
import { db } from "@workspace/db";
import { eventsTable, merchTable, followsTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";

const router = Router();

function getUser(req: any) {
  return (req.session as any)?.user as { id: number; username: string; role: string } | undefined;
}

// Shop: all events + merch from followed artists
router.get("/shop", async (req, res) => {
  try {
    const user = getUser(req);
    const events = await db.select().from(eventsTable);

    let merch: any[] = [];
    if (user) {
      const follows = await db.select().from(followsTable).where(eq(followsTable.userId, user.id));
      const followedIds = follows.map((f) => f.artistId);
      if (followedIds.length > 0) {
        merch = await db.select().from(merchTable).where(inArray(merchTable.artistId, followedIds));
      }
    }

    res.json({ events, merch });
  } catch (err) {
    req.log.error({ err }, "Failed to load shop");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

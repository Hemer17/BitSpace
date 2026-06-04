import { Router } from "express";
import { db } from "@workspace/db";
import { artistsTable, postsTable, tourStopsTable, merchTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/stats/dashboard", async (req, res) => {
  try {
    const [artist] = await db.select().from(artistsTable).limit(1);
    const posts = await db.select().from(postsTable).limit(3);
    const stops = await db.select().from(tourStopsTable).limit(3);
    const merch = await db.select().from(merchTable).where(eq(merchTable.artistId, artist?.id ?? 1));
    res.json({
      totalFollowers: artist?.followers ?? 84200,
      totalPlays: 3240000,
      tourDates: stops.length,
      merch: merch.length,
      followersGrowth: 4.2,
      playsGrowth: 12.1,
      recentPosts: posts.map((p) => ({ ...p, liked: false, meta: null })),
      upcomingEvents: stops,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get dashboard stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

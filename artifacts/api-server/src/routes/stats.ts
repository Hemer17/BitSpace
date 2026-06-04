import { Router } from "express";
import { db } from "@workspace/db";
import {
  artistsTable,
  postsTable,
  tourStopsTable,
  followsTable,
  songsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function getUser(req: any) {
  return (req.session as any)?.user as
    | { id: number; username: string; role: string }
    | undefined;
}

router.get("/stats/dashboard", async (req, res) => {
  try {
    const user = getUser(req);

    let artist;
    if (user && user.role === "artist") {
      const [linked] = await db
        .select()
        .from(artistsTable)
        .where(eq(artistsTable.userId, user.id));
      artist = linked;
    }
    // Fallback: first artist if no linked profile found
    if (!artist) {
      const [first] = await db.select().from(artistsTable).limit(1);
      artist = first;
    }

    const artistId = artist?.id ?? 1;
    const stops = await db
      .select()
      .from(tourStopsTable)
      .where(eq(tourStopsTable.artistId, artistId));

    const posts = await db
      .select()
      .from(postsTable)
      .where(eq(postsTable.artistId, artistId));
    const songs = await db
      .select()
      .from(songsTable)
      .where(eq(songsTable.artistId, artistId));

    // Follower count from follows table
    const allFollows = await db
      .select()
      .from(followsTable)
      .where(eq(followsTable.artistId, artistId));

    res.json({
      artistId,
      artistName: artist?.name ?? "",
      totalFollowers: allFollows.length || (artist?.followers ?? 0),
      totalPlays: artist?.plays ?? 3240000,
      tourDates: stops.length,
      songs: songs.length,
      followersGrowth: 4.2,
      playsGrowth: 12.1,
      recentPosts: posts
        .slice(-3)
        .reverse()
        .map((p) => ({ ...p, liked: false })),
      upcomingEvents: stops,
      songsList: songs,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get dashboard stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

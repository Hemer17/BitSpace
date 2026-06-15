import { Router } from "express";
import { db } from "@workspace/db";
import { artistsTable, postsTable, tourStopsTable, merchTable, followsTable, songsTable, songPlaysTable } from "@workspace/db";
import { eq, and, gte, lt } from "drizzle-orm";

const router = Router();

function getUser(req: any) {
  return (req.session as any)?.user as { id: number; username: string; role: string } | undefined;
}

router.get("/stats/dashboard", async (req, res) => {
  try {
    const user = getUser(req);

    let artist;
    if (user && user.role === "artist") {
      const [linked] = await db.select().from(artistsTable).where(eq(artistsTable.userId, user.id));
      artist = linked;
    }
    if (!artist) {
      const [first] = await db.select().from(artistsTable).limit(1);
      artist = first;
    }

    const artistId = artist?.id ?? 1;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [stops, merch, posts, songs, allFollows] = await Promise.all([
      db.select().from(tourStopsTable).where(eq(tourStopsTable.artistId, artistId)),
      db.select().from(merchTable).where(eq(merchTable.artistId, artistId)),
      db.select().from(postsTable).where(eq(postsTable.artistId, artistId)),
      db.select().from(songsTable).where(eq(songsTable.artistId, artistId)),
      db.select().from(followsTable).where(eq(followsTable.artistId, artistId)),
    ]);

    // Real followers growth: last 30 days vs previous 30 days
    const followsThisMonth = allFollows.filter(
      (f) => f.createdAt && f.createdAt >= thirtyDaysAgo
    ).length;
    const followsPrevMonth = allFollows.filter(
      (f) => f.createdAt && f.createdAt >= sixtyDaysAgo && f.createdAt < thirtyDaysAgo
    ).length;
    const followersGrowth = followsPrevMonth === 0
      ? (followsThisMonth > 0 ? 100 : 0)
      : Math.round(((followsThisMonth - followsPrevMonth) / followsPrevMonth) * 100 * 10) / 10;

    // Real plays growth: last 30 days vs previous 30 days
    const [playsThisMonth, playsPrevMonth] = await Promise.all([
      db.select().from(songPlaysTable).where(
        and(eq(songPlaysTable.artistId, artistId), gte(songPlaysTable.playedAt, thirtyDaysAgo))
      ),
      db.select().from(songPlaysTable).where(
        and(
          eq(songPlaysTable.artistId, artistId),
          gte(songPlaysTable.playedAt, sixtyDaysAgo),
          lt(songPlaysTable.playedAt, thirtyDaysAgo)
        )
      ),
    ]);

    const playsGrowth = playsPrevMonth.length === 0
      ? (playsThisMonth.length > 0 ? 100 : 0)
      : Math.round(((playsThisMonth.length - playsPrevMonth.length) / playsPrevMonth.length) * 100 * 10) / 10;

    const totalPlays = playsThisMonth.length + playsPrevMonth.length || artist?.plays || 0;

    res.json({
      artistId,
      artistName: artist?.name ?? "",
      totalFollowers: allFollows.length || (artist?.followers ?? 0),
      totalPlays,
      playsThisMonth: playsThisMonth.length,
      newFollowersThisMonth: followsThisMonth,
      tourDates: stops.length,
      merch: merch.length,
      songs: songs.length,
      followersGrowth,
      playsGrowth,
      recentPosts: posts.slice(-3).reverse().map((p) => ({ ...p, liked: false })),
      upcomingEvents: stops,
      songsList: songs,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get dashboard stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

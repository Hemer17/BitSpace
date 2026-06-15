import { Router } from "express";
import { db } from "@workspace/db";
import { postsTable, commentsTable, followsTable, artistsTable, usersTable, artistBlocksTable } from "@workspace/db";
import { eq, inArray, and } from "drizzle-orm";

const router = Router();

function getUser(req: any) {
  return (req.session as any)?.user as { id: number; username: string; email: string; role: string } | undefined;
}

router.get("/feed", async (req, res) => {
  try {
    const user = getUser(req);
    const { type } = req.query as { type?: string };

    let posts = await db.select().from(postsTable);

    if (user) {
      // Get artist IDs that have blocked this user
      const blocks = await db.select().from(artistBlocksTable).where(eq(artistBlocksTable.blockedUserId, user.id));
      const blockedArtistIds = new Set(blocks.map((b) => b.artistId));

      // Remove posts from artists that blocked this user
      posts = posts.filter((p) => !blockedArtistIds.has(p.artistId));

      // Get followed artist IDs
      const follows = await db.select().from(followsTable).where(eq(followsTable.userId, user.id));
      const followedArtistIds = follows.map((f) => f.artistId);

      if (followedArtistIds.length > 0) {
        posts = posts.filter(
          (p) => followedArtistIds.includes(p.artistId) || p.userId === user.id || p.isShared
        );
      } else {
        const [dbUser] = await db.select().from(usersTable).where(eq(usersTable.id, user.id));
        const userGenres = dbUser?.genres ?? [];
        if (userGenres.length > 0) {
          const genreLower = userGenres.map((g: string) => g.toLowerCase());
          posts = posts.filter((p) => {
            const genre = (p.artistGenre || "").toLowerCase();
            return genreLower.some((g: string) => genre.includes(g) || g.includes(genre));
          });
        }
        if (posts.length === 0) {
          let all = await db.select().from(postsTable);
          all = all.filter((p) => !blockedArtistIds.has(p.artistId));
          posts = all;
        }
      }
    }

    if (type && type !== "all") {
      posts = posts.filter((p) => p.type === type);
    }

    posts = posts.sort((a, b) => b.id - a.id);

    res.json(posts.map((p) => ({ ...p, liked: false, meta: null })));
  } catch (err) {
    req.log.error({ err }, "Failed to get feed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/feed/summary", async (req, res) => {
  try {
    const posts = await db.select().from(postsTable);
    res.json({
      newAnnouncements: posts.length,
      newReleases: posts.filter((p) => p.type === "release").length,
      newTourDates: posts.filter((p) => p.type === "tour").length,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get feed summary");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create post — fan utenti possono postare solo storie
router.post("/posts", async (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Not authenticated" });

    const { content, type } = req.body as { content: string; type?: string };
    if (!content?.trim()) return res.status(400).json({ error: "Content is required" });

    // Non-artist users can only post stories
    const postType = user.role !== "artist" ? "story" : (type ?? "story");

    let artistId = 0;
    let artistName = user.username;
    let artistGenre = "";
    let artistAvatarInitials = user.username.slice(0, 2).toUpperCase();
    let artistAvatarUrl: string | null = null;

    if (user.role === "artist") {
      const [artistProfile] = await db.select().from(artistsTable).where(eq(artistsTable.userId, user.id));
      if (artistProfile) {
        artistId = artistProfile.id;
        artistName = artistProfile.name;
        artistGenre = artistProfile.genre;
        artistAvatarInitials = artistProfile.avatarInitials;
        artistAvatarUrl = artistProfile.avatarUrl ?? null;
      }
    }

    const { songUrl, songTitle, songId } = req.body as { songUrl?: string; songTitle?: string; songId?: number };

    const [post] = await db
      .insert(postsTable)
      .values({
        artistId,
        artistName,
        artistGenre,
        artistAvatarUrl,
        artistAvatarInitials,
        type: postType,
        content: content.trim(),
        likes: 0,
        reposts: 0,
        comments: 0,
        timeAgo: "adesso",
        userId: user.id,
        username: user.username,
        isShared: false,
        songUrl: songUrl ?? null,
        songTitle: songTitle ?? null,
        songId: songId ?? null,
      })
      .returning();

    res.status(201).json({ ...post, liked: false });
  } catch (err) {
    req.log.error({ err }, "Failed to create post");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Share / repost (toggle: repost if not yet done, undo if already done)
router.post("/posts/:id/share", async (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Not authenticated" });

    const id = parseInt(req.params.id);
    const [original] = await db.select().from(postsTable).where(eq(postsTable.id, id));
    if (!original) return res.status(404).json({ error: "Not found" });

    // Check if user already reposted this post
    const [existing] = await db
      .select()
      .from(postsTable)
      .where(and(eq(postsTable.sharedFromId, id), eq(postsTable.userId, user.id), eq(postsTable.isShared, true)));

    if (existing) {
      // Undo repost: delete the shared post and decrement counter
      await db.delete(postsTable).where(eq(postsTable.id, existing.id));
      const newCount = Math.max(0, original.reposts - 1);
      await db.update(postsTable).set({ reposts: newCount }).where(eq(postsTable.id, id));
      return res.json({ reposted: false, reposts: newCount });
    }

    // New repost
    const newCount = original.reposts + 1;
    await db.update(postsTable).set({ reposts: newCount }).where(eq(postsTable.id, id));

    const [shared] = await db
      .insert(postsTable)
      .values({
        artistId: original.artistId,
        artistName: original.artistName,
        artistGenre: original.artistGenre,
        artistAvatarUrl: original.artistAvatarUrl,
        artistAvatarInitials: original.artistAvatarInitials,
        type: original.type,
        content: original.content,
        likes: 0,
        reposts: 0,
        comments: 0,
        timeAgo: "adesso",
        userId: user.id,
        username: user.username,
        isShared: true,
        sharedFromId: id,
      })
      .returning();

    res.status(201).json({ reposted: true, reposts: newCount, post: { ...shared, liked: false } });
  } catch (err) {
    req.log.error({ err }, "Failed to share post");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/posts/:id/like", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id));
    if (!post) return res.status(404).json({ error: "Not found" });
    const newLikes = post.likes + 1;
    await db.update(postsTable).set({ likes: newLikes }).where(eq(postsTable.id, id));
    res.json({ liked: true, likes: newLikes });
  } catch (err) {
    req.log.error({ err }, "Failed to like post");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/posts/:id/comments", async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const comments = await db.select().from(commentsTable).where(eq(commentsTable.postId, postId));
    res.json(comments);
  } catch (err) {
    req.log.error({ err }, "Failed to get comments");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/posts/:id/comments", async (req, res) => {
  try {
    const user = getUser(req);
    const postId = parseInt(req.params.id);
    const { content } = req.body as { content: string };
    if (!content?.trim()) return res.status(400).json({ error: "Content is required" });

    const author = user?.username ?? "Utente";
    const [comment] = await db
      .insert(commentsTable)
      .values({ postId, author, content: content.trim(), timeAgo: "adesso", userId: user?.id })
      .returning();

    const [post] = await db.select().from(postsTable).where(eq(postsTable.id, postId));
    if (post) {
      await db.update(postsTable).set({ comments: post.comments + 1 }).where(eq(postsTable.id, postId));
    }
    res.status(201).json(comment);
  } catch (err) {
    req.log.error({ err }, "Failed to create comment");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

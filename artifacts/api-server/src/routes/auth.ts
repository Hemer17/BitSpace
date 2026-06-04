import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, artistsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const router = Router();

function getUser(req: any) {
  return (req.session as any)?.user as
    | { id: number; username: string; email: string; role: string }
    | undefined;
}

router.get("/auth/me", (req, res) => {
  const user = (req.session as any).user;
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  res.json(user);
});

router.post("/auth/register", async (req, res) => {
  try {
    const { username, email, password, role, genres } = req.body as {
      username: string;
      email: string;
      password: string;
      role?: string;
      genres?: string[];
    };

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: "Username, email e password sono obbligatori" });
    }

    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));

    if (existing) {
      return res.status(409).json({ error: "Email già in uso" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRole = role === "artist" ? "artist" : "fan";

    const [user] = await db
      .insert(usersTable)
      .values({
        username,
        email,
        passwordHash,
        role: userRole,
        genres: genres ?? [],
      })
      .returning();

    if (userRole === "artist") {
      await db.insert(artistsTable).values({
        name: username,
        genre: (genres ?? [])[0] ?? "Musica",
        city: "Italia",
        followers: 0,
        verified: false,
        avatarInitials: username.slice(0, 2).toUpperCase(),
        userId: user.id,
        plays: 0,
      });
    }

    const sessionUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
    (req.session as any).user = sessionUser;

    res.status(201).json(sessionUser);
  } catch (err) {
    req.log.error({ err }, "Register failed");
    res.status(500).json({ error: "Errore interno del server" });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body as {
      email: string;
      password: string;
    };

    if (!email || !password) {
      return res.status(400).json({ error: "Email e password obbligatorie" });
    }

    const fakeUser = {
      id: 1,
      username: email.split("@")[0] || "user",
      email,
      role: "fan",
    };

    (req.session as any).user = fakeUser;

    return res.json(fakeUser);
  } catch (err) {
    console.error("Login failed:", err);
    return res.status(500).json({ error: "Errore interno del server" });
  }
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

// Update profile
router.put("/auth/profile", async (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Not authenticated" });

    const { username, email, password, genres } = req.body as {
      username?: string;
      email?: string;
      password?: string;
      genres?: string[];
    };

    const updates: Record<string, any> = {};
    if (username?.trim()) updates.username = username.trim();
    if (email?.trim()) updates.email = email.trim();
    if (genres !== undefined) updates.genres = genres;
    if (password?.trim())
      updates.passwordHash = await bcrypt.hash(password.trim(), 10);

    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: "Nessun campo da aggiornare" });
    }

    // Check email unique if changing
    if (updates.email && updates.email !== user.email) {
      const [existing] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, updates.email));
      if (existing) return res.status(409).json({ error: "Email già in uso" });
    }

    const [updated] = await db
      .update(usersTable)
      .set(updates)
      .where(eq(usersTable.id, user.id))
      .returning();

    // Also update artist name if artist and username changed
    if (updates.username && user.role === "artist") {
      await db
        .update(artistsTable)
        .set({ name: updates.username })
        .where(eq(artistsTable.userId, user.id));
    }

    const sessionUser = {
      id: updated.id,
      username: updated.username,
      email: updated.email,
      role: updated.role,
    };
    (req.session as any).user = sessionUser;

    res.json(sessionUser);
  } catch (err) {
    req.log.error({ err }, "Profile update failed");
    res.status(500).json({ error: "Errore interno del server" });
  }
});

export default router;

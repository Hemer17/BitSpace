import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const router = Router();

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
      return res.status(400).json({ error: "Username, email e password sono obbligatori" });
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
      .values({ username, email, passwordHash, role: userRole, genres: genres ?? [] })
      .returning();

    const sessionUser = { id: user.id, username: user.username, email: user.email, role: user.role };
    (req.session as any).user = sessionUser;

    res.status(201).json(sessionUser);
  } catch (err) {
    req.log.error({ err }, "Register failed");
    res.status(500).json({ error: "Errore interno del server" });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    if (!email || !password) {
      return res.status(400).json({ error: "Email e password obbligatorie" });
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));

    if (!user) {
      return res.status(401).json({ error: "Credenziali non valide" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Credenziali non valide" });
    }

    const sessionUser = { id: user.id, username: user.username, email: user.email, role: user.role };
    (req.session as any).user = sessionUser;

    res.json(sessionUser);
  } catch (err) {
    req.log.error({ err }, "Login failed");
    res.status(500).json({ error: "Errore interno del server" });
  }
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

export default router;

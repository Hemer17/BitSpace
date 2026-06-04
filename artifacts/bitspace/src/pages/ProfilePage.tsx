import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, User, Mail, Lock, Music, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

const GENRES = [
  "Pop", "Hip-Hop / Rap", "Rock", "EDM", "Latin", "Country",
  "K-Pop", "R&B / Soul", "Jazz", "Classica", "Afrobeats",
  "Indie / Alternative", "Reggaeton", "Trap", "Phonk",
];

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleGenre = (g: string) =>
    setSelectedGenres((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);

  const handleSave = async () => {
    if (password && password !== confirmPassword) {
      toast({ title: "Le password non coincidono", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const body: Record<string, any> = {};
      if (username.trim() && username !== user?.username) body.username = username.trim();
      if (email.trim() && email !== user?.email) body.email = email.trim();
      if (password.trim()) body.password = password.trim();
      if (selectedGenres.length > 0) body.genres = selectedGenres;

      if (!Object.keys(body).length) {
        toast({ title: "Nessuna modifica da salvare" });
        return;
      }

      const r = await fetch(`${BASE_URL}/api/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error ?? "Errore");
      }

      const updated = await r.json();
      updateUser(updated);
      setPassword("");
      setConfirmPassword("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast({ title: "Profilo aggiornato!" });
    } catch (e: any) {
      toast({ title: "Errore", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setLocation("/feed")}
          className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Modifica profilo</h1>
          <p className="text-xs text-muted-foreground">Aggiorna le informazioni del tuo account</p>
        </div>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-7 p-4 bg-card border border-border rounded-2xl">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
          {(username || user?.username || "?").slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold">{user?.username}</p>
          <p className="text-xs text-muted-foreground capitalize">{user?.role === "artist" ? "Artista" : "Fan"}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Username */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2"><User className="w-4 h-4 text-primary" />Informazioni account</h2>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Nome utente</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Il tuo username"
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="La tua email"
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Password */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2"><Lock className="w-4 h-4 text-primary" />Cambia password</h2>
          <p className="text-xs text-muted-foreground">Lascia vuoto per non modificare la password.</p>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Nuova password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Nuova password..."
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Conferma password</label>
            <input
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
              placeholder="Conferma password..."
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Genres */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2"><Music className="w-4 h-4 text-primary" />Aggiorna generi preferiti</h2>
          <p className="text-xs text-muted-foreground">Seleziona i generi da aggiungere alle tue preferenze.</p>
          <div className="grid grid-cols-3 gap-2">
            {GENRES.map((g) => {
              const sel = selectedGenres.includes(g);
              return (
                <button key={g} onClick={() => toggleGenre(g)}
                  className={cn(
                    "px-2 py-2 rounded-xl text-xs text-center border transition-all",
                    sel
                      ? "bg-primary/15 border-primary text-white"
                      : "bg-background border-border text-muted-foreground hover:border-primary/40"
                  )}>
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className={cn(
            "w-full py-3 rounded-xl font-semibold text-sm transition-all",
            saved
              ? "bg-emerald-600 text-white"
              : "bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
          )}>
          {loading ? "Salvataggio..." : saved ? <span className="flex items-center justify-center gap-2"><Check className="w-4 h-4" />Salvato!</span> : "Salva modifiche"}
        </button>
      </div>
    </div>
  );
}

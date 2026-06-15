import { useState, useEffect } from "react";
import {
  Users, Play, Calendar, ShoppingBag, TrendingUp, Plus, Trash2, MapPin,
  BarChart2, Music, Gift, Ban, Send, X, ChevronDown, ChevronUp, FileMusic,
  Link, ExternalLink, Upload
} from "lucide-react";
import {
  useGetArtistDashboard, useListMerch, useCreateMerchItem, useDeleteMerchItem,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

function formatNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
}

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub?: string; icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", color)}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1"><TrendingUp className="w-3 h-3" />{sub}</p>}
    </div>
  );
}

type Section = "overview" | "songs" | "tour" | "post" | "merch" | "ban" | "gift";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading, refetch: refetchStats } = useGetArtistDashboard();
  const { data: merch, isLoading: merchLoading } = useListMerch({});
  const createMerch = useCreateMerchItem();
  const deleteMerch = useDeleteMerchItem();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [section, setSection] = useState<Section>("overview");
  const [users, setUsers] = useState<any[]>([]);

  // Load followers for the follower-block section
  useEffect(() => {
    if (section === "ban") {
      fetch(`${BASE_URL}/api/artists/me/followers`).then((r) => r.json()).then((d) => Array.isArray(d) && setUsers(d));
    }
    if (section === "post") {
      fetch(`${BASE_URL}/api/songs/me`).then((r) => r.ok ? r.json() : []).then((d) => Array.isArray(d) && setPostMySongs(d));
    }
  }, [section]);

  // --- Song upload state ---
  const [songForm, setSongForm] = useState({ title: "", duration: "", genre: "", externalUrl: "" });
  const [songFile, setSongFile] = useState<File | null>(null);
  const [songMode, setSongMode] = useState<"file" | "link">("link");
  const [songLoading, setSongLoading] = useState(false);

  // --- Tour date state ---
  const [tourForm, setTourForm] = useState({ city: "", venue: "", date: "", lat: "", lng: "", price: "" });
  const [tourLoading, setTourLoading] = useState(false);

  // --- New post state ---
  const [postForm, setPostForm] = useState({ content: "", type: "announcement" });
  const [postLoading, setPostLoading] = useState(false);
  const [postSelectedSongId, setPostSelectedSongId] = useState("");
  const [postMySongs, setPostMySongs] = useState<any[]>([]);

  // --- Merch form state ---
  const [showMerchForm, setShowMerchForm] = useState(false);
  const [merchForm, setMerchForm] = useState({ name: "", category: "Magliette", price: "", stock: "", description: "", imageUrl: "" });
  const [merchImagePreview, setMerchImagePreview] = useState<string | null>(null);

  // --- Gift state ---
  const [giftForm, setGiftForm] = useState({ recipientUsername: "", type: "ticket", eventId: "", merchId: "" });
  const [giftLoading, setGiftLoading] = useState(false);

  const handleUploadSong = async () => {
    if (!songForm.title.trim()) return;
    setSongLoading(true);
    try {
      let fileUrl: string | undefined;
      if (songMode === "file" && songFile) {
        const fd = new FormData();
        fd.append("file", songFile);
        const up = await fetch(`${BASE_URL}/api/songs/upload`, { method: "POST", body: fd });
        if (up.ok) {
          const data = await up.json();
          fileUrl = data.url;
        }
      }
      const r = await fetch(`${BASE_URL}/api/songs`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...songForm,
          fileUrl,
          externalUrl: songMode === "link" && songForm.externalUrl.trim() ? songForm.externalUrl.trim() : undefined,
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      toast({ title: "Canzone aggiunta!" });
      setSongForm({ title: "", duration: "", genre: "", externalUrl: "" });
      setSongFile(null);
      refetchStats();
    } catch (e: any) { toast({ title: "Errore", description: e.message, variant: "destructive" }); }
    finally { setSongLoading(false); }
  };

  const handleCreateTour = async () => {
    if (!tourForm.city || !tourForm.venue || !tourForm.date) return;
    setTourLoading(true);
    try {
      const r = await fetch(`${BASE_URL}/api/admin/tour-stops`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...tourForm,
          lat: tourForm.lat ? parseFloat(tourForm.lat) : undefined,
          lng: tourForm.lng ? parseFloat(tourForm.lng) : undefined,
          price: tourForm.price ? parseFloat(tourForm.price) : undefined,
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      toast({ title: "Data tour aggiunta!" });
      setTourForm({ city: "", venue: "", date: "", lat: "", lng: "", price: "" });
      refetchStats();
    } catch (e: any) { toast({ title: "Errore", description: e.message, variant: "destructive" }); }
    finally { setTourLoading(false); }
  };

  const handleCreatePost = async () => {
    if (!postForm.content.trim()) return;
    setPostLoading(true);
    try {
      const body: any = { ...postForm };
      if (postForm.type === "release" && postSelectedSongId) {
        const song = postMySongs.find((s) => String(s.id) === postSelectedSongId);
        if (song) {
          body.songUrl = song.externalUrl || song.fileUrl || null;
          body.songTitle = song.title;
          body.songId = song.id;
        }
      }
      const r = await fetch(`${BASE_URL}/api/posts`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      toast({ title: "Post pubblicato!" });
      setPostForm({ content: "", type: "announcement" });
      setPostSelectedSongId("");
      refetchStats();
    } catch (e: any) { toast({ title: "Errore", description: e.message, variant: "destructive" }); }
    finally { setPostLoading(false); }
  };

  const handleBlockFollower = async (userId: number, username: string) => {
    const r = await fetch(`${BASE_URL}/api/artists/me/block/${userId}`, { method: "POST" });
    if (r.ok) {
      toast({ title: `${username} rimosso dai follower`, description: "Non potrà più vedere i tuoi post." });
      setUsers((u) => u.filter((x) => x.id !== userId));
    } else {
      toast({ title: "Errore durante il blocco", variant: "destructive" });
    }
  };

  const handleGift = async () => {
    if (!giftForm.recipientUsername) return;
    setGiftLoading(true);
    try {
      if (giftForm.type === "ticket") {
        const r = await fetch(`${BASE_URL}/api/tickets/gift`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipientUsername: giftForm.recipientUsername, eventId: parseInt(giftForm.eventId) }),
        });
        if (!r.ok) throw new Error((await r.json()).error);
      } else {
        const r = await fetch(`${BASE_URL}/api/admin/gift-merch`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipientUsername: giftForm.recipientUsername, merchId: parseInt(giftForm.merchId) }),
        });
        if (!r.ok) throw new Error((await r.json()).error);
      }
      toast({ title: "Regalo inviato!" });
      setGiftForm({ recipientUsername: "", type: "ticket", eventId: "", merchId: "" });
    } catch (e: any) { toast({ title: "Errore", description: e.message, variant: "destructive" }); }
    finally { setGiftLoading(false); }
  };

  const handleCreateMerch = async () => {
    if (!merchForm.name || !merchForm.price || !merchForm.stock || !merchForm.description) {
      toast({ title: "Campi obbligatori mancanti", variant: "destructive" }); return;
    }
    try {
      const r = await fetch(`${BASE_URL}/api/merch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: merchForm.name,
          category: merchForm.category,
          price: parseFloat(merchForm.price),
          stock: parseInt(merchForm.stock),
          description: merchForm.description,
          imageUrl: merchImagePreview || merchForm.imageUrl || undefined,
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      queryClient.invalidateQueries({ queryKey: ["/api/merch"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shop"] });
      setShowMerchForm(false);
      setMerchForm({ name: "", category: "Magliette", price: "", stock: "", description: "", imageUrl: "" });
      setMerchImagePreview(null);
      toast({ title: "Articolo aggiunto! Ora visibile nello shop." });
    } catch (e: any) {
      toast({ title: "Errore", description: e.message, variant: "destructive" });
    }
  };

  const navItems: { key: Section; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "Panoramica", icon: BarChart2 },
    { key: "songs", label: "Canzoni", icon: FileMusic },
    { key: "tour", label: "Date tour", icon: MapPin },
    { key: "post", label: "Nuovo post", icon: Send },
    { key: "merch", label: "Merch", icon: ShoppingBag },
    { key: "gift", label: "Regala", icon: Gift },
    { key: "ban", label: "Follower", icon: Users },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Side nav */}
      <aside className="hidden md:flex flex-col w-48 shrink-0 border-r border-border bg-card/50 pt-6 pb-4 px-3 gap-1">
        {navItems.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setSection(key)}
            className={cn("flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-colors",
              section === key ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary")}>
            <Icon className="w-4 h-4 shrink-0" />{label}
          </button>
        ))}
      </aside>

      {/* Mobile tab bar */}
      <div className="md:hidden flex overflow-x-auto gap-2 p-3 border-b border-border bg-card shrink-0 scrollbar-none">
        {navItems.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setSection(key)}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors",
              section === key ? "bg-primary text-white" : "bg-secondary text-muted-foreground")}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      <div className="flex-1 px-4 py-6 pb-24 md:pb-6 max-w-2xl">
        {/* Artist header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Dashboard Artista</h1>
            <p className="text-xs text-muted-foreground">{stats?.artistName ?? user?.username ?? "Caricamento..."}</p>
          </div>
        </div>

        {/* PANORAMICA */}
        {section === "overview" && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-7">
              {isLoading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />) : (
                <>
                  <StatCard label="Follower" value={formatNum(stats?.totalFollowers ?? 0)} sub={`+${stats?.followersGrowth}% questo mese`} icon={Users} color="bg-primary" />
                  <StatCard label="Riproduzioni" value={formatNum(stats?.totalPlays ?? 0)} sub={`+${stats?.playsGrowth}% questo mese`} icon={Play} color="bg-emerald-600" />
                  <StatCard label="Date tour" value={String(stats?.tourDates ?? 0)} icon={Calendar} color="bg-amber-600" />
                  <StatCard label="Articoli merch" value={String(stats?.merch ?? 0)} icon={ShoppingBag} color="bg-violet-600" />
                  <StatCard label="Canzoni" value={String(stats?.songs ?? 0)} icon={Music} color="bg-sky-600" />
                </>
              )}
            </div>
            {stats?.upcomingEvents && stats.upcomingEvents.length > 0 && (
              <section className="mb-7">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" />Prossime date
                </h2>
                <div className="space-y-2">
                  {stats.upcomingEvents.map((stop: any) => (
                    <div key={stop.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{stop.city} – {stop.venue}</p>
                        <p className="text-xs text-muted-foreground">{stop.date}</p>
                      </div>
                      <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full",
                        stop.status === "sold_out" ? "bg-destructive/15 text-destructive" :
                        stop.status === "presale" ? "bg-amber-500/15 text-amber-400" : "bg-primary/15 text-primary")}>
                        {stop.status === "sold_out" ? "Esaurito" : stop.status === "presale" ? "Presale" : "In vendita"}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {stats?.recentPosts && stats.recentPosts.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">Post recenti</h2>
                <div className="space-y-2">
                  {stats.recentPosts.map((post: any) => (
                    <div key={post.id} className="bg-card border border-border rounded-xl px-4 py-3">
                      <p className="text-xs text-muted-foreground mb-1">{post.type} · {post.timeAgo}</p>
                      <p className="text-sm truncate">{post.content}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* CANZONI */}
        {section === "songs" && (
          <div className="space-y-5">
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Plus className="w-4 h-4" />Aggiungi canzone</h3>

              {/* Mode toggle */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Tipo di caricamento</label>
                <div className="flex gap-2">
                  <button onClick={() => setSongMode("link")}
                    className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                      songMode === "link" ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:text-foreground")}>
                    <Link className="w-3 h-3" />Link esterno
                  </button>
                  <button onClick={() => setSongMode("file")}
                    className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                      songMode === "file" ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:text-foreground")}>
                    <Upload className="w-3 h-3" />Carica file
                  </button>
                </div>
              </div>

              {[
                { key: "title", label: "Titolo *", placeholder: "Es. Notte d'estate" },
                { key: "duration", label: "Durata", placeholder: "Es. 3:45" },
                { key: "genre", label: "Genere", placeholder: "Es. Pop, EDM..." },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                  <input value={(songForm as any)[key]} onChange={(e) => setSongForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>
              ))}

              {songMode === "link" && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Link esterno (Spotify, YouTube, SoundCloud…)</label>
                  <div className="relative">
                    <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      value={songForm.externalUrl}
                      onChange={(e) => setSongForm((f) => ({ ...f, externalUrl: e.target.value }))}
                      placeholder="https://open.spotify.com/track/..."
                      className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                </div>
              )}

              {songMode === "file" && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">File audio (MP3, WAV, FLAC)</label>
                  <label className={cn(
                    "flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-colors",
                    songFile ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/40 hover:bg-primary/5"
                  )}>
                    <input type="file" accept="audio/*" className="hidden"
                      onChange={(e) => setSongFile(e.target.files?.[0] ?? null)} />
                    {songFile ? (
                      <div className="text-center">
                        <Music className="w-5 h-5 mx-auto mb-1 text-primary" />
                        <p className="text-xs font-medium text-primary truncate max-w-[200px]">{songFile.name}</p>
                        <p className="text-xs text-muted-foreground">{(songFile.size / 1024 / 1024).toFixed(1)} MB</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Clicca per selezionare un file audio</p>
                      </div>
                    )}
                  </label>
                </div>
              )}

              <button onClick={handleUploadSong} disabled={songLoading || !songForm.title.trim()}
                className="w-full bg-primary text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {songLoading ? "Salvataggio..." : "Aggiungi canzone"}
              </button>
            </div>

            {/* Songs list */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Le tue canzoni ({stats?.songs ?? 0})</h3>
              {(stats?.songsList ?? []).map((song: any) => (
                <div key={song.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                    <Music className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{song.title}</p>
                    <p className="text-xs text-muted-foreground">{song.genre} · {song.duration}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {(song.externalUrl || song.fileUrl) && (
                      <a
                        href={song.externalUrl || song.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/70 transition-colors p-1.5"
                        title={song.externalUrl ? "Apri link esterno" : "Riproduci file"}
                      >
                        {song.externalUrl ? <ExternalLink className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </a>
                    )}
                    <button onClick={async () => { await fetch(`${BASE_URL}/api/songs/${song.id}`, { method: "DELETE" }); refetchStats(); }}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1.5">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TOUR */}
        {section === "tour" && (
          <div className="space-y-5">
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Plus className="w-4 h-4" />Aggiungi data tour</h3>
              {[
                { key: "city", label: "Città *", placeholder: "Es. Milano" },
                { key: "venue", label: "Venue *", placeholder: "Es. Mediolanum Forum" },
                { key: "date", label: "Data *", placeholder: "Es. 15 Ago 2026" },
                { key: "lat", label: "Latitudine (opzionale)", placeholder: "Es. 45.4654" },
                { key: "lng", label: "Longitudine (opzionale)", placeholder: "Es. 9.1859" },
                { key: "price", label: "Prezzo biglietto (€)", placeholder: "Es. 35" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                  <input value={(tourForm as any)[key]} onChange={(e) => setTourForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>
              ))}
              <button onClick={handleCreateTour} disabled={tourLoading || !tourForm.city || !tourForm.venue || !tourForm.date}
                className="w-full bg-primary text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {tourLoading ? "Salvataggio..." : "Aggiungi data"}
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Date ({stats?.tourDates ?? 0})</h3>
              {(stats?.upcomingEvents ?? []).map((stop: any) => (
                <div key={stop.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{stop.city} – {stop.venue}</p>
                    <p className="text-xs text-muted-foreground">{stop.date}</p>
                  </div>
                  <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full">In vendita</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NUOVO POST */}
        {section === "post" && (
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Send className="w-4 h-4" />Crea post</h3>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tipo</label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { key: "announcement", label: "Annuncio" }, { key: "release", label: "Uscita" },
                  { key: "tour", label: "Tour" }, { key: "story", label: "Racconto" },
                ].map(({ key, label }) => (
                  <button key={key} onClick={() => setPostForm((f) => ({ ...f, type: key }))}
                    className={cn("px-3 py-1 rounded-full text-xs font-medium transition-colors",
                      postForm.type === key ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:text-foreground")}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {postForm.type === "release" && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Canzone collegata (opzionale)</label>
                <select
                  value={postSelectedSongId}
                  onChange={(e) => setPostSelectedSongId(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary">
                  <option value="">— Nessuna canzone selezionata —</option>
                  {postMySongs.map((s: any) => (
                    <option key={s.id} value={String(s.id)}>{s.title}{s.genre ? ` (${s.genre})` : ""}</option>
                  ))}
                </select>
                {postMySongs.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">Nessuna canzone caricata. Aggiungine una dalla sezione Canzoni.</p>
                )}
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Contenuto *</label>
              <textarea value={postForm.content} onChange={(e) => setPostForm((f) => ({ ...f, content: e.target.value }))}
                placeholder="Scrivi il tuo post per i fan..." rows={5}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary resize-none" />
            </div>
            <button onClick={handleCreatePost} disabled={postLoading || !postForm.content.trim()}
              className="w-full bg-primary text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {postLoading ? "Pubblicazione..." : "Pubblica post"}
            </button>
          </div>
        )}

        {/* MERCH */}
        {section === "merch" && (
          <div className="space-y-4">
            <button onClick={() => setShowMerchForm(!showMerchForm)}
              className="flex items-center gap-1.5 text-xs px-4 py-2 bg-primary text-white rounded-full font-semibold hover:bg-primary/90 transition-colors">
              <Plus className="w-3 h-3" />Aggiungi articolo
            </button>
            {showMerchForm && (
              <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                {/* Image picker */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Immagine prodotto</label>
                  <label className={cn(
                    "flex items-center justify-center w-full rounded-xl border-2 border-dashed cursor-pointer transition-colors overflow-hidden",
                    merchImagePreview ? "border-primary/40 h-36" : "border-border hover:border-primary/40 h-24 hover:bg-primary/5"
                  )}>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const img = new Image();
                        img.onload = () => {
                          const canvas = document.createElement("canvas");
                          const MAX = 600;
                          const scale = Math.min(1, MAX / Math.max(img.width, img.height));
                          canvas.width = img.width * scale;
                          canvas.height = img.height * scale;
                          canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
                          setMerchImagePreview(canvas.toDataURL("image/jpeg", 0.8));
                        };
                        img.src = ev.target?.result as string;
                      };
                      reader.readAsDataURL(file);
                    }} />
                    {merchImagePreview ? (
                      <img src={merchImagePreview} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <Upload className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Clicca per caricare un'immagine</p>
                      </div>
                    )}
                  </label>
                  {merchImagePreview && (
                    <button onClick={() => setMerchImagePreview(null)}
                      className="mt-1 text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1">
                      <X className="w-3 h-3" />Rimuovi immagine
                    </button>
                  )}
                  {!merchImagePreview && (
                    <div className="mt-1.5">
                      <input value={merchForm.imageUrl} onChange={(e) => setMerchForm((f) => ({ ...f, imageUrl: e.target.value }))}
                        placeholder="Oppure incolla un URL immagine..."
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary" />
                    </div>
                  )}
                </div>

                {[
                  { key: "name", label: "Nome *", placeholder: "Es. T-shirt Tour 2026" },
                  { key: "price", label: "Prezzo (€) *", placeholder: "Es. 24" },
                  { key: "stock", label: "Stock *", placeholder: "Es. 50" },
                  { key: "description", label: "Descrizione *", placeholder: "Descrizione breve..." },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                    <input value={(merchForm as any)[key]} onChange={(e) => setMerchForm((f) => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary" />
                  </div>
                ))}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Categoria</label>
                  <select value={merchForm.category} onChange={(e) => setMerchForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none">
                    {["Magliette", "Cappelli", "Portachiavi", "Bandiere", "Poster", "Altro"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleCreateMerch}
                    className="flex-1 bg-primary text-white rounded-xl py-2 text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors">
                    Aggiungi
                  </button>
                  <button onClick={() => { setShowMerchForm(false); setMerchImagePreview(null); }}
                    className="px-4 bg-secondary text-muted-foreground rounded-xl py-2 text-sm">Annulla</button>
                </div>
              </div>
            )}
            {merchLoading ? <div className="space-y-2">{[1,2,3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div> : (
              <div className="space-y-2">
                {(merch ?? []).map((item: any) => (
                  <div key={item.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                    <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.category} · Stock: {item.stock}</p>
                      <p className="text-sm font-bold text-primary mt-0.5">€{item.price.toFixed(2)}</p>
                    </div>
                    <button onClick={() => deleteMerch.mutate({ id: item.id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/merch"] }) })}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1.5">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* REGALA */}
        {section === "gift" && (
          <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Gift className="w-4 h-4" />Regala a un utente</h3>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tipo regalo</label>
              <div className="flex gap-2">
                {[{ key: "ticket", label: "🎫 Biglietto" }, { key: "merch", label: "👕 Merch" }].map(({ key, label }) => (
                  <button key={key} onClick={() => setGiftForm((f) => ({ ...f, type: key }))}
                    className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                      giftForm.type === key ? "bg-primary text-white" : "bg-secondary text-muted-foreground")}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Username destinatario</label>
              <input value={giftForm.recipientUsername} onChange={(e) => setGiftForm((f) => ({ ...f, recipientUsername: e.target.value }))}
                placeholder="Es. mario_rossi"
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
            {giftForm.type === "merch" && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Articolo merch</label>
                <select value={giftForm.merchId} onChange={(e) => setGiftForm((f) => ({ ...f, merchId: e.target.value }))}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none">
                  <option value="">Seleziona...</option>
                  {(merch ?? []).map((item: any) => <option key={item.id} value={item.id}>{item.name} (€{item.price})</option>)}
                </select>
              </div>
            )}
            <button onClick={handleGift} disabled={giftLoading}
              className="w-full bg-primary text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {giftLoading ? "Invio..." : "Invia regalo"}
            </button>
          </div>
        )}

        {/* FOLLOWER */}
        {section === "ban" && (
          <div className="space-y-3">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
              <p className="text-xs text-amber-400 font-medium">Gestisci i tuoi follower</p>
              <p className="text-xs text-muted-foreground mt-0.5">Rimuovendo un follower, non potrà più vedere i tuoi post su BitSpace.</p>
            </div>
            {users.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nessun follower ancora</p>
              </div>
            )}
            {users.map((u: any) => (
              <div key={u.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {u.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{u.username}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                </div>
                <button onClick={() => handleBlockFollower(u.id, u.username)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-secondary text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-colors">
                  <X className="w-3 h-3" />Rimuovi
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

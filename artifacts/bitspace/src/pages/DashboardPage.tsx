import { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const fmtDate = (d: string) =>
  new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(d + "T00:00:00"));
const longDate = (d: string) =>
  new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(d + "T00:00:00"));
const initials = (n: string) =>
  n.split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase();

type PostType = "story" | "release" | "tour";
type MediaItem = { kind: string; name: string; size: string };
type TourStop = { id: string; date: string; event: string; price: string; location: string; address: string; status: string };
type Follower = { id: string; initials: string; name: string; meta: string; badge: string; tone: PostType; note: string };
type Post = { id: string; type: PostType; title: string; text: string; meta: string; extras: { label: string; value: string }[]; attachments: string[] };

function uid() { return Math.random().toString(36).slice(2); }

const FOLLOWER_POOL: [string, string, string, string, PostType, string][] = [
  ["GI", "Giulia Iovino", "Nuovo follower • Torino", "Fresh fan", "story", "Ha iniziato a seguirti dopo un reel backstage pubblicato ieri."],
  ["RT", "Riccardo Testa", "Segue il tour • Firenze", "Ticket buyer", "tour", "Ha cliccato la CTA del tour e salvato la data di Milano."],
  ["AM", "Alessia Marino", "Follower merch • Salerno", "Bundle lover", "release", "Interagisce con i post dei bundle album + t-shirt."],
];

const INIT_TOURS: TourStop[] = [
  { id: uid(), date: "2026-06-14", event: "Neon Nights Live", price: "€ 29,00", location: "Casa della Musica", address: "Via Corrado Barbagallo 115, Napoli", status: "Prevendita attiva" },
  { id: uid(), date: "2026-06-21", event: "Midnight Signals Tour", price: "€ 34,00", location: "Atlantico Live", address: "Viale dell'Oceano Atlantico 271D, Roma", status: "Quasi sold out" },
  { id: uid(), date: "2026-06-28", event: "Afterglow Session", price: "€ 31,00", location: "Fabrique", address: "Via Fantoli 9, Milano", status: "Nuova data" },
];

const INIT_FOLLOWERS: Follower[] = [
  { id: uid(), initials: "MF", name: "Martina Ferraro", meta: "Segue dal 2024 • Napoli", badge: "Top fan", tone: "release", note: "Interagisce spesso con i post sulle nuove release e ha già salvato 3 date del tour." },
  { id: uid(), initials: "LC", name: "Lorenzo Coppola", meta: "Nuovo follower • Roma", badge: "Tour lover", tone: "tour", note: "Ha acquistato un biglietto per Roma dopo aver visto il post promozionale." },
  { id: uid(), initials: "SG", name: "Sara Giordano", meta: "Follower storico • Milano", badge: "Engaged", tone: "story", note: "Commenta i contenuti backstage e condivide spesso teaser e video delle prove." },
  { id: uid(), initials: "DP", name: "Davide Parisi", meta: "Segue il merch shop • Bari", badge: "Collector", tone: "release", note: "Ha acquistato merchandising in due occasioni e apre quasi tutti gli annunci di album o bundle." },
];

const INIT_POSTS: Post[] = [
  { id: uid(), type: "story", title: "Backstage in studio", text: "Abbiamo appena chiuso il mix del nuovo live set. Sto preparando un video backstage da condividere domani con clip, synth e prove voce.", meta: "Pubblicato 12 min fa", extras: [{ label: "Allegato", value: "video-rehearsal.mp4" }, { label: "Formato", value: "Video + testo" }, { label: "Audience", value: "Tutti i follower" }], attachments: ["video-rehearsal.mp4"] },
  { id: uid(), type: "release", title: "Annuncio nuovo singolo", text: "Midnight Signals esce il 9 maggio. Nel post ho incluso cover, descrizione teaser, bonus demo esclusiva e CTA per il pre-save.", meta: "Pubblicato ieri • Campaign release", extras: [{ label: "Titolo", value: "Midnight Signals" }, { label: "Uscita", value: "09/05/2026" }, { label: "Bonus", value: "Demo backstage" }], attachments: ["cover-midnight-signals.jpg"] },
  { id: uid(), type: "tour", title: "Push data tour di Napoli", text: "Nuova call to action per la tappa di Napoli con prezzo base, venue, indirizzo completo e pulsante diretto all'acquisto dei biglietti.", meta: "Pubblicato 2 giorni fa", extras: [{ label: "Evento", value: "Neon Nights Live" }, { label: "Prezzo", value: "€ 29,00" }, { label: "CTA", value: "Acquista biglietti" }], attachments: [] },
];

const typeBadge: Record<PostType, string> = {
  story: "bg-amber-500/12 text-amber-300 border-amber-500/24",
  release: "bg-primary/14 text-purple-300 border-primary/25",
  tour: "bg-emerald-500/12 text-emerald-300 border-emerald-500/24",
};
const typeLabel: Record<PostType, string> = { story: "Post", release: "Singolo / Album", tour: "Data tour" };

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  return (
    <div
      className="fixed right-5 bottom-5 bg-[#141a2a] border border-white/10 rounded-2xl px-4 py-3 text-sm shadow-xl z-50 animate-in fade-in slide-in-from-bottom-2"
      onAnimationEnd={onDone}
    >
      {msg}
    </div>
  );
}

function Modal({ open, title, text, onConfirm, onClose, confirmLabel = "Conferma" }: { open: boolean; title: string; text: string; onConfirm: () => void; onClose: () => void; confirmLabel?: string }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-[480px] bg-[#141a2a] border border-white/10 rounded-3xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className="text-xl font-bold">{title}</h4>
            <p className="text-muted-foreground text-sm mt-1">{text}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors text-xl leading-none mt-1">✕</button>
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={() => { onConfirm(); onClose(); }} className="flex-1 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors">{confirmLabel}</button>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-[#0f1424] border border-white/10 text-sm hover:border-white/20 transition-colors">Annulla</button>
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] text-muted-foreground uppercase tracking-widest mb-1.5 font-medium">{children}</label>;
}
function DashInput({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/50"
    />
  );
}
function DashTextarea({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={4}
      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-primary/50 transition-colors resize-y placeholder:text-muted-foreground/50"
    />
  );
}

function PrimaryBtn({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button onClick={onClick} className={cn("inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2.5 rounded-xl bg-gradient-to-br from-primary to-[#4b39f5] text-white font-semibold text-sm transition-opacity hover:opacity-90", className)}>
      {children}
    </button>
  );
}
function GhostBtn({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button onClick={onClick} className={cn("inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2.5 rounded-xl bg-[#0f1424] border border-white/10 text-[#d6ddfb] text-sm hover:border-white/20 transition-colors", className)}>
      {children}
    </button>
  );
}
function TabBtn({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("min-h-[38px] px-4 py-2 rounded-xl text-sm transition-colors", active ? "bg-primary/14 border border-primary/35 text-white" : "bg-[#0f1424] border border-white/10 text-[#d6ddfb] hover:border-white/20")}>
      {children}
    </button>
  );
}

function StatCard({ label, value, progress }: { label: string; value: number; progress: number }) {
  return (
    <div className="bg-[#0f1424] border border-white/10 rounded-2xl p-4">
      <p className="text-[11px] text-muted-foreground uppercase tracking-widest">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
      <div className="h-2 bg-white/6 rounded-full overflow-hidden mt-3">
        <div className="h-full bg-gradient-to-r from-[#25c281] to-[#66e7b0] rounded-full transition-all duration-500" style={{ width: `${Math.min(96, progress)}%` }} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  // Toast
  const [toasts, setToasts] = useState<string[]>([]);
  const toast = (msg: string) => setToasts((p) => [...p, msg]);

  // State matching original
  const [postType, setPostType] = useState<PostType>("story");
  const [postFilter, setPostFilter] = useState<"all" | PostType>("all");
  const [posts, setPosts] = useState<Post[]>(INIT_POSTS);
  const [tours, setTours] = useState<TourStop[]>(INIT_TOURS);
  const [followers, setFollowers] = useState<Follower[]>(INIT_FOLLOWERS);
  const [media, setMedia] = useState<MediaItem[]>([]);

  // Profile
  const [profile, setProfile] = useState({
    name: user?.username ?? "Nova Echo",
    genre: "Electro-pop • Artista • Napoli",
    bio: "Electro-pop artist tra sintetizzatori analogici, club set e release narrative.",
    photo: "initials" as string,
  });

  // Composer fields
  const [postTitle, setPostTitle] = useState("");
  const [postText, setPostText] = useState("");
  const [releaseName, setReleaseName] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [releaseBonus, setReleaseBonus] = useState("");
  const [linkedTour, setLinkedTour] = useState("");
  const [tourPromoNote, setTourPromoNote] = useState("");

  // Tour form
  const [tourForm, setTourForm] = useState({ date: "", event: "", price: "", location: "", address: "" });

  // Activity
  const [activity] = useState([
    { time: "5 min fa", text: "46 nuovi follower dopo l'annuncio del singolo" },
    { time: "18 min fa", text: "Bozza tour di Bologna salvata" },
    { time: "1 h fa", text: "Cover profilo aggiornata" },
  ]);

  // Modal
  const [modal, setModal] = useState<{ open: boolean; title: string; text: string; confirmLabel: string; onConfirm: () => void }>({ open: false, title: "", text: "", confirmLabel: "Conferma", onConfirm: () => {} });

  const composerRef = useRef<HTMLElement>(null);
  const tourRef = useRef<HTMLElement>(null);

  // Stats
  const mediaTotal = posts.reduce((s, p) => s + p.attachments.length, 0);
  const stats = [
    { label: "Follower", value: followers.length, progress: 40 + followers.length * 8 },
    { label: "Date attive", value: tours.length, progress: 35 + tours.length * 12 },
    { label: "Post totali", value: posts.length, progress: 30 + posts.length * 9 },
    { label: "Media allegati", value: mediaTotal, progress: 28 + mediaTotal * 10 },
  ];

  function publish(mode: "publish" | "draft" | "schedule") {
    if (!postTitle.trim() || !postText.trim()) { toast("Inserisci titolo e testo."); return; }
    let extras: Post["extras"] = [];
    if (postType === "release") {
      extras = [
        { label: "Titolo", value: releaseName || postTitle },
        { label: "Uscita", value: releaseDate ? fmtDate(releaseDate) : "Da definire" },
        { label: "Bonus", value: releaseBonus || "Pre-save esclusivo" },
      ];
    } else if (postType === "tour") {
      const linked = tours.find((t) => t.id === linkedTour);
      extras = [
        { label: "Evento", value: linked ? linked.event : "Data non collegata" },
        { label: "Prezzo", value: linked ? linked.price : "Da definire" },
        { label: "CTA", value: tourPromoNote || "Acquista biglietti" },
      ];
    } else {
      extras = [
        { label: "Allegati", value: String(media.length) },
        { label: "Formato", value: media.length ? "Testo + media" : "Solo testo" },
        { label: "Audience", value: "Tutti i follower" },
      ];
    }
    const newPost: Post = {
      id: uid(), type: postType, title: postTitle.trim(), text: postText.trim(),
      meta: mode === "draft" ? "Salvato come bozza adesso" : mode === "schedule" ? "Programmato per domani alle 18:00" : "Pubblicato ora",
      extras, attachments: media.map((m) => m.name),
    };
    setPosts((p) => [newPost, ...p]);
    setMedia([]);
    setPostTitle(""); setPostText("");
    toast(mode === "draft" ? "Bozza salvata." : mode === "schedule" ? "Post programmato." : "Post pubblicato.");
  }

  function saveTour() {
    const { date, event, price, location, address } = tourForm;
    if (!date || !event || !price || !location || !address) { toast("Compila tutti i campi della tappa."); return; }
    setTours((t) => [{ id: uid(), date, event, price, location, address, status: "Nuova data" }, ...t]);
    setTourForm({ date: "", event: "", price: "", location: "", address: "" });
    toast("Data tour salvata.");
  }

  function promoteTour(id: string) {
    const t = tours.find((x) => x.id === id);
    if (!t) return;
    setPostType("tour");
    setLinkedTour(t.id);
    setPostTitle(`Nuova promo: ${t.event}`);
    setPostText(`Ci vediamo a ${t.location}! ${t.status.toLowerCase()}, biglietti da ${t.price}.`);
    setTourPromoNote("Acquista biglietti");
    composerRef.current?.scrollIntoView({ behavior: "smooth" });
    toast("Tappa collegata al composer.");
  }

  function addFakeFollower() {
    const p = FOLLOWER_POOL[Math.floor(Math.random() * FOLLOWER_POOL.length)];
    setFollowers((f) => [{ id: uid(), initials: p[0], name: p[1], meta: p[2], badge: p[3], tone: p[4], note: p[5] }, ...f]);
    toast("Follower fake aggiunto.");
  }

  function exportFollowers() {
    const rows = [["Nome", "Info", "Badge", "Nota"], ...followers.map((f) => [f.name, f.meta, f.badge, f.note])];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "bitspace-followers.csv";
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Esportazione follower avviata.");
  }

  const filteredPosts = postFilter === "all" ? posts : posts.filter((p) => p.type === postFilter);

  const avatarGradient: Record<string, string> = {
    gradient: "linear-gradient(135deg,#6d5dfc,#4b39f5)",
    green: "linear-gradient(135deg,#25c281,#0ea5a8)",
    pink: "linear-gradient(135deg,#ff4fd8,#6d5dfc)",
    initials: "linear-gradient(135deg,#2c3550,#171d31)",
  };

  return (
    <div className="flex min-h-screen" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Main content */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-[860px] mx-auto px-5 py-6 pb-28 md:pb-8 space-y-6">

          {/* Hero / stats */}
          <section className="bg-[rgba(20,26,42,0.9)] border border-white/10 rounded-3xl p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Gestisci community, tour e contenuti</h2>
                <p className="text-muted-foreground text-sm mt-2 max-w-[55ch] leading-relaxed">
                  Dashboard artista: crea post, aggiungi date del tour, gestisci follower e aggiorna il profilo in tempo reale.
                </p>
              </div>
              <div className="flex gap-3 flex-wrap shrink-0">
                <PrimaryBtn onClick={() => composerRef.current?.scrollIntoView({ behavior: "smooth" })}>Condividi un post</PrimaryBtn>
                <GhostBtn onClick={() => tourRef.current?.scrollIntoView({ behavior: "smooth" })}>Aggiungi data tour</GhostBtn>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {stats.map((s) => <StatCard key={s.label} label={s.label} value={s.value} progress={s.progress} />)}
            </div>
          </section>

          {/* Composer */}
          <section ref={composerRef} className="bg-[rgba(20,26,42,0.9)] border border-white/10 rounded-3xl p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold">Composer artista</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Post normali, annunci di singolo/album e promozione date del tour.</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {(["story", "release", "tour"] as PostType[]).map((t) => (
                  <TabBtn key={t} active={postType === t} onClick={() => setPostType(t)}>
                    {t === "story" ? "Post" : t === "release" ? "Singolo / Album" : "Data tour"}
                  </TabBtn>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-b from-primary/10 to-[#0f1424]/95 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-4">
                <div className="space-y-3">
                  <div>
                    <FieldLabel>Titolo del contenuto</FieldLabel>
                    <DashInput value={postTitle} onChange={setPostTitle} placeholder="Es. Midnight Signals fuori venerdì" />
                  </div>
                  <div>
                    <FieldLabel>Scrivi il tuo post</FieldLabel>
                    <DashTextarea value={postText} onChange={setPostText} placeholder="Racconta un backstage, annuncia un nuovo brano o aggiorna i fan su una tappa del tour..." />
                  </div>
                </div>
                <div className="bg-white/[0.03] border border-dashed border-white/14 rounded-2xl p-4 space-y-3">
                  <p className="font-semibold text-sm">Allegati media</p>
                  <p className="text-xs text-muted-foreground">Aggiungi allegati demo al post.</p>
                  <div className="flex gap-2 flex-wrap">
                    <GhostBtn onClick={() => { const n = media.length + 1; setMedia((m) => [...m, { kind: "Foto", name: `foto-demo-${n}.jpg`, size: `${1 + n}.2 MB` }]); toast("Foto demo aggiunta."); }} className="text-xs px-3 min-h-[36px]">Carica foto</GhostBtn>
                    <GhostBtn onClick={() => { const n = media.length + 1; setMedia((m) => [...m, { kind: "Video", name: `video-demo-${n}.mp4`, size: `${6 + n}.8 MB` }]); toast("Video demo aggiunto."); }} className="text-xs px-3 min-h-[36px]">Carica video</GhostBtn>
                    {media.length > 0 && <GhostBtn onClick={() => { setMedia([]); toast("Allegati svuotati."); }} className="text-xs px-3 min-h-[36px]">Svuota</GhostBtn>}
                  </div>
                  {media.length === 0 ? (
                    <div className="bg-white/[0.03] border border-white/8 rounded-xl p-3">
                      <p className="text-xs text-muted-foreground">Nessun allegato</p>
                      <p className="text-xs font-medium mt-0.5">Carica foto o video demo</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {media.map((m, i) => (
                        <div key={i} className="bg-white/[0.03] border border-white/8 rounded-xl p-3 flex items-center justify-between gap-2">
                          <div>
                            <p className="text-[10px] text-muted-foreground">{m.kind}</p>
                            <p className="text-xs font-medium">{m.name}</p>
                            <p className="text-[10px] text-muted-foreground">{m.size}</p>
                          </div>
                          <button onClick={() => { setMedia((x) => x.filter((_, j) => j !== i)); toast("Allegato rimosso."); }} className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-lg hover:bg-destructive/10">Rimuovi</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {postType === "release" && (
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-3">
                    <p className="font-semibold text-sm">Annuncio singolo / album</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div><FieldLabel>Titolo release</FieldLabel><DashInput value={releaseName} onChange={setReleaseName} placeholder="Midnight Signals" /></div>
                      <div><FieldLabel>Data uscita</FieldLabel><DashInput value={releaseDate} onChange={setReleaseDate} type="date" /></div>
                    </div>
                    <div><FieldLabel>Bonus fan</FieldLabel><DashInput value={releaseBonus} onChange={setReleaseBonus} placeholder="Demo backstage esclusiva" /></div>
                  </div>
                )}
                {postType === "tour" && (
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-3">
                    <p className="font-semibold text-sm">Promuovi una data del tour</p>
                    <div>
                      <FieldLabel>Data collegata</FieldLabel>
                      <select value={linkedTour} onChange={(e) => setLinkedTour(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-primary/50 transition-colors">
                        <option value="">Nessuna tappa collegata</option>
                        {tours.map((t) => <option key={t.id} value={t.id}>{fmtDate(t.date)} • {t.event} • {t.location}</option>)}
                      </select>
                    </div>
                    <div><FieldLabel>Messaggio promo</FieldLabel><DashInput value={tourPromoNote} onChange={setTourPromoNote} placeholder="Ultimi biglietti disponibili" /></div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 flex-wrap">
                <PrimaryBtn onClick={() => publish("publish")}>Pubblica ora</PrimaryBtn>
                <GhostBtn onClick={() => publish("draft")}>Salva bozza</GhostBtn>
                <GhostBtn onClick={() => publish("schedule")}>Programma</GhostBtn>
              </div>
            </div>
          </section>

          {/* Tour dates */}
          <section ref={tourRef} className="bg-[rgba(20,26,42,0.9)] border border-white/10 rounded-3xl p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold">Date del tour</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Gestisci le tappe esistenti e inserisci nuove date.</p>
              </div>
              <PrimaryBtn onClick={() => tourRef.current?.scrollIntoView({ behavior: "smooth" })}>Aggiungi nuova data</PrimaryBtn>
            </div>

            <div className="bg-gradient-to-b from-primary/10 to-[#0f1424]/95 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { key: "date", label: "Data", type: "date", placeholder: "" },
                  { key: "event", label: "Nome evento", placeholder: "Neon Nights Live" },
                  { key: "price", label: "Prezzo base biglietti", placeholder: "€ 29,00" },
                  { key: "location", label: "Location", placeholder: "Casa della Musica" },
                  { key: "address", label: "Indirizzo", placeholder: "Via Corrado Barbagallo 115, Napoli" },
                ].map(({ key, label, type, placeholder }) => (
                  <div key={key} className={key === "address" ? "col-span-2 md:col-span-3" : ""}>
                    <FieldLabel>{label}</FieldLabel>
                    <DashInput value={(tourForm as any)[key]} onChange={(v) => setTourForm((f) => ({ ...f, [key]: v }))} placeholder={placeholder} type={type} />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 flex-wrap">
                <PrimaryBtn onClick={saveTour}>Salva tappa</PrimaryBtn>
                <GhostBtn onClick={() => { if (tours[0]) setTourForm({ date: tours[0].date, event: tours[0].event + " Copy", price: tours[0].price, location: tours[0].location, address: tours[0].address }); toast("Campi compilati."); }}>Duplica da evento precedente</GhostBtn>
                <GhostBtn onClick={() => { setTourForm({ date: "", event: "", price: "", location: "", address: "" }); toast("Form tour ripulito."); }}>Reset form</GhostBtn>
              </div>
            </div>

            <div className="space-y-4">
              {tours.map((t) => (
                <article key={t.id} className="bg-[#0f1424] border border-white/10 rounded-3xl p-5 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold">{t.event} — {t.location}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{longDate(t.date)} • {t.location}</p>
                    </div>
                    <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-500/12 text-emerald-300 border border-emerald-500/24 shrink-0">{t.status}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {[{ label: "Data", value: fmtDate(t.date) }, { label: "Evento", value: t.event }, { label: "Prezzo base", value: t.price }, { label: "Location", value: t.location }, { label: "Indirizzo", value: t.address }].map((x) => (
                      <div key={x.label} className="bg-[rgba(9,13,24,0.55)] border border-white/8 rounded-2xl p-3">
                        <p className="text-[10px] text-muted-foreground mb-1">{x.label}</p>
                        <p className="text-xs font-semibold truncate">{x.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <GhostBtn onClick={() => promoteTour(t.id)} className="text-xs px-3 min-h-[36px]">Promuovi questa data</GhostBtn>
                    <GhostBtn onClick={() => { setTourForm({ date: t.date, event: t.event, price: t.price, location: t.location, address: t.address }); tourRef.current?.scrollIntoView({ behavior: "smooth" }); toast("Dati evento caricati."); }} className="text-xs px-3 min-h-[36px]">Modifica</GhostBtn>
                    <GhostBtn onClick={() => setModal({ open: true, title: "Elimina tappa", text: `Eliminare "${t.event}"?`, confirmLabel: "Elimina", onConfirm: () => { setTours((x) => x.filter((s) => s.id !== t.id)); toast("Tappa eliminata."); } })} className="text-xs px-3 min-h-[36px] hover:text-destructive hover:border-destructive/30">Elimina</GhostBtn>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Posts list */}
          <section className="bg-[rgba(20,26,42,0.9)] border border-white/10 rounded-3xl p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold">Post recenti pubblicati</h3>
                <p className="text-sm text-muted-foreground mt-0.5">La lista si aggiorna quando usi il composer.</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {(["all", "story", "release", "tour"] as const).map((f) => (
                  <TabBtn key={f} active={postFilter === f} onClick={() => setPostFilter(f)}>
                    {f === "all" ? "Tutti" : f === "story" ? "Post" : f === "release" ? "Release" : "Tour"}
                  </TabBtn>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {filteredPosts.length === 0 ? (
                <div className="bg-[#0f1424] border border-white/10 rounded-2xl p-5">
                  <p className="font-semibold">Nessun contenuto in questo filtro</p>
                  <p className="text-sm text-muted-foreground mt-1">Crea un nuovo post oppure cambia filtro.</p>
                </div>
              ) : filteredPosts.map((post) => (
                <article key={post.id} className="bg-[#0f1424] border border-white/10 rounded-3xl p-5 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold">{post.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{post.meta}</p>
                    </div>
                    <span className={cn("text-[11px] px-2.5 py-1 rounded-full border shrink-0", typeBadge[post.type])}>{typeLabel[post.type]}</span>
                  </div>
                  <p className="text-sm text-[#e8edff] leading-relaxed">{post.text}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {post.extras.map((x) => (
                      <div key={x.label} className="bg-[rgba(9,13,24,0.55)] border border-white/8 rounded-2xl p-3">
                        <p className="text-[10px] text-muted-foreground mb-1">{x.label}</p>
                        <p className="text-xs font-semibold">{x.value}</p>
                      </div>
                    ))}
                  </div>
                  {post.attachments.length > 0 && (
                    <div className="space-y-1.5">
                      {post.attachments.map((f) => (
                        <div key={f} className="bg-white/[0.03] border border-white/8 rounded-xl px-3 py-2">
                          <p className="text-[10px] text-muted-foreground">Allegato</p>
                          <p className="text-xs font-medium">{f}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <GhostBtn onClick={() => { setPosts((p) => [{ ...post, id: uid(), meta: "Duplicato adesso", title: post.title + " Copy" }, ...p]); toast("Post duplicato."); }} className="text-xs px-3 min-h-[36px]">Duplica post</GhostBtn>
                    <GhostBtn onClick={() => { setPosts((p) => p.filter((x) => x.id !== post.id)); toast("Post eliminato."); }} className="text-xs px-3 min-h-[36px] hover:text-destructive hover:border-destructive/30">Elimina</GhostBtn>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Followers */}
          <section className="bg-[rgba(20,26,42,0.9)] border border-white/10 rounded-3xl p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold">I miei follower</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Community con utenti recenti, top fan e nuovi ingressi.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs px-3 py-1.5 rounded-full bg-primary/12 text-primary border border-primary/25">+{Math.max(12, followers.length * 3)} questa settimana</span>
                <GhostBtn onClick={addFakeFollower} className="text-xs px-3 min-h-[36px]">Aggiungi follower fake</GhostBtn>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {followers.map((f) => (
                <article key={f.id} className="bg-[#0f1424] border border-white/10 rounded-3xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2c3550] to-[#171d31] flex items-center justify-center text-sm font-bold border border-white/10 shrink-0">{f.initials}</div>
                      <div>
                        <p className="font-semibold text-sm">{f.name}</p>
                        <p className="text-xs text-muted-foreground">{f.meta}</p>
                      </div>
                    </div>
                    <span className={cn("text-[11px] px-2.5 py-1 rounded-full border shrink-0", typeBadge[f.tone])}>{f.badge}</span>
                  </div>
                  <p className="text-sm text-[#e8edff] leading-relaxed">{f.note}</p>
                  <div className="flex gap-2">
                    <GhostBtn onClick={() => setModal({ open: true, title: "Invita a evento", text: `Invio di un invito VIP a ${f.name}.`, confirmLabel: "Invia invito", onConfirm: () => toast("Invito inviato.") })} className="text-xs px-3 min-h-[34px]">Invita a evento</GhostBtn>
                    <GhostBtn onClick={() => { setFollowers((x) => x.filter((y) => y.id !== f.id)); toast("Follower rimosso."); }} className="text-xs px-3 min-h-[34px] hover:text-destructive hover:border-destructive/30">Rimuovi</GhostBtn>
                  </div>
                </article>
              ))}
            </div>
          </section>

        </div>
      </div>

      {/* Right sidebar */}
      <aside className="hidden xl:flex flex-col w-[320px] shrink-0 border-l border-white/10 bg-[rgba(14,19,32,0.6)] sticky top-0 h-screen overflow-y-auto p-5 gap-5">

        {/* Profile */}
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest mb-3">Modifica profilo</p>
          <div className="bg-[#0f1424] border border-white/10 rounded-2xl p-4 space-y-3">
            <p className="font-semibold text-sm">Profilo e immagine</p>
            <div className="flex items-center gap-3 mb-1">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg border border-white/10 shrink-0"
                style={{ background: profile.photo === "image" ? `url(https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop) center/cover` : (avatarGradient[profile.photo] ?? avatarGradient["initials"]) }}
              >
                {profile.photo !== "image" ? initials(profile.name) : ""}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{profile.name}</p>
                <p className="text-xs text-muted-foreground truncate">{profile.genre}</p>
              </div>
            </div>
            {[{ key: "name", label: "Nome artista", placeholder: "Nome artista" }, { key: "genre", label: "Genere / tagline", placeholder: "Electro-pop • Artista • Napoli" }].map(({ key, label, placeholder }) => (
              <div key={key}>
                <FieldLabel>{label}</FieldLabel>
                <DashInput value={(profile as any)[key]} onChange={(v) => setProfile((p) => ({ ...p, [key]: v }))} placeholder={placeholder} />
              </div>
            ))}
            <div>
              <FieldLabel>Bio</FieldLabel>
              <textarea value={profile.bio} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))} rows={3} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary/50 transition-colors resize-none placeholder:text-muted-foreground/50" />
            </div>
            <div>
              <FieldLabel>Stile foto profilo</FieldLabel>
              <select value={profile.photo} onChange={(e) => setProfile((p) => ({ ...p, photo: e.target.value }))} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary/50 transition-colors">
                <option value="initials">Iniziali</option>
                <option value="gradient">Gradient neon</option>
                <option value="green">Gradient emerald</option>
                <option value="pink">Gradient magenta</option>
                <option value="image">Foto artista</option>
              </select>
            </div>
            <PrimaryBtn onClick={() => toast("Profilo aggiornato.")} className="w-full">Salva profilo</PrimaryBtn>
          </div>
        </div>

        {/* Agenda */}
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest mb-3">Agenda tour</p>
          <div className="space-y-2">
            {[...tours].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4).map((t) => (
              <div key={t.id} className="bg-[#0f1424] border border-white/8 rounded-xl px-4 py-3">
                <p className="text-[10px] text-muted-foreground">{longDate(t.date)}</p>
                <p className="text-xs font-semibold mt-0.5">{t.location} • {t.event}</p>
              </div>
            ))}
            {tours.length === 0 && <div className="bg-[#0f1424] border border-white/8 rounded-xl px-4 py-3 text-xs text-muted-foreground">Nessuna data aggiunta</div>}
          </div>
        </div>

        {/* Activity */}
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest mb-3">Attività recenti</p>
          <div className="space-y-2">
            {activity.map((a, i) => (
              <div key={i} className="bg-[#0f1424] border border-white/8 rounded-xl px-4 py-3">
                <p className="text-[10px] text-muted-foreground">{a.time}</p>
                <p className="text-xs font-medium mt-0.5">{a.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-[#0f1424] border border-white/10 rounded-2xl p-4 space-y-2">
          <p className="font-semibold text-sm mb-1">Azioni rapide</p>
          <GhostBtn onClick={() => { setPostType("release"); setPostTitle("Nuovo album in arrivo"); composerRef.current?.scrollIntoView({ behavior: "smooth" }); toast("Composer impostato su release."); }} className="w-full text-sm justify-start">Crea annuncio album</GhostBtn>
          <GhostBtn onClick={() => toast("Apri Gestione merch dal menu principale.")} className="w-full text-sm justify-start">Pubblicizza merch bundle</GhostBtn>
          <GhostBtn onClick={exportFollowers} className="w-full text-sm justify-start">Esporta lista follower</GhostBtn>
        </div>

      </aside>

      {/* Toasts */}
      <div className="fixed right-5 bottom-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((msg, i) => (
          <div key={i} className="bg-[#141a2a] border border-white/10 rounded-2xl px-4 py-3 text-sm shadow-xl pointer-events-auto">
            {msg}
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal
        open={modal.open}
        title={modal.title}
        text={modal.text}
        confirmLabel={modal.confirmLabel}
        onConfirm={modal.onConfirm}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
      />
    </div>
  );
}

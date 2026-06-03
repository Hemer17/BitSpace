import { useState } from "react";
import {
  Users, Play, Calendar, ShoppingBag, TrendingUp, Plus, Trash2, MapPin, BarChart2
} from "lucide-react";
import {
  useGetArtistDashboard,
  useListMerch,
  useCreateMerchItem,
  useDeleteMerchItem,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

function StatCard({
  label, value, sub, icon: Icon, color
}: {
  label: string; value: string; sub?: string; icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", color)}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      {sub && (
        <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
          <TrendingUp className="w-3 h-3" />{sub}
        </p>
      )}
    </div>
  );
}

function formatNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useGetArtistDashboard();
  const { data: merch, isLoading: merchLoading } = useListMerch({});
  const createMerch = useCreateMerchItem();
  const deleteMerch = useDeleteMerchItem();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", category: "Magliette", price: "", stock: "", description: "" });

  const handleCreate = () => {
    if (!form.name || !form.price || !form.stock || !form.description) {
      toast({ title: "Campi obbligatori mancanti", variant: "destructive" });
      return;
    }
    createMerch.mutate(
      { data: { name: form.name, category: form.category, price: parseFloat(form.price), stock: parseInt(form.stock), description: form.description } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/merch"] });
          setShowForm(false);
          setForm({ name: "", category: "Magliette", price: "", stock: "", description: "" });
          toast({ title: "Articolo aggiunto!" });
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteMerch.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/merch"] });
          toast({ title: "Articolo rimosso" });
        },
      }
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <BarChart2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Dashboard Artista</h1>
          <p className="text-xs text-muted-foreground">Amanda Bonassi</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-7">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : (
          <>
            <StatCard
              label="Follower totali"
              value={formatNum(stats?.totalFollowers ?? 0)}
              sub={`+${stats?.followersGrowth}% questo mese`}
              icon={Users}
              color="bg-primary"
            />
            <StatCard
              label="Riproduzioni"
              value={formatNum(stats?.totalPlays ?? 0)}
              sub={`+${stats?.playsGrowth}% questo mese`}
              icon={Play}
              color="bg-emerald-600"
            />
            <StatCard
              label="Date tour"
              value={String(stats?.tourDates ?? 0)}
              icon={Calendar}
              color="bg-amber-600"
            />
            <StatCard
              label="Articoli merch"
              value={String(stats?.merch ?? 0)}
              icon={ShoppingBag}
              color="bg-violet-600"
            />
          </>
        )}
      </div>

      {/* Upcoming events */}
      {stats?.upcomingEvents && stats.upcomingEvents.length > 0 && (
        <section className="mb-7">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" />
            Prossime date
          </h2>
          <div className="space-y-2">
            {stats.upcomingEvents.map((stop: any) => (
              <div key={stop.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{stop.city} – {stop.venue}</p>
                  <p className="text-xs text-muted-foreground">{stop.date}</p>
                </div>
                <span className={cn(
                  "text-xs font-medium px-2.5 py-1 rounded-full",
                  stop.status === "sold_out" ? "bg-destructive/15 text-destructive" :
                  stop.status === "presale" ? "bg-amber-500/15 text-amber-400" :
                  "bg-primary/15 text-primary"
                )}>
                  {stop.status === "sold_out" ? "Esaurito" : stop.status === "presale" ? "Presale" : "In vendita"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Merch management */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <ShoppingBag className="w-3.5 h-3.5" />
            Gestione merch
          </h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-primary text-white rounded-full font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Aggiungi
          </button>
        </div>

        {showForm && (
          <div className="bg-card border border-border rounded-2xl p-4 mb-4 space-y-3">
            <h3 className="text-sm font-semibold">Nuovo articolo</h3>
            {[
              { key: "name", label: "Nome", placeholder: "Es. T-shirt Tour 2026" },
              { key: "price", label: "Prezzo (€)", placeholder: "Es. 24" },
              { key: "stock", label: "Stock", placeholder: "Es. 50" },
              { key: "description", label: "Descrizione", placeholder: "Descrizione breve..." },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                <input
                  value={(form as any)[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            ))}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Categoria</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
              >
                {["Magliette", "Cappelli", "Portachiavi", "Bandiere", "Poster", "Altro"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleCreate}
                disabled={createMerch.isPending}
                className="flex-1 bg-primary text-white rounded-xl py-2 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {createMerch.isPending ? "Salvataggio..." : "Aggiungi articolo"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 bg-secondary text-muted-foreground rounded-xl py-2 text-sm hover:text-foreground transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        )}

        {merchLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {(merch ?? []).map((item: any) => (
              <div key={item.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0">
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.category}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-sm font-bold text-primary">€{item.price.toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground">Stock: {item.stock}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

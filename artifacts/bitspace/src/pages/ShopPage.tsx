import { useState, useEffect } from "react";
import { Ticket, Calendar, MapPin, QrCode, ShoppingCart, ShoppingBag, Tag, AlertCircle, ArrowLeft } from "lucide-react";
import { useListTickets, usePurchaseTicket, useListEvents } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useSearch, useLocation } from "wouter";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

function ResaleModal({ ticket, onClose, onDone }: { ticket: any; onClose: () => void; onDone: () => void }) {
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const maxPrice = ticket.originalPrice ?? ticket.price;

  const handleSubmit = async () => {
    const p = parseFloat(price);
    if (isNaN(p) || p <= 0) return;
    if (p > maxPrice) { toast({ title: `Prezzo massimo: €${maxPrice.toFixed(2)}`, variant: "destructive" }); return; }
    setLoading(true);
    try {
      const r = await fetch(`${BASE_URL}/api/tickets/${ticket.id}/resale`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resalePrice: p }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      toast({ title: "Biglietto messo in vendita!" });
      onDone();
      onClose();
    } catch (e: any) { toast({ title: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold mb-1">Vendi biglietto</h3>
        <p className="text-xs text-muted-foreground mb-4">Prezzo massimo: <span className="text-primary font-semibold">€{maxPrice.toFixed(2)}</span></p>
        <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" step="0.01" min="0.01" max={maxPrice}
          placeholder={`Prezzo (max €${maxPrice.toFixed(2)})`}
          className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary mb-4" />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl text-sm text-muted-foreground bg-secondary hover:text-foreground transition-colors">Annulla</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {loading ? "..." : "Metti in vendita"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  const { user } = useAuth();
  const search = useSearch();
  const [, navigate] = useLocation();
  const params = new URLSearchParams(search);
  const filterArtistId = params.get("artistId") ? parseInt(params.get("artistId")!) : null;

  const { data: tickets, isLoading: ticketsLoading } = useListTickets();
  const { data: events } = useListEvents({});
  const purchaseMutation = usePurchaseTicket();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [buyingId, setBuyingId] = useState<number | null>(null);
  const [buyingMerchId, setBuyingMerchId] = useState<number | null>(null);
  const [resaleTicket, setResaleTicket] = useState<any>(null);
  const [shopData, setShopData] = useState<{ events: any[]; merch: any[] } | null>(null);
  const [tab, setTab] = useState<"biglietti" | "merch" | "miei">("biglietti");
  const [artists, setArtists] = useState<any[]>([]);
  const [selectedArtistId, setSelectedArtistId] = useState<number | null>(filterArtistId);

  useEffect(() => {
    fetch(`${BASE_URL}/api/shop`).then((r) => r.json()).then(setShopData).catch(() => { });
    fetch(`${BASE_URL}/api/artists`).then((r) => r.json()).then((d) => Array.isArray(d) && setArtists(d)).catch(() => { });
  }, []);

  // Sync selectedArtist from URL param on load
  useEffect(() => {
    if (filterArtistId) setSelectedArtistId(filterArtistId);
  }, [filterArtistId]);

  const handleBuy = (eventId: number, eventTitle: string) => {
    setBuyingId(eventId);
    purchaseMutation.mutate(
      { data: { eventId } },
      {
        onSuccess: () => {
          setShopData((prev) => prev ? {
            ...prev,
            events: prev.events.map((e) =>
              e.id === eventId ? { ...e, ticketsLeft: Math.max(0, (e.ticketsLeft ?? 1) - 1) } : e
            ),
          } : prev);
          queryClient.setQueryData(["/api/events"], (old: any) => {
            if (!Array.isArray(old)) return old;
            return old.map((e: any) =>
              e.id === eventId ? { ...e, ticketsLeft: Math.max(0, (e.ticketsLeft ?? 1) - 1) } : e
            );
          });
          queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
          toast({ title: "Biglietto acquistato!", description: eventTitle });
          setBuyingId(null);
        },
        onError: async (err: any) => {
          toast({ title: "Errore", description: err.message ?? "Impossibile acquistare", variant: "destructive" });
          setBuyingId(null);
        },
      }
    );
  };

  const handleBuyMerch = async (item: any) => {
    setBuyingMerchId(item.id);
    try {
      const r = await fetch(`${BASE_URL}/api/merch/${item.id}/buy`, { method: "POST" });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Errore acquisto");
      setShopData((prev) => prev ? {
        ...prev,
        merch: prev.merch.map((m) => m.id === item.id ? { ...m, stock: data.stock } : m),
      } : prev);
      toast({ title: "Acquisto completato! 🛍️", description: item.name });
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    } finally {
      setBuyingMerchId(null);
    }
  };

  const rawEvents = shopData?.events ?? events ?? [];
  const rawMerch = shopData?.merch ?? [];

  const displayEvents = selectedArtistId
    ? rawEvents.filter((e: any) => e.artistId === selectedArtistId)
    : rawEvents;
  const displayMerch = selectedArtistId
    ? rawMerch.filter((m: any) => m.artistId === selectedArtistId)
    : rawMerch;

  const selectedArtistName = selectedArtistId
    ? (artists.find((a: any) => a.id === selectedArtistId)?.name ?? "Artista")
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold mb-1">Shop</h1>
        <p className="text-sm text-muted-foreground">Biglietti e merchandise degli artisti che segui</p>
      </div>

      {/* Artist filter pills */}
      {artists.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-none">
          <button
            onClick={() => { setSelectedArtistId(null); navigate("/shop"); }}
            className={cn("px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors border",
              selectedArtistId === null
                ? "bg-primary text-white border-primary"
                : "bg-secondary text-muted-foreground border-border hover:text-foreground")}>
            Tutti
          </button>
          {artists.map((a: any) => (
            <button
              key={a.id}
              onClick={() => { setSelectedArtistId(a.id); navigate(`/shop?artistId=${a.id}`); }}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors border",
                selectedArtistId === a.id
                  ? "bg-primary text-white border-primary"
                  : "bg-secondary text-muted-foreground border-border hover:text-foreground")}>
              {a.avatarUrl
                ? <img src={a.avatarUrl} className="w-4 h-4 rounded-full object-cover" />
                : <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[9px] font-bold">{a.avatarInitials ?? a.name?.[0]}</span>
              }
              {a.name}
            </button>
          ))}
        </div>
      )}

      {selectedArtistName && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm font-semibold text-primary">{selectedArtistName}</span>
          <button onClick={() => { setSelectedArtistId(null); navigate("/shop"); }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" />mostra tutti
          </button>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        {[
          { key: "biglietti", label: "🎫 Concerti" },
          { key: "merch", label: "👕 Merch" },
          { key: "miei", label: "🎟 I miei" },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key as any)}
            className={cn("px-4 py-2 rounded-full text-sm font-medium transition-colors",
              tab === key ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:text-foreground")}>
            {label}
          </button>
        ))}
      </div>

      {/* CONCERTI */}
      {tab === "biglietti" && (
        <div className="space-y-3">
          {displayEvents.length === 0 && (
            <p className="text-center py-8 text-muted-foreground text-sm">Nessun evento disponibile</p>
          )}
          {displayEvents.map((event: any) => (
            <div key={event.id} className="bg-card border border-border rounded-2xl overflow-hidden flex">
              <div className="w-20 h-auto shrink-0">
                <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 p-3 min-w-0 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{event.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="w-3 h-3" />{event.city}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="w-3 h-3" />{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{event.ticketsLeft} rimasti</span>
                    {event.ticketsLeft === 0 && (
                      <span className="text-xs text-destructive font-medium flex items-center gap-0.5"><AlertCircle className="w-3 h-3" />Esauriti</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-sm font-bold text-primary">€{event.price.toFixed(2)}</span>
                  <button
                    onClick={() => handleBuy(event.id, event.title)}
                    disabled={buyingId === event.id || event.ticketsLeft === 0}
                    className="px-3 py-1.5 rounded-full bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
                    {buyingId === event.id ? "..." : event.ticketsLeft === 0 ? "Esaurito" : "Acquista"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MERCH */}
      {tab === "merch" && (
        <div className="grid grid-cols-2 gap-3">
          {displayMerch.length === 0 && (
            <div className="col-span-2 text-center py-12">
              <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm text-muted-foreground">
                {filterArtistId ? "Nessun merch disponibile per questo artista" : "Segui degli artisti per vedere il loro merch qui"}
              </p>
            </div>
          )}
          {displayMerch.map((item: any) => (
            <div key={item.id} className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
              <div className="relative aspect-square overflow-hidden">
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                {item.badge && (
                  <span className="absolute top-2 left-2 text-xs bg-primary text-white px-2 py-0.5 rounded-full font-medium shadow">
                    {item.badge}
                  </span>
                )}
                {item.stock === 0 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">Esaurito</span>
                  </div>
                )}
              </div>
              <div className="p-3 flex flex-col gap-2 flex-1">
                <div>
                  <p className="font-semibold text-sm leading-tight">{item.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.category}</p>
                  <p className="text-xs text-muted-foreground">Stock: {item.stock}</p>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-sm font-bold text-primary">€{item.price.toFixed(2)}</span>
                  <button
                    onClick={() => handleBuyMerch(item)}
                    disabled={buyingMerchId === item.id || item.stock === 0}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                      item.stock === 0
                        ? "bg-secondary text-muted-foreground cursor-not-allowed"
                        : "bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
                    )}>
                    {buyingMerchId === item.id ? "..." : item.stock === 0 ? "Esaurito" : (
                      <><ShoppingCart className="w-3 h-3" />Compra</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* I MIEI BIGLIETTI */}
      {tab === "miei" && (
        <section>
          {ticketsLoading && <div className="space-y-3">{[1,2].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>}
          {!ticketsLoading && (tickets ?? []).length === 0 && (
            <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-2xl">
              <Ticket className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nessun biglietto ancora — acquistane uno!</p>
            </div>
          )}
          <div className="space-y-3">
            {(tickets ?? []).map((ticket: any) => (
              <div key={ticket.id} className="bg-card border border-border rounded-2xl p-4 flex items-start gap-4 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-2xl" />
                <div className="flex-1 pl-2 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate">{ticket.eventTitle}</p>
                    {ticket.status === "gift" && <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full">Regalo</span>}
                    {ticket.forSale && <span className="text-xs bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1"><Tag className="w-2.5 h-2.5" />In vendita</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{ticket.artistName}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="w-3 h-3" />{ticket.city}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="w-3 h-3" />{ticket.date}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-xs font-bold text-primary">
                    {ticket.forSale ? `€${ticket.resalePrice?.toFixed(2)} (rivendita)` : `€${ticket.price.toFixed(2)}`}
                  </span>
                  <div className="flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded-lg">
                    <QrCode className="w-3 h-3" />{ticket.qrCode.slice(0, 12)}
                  </div>
                  {!ticket.forSale ? (
                    <button onClick={() => setResaleTicket(ticket)}
                      className="text-xs px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-colors font-medium">
                      Vendi
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        await fetch(`${BASE_URL}/api/tickets/${ticket.id}/resale/cancel`, { method: "POST" });
                        queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
                      }}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors">
                      Ritira
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {resaleTicket && (
        <ResaleModal ticket={resaleTicket} onClose={() => setResaleTicket(null)}
          onDone={() => queryClient.invalidateQueries({ queryKey: ["/api/tickets"] })} />
      )}
    </div>
  );
}

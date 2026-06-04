import { useState } from "react";
import { Ticket, Calendar, MapPin, QrCode, ShoppingCart } from "lucide-react";
import { useListTickets, usePurchaseTicket, useListEvents } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function TicketsPage() {
  const { data: tickets, isLoading } = useListTickets();
  const { data: events } = useListEvents({});
  const purchaseMutation = usePurchaseTicket();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [buyingId, setBuyingId] = useState<number | null>(null);

  const handleBuy = (eventId: number, eventTitle: string) => {
    setBuyingId(eventId);
    purchaseMutation.mutate(
      { data: { eventId } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
          toast({ title: "Biglietto acquistato!", description: `${eventTitle} — conferma inviata.` });
          setBuyingId(null);
        },
        onError: () => {
          toast({ title: "Errore", description: "Impossibile acquistare il biglietto.", variant: "destructive" });
          setBuyingId(null);
        },
      }
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <h1 className="text-2xl font-bold mb-1">Biglietti</h1>
      <p className="text-sm text-muted-foreground mb-6">I tuoi biglietti e gli eventi disponibili</p>

      {/* My tickets */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
          <Ticket className="w-3.5 h-3.5" />
          I miei biglietti
        </h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
        ) : (tickets ?? []).length === 0 ? (
          <div className="text-center py-10 text-muted-foreground bg-card border border-border rounded-2xl">
            <Ticket className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nessun biglietto ancora</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(tickets ?? []).map((ticket: any) => (
              <div key={ticket.id} className="bg-card border border-primary/20 rounded-2xl p-4 flex items-start gap-4 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-2xl" />
                <div className="flex-1 pl-2 min-w-0">
                  <p className="font-semibold text-sm truncate">{ticket.eventTitle}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{ticket.artistName}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />{ticket.city} – {ticket.venue}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />{ticket.date}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-xs font-bold text-primary">€{ticket.price.toFixed(2)}</span>
                  <div className="flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded-lg">
                    <QrCode className="w-3 h-3" />
                    {ticket.qrCode}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Buy tickets */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
          <ShoppingCart className="w-3.5 h-3.5" />
          Acquista biglietti
        </h2>
        <div className="space-y-3">
          {(events ?? []).map((event: any) => (
            <div key={event.id} className="bg-card border border-border rounded-2xl overflow-hidden flex">
              <div className="w-20 h-20 shrink-0">
                <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 p-3 min-w-0 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{event.title}</p>
                  <p className="text-xs text-muted-foreground">{event.city} · {event.date}</p>
                  <p className="text-xs text-muted-foreground">{event.ticketsLeft} rimasti</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-sm font-bold text-primary">€{event.price.toFixed(2)}</span>
                  <button
                    onClick={() => handleBuy(event.id, event.title)}
                    disabled={buyingId === event.id}
                    className="px-3 py-1.5 rounded-full bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
                  >
                    {buyingId === event.id ? "..." : "Acquista"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

import { useParams, Link } from "wouter";
import { BadgeCheck, ArrowLeft, Users, MapPin, Music, ShoppingBag } from "lucide-react";
import { useGetArtist, useFollowArtist, useListMerch, useListTourStops } from "@workspace/api-client-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function ArtistDetailPage() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0");
  const { data: artist, isLoading } = useGetArtist(id);
  const { data: merch } = useListMerch({ artistId: id });
  const { data: stops } = useListTourStops();
  const [followed, setFollowed] = useState(false);
  const followMutation = useFollowArtist();

  const artistStops = (stops ?? []).filter((s: any) => s.artistId === id);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  if (!artist) return <div className="p-8 text-center text-muted-foreground">Artista non trovato</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6 space-y-6">
      {/* Back */}
      <Link href="/artisti" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Artisti
      </Link>

      {/* Hero */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="h-32 bg-gradient-to-br from-primary/30 via-primary/10 to-transparent" />
        <div className="px-5 pb-5 -mt-10">
          <div className="w-20 h-20 rounded-full ring-4 ring-card overflow-hidden mb-3">
            {artist.avatarUrl ? (
              <img src={artist.avatarUrl} alt={artist.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary">
                {artist.avatarInitials}
              </div>
            )}
          </div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{artist.name}</h1>
                {artist.verified && <BadgeCheck className="w-5 h-5 text-primary" />}
              </div>
              <p className="text-sm text-muted-foreground">{artist.genre} · {artist.city}</p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Users className="w-4 h-4" />
                {((artist.followers ?? 0) / 1000).toFixed(1)}k follower
              </div>
            </div>
            <button
              onClick={() => {
                if (!followed) {
                  setFollowed(true);
                  followMutation.mutate({ id });
                }
              }}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-semibold transition-colors shrink-0",
                followed ? "bg-secondary text-muted-foreground" : "bg-primary text-white hover:bg-primary/90"
              )}
            >
              {followed ? "Seguendo" : "Segui"}
            </button>
          </div>
          {artist.bio && <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{artist.bio}</p>}
        </div>
      </div>

      {/* Tour stops */}
      {artistStops.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" />
            Date tour
          </h2>
          <div className="space-y-2">
            {artistStops.map((stop: any) => (
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
                  {stop.status === "sold_out" ? "Esaurito" : stop.status === "presale" ? "Presale" : "Disponibile"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Merch */}
      {merch && merch.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
            <ShoppingBag className="w-3.5 h-3.5" />
            Merch
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {merch.map((item: any) => (
              <div key={item.id} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="aspect-square overflow-hidden">
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.category}</p>
                  <p className="text-sm font-semibold text-primary mt-1">€{item.price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

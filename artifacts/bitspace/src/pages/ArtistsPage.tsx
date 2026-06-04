import { useState } from "react";
import { Link } from "wouter";
import { Search, BadgeCheck, Users, ChevronDown } from "lucide-react";
import { useListArtists, useListTrendingArtists, useFollowArtist } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const GENRES = ["Tutti", "Electro-pop", "Indie rock", "R&B", "EDM", "Afrobeats", "Pop", "Hip-Hop", "Rock", "Jazz", "Classica"];

function ArtistCard({ artist }: { artist: any }) {
  const [followed, setFollowed] = useState(artist.isFollowed ?? false);
  const [followers, setFollowers] = useState(artist.followers ?? 0);
  const followMutation = useFollowArtist();
  const queryClient = useQueryClient();

  const handleFollow = (e: React.MouseEvent) => {
    e.preventDefault();
    const nowFollowing = !followed;
    setFollowed(nowFollowing);
    setFollowers((f: number) => nowFollowing ? f + 1 : Math.max(0, f - 1));
    followMutation.mutate({ id: artist.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
        queryClient.invalidateQueries({ queryKey: ["/api/artists"] });
      }
    });
  };

  return (
    <Link href={`/artisti/${artist.id}`}>
      <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 hover:border-primary/40 transition-colors cursor-pointer group">
        <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 ring-2 ring-border group-hover:ring-primary/40 transition-all">
          {artist.avatarUrl
            ? <img src={artist.avatarUrl} alt={artist.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-primary/20 flex items-center justify-center font-bold text-primary">{artist.avatarInitials}</div>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold truncate">{artist.name}</span>
            {artist.verified && <BadgeCheck className="w-4 h-4 text-primary shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground">{artist.genre} · {artist.city}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <Users className="w-3 h-3" />{(followers / 1000).toFixed(1)}k follower
          </div>
        </div>
        <button onClick={handleFollow}
          className={cn("px-4 py-1.5 rounded-full text-xs font-semibold transition-colors shrink-0",
            followed ? "bg-secondary text-muted-foreground" : "bg-primary text-white hover:bg-primary/90")}>
          {followed ? "Seguendo" : "Segui"}
        </button>
      </div>
    </Link>
  );
}

export default function ArtistsPage() {
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState("Tutti");
  const { data: all, isLoading } = useListArtists({
    search: search || undefined,
    genre: genreFilter !== "Tutti" ? genreFilter : undefined,
  });
  const { data: trending } = useListTrendingArtists();

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-6 pb-24 md:pb-6">
      <h1 className="text-2xl font-bold mb-1">Artisti</h1>
      <p className="text-sm text-muted-foreground mb-5">Scopri e segui artisti italiani</p>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Cerca artisti, generi..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-card border-border" />
      </div>

      {/* Genre filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
        {GENRES.map((g) => (
          <button key={g} onClick={() => setGenreFilter(g)}
            className={cn("px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0",
              genreFilter === g ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:text-foreground")}>
            {g}
          </button>
        ))}
      </div>

      {/* Trending (only when no filters) */}
      {!search && genreFilter === "Tutti" && trending && trending.length > 0 && (
        <section className="mb-7">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">In tendenza</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {trending.map((artist: any) => (
              <Link key={artist.id} href={`/artisti/${artist.id}`}>
                <div className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group">
                  <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-border group-hover:ring-primary/50 transition-all">
                    {artist.avatarUrl
                      ? <img src={artist.avatarUrl} alt={artist.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-primary/20 flex items-center justify-center font-bold text-primary">{artist.avatarInitials}</div>}
                  </div>
                  <span className="text-xs font-medium text-center truncate max-w-[72px]">{artist.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          {search || genreFilter !== "Tutti" ? `Risultati (${(all ?? []).length})` : "Tutti gli artisti"}
        </h2>
        <div className="space-y-3">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                  <Skeleton className="w-14 h-14 rounded-full" />
                  <div className="flex-1 space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div>
                </div>
              ))
            : (all ?? []).map((artist: any) => <ArtistCard key={artist.id} artist={artist} />)}
          {!isLoading && (all ?? []).length === 0 && (
            <p className="text-center py-8 text-muted-foreground text-sm">Nessun artista trovato</p>
          )}
        </div>
      </section>
    </div>
  );
}

import { useState } from "react";
import { Heart, Repeat2, MessageCircle, Zap, Radio, Music, MapPin } from "lucide-react";
import { useGetFeed, useLikePost, useGetFeedSummary } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const typeLabel: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  release: { label: "Nuovo singolo", icon: Music, color: "text-primary" },
  tour: { label: "Tour / Date", icon: MapPin, color: "text-emerald-400" },
  story: { label: "Story", icon: Radio, color: "text-amber-400" },
};

function PostCard({ post }: { post: any }) {
  const [liked, setLiked] = useState(post.liked ?? false);
  const [likes, setLikes] = useState(post.likes ?? 0);
  const likeMutation = useLikePost();

  const info = typeLabel[post.type] ?? typeLabel["story"];
  const Icon = info.icon;

  const handleLike = () => {
    if (!liked) {
      setLiked(true);
      setLikes((l: number) => l + 1);
      likeMutation.mutate({ id: post.id });
    }
  };

  return (
    <article className="bg-card border border-border rounded-2xl p-4 space-y-3 hover:border-primary/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 ring-2 ring-border">
          {post.artistAvatarUrl ? (
            <img src={post.artistAvatarUrl} alt={post.artistName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {post.artistAvatarInitials}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{post.artistName}</span>
            <span className="text-xs text-muted-foreground">{post.artistGenre}</span>
            <span className="ml-auto text-xs text-muted-foreground">{post.timeAgo}</span>
          </div>
          <div className={cn("flex items-center gap-1.5 text-xs mt-0.5", info.color)}>
            <Icon className="w-3 h-3" />
            <span>{info.label}</span>
          </div>
        </div>
      </div>

      <p className="text-sm text-foreground/90 leading-relaxed">{post.content}</p>

      <div className="flex items-center gap-5 pt-1">
        <button
          onClick={handleLike}
          className={cn(
            "flex items-center gap-1.5 text-xs transition-colors",
            liked ? "text-rose-400" : "text-muted-foreground hover:text-rose-400"
          )}
        >
          <Heart className={cn("w-4 h-4", liked && "fill-rose-400")} />
          {likes}
        </button>
        <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
          <Repeat2 className="w-4 h-4" />
          {post.reposts}
        </button>
        <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
          <MessageCircle className="w-4 h-4" />
          {post.comments}
        </button>
      </div>
    </article>
  );
}

export default function FeedPage() {
  const [filter, setFilter] = useState("all");
  const { data: posts, isLoading } = useGetFeed({ type: filter !== "all" ? (filter as any) : undefined });
  const { data: summary } = useGetFeedSummary();

  const tabs = [
    { value: "all", label: "Tutto" },
    { value: "release", label: "Uscite" },
    { value: "tour", label: "Tour" },
    { value: "story", label: "Story" },
  ];

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Il tuo feed</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Aggiornamenti dagli artisti che segui</p>
        </div>
        {summary && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-medium">
              <Zap className="w-3 h-3" />
              {summary.newAnnouncements} novità
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setFilter(t.value)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors shrink-0",
              filter === t.value
                ? "bg-primary text-white"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-16 w-full" />
              </div>
            ))
          : (posts ?? []).map((post: any) => <PostCard key={post.id} post={post} />)}

        {!isLoading && (posts ?? []).length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Radio className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p>Nessun aggiornamento per questo filtro</p>
          </div>
        )}
      </div>
    </div>
  );
}

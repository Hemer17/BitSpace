import { useState } from "react";
import { Heart, MessageCircle, Repeat2, Send, Plus, X, Radio } from "lucide-react";
import { useGetFeed, useLikePost, useGetFeedSummary } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

const typeLabel: Record<string, string> = {
  story: "Racconto", release: "Uscita", tour: "Tour", announcement: "Annuncio",
};
const typeColor: Record<string, string> = {
  story: "bg-blue-500/15 text-blue-400", release: "bg-green-500/15 text-green-400",
  tour: "bg-orange-500/15 text-orange-400", announcement: "bg-violet-500/15 text-violet-400",
};

function PostCard({ post, onRefresh }: { post: any; onRefresh: () => void }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [localComments, setLocalComments] = useState<{ author: string; content: string }[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const likeMutation = useLikePost();
  const { toast } = useToast();

  const handleLike = () => {
    if (liked) return;
    setLiked(true);
    setLikes((n: number) => n + 1);
    likeMutation.mutate({ id: post.id });
  };

  const handleToggleComments = async () => {
    const next = !showComments;
    setShowComments(next);
    if (next && !commentsLoaded) {
      setCommentsLoaded(true);
      try {
        const r = await fetch(`${BASE_URL}/api/posts/${post.id}/comments`);
        if (r.ok) setLocalComments(await r.json());
      } catch { /* noop */ }
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    const text = commentText;
    setCommentText("");
    setLocalComments((c) => [...c, { author: "Tu", content: text }]);
    await fetch(`${BASE_URL}/api/posts/${post.id}/comments`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: text }),
    });
  };

  const handleShare = async () => {
    const r = await fetch(`${BASE_URL}/api/posts/${post.id}/share`, { method: "POST" });
    if (r.ok) { toast({ title: "Post condiviso!" }); onRefresh(); }
    else toast({ title: "Errore nella condivisione", variant: "destructive" });
  };

  return (
    <article className={cn("bg-card border border-border rounded-2xl p-4", post.isShared && "border-l-4 border-l-primary/60")}>
      {post.isShared && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
          <Repeat2 className="w-3 h-3" />
          Condiviso da <span className="text-foreground font-medium">{post.username ?? post.artistName}</span>
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 ring-2 ring-border">
          {post.artistAvatarUrl
            ? <img src={post.artistAvatarUrl} alt={post.artistName} className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                {post.artistAvatarInitials || (post.username ?? "??").slice(0, 2).toUpperCase()}
              </div>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold">{post.artistName ?? post.username}</span>
            <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", typeColor[post.type] ?? "bg-muted text-muted-foreground")}>
              {typeLabel[post.type] ?? post.type}
            </span>
            <span className="text-xs text-muted-foreground ml-auto">{post.timeAgo}</span>
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed">{post.content}</p>
          <div className="flex items-center gap-5 mt-3">
            <button onClick={handleLike}
              className={cn("flex items-center gap-1.5 text-xs transition-colors", liked ? "text-rose-500" : "text-muted-foreground hover:text-rose-400")}>
              <Heart className={cn("w-3.5 h-3.5", liked && "fill-current")} />{likes}
            </button>
            <button onClick={handleToggleComments}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
              <MessageCircle className="w-3.5 h-3.5" />{post.comments ?? 0}
            </button>
            <button onClick={handleShare}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-emerald-400 transition-colors">
              <Repeat2 className="w-3.5 h-3.5" />{post.reposts ?? 0}
            </button>
          </div>
        </div>
      </div>
      {showComments && (
        <div className="mt-3 border-t border-border pt-3 space-y-2">
          {localComments.map((c, i) => (
            <div key={i} className="flex gap-2 text-xs">
              <span className="font-semibold text-primary shrink-0">{c.author}</span>
              <span className="text-muted-foreground">{c.content}</span>
            </div>
          ))}
          {localComments.length === 0 && <p className="text-xs text-muted-foreground">Nessun commento ancora</p>}
          <div className="flex gap-2 pt-1">
            <input value={commentText} onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleComment()}
              placeholder="Scrivi un commento..."
              className="flex-1 bg-secondary border border-border rounded-xl px-3 py-1.5 text-xs outline-none focus:border-primary" />
            <button onClick={handleComment} className="p-1.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors">
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function CreatePostModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { user } = useAuth();
  const isArtist = user?.role === "artist";
  const [content, setContent] = useState("");
  const [type, setType] = useState("story");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const r = await fetch(`${BASE_URL}/api/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, type: isArtist ? type : "story" }),
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error ?? "Errore");
      }
      toast({ title: "Post pubblicato!" });
      onCreated();
      onClose();
    } catch (e: any) {
      toast({ title: "Errore", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const artistTypes = [
    { key: "story", label: "Racconto" }, { key: "release", label: "Uscita" },
    { key: "tour", label: "Tour" }, { key: "announcement", label: "Annuncio" },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-5 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Nuovo post</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        {isArtist ? (
          <div className="flex gap-2 mb-3 flex-wrap">
            {artistTypes.map(({ key, label }) => (
              <button key={key} onClick={() => setType(key)}
                className={cn("px-3 py-1 rounded-full text-xs font-medium transition-colors",
                  type === key ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:text-foreground")}>
                {label}
              </button>
            ))}
          </div>
        ) : (
          <div className="mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/15 text-blue-400 rounded-full text-xs font-medium">
              Racconto
            </span>
            <p className="text-xs text-muted-foreground mt-2">I fan possono pubblicare solo racconti.</p>
          </div>
        )}

        <textarea value={content} onChange={(e) => setContent(e.target.value)}
          placeholder={isArtist ? "Cosa vuoi condividere?" : "Scrivi il tuo racconto..."}
          rows={4}
          className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary resize-none" />
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors">Annulla</button>
          <button onClick={handleSubmit} disabled={loading || !content.trim()}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {loading ? "Pubblicazione..." : "Pubblica"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FeedPage() {
  const [filter, setFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const { data: posts, isLoading, refetch } = useGetFeed({ type: filter !== "all" ? filter : undefined });
  const { data: summary } = useGetFeedSummary();
  const queryClient = useQueryClient();

  const tabs = [
    { value: "all", label: "Tutto" }, { value: "story", label: "Storie" },
    { value: "release", label: "Uscite" }, { value: "tour", label: "Tour" }, { value: "announcement", label: "Annunci" },
  ];

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold">Il tuo feed</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Aggiornamenti dagli artisti che segui</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />Post
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Annunci", value: summary.newAnnouncements },
            { label: "Uscite", value: summary.newReleases },
            { label: "Tour", value: summary.newTourDates },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-primary">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map(({ value, label }) => (
          <button key={value} onClick={() => setFilter(value)}
            className={cn("px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors shrink-0",
              filter === value ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:text-foreground")}>
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {isLoading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-4 h-28 animate-pulse" />
        ))}
        {!isLoading && (posts ?? []).length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Radio className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p>Nessun post — segui qualche artista!</p>
          </div>
        )}
        {(posts ?? []).map((post: any) => (
          <PostCard key={post.id} post={post} onRefresh={() => queryClient.invalidateQueries({ queryKey: ["/api/feed"] })} />
        ))}
      </div>

      {showCreate && <CreatePostModal onClose={() => setShowCreate(false)} onCreated={() => { queryClient.invalidateQueries({ queryKey: ["/api/feed"] }); }} />}
    </div>
  );
}

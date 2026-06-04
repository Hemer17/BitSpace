import { Link, useLocation } from "wouter";
import { Home, Map, Users, ShoppingBag, BarChart2, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { href: "/feed", label: "Feed", icon: Home },
    { href: "/mappa", label: "Mappa", icon: Map },
    { href: "/artisti", label: "Artisti", icon: Users },
    { href: "/shop", label: "Shop", icon: ShoppingBag },
    ...(user?.role === "artist" ? [{ href: "/dashboard", label: "Dashboard", icon: BarChart2 }] : []),
  ];

  const handleLogout = async () => { await logout(); setLocation("/"); };

  const isActive = (href: string) =>
    href === "/feed" ? location === "/" || location === "/feed" : location.startsWith(href);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-border bg-card sticky top-0 h-screen overflow-y-auto">
        <div className="flex items-center px-4 py-4 border-b border-border">
          <img src={`${BASE}/bitspacescritta.png`} alt="BitSpace" className="h-8 w-auto" />
        </div>
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isActive(href) ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}>
              <Icon className="w-4 h-4 shrink-0" />{label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-border space-y-2">
          <Link href="/profilo"
            className={cn(
              "flex items-center gap-3 w-full rounded-xl p-2 transition-colors group cursor-pointer",
              location === "/profilo" ? "bg-primary/10" : "hover:bg-secondary"
            )}>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
              {user?.username?.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{user?.username}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role === "artist" ? "Artista" : "Fan"}</p>
            </div>
            <Settings className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </Link>
          <button onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
            <LogOut className="w-4 h-4" />Esci
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">{children}</main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex z-50">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className={cn("flex-1 flex flex-col items-center py-3 gap-1 text-[10px] font-medium transition-colors",
              isActive(href) ? "text-primary" : "text-muted-foreground")}>
            <Icon className="w-5 h-5" />{label}
          </Link>
        ))}
        <Link href="/profilo"
          className={cn("flex-1 flex flex-col items-center py-3 gap-1 text-[10px] font-medium transition-colors",
            location === "/profilo" ? "text-primary" : "text-muted-foreground")}>
          <Settings className="w-5 h-5" />Profilo
        </Link>
      </nav>
    </div>
  );
}

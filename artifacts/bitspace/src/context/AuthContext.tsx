import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export type SessionUser = {
  id: number;
  username: string;
  email: string;
  role: "fan" | "artist";
};

type AuthContextType = {
  user: SessionUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    username: string;
    email: string;
    password: string;
    role: string;
    genres: string[];
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (u: SessionUser) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/auth/me`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const r = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const text = await r.text();

    console.log("status:", r.status);
    console.log("body:", text);

    const clone = r.clone();

    console.log("status:", r.status);
    console.log("body:", await clone.text());

    const data = await r.json();

    if (!r.ok) {
      throw new Error(text || "Login failed");
    }

    const u = JSON.parse(text);
    setUser(u);
  };

  const register = async (data: {
    username: string;
    email: string;
    password: string;
    role: string;
    genres: string[];
  }) => {
    const r = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!r.ok) {
      const e = await r.json();
      throw new Error(e.error ?? "Registrazione fallita");
    }
    const u = await r.json();
    setUser(u);
  };

  const logout = async () => {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  };

  const updateUser = (u: SessionUser) => setUser(u);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

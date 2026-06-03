import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      setLocation("/feed");
    } catch (err: any) {
      setError(err.message ?? "Login fallito");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#0b0f1a] text-white p-5"
      style={{ fontFamily: "'Poppins', sans-serif", cursor: "pointer" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setLocation("/");
      }}
    >
      <div
        className="w-full max-w-[400px] bg-[#151b2d] p-10 rounded-3xl shadow-2xl"
        style={{ cursor: "default" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h1 className="text-center text-3xl font-bold text-[#6d5dfc] mb-8">Login</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-2 font-medium text-sm">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Inserisci la tua email"
              required
              className="w-full px-4 py-3.5 rounded-xl bg-[#0b0f1a] text-white outline-none border border-transparent focus:border-[#6d5dfc] transition-colors"
            />
          </div>
          <div>
            <label className="block mb-2 font-medium text-sm">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Inserisci la password"
              required
              className="w-full px-4 py-3.5 rounded-xl bg-[#0b0f1a] text-white outline-none border border-transparent focus:border-[#6d5dfc] transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 px-4 py-2 rounded-xl">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#6d5dfc] text-white font-semibold text-base hover:bg-[#5847ff] transition-colors disabled:opacity-60 mt-2"
          >
            {loading ? "Accesso in corso..." : "Accedi"}
          </button>
        </form>

        <div className="flex items-center gap-4 my-6 text-[#9ea7c2] text-sm">
          <div className="flex-1 h-px bg-white/10" />
          oppure continua con
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <div className="space-y-3">
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-[#0f1424] text-white font-medium text-sm hover:-translate-y-0.5 hover:border-[#6d5dfc]/50 transition-all"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
              <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.24 1.26-.96 2.32-2.04 3.03l3.3 2.56c1.92-1.77 3.03-4.38 3.03-7.48 0-.71-.06-1.39-.18-2.04H12z"/>
              <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.63-2.44l-3.3-2.56c-.92.62-2.1.99-3.33.99-2.56 0-4.73-1.73-5.5-4.05H3.08v2.64A9.997 9.997 0 0 0 12 22z"/>
              <path fill="#4A90E2" d="M6.5 13.94A5.99 5.99 0 0 1 6.19 12c0-.67.12-1.31.31-1.94V7.42H3.08A10 10 0 0 0 2 12c0 1.61.39 3.14 1.08 4.58l3.42-2.64z"/>
              <path fill="#FBBC05" d="M12 5.98c1.47 0 2.8.51 3.84 1.51l2.88-2.88C16.96 2.98 14.7 2 12 2A9.997 9.997 0 0 0 3.08 7.42L6.5 10.06c.77-2.32 2.94-4.08 5.5-4.08z"/>
            </svg>
            Accedi con Google
          </button>
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-white/40 bg-white text-black font-medium text-sm hover:-translate-y-0.5 hover:bg-gray-100 transition-all"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="currentColor">
              <path d="M16.37 12.27c.03 3.05 2.68 4.06 2.71 4.07-.02.07-.42 1.44-1.38 2.84-.83 1.2-1.69 2.4-3.05 2.42-1.34.03-1.77-.8-3.3-.8-1.54 0-2.01.78-3.28.83-1.31.05-2.31-1.31-3.15-2.5-1.71-2.48-3.01-7.01-1.26-10.05.87-1.51 2.43-2.47 4.12-2.49 1.29-.02 2.51.87 3.3.87.79 0 2.28-1.07 3.84-.91.65.03 2.48.26 3.65 1.97-.09.06-2.18 1.27-2.2 3.75zM14.96 4.93c.7-.85 1.18-2.03 1.05-3.21-1.01.04-2.23.67-2.96 1.52-.65.75-1.22 1.95-1.07 3.1 1.12.09 2.28-.57 2.98-1.41z"/>
            </svg>
            Accedi con Apple
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-[#9ea7c2]">
          Non hai un account?{" "}
          <Link href="/register" className="text-[#6d5dfc] hover:underline font-medium">
            Registrati
          </Link>
        </p>
      </div>
    </div>
  );
}

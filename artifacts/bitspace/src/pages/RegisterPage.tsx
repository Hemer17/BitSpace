import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";

const GENRES = [
  "Pop", "Hip-Hop / Rap", "Rock", "EDM", "Latin", "Country",
  "K-Pop", "R&B / Soul", "Jazz", "Classica", "Afrobeats",
  "Indie / Alternative", "Reggaeton", "Trap", "Phonk",
];

export default function RegisterPage() {
  const { register } = useAuth();
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "fan" as "fan" | "artist",
  });
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleGenre = (g: string) => {
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Le password non coincidono");
      return;
    }
    setLoading(true);
    try {
      await register({
        username: form.username,
        email: form.email,
        password: form.password,
        role: form.role,
        genres: selectedGenres,
      });
      setLocation("/feed");
    } catch (err: any) {
      setError(err.message ?? "Registrazione fallita");
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
        className="w-full max-w-[560px] bg-[#151b2d] p-10 rounded-3xl shadow-2xl my-6"
        style={{ cursor: "default" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h1 className="text-center text-3xl font-bold text-[#6d5dfc] mb-8">Registrati</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {[
            { label: "Nome Utente", key: "username", type: "text", placeholder: "Scegli un username" },
            { label: "Email", key: "email", type: "email", placeholder: "Inserisci la tua email" },
            { label: "Password", key: "password", type: "password", placeholder: "Crea una password" },
            { label: "Conferma Password", key: "confirmPassword", type: "password", placeholder: "Conferma la password" },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block mb-2 font-medium text-sm">{label}</label>
              <input
                type={type}
                value={(form as any)[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                required
                className="w-full px-4 py-3.5 rounded-xl bg-[#0b0f1a] text-white outline-none border border-transparent focus:border-[#6d5dfc] transition-colors"
              />
            </div>
          ))}

          {/* Account type */}
          <div>
            <label className="block mb-2 font-medium text-sm">Tipo di account</label>
            <div className="flex gap-3">
              {(["fan", "artist"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, role: r }))}
                  className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all ${
                    form.role === r
                      ? "bg-[rgba(109,93,252,0.18)] border-[#6d5dfc] text-white"
                      : "bg-[#0f1424] border-white/8 text-[#dce1f3] hover:border-[#6d5dfc]/40"
                  }`}
                >
                  {r === "fan" ? "🎧 Fan" : "🎤 Artista"}
                </button>
              ))}
            </div>
            {form.role === "artist" && (
              <p className="text-xs text-[#9ea7c2] mt-2">Come artista avrai accesso alla dashboard per gestire tour, merch e statistiche.</p>
            )}
          </div>

          {/* Genres */}
          <div>
            <label className="block mb-1 font-medium text-sm">Generi musicali preferiti</label>
            <p className="text-[#9ea7c2] text-xs mb-3 leading-relaxed">
              Puoi selezionare uno o più generi tra i 15 più diffusi a livello globale.
            </p>
            <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-2">
              {GENRES.map((g) => {
                const selected = selectedGenres.includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGenre(g)}
                    className={`flex items-center justify-center min-h-[48px] px-3 py-3 rounded-xl border text-sm text-center transition-all ${
                      selected
                        ? "bg-[rgba(109,93,252,0.18)] border-[#6d5dfc] text-white shadow-[0_0_0_1px_rgba(109,93,252,0.25)]"
                        : "bg-[#0f1424] border-white/8 text-[#dce1f3] hover:border-[#6d5dfc]/40 hover:-translate-y-0.5"
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 px-4 py-2 rounded-xl">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#6d5dfc] text-white font-semibold text-base hover:bg-[#5847ff] transition-colors disabled:opacity-60 mt-2"
          >
            {loading ? "Creazione account..." : "Crea Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#9ea7c2]">
          Hai già un account?{" "}
          <Link href="/login" className="text-[#6d5dfc] hover:underline font-medium">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

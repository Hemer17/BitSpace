import { useState } from "react";
import { Link } from "wouter";
import { X, Music2 } from "lucide-react";

function Modal({ id, open, onClose, children }: { id: string; open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/65 flex items-center justify-center z-50 p-5"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-xl bg-[#151b2d] rounded-3xl p-8 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white text-3xl leading-none">
          <X className="w-6 h-6" />
        </button>
        {children}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-white overflow-x-hidden" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Header */}
      <header className="w-full px-[8%] py-5 flex justify-between items-center fixed top-0 z-40 bg-[rgba(11,15,26,0.8)] backdrop-blur-[10px]">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#6d5dfc] flex items-center justify-center">
            <Music2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">BitSpace</span>
        </div>
        <nav className="flex gap-4">
          <Link href="/login" className="px-[18px] py-[10px] rounded-xl border border-[#6d5dfc] font-medium hover:bg-[#6d5dfc] transition-colors text-sm">
            Login
          </Link>
          <Link href="/register" className="px-[18px] py-[10px] rounded-xl bg-[#6d5dfc] font-medium hover:bg-[#5847ff] transition-colors text-sm">
            Registrati
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section
        className="min-h-screen flex items-center justify-center text-center px-[8%] pt-[120px] pb-16"
        style={{
          background: "linear-gradient(rgba(11,15,26,0.7), rgba(11,15,26,0.9)), url('https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1600&auto=format&fit=crop')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div>
          <h1 className="text-[64px] font-bold mb-5 leading-tight max-md:text-[42px]">
            Scopri i migliori <span className="text-[#6d5dfc]">concerti</span> vicino a te
          </h1>
          <p className="max-w-[700px] mx-auto text-lg mb-9 text-white/90">
            Prenota eventi live, scopri artisti in tendenza e vivi la musica insieme alla community di BitSpace.
          </p>
          <div className="flex justify-center gap-5 flex-wrap">
            <a
              href="#concerti"
              className="px-7 py-3.5 rounded-2xl font-semibold bg-[#6d5dfc] hover:bg-[#5847ff] transition-colors"
            >
              Esplora Concerti
            </a>
            <button
              onClick={() => setDiscoverOpen(true)}
              className="px-7 py-3.5 rounded-2xl font-semibold border border-white hover:bg-white hover:text-[#0b0f1a] transition-colors"
            >
              Scopri di più
            </button>
          </div>
        </div>
      </section>

      {/* Trending concerts */}
      <section className="px-[8%] py-20" id="concerti">
        <h2 className="text-[40px] font-bold mb-10">Concerti in Tendenza in Italia</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-8">
          {[
            {
              img: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=1200&auto=format&fit=crop",
              title: "Neon Dreams Festival",
              city: "Milano",
              date: "12 Agosto 2026",
            },
            {
              img: "https://images.unsplash.com/photo-1503095396549-807759245b35?q=80&w=1200&auto=format&fit=crop",
              title: "Vibes Under Stars",
              city: "Napoli",
              date: "25 Luglio 2026",
            },
            {
              img: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=1200&auto=format&fit=crop",
              title: "Electro Pulse Night",
              city: "Roma",
              date: "7 Settembre 2026",
            },
          ].map((c) => (
            <div
              key={c.title}
              className="bg-[#151b2d] rounded-[22px] overflow-hidden hover:-translate-y-2 transition-transform"
            >
              <img src={c.img} alt={c.title} className="w-full h-[220px] object-cover" />
              <div className="p-5">
                <h3 className="font-bold text-lg mb-2">{c.title}</h3>
                <p className="text-white/80 mb-2">📍 {c.city}</p>
                <p className="text-[#6d5dfc] font-semibold mb-5">{c.date}</p>
                <Link
                  href="/login"
                  className="inline-block bg-[#6d5dfc] px-[18px] py-2.5 rounded-xl text-sm font-semibold hover:bg-[#5847ff] transition-colors"
                >
                  Prenota Ora
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center px-8 py-8 text-[#9ea7c2] border-t border-white/[0.08] mt-12">
        <p className="mb-2">© 2026 BitSpace - Connetti. Ascolta, vivi la musica.</p>
        <div className="flex justify-center gap-3 flex-wrap text-sm">
          <button onClick={() => setAboutOpen(true)} className="hover:text-white transition-colors">About us</button>
          <span>•</span>
          <button onClick={() => setLegalOpen(true)} className="hover:text-white transition-colors">Informazioni legali</button>
          <span>•</span>
          <button onClick={() => setPrivacyOpen(true)} className="hover:text-white transition-colors">Privacy Policy</button>
        </div>
      </footer>

      {/* Modals */}
      <Modal open={discoverOpen} onClose={() => setDiscoverOpen(false)} id="discover">
        <h2 className="text-3xl font-bold mb-3">Novità su BitSpace</h2>
        <p className="text-[#d7dcf0] leading-relaxed mb-5">
          Scopri in anteprima alcuni dei nuovi artisti che stanno arrivando su BitSpace e i concerti più attesi.
        </p>
        <div className="mb-4">
          <h3 className="text-[#6d5dfc] font-semibold mb-2">Nuovi artisti</h3>
          <ul className="list-disc pl-5 text-[#eef1ff] space-y-1">
            <li>Aura Nova — elettronica e visual live</li>
            <li>Velvet Echo — indie pop emergente</li>
            <li>Neon Pulse — techno e club culture</li>
          </ul>
        </div>
        <div className="mb-5">
          <h3 className="text-[#6d5dfc] font-semibold mb-2">Concerti in arrivo</h3>
          <ul className="list-disc pl-5 text-[#eef1ff] space-y-1">
            <li>Sunset Waves Live — Napoli, Casa della Musica</li>
            <li>Midnight Frequencies — Milano, Fabrique</li>
            <li>Urban Sound Experience — Roma, Teatro Marcello</li>
          </ul>
        </div>
        <p className="font-medium mb-4 text-white/90">
          Unisciti subito alla community per seguire gli artisti e prenotare i tuoi eventi preferiti.
        </p>
        <Link
          href="/register"
          onClick={() => setDiscoverOpen(false)}
          className="inline-block bg-[#6d5dfc] text-white px-[18px] py-3 rounded-xl font-semibold hover:bg-[#5847ff] transition-colors"
        >
          Unisciti ora
        </Link>
      </Modal>

      <Modal open={aboutOpen} onClose={() => setAboutOpen(false)} id="about">
        <h2 className="text-3xl font-bold mb-4">About BitSpace</h2>
        <div className="text-[#d7dcf0] leading-relaxed space-y-3">
          <p>BitSpace è un social network dedicato alla musica che connette artisti emergenti e già affermati con la propria fanbase in modo diretto, semplice e coinvolgente.</p>
          <p>Gli artisti possono pubblicare aggiornamenti, nuovi singoli, tour e concerti, creando uno spazio sempre aggiornato per restare vicini ai propri fan.</p>
          <p>Gli utenti possono seguire i propri artisti preferiti, interagire con i contenuti, acquistare biglietti e merchandising, e scoprire nuovi talenti nella propria città tramite una mappa interattiva.</p>
          <p>Il nostro obiettivo è rendere la scoperta musicale più vicina, sociale e dinamica, trasformando ogni artista in una community viva.</p>
        </div>
      </Modal>

      <Modal open={legalOpen} onClose={() => setLegalOpen(false)} id="legal">
        <h2 className="text-3xl font-bold mb-4">Informazioni legali</h2>
        <div className="text-[#d7dcf0] leading-relaxed space-y-3">
          <p>BitSpace è una piattaforma digitale pensata per la promozione musicale e l'interazione tra artisti, fan e organizzatori di eventi.</p>
          <p>I contenuti pubblicati dagli artisti restano di loro proprietà, mentre BitSpace si riserva il diritto di moderare contenuti che violano le regole della community.</p>
          <p>L'acquisto di biglietti e merchandising può avvenire tramite partner terzi o canali ufficiali indicati sulla piattaforma, secondo disponibilità e condizioni del venditore.</p>
          <p>BitSpace non garantisce la disponibilità continua di tutti i servizi e può aggiornare funzionalità, contenuti e condizioni d'uso in qualsiasi momento.</p>
        </div>
      </Modal>

      <Modal open={privacyOpen} onClose={() => setPrivacyOpen(false)} id="privacy">
        <h2 className="text-3xl font-bold mb-4">Privacy Policy</h2>
        <div className="text-[#d7dcf0] leading-relaxed space-y-3">
          <p>BitSpace raccoglie solo i dati necessari per offrire il servizio, come nome, email, preferenze musicali e interazioni con artisti e contenuti.</p>
          <p>I dati personali non vengono venduti a terze parti e sono trattati in conformità con il Regolamento Europeo sulla Protezione dei Dati (GDPR).</p>
          <p>Gli utenti possono richiedere la cancellazione o la portabilità dei propri dati in qualsiasi momento contattando il nostro team.</p>
          <p>Per qualsiasi richiesta relativa alla privacy, scrivici all'indirizzo privacy@bitspace.it</p>
        </div>
      </Modal>
    </div>
  );
}

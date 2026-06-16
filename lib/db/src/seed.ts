import bcrypt from "bcryptjs";
import { db, pool } from "./index.js";
import * as schema from "./schema/index.js";

const {
  usersTable, artistsTable, songsTable, postsTable,
  tourStopsTable, eventsTable, merchTable, followsTable,
} = schema;

const HASH = await bcrypt.hash("password123", 10);

console.log("🌱 Seeding database...\n");

// ─── 1. ARTIST USERS ────────────────────────────────────────────────────────

const artistUsers = await db.insert(usersTable).values([
  { username: "aurora_nova",    email: "aurora@bitspace.it",   passwordHash: HASH, role: "artist", genres: ["Electronic", "Pop"] },
  { username: "velvet_echo",    email: "velvet@bitspace.it",   passwordHash: HASH, role: "artist", genres: ["Indie", "Alternative"] },
  { username: "neon_pulse",     email: "neon@bitspace.it",     passwordHash: HASH, role: "artist", genres: ["Techno", "EDM"] },
  { username: "luna_mare",      email: "luna@bitspace.it",     passwordHash: HASH, role: "artist", genres: ["Pop", "Soul"] },
]).returning();

console.log(`✅ ${artistUsers.length} artist users created`);

// ─── 2. ARTIST PROFILES ──────────────────────────────────────────────────────

const artistProfiles = await db.insert(artistsTable).values([
  {
    name: "Aurora Nova", genre: "Electronic / Pop", city: "Milano",
    followers: 12400, verified: true, avatarInitials: "AN",
    avatarUrl: "https://images.unsplash.com/photo-1516575334481-f85287c2c82d?w=200&h=200&fit=crop&q=80",
    bio: "Produttrice elettronica milanese. Faccio musica che ti fa ballare e pensare allo stesso tempo.",
    userId: artistUsers[0].id, plays: 340000,
  },
  {
    name: "Velvet Echo", genre: "Indie / Alternative", city: "Roma",
    followers: 7800, verified: true, avatarInitials: "VE",
    avatarUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop&q=80",
    bio: "Chitarra e voce dal cuore di Roma. Racconti di vita urbana e notti insonni.",
    userId: artistUsers[1].id, plays: 195000,
  },
  {
    name: "Neon Pulse", genre: "Techno / EDM", city: "Torino",
    followers: 23100, verified: true, avatarInitials: "NP",
    avatarUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=200&h=200&fit=crop&q=80",
    bio: "DJ e producer torinese. Resident al Fabrique di Milano. La notte è il mio studio.",
    userId: artistUsers[2].id, plays: 890000,
  },
  {
    name: "Luna Mare", genre: "Pop / Soul", city: "Napoli",
    followers: 5600, verified: false, avatarInitials: "LM",
    avatarUrl: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=200&h=200&fit=crop&q=80",
    bio: "Voce del Golfo. Canzoni d'amore, di mare e di Napoli eterna.",
    userId: artistUsers[3].id, plays: 87000,
  },
]).returning();

console.log(`✅ ${artistProfiles.length} artist profiles created`);

// ─── 3. FAN USERS ────────────────────────────────────────────────────────────

const fanUsers = await db.insert(usersTable).values([
  { username: "marco_fan",   email: "marco@test.it",   passwordHash: HASH, role: "fan", genres: ["Electronic", "Techno"] },
  { username: "giulia_music", email: "giulia@test.it",  passwordHash: HASH, role: "fan", genres: ["Indie", "Pop"] },
  { username: "luca_beats",  email: "luca@test.it",    passwordHash: HASH, role: "fan", genres: ["EDM", "Soul"] },
]).returning();

console.log(`✅ ${fanUsers.length} fan users created`);

// ─── 4. SONGS ────────────────────────────────────────────────────────────────

const songs = await db.insert(songsTable).values([
  // Aurora Nova
  { artistId: artistProfiles[0].id, title: "Notte Digitale", duration: "3:42", genre: "Electronic", externalUrl: "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT" },
  { artistId: artistProfiles[0].id, title: "Pixel Dreams", duration: "4:10", genre: "Pop Electronic", externalUrl: "https://soundcloud.com" },
  { artistId: artistProfiles[0].id, title: "Frequenza 88", duration: "5:03", genre: "Electronic" },
  // Velvet Echo
  { artistId: artistProfiles[1].id, title: "Strade di Notte", duration: "3:58", genre: "Indie", externalUrl: "https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUIOKE" },
  { artistId: artistProfiles[1].id, title: "Cemento e Cielo", duration: "4:22", genre: "Alternative" },
  { artistId: artistProfiles[1].id, title: "Ultimo Treno", duration: "3:15", genre: "Indie Pop" },
  // Neon Pulse
  { artistId: artistProfiles[2].id, title: "404 Bpm", duration: "6:44", genre: "Techno", externalUrl: "https://soundcloud.com" },
  { artistId: artistProfiles[2].id, title: "Dark Room Ritual", duration: "7:11", genre: "Techno" },
  { artistId: artistProfiles[2].id, title: "Synthetic Love", duration: "5:50", genre: "EDM", externalUrl: "https://open.spotify.com/track/2takcwOaAZWiXM31q4a4z1" },
  // Luna Mare
  { artistId: artistProfiles[3].id, title: "Vesuvio Blues", duration: "4:05", genre: "Soul", externalUrl: "https://soundcloud.com" },
  { artistId: artistProfiles[3].id, title: "Sirene di Napoli", duration: "3:30", genre: "Pop" },
]).returning();

console.log(`✅ ${songs.length} songs created`);

// ─── 5. POSTS ────────────────────────────────────────────────────────────────

await db.insert(postsTable).values([
  // Aurora Nova posts
  {
    artistId: artistProfiles[0].id, artistName: "Aurora Nova", artistGenre: "Electronic / Pop",
    artistAvatarUrl: artistProfiles[0].avatarUrl, artistAvatarInitials: "AN",
    type: "release", content: "Finalmente live! 'Notte Digitale' è ora disponibile su tutti i canali 🎶 Questo brano racconta di quando la città dorme e la musica parla.",
    likes: 342, reposts: 67, comments: 24, timeAgo: "2 ore fa",
    userId: artistUsers[0].id, username: "aurora_nova",
    songUrl: songs[0].externalUrl, songTitle: songs[0].title, songId: songs[0].id,
  },
  {
    artistId: artistProfiles[0].id, artistName: "Aurora Nova", artistGenre: "Electronic / Pop",
    artistAvatarUrl: artistProfiles[0].avatarUrl, artistAvatarInitials: "AN",
    type: "announcement", content: "Stiamo lavorando all'album di debutto 🔥 Dieci tracce. Tre anni di lavoro. Vi farò sentire qualcosa presto... state pronti.",
    likes: 891, reposts: 145, comments: 88, timeAgo: "3 giorni fa",
    userId: artistUsers[0].id, username: "aurora_nova",
  },
  {
    artistId: artistProfiles[0].id, artistName: "Aurora Nova", artistGenre: "Electronic / Pop",
    artistAvatarUrl: artistProfiles[0].avatarUrl, artistAvatarInitials: "AN",
    type: "story", content: "Studio session dalle 2 alle 6 di mattina. A volte la creatività arriva quando il mondo dorme 🌙 Questa notte ho scritto qualcosa di speciale.",
    likes: 213, reposts: 31, comments: 15, timeAgo: "5 giorni fa",
    userId: artistUsers[0].id, username: "aurora_nova",
  },
  // Velvet Echo posts
  {
    artistId: artistProfiles[1].id, artistName: "Velvet Echo", artistGenre: "Indie / Alternative",
    artistAvatarUrl: artistProfiles[1].avatarUrl, artistAvatarInitials: "VE",
    type: "release", content: "'Strade di Notte' è finalmente fuori. Un brano scritto camminando per il Pigneto alle 3 di notte, quando Roma è solo tua.",
    likes: 178, reposts: 29, comments: 41, timeAgo: "1 giorno fa",
    userId: artistUsers[1].id, username: "velvet_echo",
    songUrl: songs[3].externalUrl, songTitle: songs[3].title, songId: songs[3].id,
  },
  {
    artistId: artistProfiles[1].id, artistName: "Velvet Echo", artistGenre: "Indie / Alternative",
    artistAvatarUrl: artistProfiles[1].avatarUrl, artistAvatarInitials: "VE",
    type: "tour", content: "TOUR AUTUNNALE ANNUNCIATO 🎸 Roma, Milano, Bologna, Firenze. Prevendite aperte da venerdì. Non vedo l'ora di suonare per voi.",
    likes: 567, reposts: 102, comments: 73, timeAgo: "4 giorni fa",
    userId: artistUsers[1].id, username: "velvet_echo",
  },
  {
    artistId: artistProfiles[1].id, artistName: "Velvet Echo", artistGenre: "Indie / Alternative",
    artistAvatarUrl: artistProfiles[1].avatarUrl, artistAvatarInitials: "VE",
    type: "story", content: "Grazie a tutti che erano al Circolo degli Artisti ieri sera ❤️ Uno dei concerti più belli della mia vita. Quella connessione col pubblico... magia pura.",
    likes: 390, reposts: 48, comments: 56, timeAgo: "1 settimana fa",
    userId: artistUsers[1].id, username: "velvet_echo",
  },
  // Neon Pulse posts
  {
    artistId: artistProfiles[2].id, artistName: "Neon Pulse", artistGenre: "Techno / EDM",
    artistAvatarUrl: artistProfiles[2].avatarUrl, artistAvatarInitials: "NP",
    type: "release", content: "404 BPM è live 🔊 Six minutes of pure darkness. Dedicato a tutti i raver che capiscono.",
    likes: 1240, reposts: 334, comments: 127, timeAgo: "6 ore fa",
    userId: artistUsers[2].id, username: "neon_pulse",
    songUrl: songs[6].externalUrl, songTitle: songs[6].title, songId: songs[6].id,
  },
  {
    artistId: artistProfiles[2].id, artistName: "Neon Pulse", artistGenre: "Techno / EDM",
    artistAvatarUrl: artistProfiles[2].avatarUrl, artistAvatarInitials: "NP",
    type: "announcement", content: "FABRIC LONDON 🇬🇧 il 19 luglio. Prima data internazionale. Non ci credo ancora. Vi porto con me.",
    likes: 2890, reposts: 678, comments: 245, timeAgo: "2 giorni fa",
    userId: artistUsers[2].id, username: "neon_pulse",
  },
  {
    artistId: artistProfiles[2].id, artistName: "Neon Pulse", artistGenre: "Techno / EDM",
    artistAvatarUrl: artistProfiles[2].avatarUrl, artistAvatarInitials: "NP",
    type: "story", content: "Soundcheck al Fabrique ⚡ L'impianto audio nuovo è una bestia. Stasera vi distruggo.",
    likes: 743, reposts: 88, comments: 62, timeAgo: "3 giorni fa",
    userId: artistUsers[2].id, username: "neon_pulse",
  },
  // Luna Mare posts
  {
    artistId: artistProfiles[3].id, artistName: "Luna Mare", artistGenre: "Pop / Soul",
    artistAvatarUrl: artistProfiles[3].avatarUrl, artistAvatarInitials: "LM",
    type: "release", content: "Vesuvio Blues. Il mio cuore in una canzone. Spero che vi arrivi come è arrivata a me mentre la scrivevo ☀️🌊",
    likes: 234, reposts: 41, comments: 38, timeAgo: "12 ore fa",
    userId: artistUsers[3].id, username: "luna_mare",
    songUrl: songs[9].externalUrl, songTitle: songs[9].title, songId: songs[9].id,
  },
  {
    artistId: artistProfiles[3].id, artistName: "Luna Mare", artistGenre: "Pop / Soul",
    artistAvatarUrl: artistProfiles[3].avatarUrl, artistAvatarInitials: "LM",
    type: "story", content: "Questa mattina mi sono svegliata con la melodia di una nuova canzone in testa. Ho registrato un voice memo in pigiama prima che svanisse 😂 A volte è così che nascono le cose belle.",
    likes: 156, reposts: 18, comments: 22, timeAgo: "2 giorni fa",
    userId: artistUsers[3].id, username: "luna_mare",
  },
]);

console.log("✅ Posts created");

// ─── 6. TOUR STOPS & EVENTS ──────────────────────────────────────────────────

await db.insert(tourStopsTable).values([
  { artistName: "Aurora Nova",  artistId: artistProfiles[0].id, city: "Milano",  venue: "Fabrique",            date: "12 Luglio 2026",    status: "on_sale" },
  { artistName: "Aurora Nova",  artistId: artistProfiles[0].id, city: "Roma",    venue: "Atlantico Live",      date: "19 Luglio 2026",    status: "on_sale" },
  { artistName: "Aurora Nova",  artistId: artistProfiles[0].id, city: "Torino",  venue: "Club to Club",        date: "2 Agosto 2026",     status: "on_sale" },
  { artistName: "Velvet Echo",  artistId: artistProfiles[1].id, city: "Roma",    venue: "Circolo Artisti",     date: "5 Settembre 2026",  status: "on_sale" },
  { artistName: "Velvet Echo",  artistId: artistProfiles[1].id, city: "Milano",  venue: "Magnolia",            date: "12 Settembre 2026", status: "on_sale" },
  { artistName: "Velvet Echo",  artistId: artistProfiles[1].id, city: "Bologna", venue: "Locomotiv Club",      date: "20 Settembre 2026", status: "on_sale" },
  { artistName: "Neon Pulse",   artistId: artistProfiles[2].id, city: "Torino",  venue: "Hiroshima Mon Amour", date: "25 Giugno 2026",    status: "sold_out" },
  { artistName: "Neon Pulse",   artistId: artistProfiles[2].id, city: "Milano",  venue: "Fabrique",            date: "8 Luglio 2026",     status: "on_sale" },
  { artistName: "Neon Pulse",   artistId: artistProfiles[2].id, city: "Napoli",  venue: "Palapartenope",       date: "30 Agosto 2026",    status: "on_sale" },
  { artistName: "Luna Mare",    artistId: artistProfiles[3].id, city: "Napoli",  venue: "Casa della Musica",   date: "14 Settembre 2026", status: "on_sale" },
  { artistName: "Luna Mare",    artistId: artistProfiles[3].id, city: "Palermo", venue: "Teatro di Verdura",   date: "21 Settembre 2026", status: "on_sale" },
]);

await db.insert(eventsTable).values([
  { title: "Aurora Nova Live",  artistName: "Aurora Nova",  artistId: artistProfiles[0].id, city: "Milano",  venue: "Fabrique",            date: "12 Luglio 2026",    lat: 45.479,  lng: 9.178,   price: 20, ticketsLeft: 180, imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&q=80", genre: "Electronic", isTrending: true },
  { title: "Aurora Nova Live",  artistName: "Aurora Nova",  artistId: artistProfiles[0].id, city: "Roma",    venue: "Atlantico Live",      date: "19 Luglio 2026",    lat: 41.853,  lng: 12.478,  price: 20, ticketsLeft: 95,  imageUrl: "https://images.unsplash.com/photo-1516575334481-f85287c2c82d?w=600&q=80", genre: "Electronic", isTrending: false },
  { title: "Velvet Echo Tour",  artistName: "Velvet Echo",  artistId: artistProfiles[1].id, city: "Roma",    venue: "Circolo Artisti",     date: "5 Settembre 2026",  lat: 41.893,  lng: 12.512,  price: 15, ticketsLeft: 120, imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80", genre: "Indie", isTrending: false },
  { title: "Velvet Echo Tour",  artistName: "Velvet Echo",  artistId: artistProfiles[1].id, city: "Milano",  venue: "Magnolia",            date: "12 Settembre 2026", lat: 45.455,  lng: 9.229,   price: 15, ticketsLeft: 200, imageUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80", genre: "Indie", isTrending: true },
  { title: "Neon Pulse RAVE",   artistName: "Neon Pulse",   artistId: artistProfiles[2].id, city: "Torino",  venue: "Hiroshima Mon Amour", date: "25 Giugno 2026",    lat: 45.062,  lng: 7.678,   price: 25, ticketsLeft: 0,   imageUrl: "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=600&q=80", genre: "Techno", isTrending: true },
  { title: "Neon Pulse RAVE",   artistName: "Neon Pulse",   artistId: artistProfiles[2].id, city: "Milano",  venue: "Fabrique",            date: "8 Luglio 2026",     lat: 45.479,  lng: 9.178,   price: 25, ticketsLeft: 320, imageUrl: "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=600&q=80", genre: "Techno", isTrending: true },
  { title: "Neon Pulse RAVE",   artistName: "Neon Pulse",   artistId: artistProfiles[2].id, city: "Napoli",  venue: "Palapartenope",       date: "30 Agosto 2026",    lat: 40.833,  lng: 14.212,  price: 25, ticketsLeft: 450, imageUrl: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=600&q=80", genre: "Techno", isTrending: false },
  { title: "Luna Mare Live",    artistName: "Luna Mare",    artistId: artistProfiles[3].id, city: "Napoli",  venue: "Casa della Musica",   date: "14 Settembre 2026", lat: 40.853,  lng: 14.268,  price: 12, ticketsLeft: 80,  imageUrl: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=600&q=80", genre: "Pop / Soul", isTrending: false },
  { title: "Luna Mare Live",    artistName: "Luna Mare",    artistId: artistProfiles[3].id, city: "Palermo", venue: "Teatro di Verdura",   date: "21 Settembre 2026", lat: 38.116,  lng: 13.361,  price: 12, ticketsLeft: 150, imageUrl: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=600&q=80", genre: "Pop / Soul", isTrending: false },
]);

console.log("✅ Tour stops & events created");

// ─── 7. MERCH ────────────────────────────────────────────────────────────────

await db.insert(merchTable).values([
  // Aurora Nova
  { artistId: artistProfiles[0].id, name: "T-Shirt Notte Digitale", category: "Magliette", price: 28, stock: 50, description: "T-shirt nera con stampa artwork di 'Notte Digitale'. 100% cotone biologico.", imageUrl: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80", badge: "Nuovo" },
  { artistId: artistProfiles[0].id, name: "Hoodie Aurora Nova", category: "Felpe", price: 55, stock: 30, description: "Felpa con cappuccio oversize. Stampa ricamata del logo Aurora Nova.", imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f15732ce?auto=format&fit=crop&w=800&q=80", badge: "" },
  { artistId: artistProfiles[0].id, name: "Vinile Pixel Dreams EP", category: "Vinili", price: 22, stock: 100, description: "EP da 4 tracce su vinile 12\" colorato. Edizione limitata numerata.", imageUrl: "https://images.unsplash.com/photo-1491295022513-f0e4b4e45e5f?auto=format&fit=crop&w=800&q=80", badge: "Limited" },
  // Velvet Echo
  { artistId: artistProfiles[1].id, name: "T-Shirt Strade di Notte", category: "Magliette", price: 24, stock: 40, description: "T-shirt grigio mélange. Design minimalista con skyline romano.", imageUrl: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=800&q=80", badge: "" },
  { artistId: artistProfiles[1].id, name: "Poster Tour 2026", category: "Poster", price: 12, stock: 200, description: "Poster del tour autunnale 2026. Stampa alta qualità A2 su carta lucida.", imageUrl: "https://images.unsplash.com/photo-1577741314755-048d8525d31e?auto=format&fit=crop&w=800&q=80", badge: "Esclusivo" },
  // Neon Pulse
  { artistId: artistProfiles[2].id, name: "Bucket Hat Neon Pulse", category: "Accessori", price: 30, stock: 60, description: "Cappello bucket con logo neon ricamato. One size. Perfetto per i festival.", imageUrl: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80", badge: "Best Seller" },
  { artistId: artistProfiles[2].id, name: "T-Shirt 404 BPM", category: "Magliette", price: 26, stock: 80, description: "Grafica glitch art sul davanti. Stampa serigrafata su cotone pesante.", imageUrl: "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&w=800&q=80", badge: "Nuovo" },
  { artistId: artistProfiles[2].id, name: "USB Rave Kit", category: "Accessori", price: 18, stock: 150, description: "Chiavetta USB con 2 ore di mix esclusivi e stems delle tracce più famose.", imageUrl: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&w=800&q=80", badge: "" },
  // Luna Mare
  { artistId: artistProfiles[3].id, name: "Sciarpa Sirene di Napoli", category: "Accessori", price: 20, stock: 35, description: "Sciarpa in seta stampata con illustrazione del Golfo di Napoli.", imageUrl: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=800&q=80", badge: "" },
  { artistId: artistProfiles[3].id, name: "CD Vesuvio Blues", category: "CD", price: 14, stock: 75, description: "Album di debutto su CD in edizione speciale con booklet fotografico.", imageUrl: "https://images.unsplash.com/photo-1542208998-f6dbbb27b569?w=400&q=80", badge: "Esclusivo" },
]);

console.log("✅ Merch created");

// ─── 8. FOLLOWS ──────────────────────────────────────────────────────────────

await db.insert(followsTable).values([
  { userId: fanUsers[0].id, artistId: artistProfiles[0].id },
  { userId: fanUsers[0].id, artistId: artistProfiles[2].id },
  { userId: fanUsers[1].id, artistId: artistProfiles[0].id },
  { userId: fanUsers[1].id, artistId: artistProfiles[1].id },
  { userId: fanUsers[1].id, artistId: artistProfiles[3].id },
  { userId: fanUsers[2].id, artistId: artistProfiles[1].id },
  { userId: fanUsers[2].id, artistId: artistProfiles[2].id },
  { userId: fanUsers[2].id, artistId: artistProfiles[3].id },
]).onConflictDoNothing();

console.log("✅ Follows created");

// ─── DONE ────────────────────────────────────────────────────────────────────

console.log("\n🎉 Seed complete! Test accounts (password: password123):\n");
console.log("  ARTISTI:");
console.log("  aurora@bitspace.it  → Aurora Nova  (Electronic/Pop)");
console.log("  velvet@bitspace.it  → Velvet Echo  (Indie/Alt)");
console.log("  neon@bitspace.it    → Neon Pulse   (Techno/EDM)");
console.log("  luna@bitspace.it    → Luna Mare    (Pop/Soul)");
console.log("\n  FAN:");
console.log("  marco@test.it       → marco_fan");
console.log("  giulia@test.it      → giulia_music");
console.log("  luca@test.it        → luca_beats\n");

await pool.end();

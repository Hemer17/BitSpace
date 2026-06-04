import { useEffect, useState, useRef } from "react";
import { MapPin, Navigation, Zap, Calendar, Euro } from "lucide-react";
import { useListNearbyEvents, useListEvents } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

type EventItem = {
  id: number; title: string; artistName: string; city: string; venue: string;
  date: string; lat: number; lng: number; price: number; ticketsLeft: number;
  imageUrl: string; genre: string; isTrending: boolean;
};
type NearbyItem = { event: EventItem; distanceKm: number };

function EventCard({ event, distanceKm }: { event: EventItem; distanceKm?: number }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden flex items-center gap-3 p-3 hover:border-primary/40 transition-colors">
      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
        <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{event.title}</p>
        <p className="text-xs text-muted-foreground truncate">{event.artistName}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />{event.city}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />{event.date}
          </span>
          {distanceKm !== undefined && (
            <span className="text-xs text-primary font-medium">{distanceKm} km</span>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-primary">€{event.price.toFixed(0)}</p>
        <p className="text-xs text-muted-foreground">{event.ticketsLeft} rimasti</p>
      </div>
    </div>
  );
}

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState(false);
  const [ready, setReady] = useState(false);

  const queryPos = userPos ?? { lat: 41.9028, lng: 12.4964 };
  const { data: nearby } = useListNearbyEvents({ lat: queryPos.lat, lng: queryPos.lng, radius: 300 });
  const { data: allEvents } = useListEvents({});

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { setGeoError(true); setUserPos({ lat: 41.9028, lng: 12.4964 }); }
    );
  }, []);

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;
    const initMap = async () => {
      const L = (await import("leaflet")).default;
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });
      const center: [number, number] = [41.9028, 12.4964];
      const map = L.map(mapRef.current!, { center, zoom: 6, zoomControl: true, attributionControl: false });

      // Colorful OSM tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      L.control.attribution({ prefix: false, position: "bottomright" }).addTo(map);
      leafletMap.current = map;
      setReady(true);
    };
    initMap();
    return () => {
      if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null; }
    };
  }, []);

  // Add/update markers when data is ready
  useEffect(() => {
    const map = leafletMap.current;
    if (!map || !ready) return;
    const L = (window as any).L;
    if (!L) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    import("leaflet").then(({ default: Leaflet }) => {
      if (userPos) {
        const m = Leaflet.circleMarker([userPos.lat, userPos.lng], {
          radius: 10, fillColor: "#6d5dfc", fillOpacity: 1, color: "#fff", weight: 3,
        }).addTo(map).bindPopup("<b>La tua posizione</b>");
        markersRef.current.push(m);
        map.setView([userPos.lat, userPos.lng], 7);
      }

      (allEvents ?? []).forEach((event: EventItem) => {
        const m = Leaflet.circleMarker([event.lat, event.lng], {
          radius: 9, fillColor: "#f97316", fillOpacity: 0.9, color: "#fff", weight: 2,
        }).addTo(map).bindPopup(
          `<div style="font-family:sans-serif;min-width:150px">
            <b style="font-size:13px">${event.title}</b><br/>
            <span style="color:#666;font-size:11px">${event.city} · ${event.date}</span><br/>
            <span style="color:#6d5dfc;font-weight:700;font-size:12px">€${event.price.toFixed(0)}</span>
          </div>`
        );
        markersRef.current.push(m);
      });
    });
  }, [ready, userPos, allEvents]);

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden">
      {/* Map — half the space */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-4 pt-4 pb-2 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-bold">Mappa eventi</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {geoError ? "Posizione non disponibile — mostro Roma" : userPos ? "Basato sulla tua posizione" : "Rilevamento posizione..."}
            </p>
          </div>
          {!geoError && userPos && (
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-medium">
              <Navigation className="w-3 h-3" />GPS attivo
            </div>
          )}
        </div>

        <div className="flex-1 mx-4 mb-4 rounded-2xl overflow-hidden border border-border min-h-[300px]">
          <div ref={mapRef} className="w-full h-full" />
        </div>

        <div className="px-4 pb-3 flex items-center gap-4 text-xs text-muted-foreground shrink-0">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-primary inline-block" />Tu</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />Evento</span>
        </div>
      </div>

      {/* Events list — other half */}
      <div className="flex-1 flex flex-col min-h-0 border-t md:border-t-0 md:border-l border-border">
        <div className="px-4 pt-4 pb-2 shrink-0">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-primary" />
            {(nearby ?? []).length} eventi nelle vicinanze
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-24 md:pb-4 space-y-3">
          {(nearby ?? []).length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nessun evento trovato</p>
            </div>
          )}
          {(nearby ?? []).map((item: NearbyItem) => (
            <EventCard key={item.event.id} event={item.event} distanceKm={item.distanceKm} />
          ))}
        </div>
      </div>
    </div>
  );
}

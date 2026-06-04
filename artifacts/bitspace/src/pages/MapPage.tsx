import { useEffect, useState, useRef } from "react";
import { MapPin, Navigation, Zap, Calendar, Euro } from "lucide-react";
import { useListNearbyEvents, useListEvents } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

type EventItem = {
  id: number;
  title: string;
  artistName: string;
  city: string;
  venue: string;
  date: string;
  lat: number;
  lng: number;
  price: number;
  ticketsLeft: number;
  imageUrl: string;
  genre: string;
  isTrending: boolean;
};

type NearbyItem = { event: EventItem; distanceKm: number };

function EventCard({ event, distanceKm }: { event: EventItem; distanceKm?: number }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden flex items-center gap-3 p-3 hover:border-primary/40 transition-colors cursor-pointer">
      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
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
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState(false);
  const [radius] = useState(200);

  const { data: nearby } = useListNearbyEvents(
    userPos ? { lat: userPos.lat, lng: userPos.lng, radius } : { lat: 41.9, lng: 12.5, radius }
  );

  const { data: allEvents } = useListEvents({});

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        setGeoError(true);
        setUserPos({ lat: 41.9028, lng: 12.4964 }); // fallback to Rome
      }
    );
  }, []);

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;

      // Fix default icon issue
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const center: [number, number] = userPos ? [userPos.lat, userPos.lng] : [41.9028, 12.4964];

      const map = L.map(mapRef.current!, {
        center,
        zoom: 6,
        zoomControl: true,
        attributionControl: false,
      });

      // Dark CartoDB tiles
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap contributors © CARTO",
        maxZoom: 19,
      }).addTo(map);

      L.control.attribution({ prefix: false, position: "bottomright" }).addTo(map);

      // User position marker
      if (userPos) {
        L.circleMarker([userPos.lat, userPos.lng], {
          radius: 10,
          fillColor: "#6d5dfc",
          fillOpacity: 1,
          color: "#fff",
          weight: 3,
        })
          .addTo(map)
          .bindPopup("<b>La tua posizione</b>");
      }

      // Event markers from allEvents
      if (allEvents) {
        allEvents.forEach((event: EventItem) => {
          L.circleMarker([event.lat, event.lng], {
            radius: 8,
            fillColor: "#ff6b81",
            fillOpacity: 0.9,
            color: "#fff",
            weight: 2,
          })
            .addTo(map)
            .bindPopup(
              `<div style="font-family:sans-serif;min-width:160px">
                <b style="font-size:13px">${event.title}</b><br/>
                <span style="color:#99a3c7;font-size:11px">${event.city} · ${event.date}</span><br/>
                <span style="color:#6d5dfc;font-weight:600;font-size:12px">€${event.price.toFixed(0)}</span>
              </div>`
            );
        });
      }

      leafletMap.current = map;
    };

    initMap();
  }, [userPos, allEvents]);

  return (
    <div className="flex flex-col h-screen md:h-full">
      {/* Map header */}
      <div className="px-4 pt-5 pb-3 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold">Mappa eventi</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {geoError
              ? "Posizione non disponibile – mostro Roma come centro"
              : userPos
              ? "Basato sulla tua posizione"
              : "Rilevamento posizione..."}
          </p>
        </div>
        {!geoError && userPos && (
          <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-medium">
            <Navigation className="w-3 h-3" />
            GPS attivo
          </div>
        )}
      </div>

      {/* Map */}
      <div className="mx-4 rounded-2xl overflow-hidden border border-border shrink-0" style={{ height: 300 }}>
        <div ref={mapRef} className="w-full h-full" />
      </div>

      {/* Legend */}
      <div className="px-4 py-2 flex items-center gap-4 text-xs text-muted-foreground shrink-0">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-primary inline-block" />
          Tu
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
          Evento
        </span>
      </div>

      {/* Nearby events list */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 md:pb-4 pt-2 space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <Zap className="w-3.5 h-3.5" />
          {(nearby ?? []).length} eventi nelle vicinanze
        </h2>
        {(nearby ?? []).length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nessun evento trovato nell'area</p>
          </div>
        )}
        {(nearby ?? []).map((item: NearbyItem) => (
          <EventCard key={item.event.id} event={item.event} distanceKm={item.distanceKm} />
        ))}
      </div>
    </div>
  );
}

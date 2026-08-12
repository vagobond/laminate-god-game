// Read-only mini map for viewing an entry's geo-pin.
//
// Loaded via React.lazy from RiverEntryCard's pin dialog, so mapbox-gl loads
// (and a Mapbox map-load is counted) only when someone clicks a pin chip.
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface EntryPinMapProps {
  latitude: number;
  longitude: number;
}

const EntryPinMap = ({ latitude, longitude }: EntryPinMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.functions
      .invoke("get-mapbox-token")
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err || !data?.token) setError(true);
        else setToken(data.token);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current || !token) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [longitude, latitude],
      zoom: 9,
    });
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    new mapboxgl.Marker().setLngLat([longitude, latitude]).addTo(map);

    return () => {
      map.remove();
    };
  }, [token, latitude, longitude]);

  if (error) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-muted-foreground border rounded-md">
        Could not load the map.
      </div>
    );
  }

  return (
    <div className="relative h-64 rounded-md overflow-hidden border">
      {!token && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
};

export default EntryPinMap;

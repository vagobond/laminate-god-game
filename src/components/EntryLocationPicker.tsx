// Mini Mapbox picker for dropping a geo-pin on a daily entry.
//
// Loaded via React.lazy from XcrolEntryForm, so mapbox-gl (and its CSS) only
// enters the browser when someone actually opens the "Add location" section —
// no bundle or Mapbox-quota cost for entries without pins.
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface EntryLocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onPick: (lat: number, lng: number) => void;
}

const EntryLocationPicker = ({ latitude, longitude, onPick }: EntryLocationPickerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
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
    if (!containerRef.current || !token || mapRef.current) return;

    mapboxgl.accessToken = token;
    const hasPin = latitude != null && longitude != null;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: hasPin ? [longitude!, latitude!] : [0, 20],
      zoom: hasPin ? 9 : 1,
    });
    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    if (hasPin) {
      markerRef.current = new mapboxgl.Marker().setLngLat([longitude!, latitude!]).addTo(map);
    }

    map.on("click", (e) => {
      const { lat, lng } = e.lngLat;
      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
      } else {
        markerRef.current = new mapboxgl.Marker().setLngLat([lng, lat]).addTo(map);
      }
      onPick(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Map is created once per mount; pin moves are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Keep the marker in sync when the pin is set externally (hometown quick-fill).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (latitude == null || longitude == null) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    if (markerRef.current) {
      markerRef.current.setLngLat([longitude, latitude]);
    } else {
      markerRef.current = new mapboxgl.Marker().setLngLat([longitude, latitude]).addTo(map);
    }
    map.easeTo({ center: [longitude, latitude], zoom: Math.max(map.getZoom(), 6) });
  }, [latitude, longitude]);

  if (error) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-muted-foreground border rounded-md">
        Could not load the map.
      </div>
    );
  }

  return (
    <div className="relative h-48 rounded-md overflow-hidden border">
      {!token && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
};

export default EntryLocationPicker;

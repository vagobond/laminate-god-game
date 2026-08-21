// Mini Mapbox picker for tagging a daily entry with a place.
//
// Three ways to set the location:
//   1. "Use my current location" — browser geolocation, reverse-geocoded to a label.
//   2. Type a place name — forward-geocoded via Mapbox search.
//   3. Click the map to drop/move the pin — reverse-geocoded to a label.
//
// Loaded via React.lazy from XcrolEntryForm, so mapbox-gl (and its CSS) only
// enters the browser when someone opens the "Add location" section — no bundle
// or Mapbox-quota cost for entries without pins.
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Loader2, LocateFixed, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface EntryLocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  /** Called when the pin moves. `label` is the geocoded place name when one was resolved. */
  onPick: (lat: number, lng: number, label?: string) => void;
}

// Turn Mapbox geocoder features into a short "City, Country"-ish label.
function labelFromFeatures(features: any[]): string | undefined {
  if (!features?.length) return undefined;
  const place =
    features.find((f) => f.place_type?.includes("place")) ||
    features.find((f) => f.place_type?.includes("locality")) ||
    features.find((f) => f.place_type?.includes("region")) ||
    features[0];
  if (!place) return undefined;
  const country = place.context?.find((c: any) => c.id?.startsWith("country"))?.text;
  const name = place.text || place.place_name;
  return [name, country].filter(Boolean).join(", ").slice(0, 80) || undefined;
}

const EntryLocationPicker = ({ latitude, longitude, onPick }: EntryLocationPickerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const tokenRef = useRef<string | null>(null);
  // Monotonic sequence: every pin placement bumps it; late async geocode
  // responses check it and drop themselves instead of snapping the pin back
  // to an earlier location (2026-08-21 audit, item 5).
  const pinSeqRef = useRef(0);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.functions
      .invoke("get-mapbox-token")
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err || !data?.token) setError(true);
        else {
          tokenRef.current = data.token;
          setToken(data.token);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Drop/move the marker and recentre. Optionally reverse-geocode a label.
  const placePin = (lat: number, lng: number, opts?: { reverse?: boolean; label?: string }) => {
    const seq = ++pinSeqRef.current;
    const map = mapRef.current;
    if (map) {
      if (markerRef.current) markerRef.current.setLngLat([lng, lat]);
      else markerRef.current = new mapboxgl.Marker().setLngLat([lng, lat]).addTo(map);
      map.easeTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 9) });
    }
    if (opts?.label !== undefined) {
      onPick(Number(lat.toFixed(6)), Number(lng.toFixed(6)), opts.label);
      return;
    }
    if (opts?.reverse && tokenRef.current) {
      // Fire the pin immediately (no label), then upgrade with the geocoded label.
      onPick(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
      fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=place,locality,region,country&limit=1&access_token=${tokenRef.current}`,
      )
        .then((r) => r.json())
        .then((d) => {
          // A newer pin placement superseded this geocode — drop it.
          if (seq !== pinSeqRef.current) return;
          const label = labelFromFeatures(d.features);
          if (label) onPick(Number(lat.toFixed(6)), Number(lng.toFixed(6)), label);
        })
        .catch(() => {/* label is optional */});
    } else {
      onPick(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
    }
  };

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
      placePin(lat, lng, { reverse: true });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Map is created once per mount; pin moves are handled below / via helpers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Keep the marker in sync when the pin is set externally (hometown quick-fill / clear).
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

  const useCurrentLocation = () => {
    setNotice(null);
    if (!("geolocation" in navigator)) {
      setNotice("Your browser can't share a location.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        placePin(pos.coords.latitude, pos.coords.longitude, { reverse: true });
      },
      (err) => {
        setLocating(false);
        setNotice(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied — search or click the map instead."
            : "Couldn't get your location — search or click the map instead.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const runSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = search.trim();
    if (!q || !tokenRef.current) return;
    setNotice(null);
    setSearching(true);
    const seqAtStart = pinSeqRef.current;
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?types=place,locality,region,country,poi,address&limit=1&access_token=${tokenRef.current}`,
      );
      const data = await res.json();
      if (pinSeqRef.current !== seqAtStart) {
        // The user placed a pin while the search was in flight — keep theirs.
        setNotice(null);
      } else if (data.features?.length) {
        const [lng, lat] = data.features[0].center;
        placePin(lat, lng, { label: labelFromFeatures(data.features) ?? q.slice(0, 80) });
      } else {
        setNotice(`No place found for "${q}".`);
      }
    } catch {
      setNotice("Search failed — try again or click the map.");
    } finally {
      setSearching(false);
    }
  };

  if (error) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-muted-foreground border rounded-md">
        Could not load the map.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={useCurrentLocation}
          disabled={!token || locating}
          className="shrink-0"
        >
          {locating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <LocateFixed className="w-4 h-4 mr-1" />}
          Use my current location
        </Button>
        <form onSubmit={runSearch} className="flex flex-1 gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search a place…"
            disabled={!token}
            aria-label="Search for a place"
          />
          <Button type="submit" variant="outline" size="sm" disabled={!token || searching || !search.trim()} className="shrink-0">
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </form>
      </div>

      {notice && <p className="text-xs text-destructive">{notice}</p>}

      <div className="relative h-48 rounded-md overflow-hidden border">
        {!token && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}
        <div ref={containerRef} className="h-full w-full" />
      </div>
    </div>
  );
};

export default EntryLocationPicker;

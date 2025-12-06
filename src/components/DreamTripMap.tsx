import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";

interface DreamTripMapProps {
  destinations: string[];
  currentDestinationIndex?: number;
}

interface GeocodedLocation {
  name: string;
  lng: number;
  lat: number;
}

export const DreamTripMap = ({ destinations, currentDestinationIndex = 0 }: DreamTripMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [locations, setLocations] = useState<GeocodedLocation[]>([]);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Mapbox token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-mapbox-token");
        if (error) throw error;
        setMapboxToken(data.token);
      } catch (err) {
        console.error("Failed to fetch Mapbox token:", err);
      }
    };
    fetchToken();
  }, []);

  // Geocode destinations
  useEffect(() => {
    if (!mapboxToken || destinations.length === 0) return;

    const geocodeDestinations = async () => {
      const geocoded: GeocodedLocation[] = [];

      for (const dest of destinations) {
        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(dest)}.json?access_token=${mapboxToken}&limit=1`
          );
          const data = await response.json();

          if (data.features && data.features.length > 0) {
            const [lng, lat] = data.features[0].center;
            geocoded.push({ name: dest, lng, lat });
          }
        } catch (err) {
          console.error(`Failed to geocode ${dest}:`, err);
        }
      }

      setLocations(geocoded);
      setIsLoading(false);
    };

    geocodeDestinations();
  }, [destinations, mapboxToken]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || locations.length === 0) return;

    mapboxgl.accessToken = mapboxToken;

    // Calculate bounds to fit all locations
    const bounds = new mapboxgl.LngLatBounds();
    locations.forEach((loc) => bounds.extend([loc.lng, loc.lat]));

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      bounds: bounds,
      fitBoundsOptions: { padding: 50 },
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.current.on("load", () => {
      if (!map.current) return;

      // Add route line
      const routeCoordinates = locations.map((loc) => [loc.lng, loc.lat]);

      map.current.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: routeCoordinates,
          },
        },
      });

      map.current.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#8b5cf6",
          "line-width": 3,
          "line-dasharray": [2, 2],
        },
      });

      // Add markers for each destination
      locations.forEach((loc, index) => {
        const el = document.createElement("div");
        el.className = "dream-trip-marker";
        el.style.cssText = `
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 12px;
          color: white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
          transition: transform 0.3s ease;
          ${index <= currentDestinationIndex
            ? "background: linear-gradient(135deg, #8b5cf6, #a855f7);"
            : "background: #6b7280;"}
          ${index === currentDestinationIndex ? "transform: scale(1.3);" : ""}
        `;
        el.textContent = String(index + 1);

        const popup = new mapboxgl.Popup({ offset: 25 }).setText(loc.name);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([loc.lng, loc.lat])
          .setPopup(popup)
          .addTo(map.current!);

        markersRef.current.push(marker);
      });
    });

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.current?.remove();
    };
  }, [locations, mapboxToken]);

  // Update markers when current destination changes
  useEffect(() => {
    markersRef.current.forEach((marker, index) => {
      const el = marker.getElement();
      el.style.background =
        index <= currentDestinationIndex
          ? "linear-gradient(135deg, #8b5cf6, #a855f7)"
          : "#6b7280";
      el.style.transform = index === currentDestinationIndex ? "scale(1.3)" : "scale(1)";
    });

    // Pan to current destination
    if (map.current && locations[currentDestinationIndex]) {
      const { lng, lat } = locations[currentDestinationIndex];
      map.current.flyTo({ center: [lng, lat], zoom: 5, duration: 1500 });
    }
  }, [currentDestinationIndex, locations]);

  if (isLoading || !mapboxToken) {
    return (
      <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Loading map...</p>
      </div>
    );
  }

  if (locations.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { X, Globe, ChevronRight, Users, CalendarIcon } from "lucide-react";
import { CreateMeetupDialog } from "@/components/CreateMeetupDialog";
import { MeetupsListModal } from "@/components/MeetupsListModal";

interface ProfileData {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  hometown_city: string;
  hometown_country: string;
  hometown_latitude: number;
  hometown_longitude: number;
  hometown_description: string | null;
}

interface HometownGroup {
  city: string;
  country: string;
  lat: number;
  lng: number;
  profiles: ProfileData[];
}

interface Meetup {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  location_name: string;
  location_address: string | null;
  latitude: number | null;
  longitude: number | null;
  start_datetime: string | null;
  end_datetime: string | null;
  is_open_ended: boolean;
  created_at: string;
}

const IRLLayer = () => {
  const navigate = useNavigate();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const meetupMarkersRef = useRef<mapboxgl.Marker[]>([]);
  
  const [user, setUser] = useState<User | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lng: number; lat: number; city: string; country: string } | null>(null);
  const [hometownDescription, setHometownDescription] = useState("");
  const [userHometown, setUserHometown] = useState<any>(null);
  const [allHometowns, setAllHometowns] = useState<ProfileData[]>([]);
  const [selectedHometown, setSelectedHometown] = useState<HometownGroup | null>(null);
  const [showExploreModal, setShowExploreModal] = useState(false);
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [showMeetupsModal, setShowMeetupsModal] = useState(false);
  const [showCreateMeetup, setShowCreateMeetup] = useState(false);
  const [expandedHometown, setExpandedHometown] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("hometown_city, hometown_country, hometown_latitude, hometown_longitude, hometown_description")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error loading profile:", error);
      return;
    }

    if (data?.hometown_city) {
      setUserHometown(data);
    }
  };

  const loadAllHometowns = async () => {
    // Use secure function that only returns non-sensitive hometown data
    const { data, error } = await supabase.rpc("get_public_hometowns");

    if (error) {
      console.error("Error loading hometowns:", error);
      return;
    }

    setAllHometowns((data || []) as ProfileData[]);
  };

  const loadMeetups = async () => {
    const { data, error } = await supabase
      .from("meetups")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading meetups:", error);
      return;
    }

    setMeetups((data || []) as Meetup[]);
  };

  // Fetch Mapbox token from edge function
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-mapbox-token");
        if (error) throw error;
        setMapboxToken(data.token);
      } catch (err) {
        console.error("Failed to fetch Mapbox token:", err);
        toast.error("Failed to load map");
      }
    };
    fetchToken();
  }, []);

  useEffect(() => {
    loadAllHometowns();
    loadMeetups();
  }, []);

  // Group profiles by hometown
  const groupedHometowns = allHometowns.reduce<Record<string, HometownGroup>>((acc, profile) => {
    const key = `${profile.hometown_city}-${profile.hometown_country}`;
    if (!acc[key]) {
      acc[key] = {
        city: profile.hometown_city,
        country: profile.hometown_country,
        lat: profile.hometown_latitude,
        lng: profile.hometown_longitude,
        profiles: [],
      };
    }
    acc[key].profiles.push(profile);
    return acc;
  }, {});

  // Check if a location has meetups nearby (within ~50km)
  const locationHasMeetups = useCallback((lat: number, lng: number): boolean => {
    const threshold = 0.5; // Roughly 50km at equator
    return meetups.some(meetup => {
      if (!meetup.latitude || !meetup.longitude) return false;
      const latDiff = Math.abs(meetup.latitude - lat);
      const lngDiff = Math.abs(meetup.longitude - lng);
      return latDiff < threshold && lngDiff < threshold;
    });
  }, [meetups]);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [0, 20],
      zoom: 2,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Add click handler for claiming location (on empty map areas)
    map.current.on("click", async (e) => {
      // Check if click was on a cluster or point
      if (!map.current) return;
      const features = map.current.queryRenderedFeatures(e.point, {
        layers: ["clusters", "unclustered-point"],
      });
      if (features.length > 0) return;

      if (!user) {
        toast.error("Please sign in to claim a hometown");
        return;
      }

      if (userHometown) {
        toast.info("You've already claimed a hometown");
        return;
      }

      const { lng, lat } = e.lngLat;

      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=place,locality,region&access_token=${mapboxToken}`
        );
        const data = await response.json();
        
        let city = "Unknown";
        let country = "Unknown";
        
        if (data.features && data.features.length > 0) {
          const cityFeature = data.features.find((f: any) => f.place_type.includes("place")) ||
                              data.features.find((f: any) => f.place_type.includes("locality")) ||
                              data.features.find((f: any) => f.place_type.includes("region"));
          
          if (cityFeature) {
            city = cityFeature.text;
            const countryContext = cityFeature.context?.find((ctx: any) => ctx.id?.startsWith("country"));
            if (countryContext) {
              country = countryContext.text;
            }
          }
        }

        setSelectedLocation({ lng, lat, city, country });
        setShowClaimForm(true);
      } catch (error) {
        console.error("Error reverse geocoding:", error);
        toast.error("Could not identify location");
      }
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, user, userHometown]);

  // Add clustered GeoJSON source and layers for hometowns
  useEffect(() => {
    if (!map.current || allHometowns.length === 0) return;

    const mapInstance = map.current;
    let isSetup = false;

    const handleClusterClick = (e: mapboxgl.MapLayerMouseEvent) => {
      if (!mapInstance || !e.features?.[0]) return;
      e.preventDefault();
      const clusterId = e.features[0].properties?.cluster_id;
      const source = mapInstance.getSource("hometowns") as mapboxgl.GeoJSONSource;
      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err || !mapInstance) return;
        const geometry = e.features![0].geometry as GeoJSON.Point;
        mapInstance.easeTo({
          center: geometry.coordinates as [number, number],
          zoom: (zoom ?? mapInstance.getZoom()) + 2,
        });
      });
    };

    const handlePointClick = (e: mapboxgl.MapLayerMouseEvent) => {
      if (!e.features?.[0]) return;
      e.preventDefault();
      const props = e.features[0].properties;
      const profiles = JSON.parse(props?.profiles || "[]") as ProfileData[];
      const geometry = e.features[0].geometry as GeoJSON.Point;
      
      setSelectedHometown({
        city: props?.city,
        country: props?.country,
        lat: geometry.coordinates[1],
        lng: geometry.coordinates[0],
        profiles,
      });
    };

    const handleMouseEnter = () => {
      if (mapInstance) mapInstance.getCanvas().style.cursor = "pointer";
    };

    const handleMouseLeave = () => {
      if (mapInstance) mapInstance.getCanvas().style.cursor = "";
    };

    const setupClusters = () => {
      if (!mapInstance || isSetup) return;
      isSetup = true;

      // Remove existing source and layers if they exist
      if (mapInstance.getLayer("clusters")) mapInstance.removeLayer("clusters");
      if (mapInstance.getLayer("cluster-count")) mapInstance.removeLayer("cluster-count");
      if (mapInstance.getLayer("unclustered-point")) mapInstance.removeLayer("unclustered-point");
      if (mapInstance.getLayer("unclustered-count")) mapInstance.removeLayer("unclustered-count");
      if (mapInstance.getSource("hometowns")) mapInstance.removeSource("hometowns");

      // Create GeoJSON from grouped hometowns with meetup info
      const geojsonData: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: Object.values(groupedHometowns).map((group) => ({
          type: "Feature",
          properties: {
            city: group.city,
            country: group.country,
            count: group.profiles.length,
            profiles: JSON.stringify(group.profiles),
            hasMeetups: locationHasMeetups(group.lat, group.lng),
          },
          geometry: {
            type: "Point",
            coordinates: [group.lng, group.lat],
          },
        })),
      };

      mapInstance.addSource("hometowns", {
        type: "geojson",
        data: geojsonData,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 60,
        clusterProperties: {
          sum: ["+", ["get", "count"]],
          hasMeetups: ["any", ["get", "hasMeetups"]],
        },
      });

      // Clustered circles - yellow if has meetups, purple otherwise
      mapInstance.addLayer({
        id: "clusters",
        type: "circle",
        source: "hometowns",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "case",
            ["get", "hasMeetups"],
            "#EAB308", // Yellow for locations with meetups
            "#8B5CF6"  // Purple for locations without meetups
          ],
          "circle-radius": [
            "step",
            ["get", "sum"],
            20, 5,
            25, 10,
            30, 25,
            40
          ],
          "circle-stroke-width": 3,
          "circle-stroke-color": "#ffffff",
        },
      });

      // Cluster count labels
      mapInstance.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "hometowns",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "sum"],
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 14,
        },
        paint: {
          "text-color": "#ffffff",
        },
      });

      // Individual (unclustered) points - yellow if has meetups, purple otherwise
      mapInstance.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "hometowns",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": [
            "case",
            ["get", "hasMeetups"],
            "#EAB308", // Yellow for locations with meetups
            "#8B5CF6"  // Purple for locations without meetups
          ],
          "circle-radius": [
            "interpolate", ["linear"], ["get", "count"],
            1, 18,
            5, 22,
            10, 28
          ],
          "circle-stroke-width": 3,
          "circle-stroke-color": "#ffffff",
        },
      });

      // Individual point count labels
      mapInstance.addLayer({
        id: "unclustered-count",
        type: "symbol",
        source: "hometowns",
        filter: ["!", ["has", "point_count"]],
        layout: {
          "text-field": ["get", "count"],
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 14,
        },
        paint: {
          "text-color": "#ffffff",
        },
      });

      // Add event listeners
      mapInstance.on("click", "clusters", handleClusterClick);
      mapInstance.on("click", "unclustered-point", handlePointClick);
      mapInstance.on("mouseenter", "clusters", handleMouseEnter);
      mapInstance.on("mouseleave", "clusters", handleMouseLeave);
      mapInstance.on("mouseenter", "unclustered-point", handleMouseEnter);
      mapInstance.on("mouseleave", "unclustered-point", handleMouseLeave);
    };

    if (mapInstance.isStyleLoaded()) {
      setupClusters();
    } else {
      mapInstance.on("load", setupClusters);
    }

    return () => {
      // Cleanup event listeners - check if map still has style loaded
      try {
        if (mapInstance && mapInstance.getStyle()) {
          mapInstance.off("click", "clusters", handleClusterClick);
          mapInstance.off("mouseenter", "clusters", handleMouseEnter);
          mapInstance.off("mouseleave", "clusters", handleMouseLeave);
          mapInstance.off("click", "unclustered-point", handlePointClick);
          mapInstance.off("mouseenter", "unclustered-point", handleMouseEnter);
          mapInstance.off("mouseleave", "unclustered-point", handleMouseLeave);
        }
      } catch {
        // Map was already destroyed, ignore cleanup
      }
    };
  }, [allHometowns, groupedHometowns, meetups, locationHasMeetups]);

  // Add meetup markers to the map
  useEffect(() => {
    if (!map.current) return;

    const mapInstance = map.current;

    const addMeetupMarkers = () => {
      // Clear existing meetup markers
      meetupMarkersRef.current.forEach(marker => marker.remove());
      meetupMarkersRef.current = [];

      meetups.forEach(meetup => {
        if (!meetup.latitude || !meetup.longitude) return;

        // Create custom marker element
        const el = document.createElement("div");
        el.className = "meetup-marker";
        el.style.width = "32px";
        el.style.height = "32px";
        el.style.borderRadius = "50%";
        el.style.backgroundColor = "#EAB308";
        el.style.border = "3px solid white";
        el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
        el.style.cursor = "pointer";
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.style.justifyContent = "center";
        el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 8px; max-width: 200px;">
            <h3 style="font-weight: bold; margin-bottom: 4px;">${meetup.title}</h3>
            <p style="font-size: 12px; color: #666;">${meetup.location_name}</p>
            ${meetup.description ? `<p style="font-size: 12px; margin-top: 4px;">${meetup.description}</p>` : ""}
          </div>
        `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([meetup.longitude, meetup.latitude])
          .setPopup(popup)
          .addTo(mapInstance);

        meetupMarkersRef.current.push(marker);
      });
    };

    if (mapInstance.isStyleLoaded()) {
      addMeetupMarkers();
    } else {
      const onLoad = () => addMeetupMarkers();
      mapInstance.on("load", onLoad);
      return () => {
        mapInstance.off("load", onLoad);
        meetupMarkersRef.current.forEach(marker => marker.remove());
        meetupMarkersRef.current = [];
      };
    }

    return () => {
      meetupMarkersRef.current.forEach(marker => marker.remove());
      meetupMarkersRef.current = [];
    };
  }, [meetups]);

  const handleClaimHometown = async () => {
    if (!user || !selectedLocation) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        hometown_city: selectedLocation.city,
        hometown_country: selectedLocation.country,
        hometown_latitude: selectedLocation.lat,
        hometown_longitude: selectedLocation.lng,
        hometown_description: hometownDescription,
      })
      .eq("id", user.id);

    if (error) {
      console.error("Error claiming hometown:", error);
      toast.error("Failed to claim hometown");
      return;
    }

    toast.success(`You've claimed ${selectedLocation.city}!`);
    setUserHometown({
      hometown_city: selectedLocation.city,
      hometown_country: selectedLocation.country,
      hometown_latitude: selectedLocation.lat,
      hometown_longitude: selectedLocation.lng,
      hometown_description: hometownDescription,
    });
    setShowClaimForm(false);
    setSelectedLocation(null);
    setHometownDescription("");

    // Reload all hometowns to update markers
    loadAllHometowns();
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold text-glow">The World</h1>
          <p className="text-foreground/80">Please sign in to claim your hometown</p>
          <Button onClick={() => navigate("/auth")} variant="mystical">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  // Sort hometowns by user count for explore modal
  const sortedHometowns = Object.values(groupedHometowns).sort(
    (a, b) => b.profiles.length - a.profiles.length
  );

  const handleExploreClick = (group: HometownGroup) => {
    setShowExploreModal(false);
    setSelectedHometown(group);
    if (map.current) {
      map.current.flyTo({
        center: [group.lng, group.lat],
        zoom: 10,
        duration: 1500,
      });
    }
  };

  return (
    <div className="min-h-screen p-4 space-y-6">
      {/* Every Country Banner */}
      <div 
        onClick={() => navigate("/every-country")}
        className="max-w-7xl mx-auto bg-gradient-to-r from-primary/20 via-purple-600/20 to-primary/20 border border-primary/30 rounded-lg p-4 cursor-pointer hover:bg-primary/30 transition-all group"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6 text-primary animate-pulse" />
            <div>
              <p className="text-lg font-semibold text-foreground">
                A person from every country in the world...
                <span className="ml-2 inline-block px-2 py-0.5 text-sm bg-primary text-primary-foreground rounded animate-pulse">
                  click here
                </span>
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

      <div className="flex justify-between items-center max-w-7xl mx-auto flex-wrap gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-glow">The World</h1>
          <p className="text-foreground/80 mt-2">Claim your hometown on the Laminate map</p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex gap-3">
            <Button onClick={() => setShowExploreModal(true)} className="gap-2 bg-purple-600 hover:bg-purple-700 text-white">
              <Globe className="w-4 h-4" />
              Explore Hometowns
            </Button>
            <Button onClick={() => setShowMeetupsModal(true)} className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-black">
              <CalendarIcon className="w-4 h-4" />
              Meetups/Events
            </Button>
            <Button onClick={() => navigate("/powers")} variant="outline">
              Back to Powers
            </Button>
          </div>
          <button
            onClick={() => setShowCreateMeetup(true)}
            className="text-sm text-yellow-500 hover:text-yellow-400 underline text-right"
          >
            Create Meetup/Event
          </button>
        </div>
      </div>

      {userHometown && (
        <div className="max-w-7xl mx-auto p-4 border border-primary/20 rounded-lg bg-card">
          <h3 className="text-xl font-semibold mb-2">Your Hometown</h3>
          <p className="text-lg">
            {userHometown.hometown_city}, {userHometown.hometown_country}
          </p>
          {userHometown.hometown_description && (
            <p className="text-foreground/70 mt-2 italic">"{userHometown.hometown_description}"</p>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto relative">
        <div ref={mapContainer} className="w-full h-[600px] rounded-lg shadow-lg" />
        
        {!userHometown && (
          <div className="absolute top-4 left-4 bg-card/95 p-4 rounded-lg border border-primary/20 max-w-xs">
            <p className="text-sm">Click anywhere on the map to claim your hometown!</p>
          </div>
        )}
      </div>

      {/* Explore Hometowns Modal */}
      {showExploreModal && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-primary/20 rounded-lg p-6 max-w-lg w-full space-y-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Globe className="w-6 h-6 text-primary" />
                  Explore Hometowns
                </h2>
                <p className="text-foreground/70 text-sm mt-1">
                  {allHometowns.length} Xcroler{allHometowns.length !== 1 ? 's' : ''} across {sortedHometowns.length} location{sortedHometowns.length !== 1 ? 's' : ''}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowExploreModal(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="overflow-y-auto flex-1 space-y-2">
              {sortedHometowns.length === 0 ? (
                <p className="text-foreground/60 text-center py-8">
                  No hometowns claimed yet. Be the first!
                </p>
              ) : (
                sortedHometowns.map((group) => {
                  const key = `${group.city}-${group.country}`;
                  const isExpanded = expandedHometown === key;
                  const hasMultiple = group.profiles.length > 1;

                  return (
                    <div key={key} className="border border-border/50 rounded-lg overflow-hidden">
                      <div
                        onClick={() => {
                          if (hasMultiple) {
                            setExpandedHometown(isExpanded ? null : key);
                          } else {
                            handleExploreClick(group);
                          }
                        }}
                        className="flex items-center gap-3 p-3 bg-secondary/20 hover:bg-secondary/40 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 text-primary font-bold">
                          {group.profiles.length}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{group.city}</p>
                          <p className="text-sm text-foreground/60">{group.country}</p>
                        </div>
                        {hasMultiple ? (
                          <ChevronRight className={`w-5 h-5 text-foreground/60 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExploreClick(group);
                            }}
                            className="text-primary"
                          >
                            View on Map
                          </Button>
                        )}
                      </div>
                      
                      {hasMultiple && isExpanded && (
                        <div className="border-t border-border/50 bg-background/50">
                          <div className="p-2 space-y-1">
                            {group.profiles.map((profile) => (
                              <div
                                key={profile.id}
                                onClick={() => navigate(`/u/${profile.id}`)}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30 cursor-pointer transition-colors"
                              >
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={profile.avatar_url || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {(profile.display_name || "A").slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm truncate">
                                  {profile.display_name || "Anonymous Xcroler"}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="p-2 border-t border-border/50">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleExploreClick(group)}
                              className="w-full text-primary"
                            >
                              View on Map
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hometown profiles modal */}
      {selectedHometown && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-primary/20 rounded-lg p-6 max-w-md w-full space-y-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold">{selectedHometown.city}</h2>
                <p className="text-foreground/70">{selectedHometown.country}</p>
                <p className="text-sm text-primary mt-1">
                  {selectedHometown.profiles.length} Xcroler{selectedHometown.profiles.length !== 1 ? 's' : ''}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedHometown(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="overflow-y-auto flex-1 space-y-3">
              {selectedHometown.profiles.map((profile) => (
                <div
                  key={profile.id}
                  onClick={() => navigate(`/u/${profile.id}`)}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors"
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback>
                      {(profile.display_name || "A").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {profile.display_name || "Anonymous Xcroler"}
                    </p>
                    {profile.hometown_description && (
                      <p className="text-sm text-foreground/60 italic mt-1">
                        "{profile.hometown_description}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showClaimForm && selectedLocation && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-primary/20 rounded-lg p-6 max-w-md w-full space-y-4">
            <h2 className="text-2xl font-bold">Claim {selectedLocation.city}</h2>
            <p className="text-foreground/70">
              {selectedLocation.city}, {selectedLocation.country}
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Why I love my hometown</label>
              <Textarea
                value={hometownDescription}
                onChange={(e) => setHometownDescription(e.target.value)}
                placeholder="Tell other Xcrolers what you love about your hometown"
                className="min-h-[120px]"
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleClaimHometown} variant="mystical" className="flex-1">
                Claim Hometown
              </Button>
              <Button
                onClick={() => {
                  setShowClaimForm(false);
                  setSelectedLocation(null);
                  setHometownDescription("");
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Meetups List Modal */}
      <MeetupsListModal
        open={showMeetupsModal}
        onClose={() => setShowMeetupsModal(false)}
        onSelectMeetup={(meetup) => {
          if (map.current && meetup.latitude && meetup.longitude) {
            map.current.flyTo({
              center: [meetup.longitude, meetup.latitude],
              zoom: 12,
              duration: 1500,
            });
          }
        }}
      />

      {/* Create Meetup Dialog */}
      <CreateMeetupDialog
        open={showCreateMeetup}
        onOpenChange={setShowCreateMeetup}
        onMeetupCreated={loadMeetups}
        mapboxToken={mapboxToken}
      />
    </div>
  );
};

export default IRLLayer;

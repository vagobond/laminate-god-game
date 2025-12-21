import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { X, Globe, ChevronRight, Users } from "lucide-react";

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

const IRLLayer = () => {
  const navigate = useNavigate();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lng: number; lat: number; city: string; country: string } | null>(null);
  const [hometownDescription, setHometownDescription] = useState("");
  const [userHometown, setUserHometown] = useState<any>(null);
  const [allHometowns, setAllHometowns] = useState<ProfileData[]>([]);
  const [selectedHometown, setSelectedHometown] = useState<HometownGroup | null>(null);
  const [showExploreModal, setShowExploreModal] = useState(false);
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

    // Add click handler for claiming location
    map.current.on("click", async (e) => {
      // Check if click was on a marker (don't trigger claim form)
      const target = e.originalEvent.target as HTMLElement;
      if (target.closest('.mapboxgl-marker')) return;

      if (!user) {
        toast.error("Please sign in to claim a hometown");
        return;
      }

      if (userHometown) {
        toast.info("You've already claimed a hometown");
        return;
      }

      const { lng, lat } = e.lngLat;

      // Reverse geocode to get city name - use types parameter for city-level results
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=place,locality,region&access_token=${mapboxToken}`
        );
        const data = await response.json();
        
        let city = "Unknown";
        let country = "Unknown";
        
        if (data.features && data.features.length > 0) {
          // Priority: place (city) > locality > region
          const cityFeature = data.features.find((f: any) => f.place_type.includes("place")) ||
                              data.features.find((f: any) => f.place_type.includes("locality")) ||
                              data.features.find((f: any) => f.place_type.includes("region"));
          
          if (cityFeature) {
            city = cityFeature.text;
            // Extract country from the context array
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

  // Add markers for grouped hometowns
  useEffect(() => {
    if (!map.current || Object.keys(groupedHometowns).length === 0) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const addMarkers = () => {
      Object.values(groupedHometowns).forEach((group) => {
        const count = group.profiles.length;
        
        // Create custom marker element with count
        const el = document.createElement('div');
        el.className = 'hometown-marker';
        el.style.cssText = `
          background: linear-gradient(135deg, #8B5CF6, #6D28D9);
          color: white;
          border-radius: 50%;
          width: ${Math.min(40 + count * 4, 60)}px;
          height: ${Math.min(40 + count * 4, 60)}px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: ${count > 9 ? '14px' : '16px'};
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 10px rgba(139, 92, 246, 0.5);
          transition: transform 0.2s;
        `;
        el.textContent = count.toString();
        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.1)';
        });
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)';
        });
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          setSelectedHometown(group);
        });

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([group.lng, group.lat])
          .addTo(map.current!);

        markersRef.current.push(marker);
      });
    };

    if (map.current.loaded()) {
      addMarkers();
    } else {
      map.current.on('load', addMarkers);
    }
  }, [groupedHometowns]);

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
          <h1 className="text-4xl font-bold text-glow">The IRL Layer</h1>
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
        onClick={() => navigate("/mini-games-hub")}
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
          <h1 className="text-4xl md:text-5xl font-bold text-glow">The IRL Layer</h1>
          <p className="text-foreground/80 mt-2">Claim your hometown on the Laminate map</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowExploreModal(true)} variant="mystical" className="gap-2">
            <Globe className="w-4 h-4" />
            Explore Hometowns
          </Button>
          <Button onClick={() => navigate("/powers")} variant="outline">
            Back to Powers
          </Button>
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
                  {allHometowns.length} Laminater{allHometowns.length !== 1 ? 's' : ''} across {sortedHometowns.length} location{sortedHometowns.length !== 1 ? 's' : ''}
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
                                  {profile.display_name || "Anonymous Laminater"}
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
                  {selectedHometown.profiles.length} Laminater{selectedHometown.profiles.length !== 1 ? 's' : ''}
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
                      {profile.display_name || "Anonymous Laminater"}
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
                placeholder="Tell other Laminaters what you love about your hometown"
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
    </div>
  );
};

export default IRLLayer;

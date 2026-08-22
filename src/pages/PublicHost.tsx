import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Home, MapPin, Users, Loader2 } from "lucide-react";
import {
  ACCOMMODATION_TYPES,
  COMPENSATION_TYPES,
  FRIENDSHIP_LEVEL_LABEL,
} from "./hearth-surfing/types";

interface HostData {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  hometown_city: string | null;
  hometown_country: string | null;
  hosting_description: string | null;
  accommodation_type: string | null;
  max_guests: number;
  min_friendship_level: string;
  compensation_type_preferred: string[];
}

const labelFor = (list: { value: string; label: string }[], v: string | null) =>
  list.find((x) => x.value === v)?.label || v || "";

export default function PublicHost() {
  const { username } = useParams<{ username: string }>();
  const [host, setHost] = useState<HostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  // Transport/auth failures are not "host not found" — they get a retry.
  const [loadError, setLoadError] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setNotFound(false);
      setLoadError(false);
      // Reset content per target so a failed load never renders the
      // previous host under the new URL.
      setHost(null);
      // og-host emits /host/<uuid> for username-less profiles, and shared
      // links may carry mixed case — accept a raw user id, and match
      // usernames lowercased (they're stored lowercase).
      const handle = (username.startsWith("@") ? username.slice(1) : username).trim();
      const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const baseQuery = supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url, bio, hometown_city, hometown_country");
      const { data: profile, error: profileError } = await (UUID_RE.test(handle)
        ? baseQuery.eq("id", handle)
        : baseQuery.eq("username", handle.toLowerCase())
      ).maybeSingle();

      if (cancelled) return;
      if (profileError) {
        setLoadError(true);
        setLoading(false);
        return;
      }
      if (!profile) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { data: prefs, error: prefsError } = await supabase
        .from("hosting_preferences")
        .select(
          "is_open_to_hosting, is_hosting_paused, hosting_description, accommodation_type, max_guests, min_friendship_level, compensation_type_preferred"
        )
        .eq("user_id", profile.id)
        .maybeSingle();

      if (cancelled) return;
      if (prefsError) {
        setLoadError(true);
        setLoading(false);
        return;
      }

      if (!prefs || !prefs.is_open_to_hosting || prefs.is_hosting_paused) {
        if (!cancelled) {
          setNotFound(true);
          setLoading(false);
        }
        return;
      }

      const comp = Array.isArray(prefs.compensation_type_preferred)
        ? (prefs.compensation_type_preferred as string[])
        : typeof prefs.compensation_type_preferred === "string" && prefs.compensation_type_preferred
        ? [prefs.compensation_type_preferred as string]
        : [];

      if (!cancelled) {
        setHost({
          ...profile,
          hosting_description: prefs.hosting_description,
          accommodation_type: prefs.accommodation_type,
          max_guests: prefs.max_guests ?? 1,
          min_friendship_level: prefs.min_friendship_level,
          compensation_type_preferred: comp,
        });
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [username, reloadTick]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loadError && !host) {
    return (
      <div className="container max-w-xl mx-auto py-16 px-4 text-center">
        <h1 className="text-2xl font-bold mb-2">Couldn't load this host</h1>
        <p className="text-muted-foreground mb-6">
          Something went wrong — probably a connection blip. Try again.
        </p>
        <Button onClick={() => setReloadTick((t) => t + 1)}>Try Again</Button>
      </div>
    );
  }

  if (notFound || !host) {
    return (
      <div className="container max-w-xl mx-auto py-16 px-4 text-center">
        <h1 className="text-2xl font-bold mb-2">Host not found</h1>
        <p className="text-muted-foreground mb-6">
          This person isn't currently hosting on XCROL, or their listing is paused.
        </p>
        <Button asChild>
          <Link to="/hearthsurf">Browse hosts</Link>
        </Button>
      </div>
    );
  }

  const displayName = host.display_name || (host.username ? `@${host.username}` : "Host");
  const location = [host.hometown_city, host.hometown_country].filter(Boolean).join(", ");
  const title = `Stay with ${displayName} on XCROL Hearth Surf`;
  const description = host.hosting_description
    ? host.hosting_description.slice(0, 155)
    : `${displayName} hosts travelers on XCROL.${location ? ` Based in ${location}.` : ""}`;
  const canonical = `https://xcrol.com/host/${host.username || host.id}`;

  return (
    <div className="container max-w-2xl mx-auto py-10 px-4 pt-20">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="profile" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        {host.avatar_url && <meta property="og:image" content={host.avatar_url} />}
      </Helmet>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Avatar className="w-14 h-14">
              <AvatarImage src={host.avatar_url || undefined} />
              <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold leading-tight">{displayName}</h1>
              {location && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" /> {location}
                </p>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {host.bio && <p className="text-sm text-muted-foreground italic">{host.bio}</p>}

          <div className="flex flex-wrap gap-2">
            {host.accommodation_type && (
              <Badge variant="secondary">
                <Home className="w-3 h-3 mr-1" />
                {labelFor(ACCOMMODATION_TYPES, host.accommodation_type)}
              </Badge>
            )}
            <Badge variant="outline">
              <Users className="w-3 h-3 mr-1" />
              Up to {host.max_guests} guest{host.max_guests !== 1 ? "s" : ""}
            </Badge>
            <Badge variant="outline">
              {FRIENDSHIP_LEVEL_LABEL[host.min_friendship_level] || "Open to all friends"}
            </Badge>
          </div>

          {host.hosting_description && (
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm whitespace-pre-line">
              {host.hosting_description}
            </div>
          )}

          {host.compensation_type_preferred.length > 0 && (
            <div className="text-sm">
              <div className="font-medium mb-1">Open to:</div>
              <div className="flex flex-wrap gap-1">
                {host.compensation_type_preferred.map((c) => (
                  <Badge key={c} variant="outline" className="text-xs">
                    {labelFor(COMPENSATION_TYPES, c)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-md border border-dashed border-border bg-muted/20 p-3 text-sm">
            Exact location, contact details, and availability are only revealed inside an
            accepted hosting request. Sign in to request to stay.
          </div>

          <div className="flex gap-2">
            <Button asChild className="flex-1">
              <Link to="/auth">Sign in to request to stay</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/hearthsurf">Browse all hosts</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

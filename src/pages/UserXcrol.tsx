import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scroll, ExternalLink, ArrowLeft, Loader2, Globe, Users, UserCheck, Heart } from "lucide-react";
import { format } from "date-fns";

interface XcrolEntry {
  id: string;
  content: string;
  link: string | null;
  entry_date: string;
  created_at: string;
  privacy_level: string;
}

interface ProfileInfo {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

const PRIVACY_ICONS: Record<string, React.ReactNode> = {
  public: <Globe className="w-3 h-3" />,
  friendly_acquaintance: <Users className="w-3 h-3" />,
  buddy: <UserCheck className="w-3 h-3" />,
  close_friend: <Heart className="w-3 h-3" />,
};

const PRIVACY_LABELS: Record<string, string> = {
  public: "Public",
  friendly_acquaintance: "Friendly Acquaintances+",
  buddy: "Buddies+",
  close_friend: "Close Friends",
};

const UserXcrol = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<XcrolEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileInfo, setProfileInfo] = useState<ProfileInfo | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
    });
  }, []);

  useEffect(() => {
    if (username) {
      loadUserXcrol();
    }
  }, [username, currentUser]);

  const loadUserXcrol = async () => {
    try {
      setLoading(true);

      // First resolve the username to get user ID
      const handle = username?.trim() || "";
      let targetUserId: string | null = null;
      let displayName = handle;

      // Check if it's a username format (starts with @) or display name
      if (handle.startsWith("@")) {
        const normalizedUsername = handle.slice(1).toLowerCase();
        const { data: resolvedId } = await supabase.rpc("resolve_username_to_id", {
          target_username: normalizedUsername,
        });
        targetUserId = resolvedId;
      } else {
        // Try to find by display name
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .ilike("display_name", handle)
          .limit(1);

        if (profiles && profiles.length > 0) {
          targetUserId = profiles[0].id;
          setProfileInfo(profiles[0]);
        }
      }

      if (!targetUserId) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Get profile info if not already set
      if (!profileInfo) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .eq("id", targetUserId)
          .single();
        
        if (profile) {
          setProfileInfo(profile);
          displayName = profile.display_name || displayName;
        }
      }

      // Fetch entries - RLS will filter based on friendship level
      const { data: entriesData, error } = await supabase
        .from("xcrol_entries")
        .select("id, content, link, entry_date, created_at, privacy_level")
        .eq("user_id", targetUserId)
        .order("entry_date", { ascending: false });

      if (error) throw error;
      setEntries(entriesData || []);
    } catch (error) {
      console.error("Error loading user xcrol:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 space-y-4 text-center">
            <Scroll className="w-16 h-16 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold">Xcrol Not Found</h2>
            <p className="text-muted-foreground">
              This user's Xcrol doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={() => navigate(-1)} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName = profileInfo?.display_name || username || "User";

  // Extract the clean username for linking back to profile
  const cleanUsername = username?.startsWith("@") ? username.slice(1) : username;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4 pt-20">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate(`/@${cleanUsername}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Profile
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scroll className="w-6 h-6 text-primary" />
              {displayName}'s Xcrol
            </CardTitle>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No entries visible to you yet.
              </p>
            ) : (
              <div className="space-y-4">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-4 bg-secondary/30 rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{format(new Date(entry.entry_date), "MMMM d, yyyy")}</span>
                      <span className="flex items-center gap-1">
                        {PRIVACY_ICONS[entry.privacy_level]}
                        {PRIVACY_LABELS[entry.privacy_level] || entry.privacy_level}
                      </span>
                    </div>
                    <p className="text-foreground whitespace-pre-wrap">{entry.content}</p>
                    {entry.link && (
                      <a
                        href={entry.link.startsWith("http") ? entry.link : `https://${entry.link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span className="truncate max-w-[200px]">
                          {entry.link.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                        </span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserXcrol;

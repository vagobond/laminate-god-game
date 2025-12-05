import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, MapPin, Link as LinkIcon, ArrowLeft, ExternalLink } from "lucide-react";

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  link: string | null;
  hometown_city: string | null;
  hometown_country: string | null;
}

const PublicProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (userId) {
      loadProfile(userId);
    }
  }, [userId]);

  const loadProfile = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, bio, link, hometown_city, hometown_country")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center">
        <div className="text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 space-y-4 text-center">
            <User className="w-16 h-16 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold">Profile Not Found</h2>
            <p className="text-muted-foreground">
              This profile doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate("/")} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hometown = profile.hometown_city && profile.hometown_country
    ? `${profile.hometown_city}, ${profile.hometown_country}`
    : null;

  const displayName = profile.display_name || "Anonymous Laminater";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4 pt-20">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="overflow-hidden">
          {/* Header Banner */}
          <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-secondary/20" />
          
          <CardContent className="relative pt-0 pb-8">
            {/* Avatar - positioned to overlap banner */}
            <div className="flex justify-center -mt-12 mb-4">
              <Avatar className="w-24 h-24 border-4 border-background shadow-lg" key={profile.avatar_url}>
                <AvatarImage src={profile.avatar_url || undefined} alt={displayName} />
                <AvatarFallback className="text-2xl">
                  {displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Name */}
            <h1 className="text-2xl font-bold text-center mb-2">{displayName}</h1>

            {/* Hometown */}
            {hometown && (
              <button
                onClick={() => navigate("/irl-layer")}
                className="flex items-center justify-center gap-2 text-muted-foreground mb-4 hover:text-primary transition-colors cursor-pointer"
              >
                <MapPin className="w-4 h-4" />
                <span className="hover:underline">{hometown}</span>
              </button>
            )}

            {/* Bio */}
            {profile.bio && (
              <div className="mt-6 p-4 bg-secondary/30 rounded-lg">
                <p className="text-foreground whitespace-pre-wrap">{profile.bio}</p>
              </div>
            )}

            {/* Link */}
            {profile.link && (
              <div className="mt-6 flex justify-center">
                <a
                  href={profile.link.startsWith("http") ? profile.link : `https://${profile.link}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 rounded-full text-primary transition-colors"
                >
                  <LinkIcon className="w-4 h-4" />
                  <span className="truncate max-w-[200px]">
                    {profile.link.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicProfile;

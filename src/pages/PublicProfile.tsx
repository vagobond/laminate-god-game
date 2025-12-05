import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, MapPin, Link as LinkIcon, ArrowLeft, ExternalLink, Phone, Mail, MessageCircle } from "lucide-react";
import AddFriendButton from "@/components/AddFriendButton";
import FriendsList from "@/components/FriendsList";

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  link: string | null;
  hometown_city: string | null;
  hometown_country: string | null;
  whatsapp: string | null;
  phone_number: string | null;
  private_email: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  contact_email: string | null;
}

type FriendshipLevel = "close_friend" | "buddy" | "friendly_acquaintance" | "secret_friend" | null;

const PublicProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [friendshipLevel, setFriendshipLevel] = useState<FriendshipLevel>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (userId) {
      loadProfile(userId);
    }
  }, [userId]);

  useEffect(() => {
    if (currentUser && userId && currentUser.id !== userId) {
      loadFriendshipLevel();
    } else if (currentUser?.id === userId) {
      // Viewing own profile - can see everything
      setFriendshipLevel("close_friend");
    }
  }, [currentUser, userId]);

  const loadFriendshipLevel = async () => {
    if (!currentUser || !userId) return;

    const { data } = await supabase.rpc("get_friendship_level", {
      viewer_id: currentUser.id,
      profile_id: userId,
    });

    setFriendshipLevel(data as FriendshipLevel);
  };

  const loadProfile = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, bio, link, hometown_city, hometown_country, whatsapp, phone_number, private_email, instagram_url, linkedin_url, contact_email")
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

  // Determine what fields to show based on friendship level
  const canSeeCloseFriendFields = friendshipLevel === "close_friend" || friendshipLevel === "secret_friend";
  const canSeeBuddyFields = canSeeCloseFriendFields || friendshipLevel === "buddy";
  const canSeeAcquaintanceFields = canSeeBuddyFields || friendshipLevel === "friendly_acquaintance";

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
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          {userId && <AddFriendButton profileUserId={userId} />}
        </div>

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
                className="flex items-center justify-center gap-2 text-muted-foreground mb-4 hover:text-primary transition-colors cursor-pointer w-full"
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

            {/* Public Link */}
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

            {/* Friend-only Contact Info */}
            {(canSeeAcquaintanceFields || canSeeBuddyFields || canSeeCloseFriendFields) && (
              <div className="mt-6 space-y-3">
                {/* Acquaintance+ fields */}
                {canSeeAcquaintanceFields && (profile.linkedin_url || profile.contact_email) && (
                  <div className="p-4 bg-secondary/20 rounded-lg space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Contact</p>
                    {profile.linkedin_url && (
                      <a
                        href={profile.linkedin_url.startsWith("http") ? profile.linkedin_url : `https://${profile.linkedin_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        LinkedIn
                      </a>
                    )}
                    {profile.contact_email && (
                      <a
                        href={`mailto:${profile.contact_email}`}
                        className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        {profile.contact_email}
                      </a>
                    )}
                  </div>
                )}

                {/* Buddy+ fields */}
                {canSeeBuddyFields && profile.instagram_url && (
                  <div className="p-4 bg-secondary/20 rounded-lg space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Social</p>
                    <a
                      href={profile.instagram_url.startsWith("http") ? profile.instagram_url : `https://${profile.instagram_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Instagram
                    </a>
                  </div>
                )}

                {/* Close friend fields */}
                {canSeeCloseFriendFields && (profile.whatsapp || profile.phone_number || profile.private_email) && (
                  <div className="p-4 bg-primary/10 rounded-lg space-y-2">
                    <p className="text-xs text-primary uppercase tracking-wide">Private Contact</p>
                    {profile.whatsapp && (
                      <a
                        href={`https://wa.me/${profile.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp: {profile.whatsapp}
                      </a>
                    )}
                    {profile.phone_number && (
                      <a
                        href={`tel:${profile.phone_number}`}
                        className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        {profile.phone_number}
                      </a>
                    )}
                    {profile.private_email && (
                      <a
                        href={`mailto:${profile.private_email}`}
                        className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        {profile.private_email}
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Friends List */}
        {userId && (
          <FriendsList 
            userId={userId} 
            viewerId={currentUser?.id || null}
          />
        )}
      </div>
    </div>
  );
};

export default PublicProfile;
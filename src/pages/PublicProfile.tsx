import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, MapPin, Link as LinkIcon, ArrowLeft, ExternalLink, Phone, Mail, MessageCircle, Ban } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import AddFriendButton from "@/components/AddFriendButton";
import FriendsList from "@/components/FriendsList";
import { ProfileGameStats } from "@/components/ProfileGameStats";
import SendMessageDialog from "@/components/SendMessageDialog";
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
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [blocking, setBlocking] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load profile with secure function when we have user context
  useEffect(() => {
    if (userId) {
      // Wait a bit for auth to initialize, then load profile
      loadSecureProfile(userId, currentUser?.id);
    }
  }, [userId, currentUser]);

  const loadSecureProfile = async (profileId: string, viewerId: string | null) => {
    try {
      setLoading(true);
      
      // Use the secure database function that enforces access control
      const { data, error } = await supabase.rpc("get_visible_profile", {
        viewer_id: viewerId ?? null,
        profile_id: profileId,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const profileData = data[0];
        setProfile({
          id: profileData.id,
          display_name: profileData.display_name,
          avatar_url: profileData.avatar_url,
          bio: profileData.bio,
          link: profileData.link,
          hometown_city: profileData.hometown_city,
          hometown_country: profileData.hometown_country,
          whatsapp: profileData.whatsapp,
          phone_number: profileData.phone_number,
          private_email: profileData.private_email,
          instagram_url: profileData.instagram_url,
          linkedin_url: profileData.linkedin_url,
          contact_email: profileData.contact_email,
        });
        // Friendship level is returned from the secure function
        setFriendshipLevel(profileData.friendship_level as FriendshipLevel);
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

  const isOwnProfile = currentUser?.id === userId;

  const handleBlockUser = async () => {
    if (!currentUser || !userId) return;
    
    setBlocking(true);
    try {
      const { error } = await supabase
        .from("user_blocks")
        .insert({
          blocker_id: currentUser.id,
          blocked_id: userId,
        });

      if (error) throw error;

      toast.success(`Blocked ${profile?.display_name || "this user"}`);
      setShowBlockDialog(false);
      navigate("/irl-layer");
    } catch (error) {
      console.error("Error blocking user:", error);
      toast.error("Failed to block user");
    } finally {
      setBlocking(false);
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
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/irl-layer")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex gap-2">
            {userId && friendshipLevel && (
              <SendMessageDialog
                recipientId={userId}
                recipientName={profile?.display_name || "User"}
                friendshipLevel={friendshipLevel}
                availablePlatforms={{
                  linkedin: !!profile?.linkedin_url,
                  email: !!profile?.contact_email,
                  instagram: !!profile?.instagram_url,
                  whatsapp: !!profile?.whatsapp,
                  phone: !!profile?.phone_number,
                }}
              />
            )}
            {userId && <AddFriendButton profileUserId={userId} />}
            {currentUser && !isOwnProfile && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setShowBlockDialog(true)}
              >
                <Ban className="w-4 h-4 mr-2" />
                Block
              </Button>
            )}
          </div>
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

        {/* Mini-Game Stats */}
        {userId && (
          <ProfileGameStats userId={userId} />
        )}
      </div>

      {/* Block User Confirmation Dialog */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block {profile?.display_name || "this user"}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to block this user? They won't be able to see your profile, send you messages, or add you as a friend. You can unblock them later from your profile settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={blocking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlockUser}
              disabled={blocking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {blocking ? "Blocking..." : "Block User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PublicProfile;
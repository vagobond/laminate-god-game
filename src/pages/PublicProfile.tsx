import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, MapPin, Link as LinkIcon, ArrowLeft, ExternalLink, Phone, Mail, MessageCircle, Ban, Pencil, Share2 } from "lucide-react";
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
import { UserReferences } from "@/components/UserReferences";
import { LeaveReferenceDialog } from "@/components/LeaveReferenceDialog";
import { MeetupRequestDialog } from "@/components/MeetupRequestDialog";
import { HostingRequestDialog } from "@/components/HostingRequestDialog";
import { PublicXcrolEntries } from "@/components/PublicXcrolEntries";
import ConnectionDegreeBadge from "@/components/ConnectionDegreeBadge";
import { Coffee, Home } from "lucide-react";
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
  birthday_day: number | null;
  birthday_month: number | null;
  birthday_year: number | null;
  home_address: string | null;
  mailing_address: string | null;
  nicknames: string | null;
}

type FriendshipLevel = "close_friend" | "buddy" | "friendly_acquaintance" | "secret_friend" | null;

const PublicProfile = () => {
  const { userId, username } = useParams<{ userId?: string; username?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [friendshipLevel, setFriendshipLevel] = useState<FriendshipLevel>(null);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);
  const [meetupPrefs, setMeetupPrefs] = useState<any>(null);
  const [hostingPrefs, setHostingPrefs] = useState<any>(null);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [showLoginRequiredModal, setShowLoginRequiredModal] = useState(false);
  const [showInsufficientLevelModal, setShowInsufficientLevelModal] = useState<"meetup" | "hosting" | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Resolve username to userId if needed
  useEffect(() => {
    const resolveUser = async () => {
      if (userId) {
        setResolvedUserId(userId);
        return;
      }

      if (!username) return;

      const normalizedUsername = username.trim().replace(/^@+/, "").toLowerCase();
      if (!normalizedUsername) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Use secure RPC function to resolve username (works without authentication)
      const { data, error } = await supabase.rpc("resolve_username_to_id", {
        target_username: normalizedUsername,
      });

      if (error || !data) {
        console.error("Username resolution failed:", error);
        setNotFound(true);
        setLoading(false);
        return;
      }
      setResolvedUserId(data);
    };
    resolveUser();
  }, [userId, username]);

  // Load profile with secure function when we have user context
  useEffect(() => {
    if (resolvedUserId) {
      loadSecureProfile(resolvedUserId, currentUser?.id);
      loadMeetupHostingPrefs(resolvedUserId);
    }
  }, [resolvedUserId, currentUser]);

  const loadMeetupHostingPrefs = async (profileId: string) => {
    setPrefsLoading(true);
    try {
      const [meetupRes, hostingRes] = await Promise.all([
        supabase.from("meetup_preferences").select("*").eq("user_id", profileId).maybeSingle(),
        supabase.from("hosting_preferences").select("*").eq("user_id", profileId).maybeSingle(),
      ]);

      if (meetupRes.error) console.error("Error loading meetup preferences:", meetupRes.error);
      if (hostingRes.error) console.error("Error loading hosting preferences:", hostingRes.error);

      setMeetupPrefs(meetupRes.data ?? null);
      setHostingPrefs(hostingRes.data ?? null);
    } finally {
      setPrefsLoading(false);
    }
  };

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
          birthday_day: profileData.birthday_day,
          birthday_month: profileData.birthday_month,
          birthday_year: profileData.birthday_year,
          home_address: profileData.home_address,
          mailing_address: profileData.mailing_address,
          nicknames: profileData.nicknames,
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

  const isOwnProfile = currentUser?.id === resolvedUserId;

  // Scroll to hash anchor when page loads
  useEffect(() => {
    if (location.hash !== "#friends") return;
    if (loading) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scrollToFriends = () => {
      const element = document.getElementById("friends");
      if (!element) return;
      element.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    };

    // Scroll on next paint, then again after async content settles.
    requestAnimationFrame(scrollToFriends);
    const t1 = window.setTimeout(scrollToFriends, 250);
    const t2 = window.setTimeout(scrollToFriends, 900);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [location.key, location.hash, loading]);

  const canRequestMeetupOrHosting =
    !!currentUser &&
    !isOwnProfile &&
    (friendshipLevel === "friendly_acquaintance" ||
      friendshipLevel === "buddy" ||
      friendshipLevel === "close_friend" ||
      friendshipLevel === "secret_friend");

  const handleBlockUser = async () => {
    if (!currentUser || !resolvedUserId) return;
    
    setBlocking(true);
    try {
      const { error } = await supabase
        .from("user_blocks")
        .insert({
          blocker_id: currentUser.id,
          blocked_id: resolvedUserId,
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

  const displayName = profile.display_name || "Anonymous Xcroler";

  const profileUrl = typeof window !== 'undefined' ? window.location.href : '';
  const metaDescription = profile.bio 
    ? profile.bio.slice(0, 155) + (profile.bio.length > 155 ? '...' : '')
    : `View ${displayName}'s profile on XCROL`;

  return (
    <>
      <Helmet>
        <title>{displayName} | XCROL</title>
        <meta name="description" content={metaDescription} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="profile" />
        <meta property="og:title" content={`${displayName} | XCROL`} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={profileUrl} />
        {profile.avatar_url && <meta property="og:image" content={profile.avatar_url} />}
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={`${displayName} | XCROL`} />
        <meta name="twitter:description" content={metaDescription} />
        {profile.avatar_url && <meta name="twitter:image" content={profile.avatar_url} />}
        
        {/* Profile specific */}
        {hometown && <meta property="profile:hometown" content={hometown} />}
      </Helmet>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const ogUrl = username 
                  ? `https://ceuaibqpikcvcnmuesos.supabase.co/functions/v1/og-profile?username=${username.replace(/^@/, '')}`
                  : `https://ceuaibqpikcvcnmuesos.supabase.co/functions/v1/og-profile?userId=${resolvedUserId}`;
                navigator.clipboard.writeText(ogUrl);
                toast.success("Profile link copied! Share it anywhere for a nice preview.");
              }}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            {isOwnProfile && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate("/profile")}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
            {resolvedUserId && friendshipLevel && (
              <SendMessageDialog
                recipientId={resolvedUserId}
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
            {resolvedUserId && <AddFriendButton profileUserId={resolvedUserId} />}
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

            {/* Name and Connection Degree */}
            <div className="text-center mb-2">
              <h1 className="text-2xl font-bold">{displayName}</h1>
              {!isOwnProfile && resolvedUserId && (
                <div className="mt-2 flex justify-center">
                  <ConnectionDegreeBadge 
                    profileId={resolvedUserId} 
                    currentUserId={currentUser?.id || null} 
                  />
                </div>
              )}
            </div>

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

            {/* Nicknames */}
            {profile.nicknames && (
              <p className="text-center text-muted-foreground italic">
                aka "{profile.nicknames}"
              </p>
            )}

            {/* Birthday */}
            {(profile.birthday_month && profile.birthday_day) && (
              <p className="text-center text-sm text-muted-foreground">
                🎂 {new Date(2000, profile.birthday_month - 1, profile.birthday_day).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                {profile.birthday_year && `, ${profile.birthday_year}`}
              </p>
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
                {canSeeCloseFriendFields && (profile.whatsapp || profile.phone_number || profile.private_email || profile.home_address || profile.mailing_address) && (
                  <div className="p-4 bg-primary/10 rounded-lg space-y-2">
                    <p className="text-xs text-primary uppercase tracking-wide">Private Contact</p>
                    {profile.home_address && (
                      <p className="flex items-center gap-2 text-sm text-foreground">
                        🏠 {profile.home_address}
                      </p>
                    )}
                    {profile.mailing_address && (
                      <p className="flex items-center gap-2 text-sm text-foreground">
                        📬 {profile.mailing_address}
                      </p>
                    )}
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

        {/* Public Xcrol Entries */}
        {resolvedUserId && (
          <PublicXcrolEntries userId={resolvedUserId} username={displayName} />
        )}

        {/* Meetup & Hosting Section */}
        {resolvedUserId && (prefsLoading || meetupPrefs?.is_open_to_meetups || hostingPrefs?.is_open_to_hosting || isOwnProfile) && (
          <Card>
            <CardContent className="pt-6">
              {prefsLoading ? (
                <p className="text-center text-muted-foreground text-sm">Loading meetups & hosting…</p>
              ) : isOwnProfile ? (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-center">Meetups & Hosting</h2>
                  <div className="flex flex-wrap gap-4 justify-center">
                    {meetupPrefs?.is_open_to_meetups && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-secondary/30 rounded-lg">
                        <Coffee className="w-4 h-4 text-primary" />
                        <span>Open to Meetups</span>
                      </div>
                    )}
                    {hostingPrefs?.is_open_to_hosting && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-secondary/30 rounded-lg">
                        <Home className="w-4 h-4 text-primary" />
                        <span>Open to Hosting</span>
                      </div>
                    )}
                  </div>

                  {!meetupPrefs?.is_open_to_meetups && !hostingPrefs?.is_open_to_hosting && (
                    <p className="text-center text-muted-foreground text-sm">
                      You haven't enabled meetups or hosting. Go to your{" "}
                      <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/profile")}>
                        profile settings
                      </Button>
                      .
                    </p>
                  )}

                  {meetupPrefs?.meetup_description && (
                    <p className="text-sm text-muted-foreground text-center italic">
                      Meetups: "{meetupPrefs.meetup_description}"
                    </p>
                  )}
                  {hostingPrefs?.hosting_description && (
                    <p className="text-sm text-muted-foreground text-center italic">
                      Hosting: "{hostingPrefs.hosting_description}"
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-center">Meetups & Hosting</h2>

                  <div className="flex flex-wrap gap-4 justify-center">
                    {meetupPrefs?.is_open_to_meetups && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-secondary/30 rounded-lg">
                        <Coffee className="w-4 h-4 text-primary" />
                        <span>Open to Meetups</span>
                      </div>
                    )}
                    {hostingPrefs?.is_open_to_hosting && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-secondary/30 rounded-lg">
                        <Home className="w-4 h-4 text-primary" />
                        <span>Open to Hosting</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 justify-center">
                    {meetupPrefs?.is_open_to_meetups && (
                      <div className="text-center">
                        {canRequestMeetupOrHosting ? (
                          <MeetupRequestDialog recipientId={resolvedUserId} recipientName={profile?.display_name || "User"} />
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (!currentUser) {
                                setShowLoginRequiredModal(true);
                              } else {
                                setShowInsufficientLevelModal("meetup");
                              }
                            }}
                          >
                            <Coffee className="w-4 h-4 mr-2" />
                            Request Meetup
                          </Button>
                        )}
                        {meetupPrefs.meetup_description && (
                          <p className="text-xs text-muted-foreground mt-2 max-w-xs">
                            {meetupPrefs.meetup_description}
                          </p>
                        )}
                      </div>
                    )}
                    {hostingPrefs?.is_open_to_hosting && (
                      <div className="text-center">
                        {canRequestMeetupOrHosting ? (
                          <HostingRequestDialog recipientId={resolvedUserId} recipientName={profile?.display_name || "User"} />
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (!currentUser) {
                                setShowLoginRequiredModal(true);
                              } else {
                                setShowInsufficientLevelModal("hosting");
                              }
                            }}
                          >
                            <Home className="w-4 h-4 mr-2" />
                            Request to Stay
                          </Button>
                        )}
                        {hostingPrefs.hosting_description && (
                          <p className="text-xs text-muted-foreground mt-2 max-w-xs">
                            {hostingPrefs.hosting_description}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* References Section */}
        {resolvedUserId && (
          <div className="space-y-4">
            <UserReferences userId={resolvedUserId} isOwnProfile={isOwnProfile} />
            {currentUser && !isOwnProfile && friendshipLevel && (
              <LeaveReferenceDialog
                recipientId={resolvedUserId}
                recipientName={profile?.display_name || "User"}
              />
            )}
          </div>
        )}

        {/* Friends List */}
        {resolvedUserId && (
          <div id="friends" className="scroll-mt-24">
            <FriendsList 
              userId={resolvedUserId} 
              viewerId={currentUser?.id || null}
            />
          </div>
        )}

        {/* Mini-Game Stats */}
        {resolvedUserId && (
          <ProfileGameStats userId={resolvedUserId} />
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

      {/* Login Required Modal */}
      <AlertDialog open={showLoginRequiredModal} onOpenChange={setShowLoginRequiredModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Account Required</AlertDialogTitle>
            <AlertDialogDescription>
              You need to create a free account to request meetups and hosting. Join our community to connect with travelers around the world!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate("/auth")}>
              Sign Up Free
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Insufficient Friendship Level Modal */}
      <AlertDialog open={!!showInsufficientLevelModal} onOpenChange={() => setShowInsufficientLevelModal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Friendship Level Required</AlertDialogTitle>
            <AlertDialogDescription>
              You don't have the required friendship trust level to send a {showInsufficientLevelModal} request to {profile?.display_name || "this user"}. 
              Build your connection first by becoming friends at the "friendly acquaintance" level or higher.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowInsufficientLevelModal(null)}>
              Got it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </>
  );
};

export default PublicProfile;
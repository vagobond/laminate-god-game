import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, ArrowLeft } from "lucide-react";
import { usePublicProfileData } from "@/components/public-profile/usePublicProfileData";
import { ProfileActionBar } from "@/components/public-profile/ProfileActionBar";
import { ProfileInfoCard } from "@/components/public-profile/ProfileInfoCard";
import { MeetupHostingSection } from "@/components/public-profile/MeetupHostingSection";
import ProfileFriendsList from "@/components/ProfileFriendsList";
import { ProfileGameStats } from "@/components/ProfileGameStats";
import { UserReferences } from "@/components/UserReferences";
import { LeaveReferenceDialog } from "@/components/LeaveReferenceDialog";
import { PublicXcrolEntries } from "@/components/PublicXcrolEntries";
import { ProfileWidgetsDisplay } from "@/components/ProfileWidgetsDisplay";

const PublicProfile = () => {
  const navigate = useNavigate();
  const data = usePublicProfileData();
  const {
    profile,
    loading,
    notFound,
    friendshipLevel,
    resolvedUserId,
    meetupPrefs,
    hostingPrefs,
    prefsLoading,
    currentUser,
    username,
    isOwnProfile,
    canSeeAcquaintanceFields,
    canSeeBuddyFields,
    canSeeCloseFriendFields,
    canRequestMeetupOrHosting,
    displayName,
    hometown,
  } = data;

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

  const profileUrl = typeof window !== "undefined" ? window.location.href : "";
  const metaDescription = profile.bio
    ? profile.bio.slice(0, 155) + (profile.bio.length > 155 ? "..." : "")
    : `View ${displayName}'s profile on XCROL`;

  return (
    <>
      <Helmet>
        <title>{displayName} | XCROL</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:type" content="profile" />
        <meta property="og:title" content={`${displayName} | XCROL`} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={profileUrl} />
        {profile.avatar_url && <meta property="og:image" content={profile.avatar_url} />}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={`${displayName} | XCROL`} />
        <meta name="twitter:description" content={metaDescription} />
        {profile.avatar_url && <meta name="twitter:image" content={profile.avatar_url} />}
        {hometown && <meta property="profile:hometown" content={hometown} />}
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4 pt-20">
        <div className="max-w-2xl mx-auto space-y-6">
          <ProfileActionBar
            profile={profile}
            resolvedUserId={resolvedUserId!}
            username={username}
            isOwnProfile={isOwnProfile}
            currentUserId={currentUser?.id || null}
            friendshipLevel={friendshipLevel}
          />

          <ProfileInfoCard
            profile={profile}
            displayName={displayName}
            hometown={hometown}
            isOwnProfile={isOwnProfile}
            resolvedUserId={resolvedUserId!}
            currentUserId={currentUser?.id || null}
            canSeeAcquaintanceFields={canSeeAcquaintanceFields}
            canSeeBuddyFields={canSeeBuddyFields}
            canSeeCloseFriendFields={canSeeCloseFriendFields}
          />

          {/* Public Xcrol Entries */}
          {resolvedUserId && (
            <PublicXcrolEntries userId={resolvedUserId} username={displayName} />
          )}

          {/* Meetup & Hosting Section */}
          {resolvedUserId && (
            <MeetupHostingSection
              resolvedUserId={resolvedUserId}
              profileName={profile.display_name || "User"}
              isOwnProfile={isOwnProfile}
              prefsLoading={prefsLoading}
              meetupPrefs={meetupPrefs}
              hostingPrefs={hostingPrefs}
              canRequestMeetupOrHosting={canRequestMeetupOrHosting}
              isLoggedIn={!!currentUser}
            />
          )}

          {/* References Section */}
          {resolvedUserId && (
            <div className="space-y-4">
              <UserReferences userId={resolvedUserId} isOwnProfile={isOwnProfile} />
              {currentUser && !isOwnProfile && friendshipLevel && (
                <LeaveReferenceDialog
                  recipientId={resolvedUserId}
                  recipientName={profile.display_name || "User"}
                />
              )}
            </div>
          )}

          {/* Friends List */}
          {resolvedUserId && (
            <div id="friends" className="scroll-mt-24">
              <ProfileFriendsList
                userId={resolvedUserId}
                viewerId={currentUser?.id || null}
              />
            </div>
          )}

          {/* Profile Widgets */}
          {resolvedUserId && (
            <ProfileWidgetsDisplay
              userId={resolvedUserId}
              username={username?.replace(/^@/, "") || null}
              viewerFriendshipLevel={friendshipLevel}
              isOwnProfile={isOwnProfile}
            />
          )}

          {/* Mini-Game Stats */}
          {resolvedUserId && (
            <ProfileGameStats userId={resolvedUserId} />
          )}
        </div>
      </div>
    </>
  );
};

export default PublicProfile;

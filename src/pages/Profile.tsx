import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useProfileData } from "@/components/profile/useProfileData";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { XcrolPrompt } from "@/components/XcrolPrompt";
import { ProfileCompleteness } from "@/components/ProfileCompleteness";
import { ProfileWidgetsManager } from "@/components/ProfileWidgetsManager";
import { CustomFriendshipTypeManager } from "@/components/CustomFriendshipTypeManager";
import { MeetupPreferencesManager } from "@/components/MeetupPreferencesManager";
import { HostingPreferencesManager } from "@/components/HostingPreferencesManager";
import IntroductionRequestsManager from "@/components/IntroductionRequestsManager";
import ProfileFriendsList from "@/components/ProfileFriendsList";
import { UserReferences } from "@/components/UserReferences";
import { ProfileGameStats } from "@/components/ProfileGameStats";
import BlockedUsersManager from "@/components/BlockedUsersManager";

const Profile = () => {
  const navigate = useNavigate();
  const data = useProfileData();
  const {
    user,
    profile,
    loading,
    saving,
    displayName,
    setDisplayName,
    username,
    usernameError,
    handleUsernameChange,
    avatarUrl,
    bio,
    setBio,
    link,
    setLink,
    contactData,
    handleContactChange,
    personalInfo,
    setPersonalInfo,
    handleSave,
    handleAvatarUpload,
    hometown,
  } = data;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Sign In Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              Please sign in to view and edit your profile.
            </p>
            <Button onClick={() => navigate("/auth")} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const copyProfileLink = () => {
    const profileUrl = username
      ? `${window.location.origin}/@${username}`
      : `${window.location.origin}/u/${user.id}`;
    navigator.clipboard.writeText(profileUrl);
    toast.success("Profile link copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4 pt-20">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => navigate("/powers")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(username ? `/@${username}` : `/u/${user.id}`)}
            >
              <Eye className="w-4 h-4 mr-2" />
              View Profile
            </Button>
            <Button variant="outline" size="sm" onClick={copyProfileLink}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Xcrol Prompt */}
        <XcrolPrompt userId={user.id} />

        {/* Profile Completeness */}
        <ProfileCompleteness
          profile={{
            display_name: displayName,
            username,
            avatar_url: avatarUrl,
            bio,
            link,
            hometown_city: profile?.hometown_city || null,
            birthday_month: personalInfo.birthday_month,
            whatsapp: contactData.whatsapp || null,
            phone_number: contactData.phone_number || null,
            private_email: contactData.private_email || null,
            instagram_url: contactData.instagram_url || null,
            linkedin_url: contactData.linkedin_url || null,
            nicknames: personalInfo.nicknames,
          }}
        />

        {/* Profile Edit Form */}
        <ProfileEditForm
          userId={user.id}
          profile={profile}
          displayName={displayName}
          setDisplayName={setDisplayName}
          username={username}
          usernameError={usernameError}
          handleUsernameChange={handleUsernameChange}
          avatarUrl={avatarUrl}
          bio={bio}
          setBio={setBio}
          link={link}
          setLink={setLink}
          contactData={contactData}
          handleContactChange={handleContactChange}
          personalInfo={personalInfo}
          setPersonalInfo={setPersonalInfo}
          saving={saving}
          handleSave={handleSave}
          handleAvatarUpload={handleAvatarUpload}
          hometown={hometown}
        />

        {/* Profile Widgets */}
        <Card>
          <CardContent className="pt-6">
            <ProfileWidgetsManager userId={user.id} username={username || null} />
          </CardContent>
        </Card>

        {/* Custom Friendship Type */}
        <CustomFriendshipTypeManager userId={user.id} />

        {/* Meetup & Hosting Preferences */}
        <div className="grid gap-6 md:grid-cols-2">
          <MeetupPreferencesManager userId={user.id} />
          <HostingPreferencesManager userId={user.id} />
        </div>

        {/* Introduction Requests */}
        <IntroductionRequestsManager userId={user.id} />

        {/* Friends List */}
        <div id="friends" className="scroll-mt-6">
          <ProfileFriendsList userId={user.id} viewerId={user.id} />
        </div>

        {/* References */}
        <UserReferences userId={user.id} isOwnProfile={true} />

        {/* Mini-Game Stats */}
        <ProfileGameStats userId={user.id} />

        {/* Blocked Users Manager */}
        <BlockedUsersManager />
      </div>
    </div>
  );
};

export default Profile;

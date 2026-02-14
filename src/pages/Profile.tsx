import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { User, MapPin, Link as LinkIcon, Save, ArrowLeft, Upload, Loader2, Eye, Share2, Pencil } from "lucide-react";
import BlockedUsersManager from "@/components/BlockedUsersManager";
import ProfileFriendsList from "@/components/ProfileFriendsList";
import { ProfileGameStats } from "@/components/ProfileGameStats";
import { SocialLinksManager } from "@/components/SocialLinksManager";
import { PersonalInfoManager, PersonalInfoData, VisibilityLevel } from "@/components/PersonalInfoManager";
import { MeetupPreferencesManager } from "@/components/MeetupPreferencesManager";
import { HostingPreferencesManager } from "@/components/HostingPreferencesManager";
import { UserReferences } from "@/components/UserReferences";
import { ProfileCompleteness } from "@/components/ProfileCompleteness";
import { CustomFriendshipTypeManager } from "@/components/CustomFriendshipTypeManager";
import { XcrolPrompt } from "@/components/XcrolPrompt";
import IntroductionRequestsManager from "@/components/IntroductionRequestsManager";
import { ProfileWidgetsManager } from "@/components/ProfileWidgetsManager";
import { z } from "zod";

// Validation constants
const MAX_DISPLAY_NAME_LENGTH = 50;
const MAX_BIO_LENGTH = 1000;
const MAX_LINK_LENGTH = 200;
const MAX_PHONE_LENGTH = 20;
const MAX_EMAIL_LENGTH = 255;
const MAX_URL_LENGTH = 200;
const MAX_ADDRESS_LENGTH = 500;
const MAX_NICKNAMES_LENGTH = 200;

// Validation schemas
const urlSchema = z.string().max(MAX_URL_LENGTH, "URL is too long").optional().or(z.literal(""));
const emailSchema = z.string().email("Invalid email format").max(MAX_EMAIL_LENGTH, "Email is too long").optional().or(z.literal(""));
const phoneSchema = z.string().max(MAX_PHONE_LENGTH, "Phone number is too long").optional().or(z.literal(""));


interface Profile {
  id: string;
  display_name: string | null;
  username: string | null;
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
  birthday_no_year_visibility: VisibilityLevel;
  birthday_year_visibility: VisibilityLevel;
  home_address_visibility: VisibilityLevel;
  mailing_address_visibility: VisibilityLevel;
  nicknames_visibility: VisibilityLevel;
}

interface ProfileContactData {
  whatsapp: string;
  phone_number: string;
  private_email: string;
  instagram_url: string;
  linkedin_url: string;
  contact_email: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [link, setLink] = useState("");
  
  // Contact fields for friend-only information
  const [contactData, setContactData] = useState<ProfileContactData>({
    whatsapp: "",
    phone_number: "",
    private_email: "",
    instagram_url: "",
    linkedin_url: "",
    contact_email: "",
  });

  // Personal info fields with visibility controls
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoData>({
    birthday_day: null,
    birthday_month: null,
    birthday_year: null,
    home_address: null,
    mailing_address: null,
    nicknames: null,
    birthday_no_year_visibility: "buddy",
    birthday_year_visibility: "close_friend",
    home_address_visibility: "close_friend",
    mailing_address_visibility: "close_friend",
    nicknames_visibility: "friendly_acquaintance",
  });

  const handleContactChange = (field: keyof ProfileContactData, value: string) => {
    setContactData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    loadProfile(user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]);

  // Scroll to hash anchor (e.g., #friends)
  useEffect(() => {
    if (location.hash && !loading) {
      const elementId = location.hash.slice(1);
      setTimeout(() => {
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 400);
    }
  }, [location.hash, loading]);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const profileData = data as unknown as Profile;
        setProfile(profileData);
        setDisplayName(profileData.display_name || "");
        setUsername(profileData.username || "");
        setAvatarUrl(profileData.avatar_url || "");
        setBio(profileData.bio || "");
        setLink(profileData.link || "");
        setContactData({
          whatsapp: profileData.whatsapp || "",
          phone_number: profileData.phone_number || "",
          private_email: profileData.private_email || "",
          instagram_url: profileData.instagram_url || "",
          linkedin_url: profileData.linkedin_url || "",
          contact_email: profileData.contact_email || "",
        });
        setPersonalInfo({
          birthday_day: profileData.birthday_day,
          birthday_month: profileData.birthday_month,
          birthday_year: profileData.birthday_year,
          home_address: profileData.home_address,
          mailing_address: profileData.mailing_address,
          nicknames: profileData.nicknames,
          birthday_no_year_visibility: (profileData.birthday_no_year_visibility as VisibilityLevel) || "buddy",
          birthday_year_visibility: (profileData.birthday_year_visibility as VisibilityLevel) || "close_friend",
          home_address_visibility: (profileData.home_address_visibility as VisibilityLevel) || "close_friend",
          mailing_address_visibility: (profileData.mailing_address_visibility as VisibilityLevel) || "close_friend",
          nicknames_visibility: (profileData.nicknames_visibility as VisibilityLevel) || "friendly_acquaintance",
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      console.log("Uploading to path:", filePath);

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      console.log("Upload successful:", uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      console.log("Public URL:", publicUrl);

      // Add cache-busting query param
      const urlWithTimestamp = `${publicUrl}?t=${Date.now()}`;
      console.log("URL with timestamp:", urlWithTimestamp);
      
      setAvatarUrl(urlWithTimestamp);

      // Save to profile immediately
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlWithTimestamp })
        .eq("id", user.id);

      if (updateError) {
        console.error("Profile update error:", updateError);
        throw updateError;
      }

      console.log("Profile updated successfully");
      toast.success("Avatar uploaded successfully!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const validateUsername = (value: string): string | null => {
    if (!value) return null; // Empty is allowed
    if (value.length < 2) return "Username must be at least 2 characters";
    if (value.length > 30) return "Username must be less than 30 characters";
    if (!/^[a-z0-9_]+$/.test(value)) return "Only lowercase letters, numbers, and underscores allowed";
    return null;
  };

  const handleUsernameChange = (value: string) => {
    const lowercased = value.toLowerCase();
    setUsername(lowercased);
    setUsernameError(validateUsername(lowercased));
  };

  const validateProfileData = (): boolean => {
    // Validate username
    const usernameValidation = validateUsername(username);
    if (usernameValidation) {
      toast.error(usernameValidation);
      return false;
    }

    // Validate display name
    if (displayName.length > MAX_DISPLAY_NAME_LENGTH) {
      toast.error(`Name must be less than ${MAX_DISPLAY_NAME_LENGTH} characters`);
      return false;
    }

    // Validate email fields
    if (contactData.private_email) {
      const result = emailSchema.safeParse(contactData.private_email);
      if (!result.success) {
        toast.error("Invalid private email format");
        return false;
      }
    }

    if (contactData.contact_email) {
      const result = emailSchema.safeParse(contactData.contact_email);
      if (!result.success) {
        toast.error("Invalid contact email format");
        return false;
      }
    }

    // Validate phone fields
    if (contactData.phone_number && contactData.phone_number.length > MAX_PHONE_LENGTH) {
      toast.error(`Phone number must be less than ${MAX_PHONE_LENGTH} characters`);
      return false;
    }

    if (contactData.whatsapp && contactData.whatsapp.length > MAX_PHONE_LENGTH) {
      toast.error(`WhatsApp number must be less than ${MAX_PHONE_LENGTH} characters`);
      return false;
    }

    // Validate URL fields
    if (contactData.instagram_url && contactData.instagram_url.length > MAX_URL_LENGTH) {
      toast.error(`Instagram URL must be less than ${MAX_URL_LENGTH} characters`);
      return false;
    }

    if (contactData.linkedin_url && contactData.linkedin_url.length > MAX_URL_LENGTH) {
      toast.error(`LinkedIn URL must be less than ${MAX_URL_LENGTH} characters`);
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate before saving
    if (!validateProfileData()) {
      return;
    }

    setSaving(true);
    try {
      // Only include username in update if it hasn't been set yet
      const updateData: Record<string, unknown> = {
        display_name: displayName.trim().slice(0, MAX_DISPLAY_NAME_LENGTH),
        avatar_url: avatarUrl,
        bio: bio.trim().slice(0, MAX_BIO_LENGTH),
        link: link.trim().slice(0, MAX_LINK_LENGTH) || null,
        whatsapp: contactData.whatsapp.trim().slice(0, MAX_PHONE_LENGTH) || null,
        phone_number: contactData.phone_number.trim().slice(0, MAX_PHONE_LENGTH) || null,
        private_email: contactData.private_email.trim().slice(0, MAX_EMAIL_LENGTH) || null,
        instagram_url: contactData.instagram_url.trim().slice(0, MAX_URL_LENGTH) || null,
        linkedin_url: contactData.linkedin_url.trim().slice(0, MAX_URL_LENGTH) || null,
        contact_email: contactData.contact_email.trim().slice(0, MAX_EMAIL_LENGTH) || null,
        // Personal info fields
        birthday_day: personalInfo.birthday_day,
        birthday_month: personalInfo.birthday_month,
        birthday_year: personalInfo.birthday_year,
        home_address: personalInfo.home_address?.trim().slice(0, MAX_ADDRESS_LENGTH) || null,
        mailing_address: personalInfo.mailing_address?.trim().slice(0, MAX_ADDRESS_LENGTH) || null,
        nicknames: personalInfo.nicknames?.trim().slice(0, MAX_NICKNAMES_LENGTH) || null,
        birthday_no_year_visibility: personalInfo.birthday_no_year_visibility,
        birthday_year_visibility: personalInfo.birthday_year_visibility,
        home_address_visibility: personalInfo.home_address_visibility,
        mailing_address_visibility: personalInfo.mailing_address_visibility,
        nicknames_visibility: personalInfo.nicknames_visibility,
      };

      // Only allow username to be set if not already set
      if (!profile?.username && username.trim()) {
        updateData.username = username.trim();
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (error) {
        if (error.code === '23505') {
          toast.error("This username is already taken");
          return;
        }
        throw error;
      }

      toast.success("Profile saved successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

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

  const hometown = profile?.hometown_city && profile?.hometown_country
    ? `${profile.hometown_city}, ${profile.hometown_country}`
    : null;

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
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/powers")}
          >
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
            <Button 
              variant="outline" 
              size="sm"
              onClick={copyProfileLink}
            >
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

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Your Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="w-24 h-24" key={avatarUrl}>
                  <AvatarImage src={avatarUrl} alt={displayName || "Profile"} optimizeSize={256} />
                  <AvatarFallback>
                    <User className="w-12 h-12 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarUpload}
                accept="image/*"
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? "Uploading..." : "Upload Avatar"}
              </Button>
            </div>

            {/* Name */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Name
              </label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            {/* Username */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Username
              </label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">@</span>
                <Input
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="your_username"
                  className={usernameError ? "border-destructive" : ""}
                  disabled={!!profile?.username}
                />
              </div>
              {profile?.username ? (
                <p className="text-sm text-muted-foreground mt-1">
                  Usernames cannot be changed once set. Your profile is at xcrol.com/@{username}
                </p>
              ) : (
                <>
                  {usernameError && (
                    <p className="text-sm text-destructive mt-1">{usernameError}</p>
                  )}
                  {username && !usernameError && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Your profile will be available at xcrol.com/@{username}
                    </p>
                  )}
                </>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Hometown
              </label>
              {hometown ? (
                <div className="flex items-center gap-2">
                  <div className="p-3 bg-secondary/50 rounded-md text-foreground flex-1">
                    {hometown}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate("/irl-layer")}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="p-3 bg-secondary/30 rounded-md text-muted-foreground italic">
                  <span>No hometown claimed yet. </span>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-primary"
                    onClick={() => navigate("/irl-layer")}
                  >
                    Claim your hometown on The IRL Layer
                  </Button>
                </div>
              )}
            </div>

            {/* About Me */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                About Me
              </label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about you. What are your passions? What are your special skills? What is your mission in life?"
                className="min-h-[120px]"
              />
            </div>

            {/* Link */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Your Link
              </label>
              <Input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="What is the most important link to get to know you?"
              />
            </div>

            {/* Personal Information with Visibility Controls */}
            <div className="pt-4 border-t border-border">
              <PersonalInfoManager
                userId={user.id}
                data={personalInfo}
                onChange={setPersonalInfo}
              />
            </div>

            {/* Contact Info & Social Links by Friendship Level */}
            <div className="pt-4 border-t border-border">
              <SocialLinksManager 
                userId={user.id} 
                profileData={contactData}
                onProfileChange={handleContactChange}
              />
            </div>

            {/* Save Button */}
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="w-full"
              size="lg"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </CardContent>
        </Card>

        {/* Profile Widgets */}
        {user && (
          <Card>
            <CardContent className="pt-6">
              <ProfileWidgetsManager userId={user.id} username={username || null} />
            </CardContent>
          </Card>
        )}

        {/* Custom Friendship Type */}
        {user && (
          <CustomFriendshipTypeManager userId={user.id} />
        )}

        {/* Meetup & Hosting Preferences */}
        {user && (
          <div className="grid gap-6 md:grid-cols-2">
            <MeetupPreferencesManager userId={user.id} />
            <HostingPreferencesManager userId={user.id} />
          </div>
        )}

        {/* Introduction Requests */}
        {user && (
          <IntroductionRequestsManager userId={user.id} />
        )}

        {/* Friends List */}
        {user && (
          <div id="friends" className="scroll-mt-6">
            <ProfileFriendsList userId={user.id} viewerId={user.id} />
          </div>
        )}

        {/* References */}
        {user && (
          <UserReferences userId={user.id} isOwnProfile={true} />
        )}

        {/* Mini-Game Stats */}
        {user && (
          <ProfileGameStats userId={user.id} />
        )}

        {/* Blocked Users Manager */}
        <BlockedUsersManager />
      </div>
    </div>
  );
};

export default Profile;

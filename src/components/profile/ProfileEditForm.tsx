import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { User, MapPin, Link as LinkIcon, Save, Upload, Loader2, Pencil } from "lucide-react";
import { PersonalInfoManager } from "@/components/PersonalInfoManager";
import { SocialLinksManager } from "@/components/SocialLinksManager";
import { toast } from "sonner";
import type { ProfileData, ProfileContactData, PersonalInfoState } from "./useProfileData";
import type { PersonalInfoData } from "@/components/PersonalInfoManager";

interface ProfileEditFormProps {
  userId: string;
  profile: ProfileData | null;
  displayName: string;
  setDisplayName: (v: string) => void;
  username: string;
  usernameError: string | null;
  handleUsernameChange: (v: string) => void;
  avatarUrl: string;
  bio: string;
  setBio: (v: string) => void;
  link: string;
  setLink: (v: string) => void;
  contactData: ProfileContactData;
  handleContactChange: (field: keyof ProfileContactData, value: string) => void;
  personalInfo: PersonalInfoState;
  setPersonalInfo: (v: PersonalInfoState) => void;
  saving: boolean;
  handleSave: () => void;
  handleAvatarUpload: (file: File) => Promise<void>;
  hometown: string | null;
}

export const ProfileEditForm = ({
  userId,
  profile,
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
  saving,
  handleSave,
  handleAvatarUpload,
  hometown,
}: ProfileEditFormProps) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await handleAvatarUpload(file);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  return (
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
            onChange={onFileChange}
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
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Name</label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
          />
        </div>

        {/* Username */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Username</label>
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
              {usernameError && <p className="text-sm text-destructive mt-1">{usernameError}</p>}
              {username && !usernameError && (
                <p className="text-sm text-muted-foreground mt-1">
                  Your profile will be available at xcrol.com/@{username}
                </p>
              )}
            </>
          )}
        </div>

        {/* Hometown */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Hometown
          </label>
          {hometown ? (
            <div className="flex items-center gap-2">
              <div className="p-3 bg-secondary/50 rounded-md text-foreground flex-1">{hometown}</div>
              <Button variant="outline" size="sm" onClick={() => navigate("/irl-layer")}>
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
          <label className="text-sm font-medium text-muted-foreground mb-2 block">About Me</label>
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
            userId={userId}
            data={personalInfo as PersonalInfoData}
            onChange={setPersonalInfo as (data: PersonalInfoData) => void}
          />
        </div>

        {/* Contact Info & Social Links by Friendship Level */}
        <div className="pt-4 border-t border-border">
          <SocialLinksManager
            userId={userId}
            profileData={contactData}
            onProfileChange={handleContactChange}
          />
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </CardContent>
    </Card>
  );
};

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { User, MapPin, Link as LinkIcon, Save, ArrowLeft, Upload, Loader2, Eye, Share2 } from "lucide-react";

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

const Profile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [link, setLink] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [privateEmail, setPrivateEmail] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, bio, link, hometown_city, hometown_country, whatsapp, phone_number, private_email, instagram_url, linkedin_url, contact_email")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || "");
        setAvatarUrl(data.avatar_url || "");
        setBio(data.bio || "");
        setLink(data.link || "");
        setWhatsapp(data.whatsapp || "");
        setPhoneNumber(data.phone_number || "");
        setPrivateEmail(data.private_email || "");
        setInstagramUrl(data.instagram_url || "");
        setLinkedinUrl(data.linkedin_url || "");
        setContactEmail(data.contact_email || "");
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

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          avatar_url: avatarUrl,
          bio: bio,
          link: link,
          whatsapp: whatsapp || null,
          phone_number: phoneNumber || null,
          private_email: privateEmail || null,
          instagram_url: instagramUrl || null,
          linkedin_url: linkedinUrl || null,
          contact_email: contactEmail || null,
        })
        .eq("id", user.id);

      if (error) throw error;

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
    const profileUrl = `${window.location.origin}/u/${user.id}`;
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
              onClick={() => navigate(`/u/${user.id}`)}
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

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Your Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="w-24 h-24" key={avatarUrl}>
                  <AvatarImage src={avatarUrl} alt={displayName || "Profile"} />
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

            {/* Hometown (Read-only, from IRL Layer) */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Hometown
              </label>
              {hometown ? (
                <div className="p-3 bg-secondary/50 rounded-md text-foreground">
                  {hometown}
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
                placeholder="Tell the Laminate about you. What are your passions? What are your special skills? What is your mission in life?"
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

            {/* Friend-only Fields Section */}
            <div className="pt-4 border-t border-border">
              <h3 className="text-lg font-semibold mb-4">Friend-Only Information</h3>
              <p className="text-sm text-muted-foreground mb-4">
                These fields are only visible to friends based on their friendship level.
              </p>

              {/* Close Friends Only */}
              <div className="space-y-4 mb-6">
                <div className="text-sm font-medium text-primary">Close Friends Only</div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    WhatsApp Number
                  </label>
                  <Input
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+1234567890"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Phone Number
                  </label>
                  <Input
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1234567890"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Private Email
                  </label>
                  <Input
                    type="email"
                    value={privateEmail}
                    onChange={(e) => setPrivateEmail(e.target.value)}
                    placeholder="personal@email.com"
                  />
                </div>
              </div>

              {/* Buddies & Close Friends */}
              <div className="space-y-4 mb-6">
                <div className="text-sm font-medium text-primary">Buddies & Close Friends</div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Instagram
                  </label>
                  <Input
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="https://instagram.com/username"
                  />
                </div>
              </div>

              {/* Acquaintances & Above */}
              <div className="space-y-4">
                <div className="text-sm font-medium text-primary">Acquaintances & Above</div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    LinkedIn
                  </label>
                  <Input
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Contact Email
                  </label>
                  <Input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="contact@email.com"
                  />
                </div>
              </div>
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
      </div>
    </div>
  );
};

export default Profile;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { User, MapPin, Link as LinkIcon, Save, ArrowLeft } from "lucide-react";

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  link: string | null;
  hometown_city: string | null;
  hometown_country: string | null;
}

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [link, setLink] = useState("");

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
        .select("id, display_name, avatar_url, bio, link, hometown_city, hometown_country")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || "");
        setAvatarUrl(data.avatar_url || "");
        setBio(data.bio || "");
        setLink(data.link || "");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/powers")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Your Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-24 h-24">
                <AvatarImage src={avatarUrl} alt={displayName || "Profile"} />
                <AvatarFallback>
                  <User className="w-12 h-12 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="w-full">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Avatar URL
                </label>
                <Input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/your-image.jpg"
                />
              </div>
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

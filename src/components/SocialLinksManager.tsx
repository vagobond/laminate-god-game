import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  label: string | null;
  friendship_level_required: string;
}

const PLATFORMS = [
  { value: "twitter", label: "Twitter / X" },
  { value: "facebook", label: "Facebook" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "snapchat", label: "Snapchat" },
  { value: "pinterest", label: "Pinterest" },
  { value: "reddit", label: "Reddit" },
  { value: "discord", label: "Discord" },
  { value: "twitch", label: "Twitch" },
  { value: "github", label: "GitHub" },
  { value: "spotify", label: "Spotify" },
  { value: "soundcloud", label: "SoundCloud" },
  { value: "behance", label: "Behance" },
  { value: "dribbble", label: "Dribbble" },
  { value: "medium", label: "Medium" },
  { value: "substack", label: "Substack" },
  { value: "threads", label: "Threads" },
  { value: "bluesky", label: "Bluesky" },
  { value: "mastodon", label: "Mastodon" },
  { value: "telegram", label: "Telegram" },
  { value: "signal", label: "Signal" },
  { value: "other", label: "Other" },
];

const FRIENDSHIP_LEVELS = [
  { value: "close_friend", label: "Close Friends Only", description: "Only visible to your closest friends" },
  { value: "buddy", label: "Buddies & Above", description: "Visible to buddies and close friends" },
  { value: "friendly_acquaintance", label: "Acquaintances & Above", description: "Visible to all friends" },
];

interface SocialLinksManagerProps {
  userId: string;
}

interface AddFormState {
  platform: string;
  url: string;
  label: string;
}

export const SocialLinksManager = ({ userId }: SocialLinksManagerProps) => {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Track which section's add form is open
  const [activeAddForm, setActiveAddForm] = useState<string | null>(null);
  const [addFormState, setAddFormState] = useState<AddFormState>({
    platform: "",
    url: "",
    label: "",
  });

  useEffect(() => {
    loadLinks();
  }, [userId]);

  const loadLinks = async () => {
    try {
      const { data, error } = await supabase
        .from("social_links")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error("Error loading social links:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLink = async (friendshipLevel: string) => {
    if (!addFormState.platform || !addFormState.url) {
      toast.error("Please select a platform and enter a URL");
      return;
    }

    setSaving("new");
    try {
      const { data, error } = await supabase
        .from("social_links")
        .insert({
          user_id: userId,
          platform: addFormState.platform,
          url: addFormState.url,
          label: addFormState.label || null,
          friendship_level_required: friendshipLevel,
        })
        .select()
        .single();

      if (error) throw error;

      setLinks([...links, data]);
      setAddFormState({ platform: "", url: "", label: "" });
      setActiveAddForm(null);
      toast.success("Social link added!");
    } catch (error) {
      console.error("Error adding social link:", error);
      toast.error("Failed to add social link");
    } finally {
      setSaving(null);
    }
  };

  const handleDeleteLink = async (id: string) => {
    setSaving(id);
    try {
      const { error } = await supabase
        .from("social_links")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setLinks(links.filter((link) => link.id !== id));
      toast.success("Social link removed");
    } catch (error) {
      console.error("Error deleting social link:", error);
      toast.error("Failed to remove social link");
    } finally {
      setSaving(null);
    }
  };

  const handleUpdateLinkLevel = async (id: string, newLevel: string) => {
    setSaving(id);
    try {
      const { error } = await supabase
        .from("social_links")
        .update({ friendship_level_required: newLevel })
        .eq("id", id);

      if (error) throw error;

      setLinks(
        links.map((link) =>
          link.id === id ? { ...link, friendship_level_required: newLevel } : link
        )
      );
      toast.success("Link visibility updated");
    } catch (error) {
      console.error("Error updating social link:", error);
      toast.error("Failed to update social link");
    } finally {
      setSaving(null);
    }
  };

  const getPlatformLabel = (platform: string) => {
    return PLATFORMS.find((p) => p.value === platform)?.label || platform;
  };

  const openAddForm = (level: string) => {
    setActiveAddForm(level);
    setAddFormState({ platform: "", url: "", label: "" });
  };

  const closeAddForm = () => {
    setActiveAddForm(null);
    setAddFormState({ platform: "", url: "", label: "" });
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading social links...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Additional Social Links</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        Add social links for each friendship level. Links are only visible to friends at that level or higher.
      </p>

      {/* Render a section for each friendship level */}
      {FRIENDSHIP_LEVELS.map((level) => {
        const levelLinks = links.filter(
          (link) => link.friendship_level_required === level.value
        );
        const isFormOpen = activeAddForm === level.value;

        return (
          <div
            key={level.value}
            className="p-4 border border-border rounded-lg space-y-4 bg-card/50"
          >
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-primary">{level.label}</div>
                <div className="text-xs text-muted-foreground">{level.description}</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => isFormOpen ? closeAddForm() : openAddForm(level.value)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Link
              </Button>
            </div>

            {/* Add Form for this section */}
            {isFormOpen && (
              <div className="p-4 border border-border/50 rounded-lg space-y-4 bg-secondary/20">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Platform
                    </label>
                    <Select
                      value={addFormState.platform}
                      onValueChange={(value) =>
                        setAddFormState({ ...addFormState, platform: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {PLATFORMS.map((platform) => (
                          <SelectItem key={platform.value} value={platform.value}>
                            {platform.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {addFormState.platform === "other" && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        Custom Label
                      </label>
                      <Input
                        value={addFormState.label}
                        onChange={(e) =>
                          setAddFormState({ ...addFormState, label: e.target.value })
                        }
                        placeholder="e.g., My Blog, Portfolio"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    URL
                  </label>
                  <Input
                    value={addFormState.url}
                    onChange={(e) =>
                      setAddFormState({ ...addFormState, url: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleAddLink(level.value)}
                    disabled={saving === "new"}
                    size="sm"
                  >
                    {saving === "new" ? "Adding..." : "Add Link"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={closeAddForm}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Links in this section */}
            {levelLinks.length > 0 ? (
              <div className="space-y-2">
                {levelLinks.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">
                        {link.label || getPlatformLabel(link.platform)}
                      </div>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 truncate"
                      >
                        {link.url}
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    </div>
                    <Select
                      value={link.friendship_level_required}
                      onValueChange={(value) => handleUpdateLinkLevel(link.id, value)}
                    >
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FRIENDSHIP_LEVELS.map((lvl) => (
                          <SelectItem key={lvl.value} value={lvl.value}>
                            {lvl.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteLink(link.id)}
                      disabled={saving === link.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              !isFormOpen && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No links added for this level yet.
                </p>
              )
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SocialLinksManager;

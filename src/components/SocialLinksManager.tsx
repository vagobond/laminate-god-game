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
  { value: "close_friend", label: "Close Friends Only" },
  { value: "buddy", label: "Buddies & Above" },
  { value: "friendly_acquaintance", label: "Acquaintances & Above" },
];

interface SocialLinksManagerProps {
  userId: string;
}

export const SocialLinksManager = ({ userId }: SocialLinksManagerProps) => {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // New link form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlatform, setNewPlatform] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newLevel, setNewLevel] = useState("friendly_acquaintance");

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

  const handleAddLink = async () => {
    if (!newPlatform || !newUrl) {
      toast.error("Please select a platform and enter a URL");
      return;
    }

    setSaving("new");
    try {
      const { data, error } = await supabase
        .from("social_links")
        .insert({
          user_id: userId,
          platform: newPlatform,
          url: newUrl,
          label: newLabel || null,
          friendship_level_required: newLevel,
        })
        .select()
        .single();

      if (error) throw error;

      setLinks([...links, data]);
      setNewPlatform("");
      setNewUrl("");
      setNewLabel("");
      setNewLevel("friendly_acquaintance");
      setShowAddForm(false);
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

  const handleUpdateLink = async (id: string, updates: Partial<SocialLink>) => {
    setSaving(id);
    try {
      const { error } = await supabase
        .from("social_links")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      setLinks(
        links.map((link) =>
          link.id === id ? { ...link, ...updates } : link
        )
      );
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

  const getLevelLabel = (level: string) => {
    return FRIENDSHIP_LEVELS.find((l) => l.value === level)?.label || level;
  };

  // Group links by friendship level
  const groupedLinks = FRIENDSHIP_LEVELS.map((level) => ({
    ...level,
    links: links.filter((link) => link.friendship_level_required === level.value),
  }));

  if (loading) {
    return <div className="text-muted-foreground">Loading social links...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Additional Social Links</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Link
        </Button>
      </div>

      {/* Add New Link Form */}
      {showAddForm && (
        <div className="p-4 border border-border rounded-lg space-y-4 bg-card">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Platform
              </label>
              <Select value={newPlatform} onValueChange={setNewPlatform}>
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

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Visibility
              </label>
              <Select value={newLevel} onValueChange={setNewLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FRIENDSHIP_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              URL
            </label>
            <Input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          {newPlatform === "other" && (
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Custom Label (optional)
              </label>
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g., My Blog, Portfolio"
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleAddLink}
              disabled={saving === "new"}
              size="sm"
            >
              {saving === "new" ? "Adding..." : "Add Link"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowAddForm(false);
                setNewPlatform("");
                setNewUrl("");
                setNewLabel("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Display grouped links */}
      {groupedLinks.map(
        (group) =>
          group.links.length > 0 && (
            <div key={group.value} className="space-y-3">
              <div className="text-sm font-medium text-primary">
                {group.label}
              </div>
              {group.links.map((link) => (
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
                    onValueChange={(value) =>
                      handleUpdateLink(link.id, {
                        friendship_level_required: value,
                      })
                    }
                  >
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FRIENDSHIP_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
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
          )
      )}

      {links.length === 0 && !showAddForm && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No additional social links added yet. Click "Add Link" to get started.
        </p>
      )}
    </div>
  );
};

export default SocialLinksManager;

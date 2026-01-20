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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Plus, Trash2, ExternalLink, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

// Validation constants
const MAX_URL_LENGTH = 500;
const MAX_LABEL_LENGTH = 50;

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  label: string | null;
  friendship_level_required: string;
}

interface ProfileData {
  whatsapp: string;
  phone_number: string;
  private_email: string;
  instagram_url: string;
  linkedin_url: string;
  contact_email: string;
}

const PLATFORMS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "phone", label: "Phone Number" },
  { value: "private_email", label: "Private Email" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "contact_email", label: "Contact Email" },
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

// Define which built-in fields appear in which section
const SECTION_BUILTIN_FIELDS: Record<string, { key: keyof ProfileData; label: string; placeholder: string; type?: string }[]> = {
  close_friend: [
    { key: "whatsapp", label: "WhatsApp Number", placeholder: "+1 555-123-4567" },
    { key: "phone_number", label: "Phone Number", placeholder: "+1 555-123-4567" },
    { key: "private_email", label: "Private Email", placeholder: "personal@example.com", type: "email" },
  ],
  family: [
    { key: "phone_number", label: "Phone Number", placeholder: "+1 555-123-4567" },
    { key: "private_email", label: "Private Email", placeholder: "personal@example.com", type: "email" },
  ],
  buddy: [
    { key: "instagram_url", label: "Instagram", placeholder: "@username or https://instagram.com/..." },
  ],
  friendly_acquaintance: [
    { key: "linkedin_url", label: "LinkedIn", placeholder: "https://linkedin.com/in/..." },
    { key: "contact_email", label: "Contact Email", placeholder: "contact@example.com", type: "email" },
  ],
  secret_friend: [
    { key: "whatsapp", label: "WhatsApp Number", placeholder: "+1 555-123-4567" },
    { key: "phone_number", label: "Phone Number", placeholder: "+1 555-123-4567" },
    { key: "private_email", label: "Private Email", placeholder: "personal@example.com", type: "email" },
  ],
  secret_enemy: [],
};

const FRIENDSHIP_SECTIONS = [
  {
    value: "close_friend",
    label: "Close Friends",
    description: "Only your closest friends can see these links",
    color: "text-green-500",
  },
  {
    value: "family",
    label: "Family",
    description: "Independent category - phone, private email, and full birthday only (no social links by default)",
    color: "text-orange-500",
  },
  {
    value: "buddy",
    label: "Buddies",
    description: "Buddies and above can see these links",
    color: "text-blue-500",
  },
  {
    value: "friendly_acquaintance",
    label: "Friendly Acquaintances",
    description: "All friends at acquaintance level or higher can see these links",
    color: "text-yellow-500",
  },
  {
    value: "secret_friend",
    label: "Secret Friends",
    description: "Secret friends see the same as close friends - your hidden inner circle",
    color: "text-purple-500",
  },
  {
    value: "secret_enemy",
    label: "Secret Enemies",
    description: "People you've accepted as friends but don't fully trust. They get no real access, or you can give them decoy info.",
    color: "text-red-500",
    warning: "⚠️ Don't give secret enemies your real contact information! Enter fake/decoy info here if desired.",
  },
];

interface SocialLinksManagerProps {
  userId: string;
  profileData: ProfileData;
  onProfileChange: (field: keyof ProfileData, value: string) => void;
}

interface AddFormState {
  platform: string;
  url: string;
  label: string;
}

export const SocialLinksManager = ({ userId, profileData, onProfileChange }: SocialLinksManagerProps) => {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<string[]>([]);

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
      toast.error("Please select a platform and enter a value");
      return;
    }

    // Validate URL length
    if (addFormState.url.length > MAX_URL_LENGTH) {
      toast.error(`URL/value must be less than ${MAX_URL_LENGTH} characters`);
      return;
    }

    // Validate label length
    if (addFormState.label && addFormState.label.length > MAX_LABEL_LENGTH) {
      toast.error(`Label must be less than ${MAX_LABEL_LENGTH} characters`);
      return;
    }

    setSaving("new");
    try {
      const { data, error } = await supabase
        .from("social_links")
        .insert({
          user_id: userId,
          platform: addFormState.platform,
          url: addFormState.url.trim().slice(0, MAX_URL_LENGTH),
          label: addFormState.label?.trim().slice(0, MAX_LABEL_LENGTH) || null,
          friendship_level_required: friendshipLevel,
        })
        .select()
        .single();

      if (error) throw error;

      setLinks([...links, data]);
      setAddFormState({ platform: "", url: "", label: "" });
      setActiveAddForm(null);
      toast.success("Link added!");
    } catch (error) {
      console.error("Error adding social link:", error);
      toast.error("Failed to add link");
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
      toast.success("Link removed");
    } catch (error) {
      console.error("Error deleting social link:", error);
      toast.error("Failed to remove link");
    } finally {
      setSaving(null);
    }
  };

  const getPlatformLabel = (platform: string) => {
    return PLATFORMS.find((p) => p.value === platform)?.label || platform;
  };

  const getPlaceholderForPlatform = (platform: string) => {
    switch (platform) {
      case "whatsapp":
      case "phone":
        return "+1 555-123-4567";
      case "private_email":
      case "contact_email":
        return "email@example.com";
      case "instagram":
        return "@username or https://instagram.com/...";
      case "linkedin":
        return "https://linkedin.com/in/...";
      default:
        return "https://...";
    }
  };

  const openAddForm = (level: string) => {
    setActiveAddForm(level);
    setAddFormState({ platform: "", url: "", label: "" });
    // Ensure section is open
    if (!openSections.includes(level)) {
      setOpenSections([...openSections, level]);
    }
  };

  const closeAddForm = () => {
    setActiveAddForm(null);
    setAddFormState({ platform: "", url: "", label: "" });
  };

  const toggleSection = (level: string) => {
    setOpenSections((prev) =>
      prev.includes(level)
        ? prev.filter((l) => l !== level)
        : [...prev, level]
    );
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Contact Info & Social Links</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Add different contact info and links for each friendship level. Friends will only see what you've added to their level (or lower).
        </p>
      </div>

      {/* Render a section for each friendship level */}
      {FRIENDSHIP_SECTIONS.map((section) => {
        const levelLinks = links.filter(
          (link) => link.friendship_level_required === section.value
        );
        const builtinFields = SECTION_BUILTIN_FIELDS[section.value] || [];
        const isFormOpen = activeAddForm === section.value;
        const isOpen = openSections.includes(section.value);
        const totalItems = levelLinks.length + builtinFields.filter(f => profileData[f.key]).length;

        return (
          <Collapsible
            key={section.value}
            open={isOpen}
            onOpenChange={() => toggleSection(section.value)}
          >
            <div className="border border-border rounded-lg overflow-hidden">
              {/* Section Header */}
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-4 bg-card/50 cursor-pointer hover:bg-card/80 transition-colors">
                  <div className="flex items-center gap-3">
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                    <div>
                      <div className={`font-medium ${section.color}`}>{section.label}</div>
                      <div className="text-xs text-muted-foreground">{section.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {totalItems > 0 && (
                      <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                        {totalItems} item{totalItems !== 1 ? "s" : ""}
                      </span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        isFormOpen ? closeAddForm() : openAddForm(section.value);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="p-4 space-y-4 border-t border-border">
                  {/* Secret Enemy Warning - only in this section */}
                  {section.warning && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-sm text-red-400 font-medium">{section.warning}</p>
                    </div>
                  )}

                  {/* Built-in fields for this section */}
                  {builtinFields.length > 0 && (
                    <div className="space-y-4">
                      {builtinFields.map((field) => (
                        <div key={field.key}>
                          <label className="text-sm font-medium text-muted-foreground mb-2 block">
                            {field.label}
                          </label>
                          <Input
                            type={field.type || "text"}
                            value={profileData[field.key]}
                            onChange={(e) => onProfileChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Form for this section */}
                  {isFormOpen && (
                    <div className="p-4 border border-border/50 rounded-lg space-y-4 bg-secondary/20">
                      <div className="text-sm font-medium text-muted-foreground">Add Custom Link</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground mb-2 block">
                            Platform / Type
                          </label>
                          <Select
                            value={addFormState.platform}
                            onValueChange={(value) =>
                              setAddFormState({ ...addFormState, platform: value, url: "" })
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
                          {["whatsapp", "phone"].includes(addFormState.platform)
                            ? "Number"
                            : ["private_email", "contact_email"].includes(addFormState.platform)
                            ? "Email Address"
                            : "URL / Handle"}
                        </label>
                        <Input
                          value={addFormState.url}
                          onChange={(e) =>
                            setAddFormState({ ...addFormState, url: e.target.value })
                          }
                          placeholder={getPlaceholderForPlatform(addFormState.platform)}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAddLink(section.value)}
                          disabled={saving === "new"}
                          size="sm"
                        >
                          {saving === "new" ? "Adding..." : "Add"}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={closeAddForm}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Custom Links in this section */}
                  {levelLinks.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Additional Links</div>
                      {levelLinks.map((link) => (
                        <div
                          key={link.id}
                          className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">
                              {link.label || getPlatformLabel(link.platform)}
                            </div>
                            {link.url.startsWith("http") ? (
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 truncate"
                              >
                                {link.url}
                                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                              </a>
                            ) : (
                              <span className="text-xs text-muted-foreground truncate block">
                                {link.url}
                              </span>
                            )}
                          </div>
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
                  )}

                  {/* Empty state */}
                  {builtinFields.length === 0 && levelLinks.length === 0 && !isFormOpen && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No links added for {section.label.toLowerCase()} yet. Click "Add" to get started.
                    </p>
                  )}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
};

export default SocialLinksManager;

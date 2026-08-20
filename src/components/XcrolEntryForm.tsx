import { useState, useEffect, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Scroll, Link as LinkIcon, Save, Loader2, AlertTriangle, MapPin, X, Home } from "lucide-react";
import { useHometownDate } from "@/hooks/use-hometown-date";
import { UserMentionInput } from "@/components/UserMentionInput";
import { useNavigate } from "react-router-dom";
import { isNostrPublishEnabled } from "@/lib/nostr-publish";
import { useNostrKey } from "@/hooks/use-nostr-key";
import { finalizeEvent, verifyEvent } from "nostr-tools/pure";
import { Relay } from "nostr-tools/relay";

// Lazy so mapbox-gl only loads when the location section is opened.
const EntryLocationPicker = lazy(() => import("@/components/EntryLocationPicker"));

interface XcrolEntryFormProps {
  userId: string;
  onEntrySaved?: () => void;
  compact?: boolean;
  prefillLink?: string;
  prefillContent?: string;
}

const PRIVACY_LEVELS = [
  { value: "private", label: "Private - me only" },
  { value: "close_friend", label: "Oath Bound (Close Friends)" },
  { value: "family", label: "Blood Bound (Family)" },
  { value: "buddy", label: "Companions & above" },
  { value: "friendly_acquaintance", label: "Wayfarers (Acquaintances) & above" },
  { value: "public", label: "Public - everyone on the internet" },
];

export const XcrolEntryForm = ({ userId, onEntrySaved, compact = false, prefillLink = "", prefillContent = "" }: XcrolEntryFormProps) => {
  const navigate = useNavigate();
  const { privateKey: nostrPrivateKey } = useNostrKey();
  const { todayDate, loading: dateLoading, timezone, hasHometown } = useHometownDate(userId);
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");
  const [privacyLevel, setPrivacyLevel] = useState("private");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [todayEntry, setTodayEntry] = useState<{ id: string; content: string; link: string | null; privacy_level: string } | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationLabel, setLocationLabel] = useState("");
  const [showLocation, setShowLocation] = useState(false);
  const [showPublicWarning, setShowPublicWarning] = useState(false);
  const [pendingPrivacyLevel, setPendingPrivacyLevel] = useState<string | null>(null);
  const [showHometownPrompt, setShowHometownPrompt] = useState(false);
  const [proceedWithUTC, setProceedWithUTC] = useState(false);

  useEffect(() => {
    if (!dateLoading) {
      loadTodayEntry();
    }
  }, [userId, dateLoading, todayDate]);

  const loadTodayEntry = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("xcrol_entries")
        .select("id, content, link, privacy_level, latitude, longitude, location_label")
        .eq("user_id", userId)
        .eq("entry_date", todayDate)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setTodayEntry(data);
        setContent(data.content);
        // Use prefillLink if provided and no existing link, otherwise use existing link
        setLink(data.link || prefillLink);
        setPrivacyLevel(data.privacy_level);
        setLatitude(data.latitude);
        setLongitude(data.longitude);
        setLocationLabel(data.location_label || "");
        if (data.latitude != null) setShowLocation(true);
      } else {
        setTodayEntry(null);
        setContent(prefillContent.slice(0, 240));
        // Use prefillLink for new entries
        setLink(prefillLink);
        setPrivacyLevel("private");
        setLatitude(null);
        setLongitude(null);
        setLocationLabel("");
      }
    } catch (error) {
      console.error("Error loading today's entry:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (bypassHometownCheck = false) => {
    // Show hometown prompt if not set (unless user chose to proceed with UTC)
    if (!hasHometown && !bypassHometownCheck && !proceedWithUTC) {
      setShowHometownPrompt(true);
      return;
    }

    if (!content.trim()) {
      toast.error("Please write something for your daily update");
      return;
    }

    if (link && link.length > 500) {
      toast.error("Link is too long");
      return;
    }

    setSaving(true);
    try {
      // Pin travels as a pair; the label only ships alongside a pin.
      const hasPin = latitude != null && longitude != null;
      const pinFields = {
        latitude: hasPin ? latitude : null,
        longitude: hasPin ? longitude : null,
        location_label: hasPin ? locationLabel.trim().slice(0, 80) || null : null,
      };

      if (todayEntry) {
        // Update existing entry
        const { error } = await supabase
          .from("xcrol_entries")
          .update({
            content: content.trim(),
            link: link.trim() || null,
            privacy_level: privacyLevel,
            ...pinFields,
          })
          .eq("id", todayEntry.id);

        if (error) throw error;
        toast.success("Daily update saved!");
      } else {
        // Create new entry
        const { error } = await supabase
          .from("xcrol_entries")
          .insert({
            user_id: userId,
            content: content.trim(),
            link: link.trim() || null,
            privacy_level: privacyLevel,
            entry_date: todayDate,
            ...pinFields,
          });

        if (error) throw error;
        toast.success("Daily update posted!");
      }

      // Publish to NOSTR if enabled and key available
      if (privacyLevel === "public" && isNostrPublishEnabled() && nostrPrivateKey) {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("nostr_npub")
            .eq("id", userId)
            .maybeSingle();
          if (profile?.nostr_npub) {
            const event = finalizeEvent(
              { kind: 1, created_at: Math.floor(Date.now() / 1000), tags: [], content: content.trim() },
              nostrPrivateKey
            );
            if (verifyEvent(event)) {
              const relays = ["wss://relay.damus.io", "wss://relay.nostr.band", "wss://nos.lol"];
              await Promise.allSettled(
                relays.map(async (url) => {
                  const relay = await Relay.connect(url);
                  try { await relay.publish(event); } finally { relay.close(); }
                })
              );
              toast.success("Also published to NOSTR!");
            }
          }
        } catch (e) {
          console.error("NOSTR publish failed:", e);
        }
      }

      await loadTodayEntry();
      onEntrySaved?.();
    } catch (error: any) {
      console.error("Error saving entry:", error);
      if (error.code === "23505") {
        toast.error("You've already posted today. Refresh to edit your entry.");
      } else {
        toast.error("Failed to save your update");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUseHometown = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("hometown_latitude, hometown_longitude, hometown_city, hometown_country")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      if (data?.hometown_latitude == null || data?.hometown_longitude == null) {
        toast.error("Set your hometown in settings first");
        return;
      }
      setLatitude(data.hometown_latitude);
      setLongitude(data.hometown_longitude);
      if (!locationLabel.trim()) {
        setLocationLabel([data.hometown_city, data.hometown_country].filter(Boolean).join(", ").slice(0, 80));
      }
    } catch (error) {
      console.error("Error loading hometown:", error);
      toast.error("Could not load your hometown");
    }
  };

  const clearPin = () => {
    setLatitude(null);
    setLongitude(null);
    setLocationLabel("");
  };

  if (loading) {
    return (
      <Card className={compact ? "bg-card/50" : ""}>
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={compact ? "bg-card/50" : ""}>
      <CardHeader className={compact ? "pb-2" : ""}>
        <CardTitle className={`flex items-center gap-2 ${compact ? "text-lg" : "text-xl"}`}>
          <Scroll className="w-5 h-5 text-primary" />
          {todayEntry ? "Edit Today's Xcrol" : "Write Today's Xcrol"}
        </CardTitle>
        {timezone && (
          <p className="text-xs text-muted-foreground">
            Date based on {hasHometown ? `your hometown (${timezone})` : "UTC (set your hometown for local time)"}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasHometown && (
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <MapPin className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-amber-600 dark:text-amber-400">
              Set your hometown in settings to use your local time for posts.{" "}
              <Button 
                variant="link" 
                className="h-auto p-0 text-amber-600 dark:text-amber-400 underline"
                onClick={() => navigate("/settings")}
              >
                Go to settings
              </Button>
            </AlertDescription>
          </Alert>
        )}
        <div>
          <UserMentionInput
            value={content}
            onChange={(val) => setContent(val.slice(0, 240))}
            placeholder="What's on your mind today? Tag friends with @username (240 characters max)"
            maxLength={240}
            className="min-h-[80px]"
            rows={3}
          />
          <div className="text-xs text-muted-foreground text-right mt-1">
            {content.length}/240
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Add a link (optional)"
            className="flex-1"
          />
        </div>

        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-muted-foreground"
            onClick={() => setShowLocation(!showLocation)}
          >
            <MapPin className="w-4 h-4 mr-1" />
            {latitude != null
              ? locationLabel.trim() || `${latitude.toFixed(2)}, ${longitude?.toFixed(2)}`
              : "Add location"}
          </Button>

          {showLocation && (
            <div className="mt-2 space-y-2">
              <Suspense
                fallback={
                  <div className="h-48 flex items-center justify-center border rounded-md">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                }
              >
                <EntryLocationPicker
                  latitude={latitude}
                  longitude={longitude}
                  onPick={(lat, lng, label) => {
                    setLatitude(lat);
                    setLongitude(lng);
                    // Auto-fill the label from geocoding, but never clobber a label
                    // the user has already typed.
                    if (label && !locationLabel.trim()) {
                      setLocationLabel(label.slice(0, 80));
                    }
                  }}
                />
              </Suspense>
              <p className="text-xs text-muted-foreground">Use your current location, search a place, or click the map to drop a pin.</p>
              <Input
                value={locationLabel}
                onChange={(e) => setLocationLabel(e.target.value.slice(0, 80))}
                placeholder="Label this place (optional, 80 characters)"
                maxLength={80}
              />
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleUseHometown}>
                  <Home className="w-4 h-4 mr-1" />
                  Use my hometown
                </Button>
                {latitude != null && (
                  <Button type="button" variant="ghost" size="sm" onClick={clearPin}>
                    <X className="w-4 h-4 mr-1" />
                    Clear pin
                  </Button>
                )}
              </div>
              {privacyLevel === "public" && latitude != null && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  This entry is public — its location will be public too.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Select 
            value={privacyLevel} 
            onValueChange={(value) => {
              if (value === "public" && privacyLevel !== "public") {
                setPendingPrivacyLevel(value);
                setShowPublicWarning(true);
              } else {
                setPrivacyLevel(value);
              }
            }}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Who can see this?" />
            </SelectTrigger>
            <SelectContent>
              {PRIVACY_LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={() => handleSave()} disabled={saving || !content.trim()}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : todayEntry ? "Update" : "Post"}
          </Button>
        </div>
      </CardContent>

      <AlertDialog open={showPublicWarning} onOpenChange={setShowPublicWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Make this status public?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This status will be visible to <strong>everyone on the internet</strong>, not just your friends. Anyone who visits your profile will be able to see it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingPrivacyLevel(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingPrivacyLevel) {
                  setPrivacyLevel(pendingPrivacyLevel);
                  setPendingPrivacyLevel(null);
                }
              }}
            >
              Yes, make it public
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showHometownPrompt} onOpenChange={setShowHometownPrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Set Your Hometown
            </AlertDialogTitle>
            <AlertDialogDescription>
              To ensure your posts are timestamped with your local time, please set your hometown in settings first. This helps your friends see when you posted in your timezone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setProceedWithUTC(true);
                setShowHometownPrompt(false);
                // Trigger save after a brief delay to ensure state is updated
                setTimeout(() => handleSave(true), 0);
              }}
            >
              Post with UTC time
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate("/settings")}>
              Go to Settings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

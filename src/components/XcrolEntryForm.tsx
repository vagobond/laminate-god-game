import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Scroll, Link as LinkIcon, Save, Loader2, AlertTriangle, MapPin } from "lucide-react";
import { useHometownDate } from "@/hooks/use-hometown-date";
import { UserMentionInput } from "@/components/UserMentionInput";
import { useNavigate } from "react-router-dom";

interface XcrolEntryFormProps {
  userId: string;
  onEntrySaved?: () => void;
  compact?: boolean;
  prefillLink?: string;
}

const PRIVACY_LEVELS = [
  { value: "private", label: "Private - me only" },
  { value: "close_friend", label: "Oath Bound (Close Friends)" },
  { value: "family", label: "Blood Bound (Family)" },
  { value: "buddy", label: "Companions & above" },
  { value: "friendly_acquaintance", label: "Wayfarers (Acquaintances) & above" },
  { value: "public", label: "Public - everyone on the internet" },
];

export const XcrolEntryForm = ({ userId, onEntrySaved, compact = false, prefillLink = "" }: XcrolEntryFormProps) => {
  const navigate = useNavigate();
  const { todayDate, loading: dateLoading, timezone, hasHometown } = useHometownDate(userId);
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");
  const [privacyLevel, setPrivacyLevel] = useState("private");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [todayEntry, setTodayEntry] = useState<{ id: string; content: string; link: string | null; privacy_level: string } | null>(null);
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
        .select("id, content, link, privacy_level")
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
      } else {
        setTodayEntry(null);
        setContent("");
        // Use prefillLink for new entries
        setLink(prefillLink);
        setPrivacyLevel("private");
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
      if (todayEntry) {
        // Update existing entry
        const { error } = await supabase
          .from("xcrol_entries")
          .update({
            content: content.trim(),
            link: link.trim() || null,
            privacy_level: privacyLevel,
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
          });

        if (error) throw error;
        toast.success("Daily update posted!");
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

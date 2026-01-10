import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Scroll, Link as LinkIcon, Save, Loader2, AlertTriangle } from "lucide-react";
import { useHometownDate } from "@/hooks/use-hometown-date";
import { UserMentionInput } from "@/components/UserMentionInput";

interface XcrolEntryFormProps {
  userId: string;
  onEntrySaved?: () => void;
  compact?: boolean;
  prefillLink?: string;
}

const PRIVACY_LEVELS = [
  { value: "private", label: "Private - me only" },
  { value: "close_friend", label: "Close Friends" },
  { value: "buddy", label: "Buddies & above" },
  { value: "friendly_acquaintance", label: "Friendly Acquaintances & above" },
  { value: "public", label: "Public - everyone on the internet" },
];

export const XcrolEntryForm = ({ userId, onEntrySaved, compact = false, prefillLink = "" }: XcrolEntryFormProps) => {
  const { todayDate, loading: dateLoading } = useHometownDate(userId);
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");
  const [privacyLevel, setPrivacyLevel] = useState("private");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [todayEntry, setTodayEntry] = useState<{ id: string; content: string; link: string | null; privacy_level: string } | null>(null);
  const [showPublicWarning, setShowPublicWarning] = useState(false);
  const [pendingPrivacyLevel, setPendingPrivacyLevel] = useState<string | null>(null);

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

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error("Please write something for your daily update");
      return;
    }

    if (content.length > 240) {
      toast.error("Your update must be 240 characters or less");
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
      </CardHeader>
      <CardContent className="space-y-4">
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

          <Button onClick={handleSave} disabled={saving || !content.trim()}>
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
    </Card>
  );
};

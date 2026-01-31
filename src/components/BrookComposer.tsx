import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Link2, Send, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useHometownDate } from "@/hooks/use-hometown-date";
import { useNavigate } from "react-router-dom";

interface BrookComposerProps {
  brookId: string;
  userId: string;
  onPostCreated: () => void;
}

export const BrookComposer = ({ brookId, userId, onPostCreated }: BrookComposerProps) => {
  const navigate = useNavigate();
  const { todayDate, loading: dateLoading, timezone, hasHometown } = useHometownDate(userId);
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [canPost, setCanPost] = useState(true);
  const [checking, setChecking] = useState(true);
  const [showHometownPrompt, setShowHometownPrompt] = useState(false);
  const [proceedWithUTC, setProceedWithUTC] = useState(false);

  useEffect(() => {
    if (!dateLoading) {
      checkCanPost();
    }
  }, [brookId, userId, dateLoading, todayDate]);

  const checkCanPost = async () => {
    setChecking(true);
    try {
      // Check if user already posted today in this brook (using hometown date)
      const { data, error } = await supabase
        .from("brook_posts")
        .select("id")
        .eq("brook_id", brookId)
        .eq("user_id", userId)
        .gte("created_at", `${todayDate}T00:00:00`)
        .lt("created_at", `${todayDate}T23:59:59`)
        .limit(1);

      if (error) throw error;
      setCanPost((data || []).length === 0);
    } catch (error) {
      console.error("Error checking post eligibility:", error);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (bypassHometownCheck = false) => {
    // Show hometown prompt if not set (unless user chose to proceed with UTC)
    if (!hasHometown && !bypassHometownCheck && !proceedWithUTC) {
      setShowHometownPrompt(true);
      return;
    }

    if (!content.trim()) return;

    setSubmitting(true);
    try {
      // First, get the brook details to find the other participant
      const { data: brookData, error: brookError } = await supabase
        .from("brooks")
        .select("user1_id, user2_id")
        .eq("id", brookId)
        .single();

      if (brookError) throw brookError;

      // Insert the post
      const { error } = await supabase
        .from("brook_posts")
        .insert({
          brook_id: brookId,
          user_id: userId,
          content: content.trim(),
          link: link.trim() || null
        });

      if (error) throw error;

      // Send a notification message to the other participant
      const otherUserId = brookData.user1_id === userId ? brookData.user2_id : brookData.user1_id;
      
      // Get the current user's display name
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", userId)
        .single();

      const senderName = myProfile?.display_name?.split(' ')[0] || 'Someone';

      // Insert a system message to notify the other user
      // Include brookId in platform_suggestion so the notification can link to the brook
      await supabase
        .from("messages")
        .insert({
          from_user_id: userId,
          to_user_id: otherUserId,
          content: `${senderName} posted in your Brook! Check it out.`,
          platform_suggestion: `brook_notification:${brookId}`
        });

      toast.success("Posted to your Brook!");
      setContent("");
      setLink("");
      setShowLinkInput(false);
      setCanPost(false);
      onPostCreated();
    } catch (error: any) {
      console.error("Error creating brook post:", error);
      if (error.message?.includes("content_length")) {
        toast.error("Content must be 240 characters or less");
      } else {
        toast.error("Failed to create post");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (checking || dateLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">Checking...</div>
        </CardContent>
      </Card>
    );
  }

  if (!canPost) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4 text-center">
          <p className="text-muted-foreground text-sm">
            You've already posted in this Brook today. Come back tomorrow!
          </p>
          {timezone && (
            <p className="text-xs text-muted-foreground mt-1">
              (Based on {hasHometown ? `your hometown time: ${timezone}` : "UTC"})
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-4 space-y-3">
          {!hasHometown && (
            <Alert className="border-amber-500/50 bg-amber-500/10">
              <MapPin className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-600 dark:text-amber-400">
                Set your hometown for local time posts.{" "}
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
          <Textarea
          placeholder="What's on your mind? (240 characters max)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={240}
          className="min-h-[80px] resize-none"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowLinkInput(!showLinkInput)}
              className={showLinkInput ? "text-primary" : ""}
            >
              <Link2 className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground">
              {content.length}/240
            </span>
          </div>

          <Button 
            onClick={() => handleSubmit()} 
            disabled={!content.trim() || submitting}
            size="sm"
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            Post
          </Button>
        </div>

        {showLinkInput && (
          <Input
            placeholder="Add a link (optional)"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="text-sm"
          />
        )}
      </CardContent>
    </Card>

    <AlertDialog open={showHometownPrompt} onOpenChange={setShowHometownPrompt}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Set Your Hometown
          </AlertDialogTitle>
          <AlertDialogDescription>
            To ensure your posts are timestamped with your local time, please set your hometown in settings first. This helps your friend see when you posted in your timezone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={() => {
              setProceedWithUTC(true);
              setShowHometownPrompt(false);
              setTimeout(() => handleSubmit(true), 0);
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
  </>
  );
};
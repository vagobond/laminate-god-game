import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Link2, Send, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface BrookComposerProps {
  brookId: string;
  userId: string;
  onPostCreated: () => void;
}

export const BrookComposer = ({ brookId, userId, onPostCreated }: BrookComposerProps) => {
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [canPost, setCanPost] = useState(true);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkCanPost();
  }, [brookId, userId]);

  const checkCanPost = async () => {
    setChecking(true);
    try {
      // Check if user already posted today in this brook
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("brook_posts")
        .select("id")
        .eq("brook_id", brookId)
        .eq("user_id", userId)
        .gte("created_at", `${today}T00:00:00`)
        .lt("created_at", `${today}T23:59:59`)
        .limit(1);

      if (error) throw error;
      setCanPost((data || []).length === 0);
    } catch (error) {
      console.error("Error checking post eligibility:", error);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("brook_posts")
        .insert({
          brook_id: brookId,
          user_id: userId,
          content: content.trim(),
          link: link.trim() || null
        });

      if (error) throw error;

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

  if (checking) {
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
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
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
            onClick={handleSubmit} 
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
  );
};
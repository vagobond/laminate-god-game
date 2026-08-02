import { useState, useEffect, useCallback, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Send, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MentionText } from "@/components/MentionText";
import { GroupPostReactions } from "./GroupPostReactions";
import { useRequireAuth } from "@/components/auth/GuestAuthGate";

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_display_name: string | null;
  author_avatar_url: string | null;
  author_username: string | null;
}

interface GroupPostCommentsProps {
  postId: string;
  currentUserId: string | null;
  lastVisitedAt?: string | null;
  focusCommentId?: string | null;
}

export const GroupPostComments = ({ postId, currentUserId, lastVisitedAt, focusCommentId }: GroupPostCommentsProps) => {
  const navigate = useNavigate();
  const requireAuth = useRequireAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [showInput, setShowInput] = useState(false);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const focusedCommentRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [highlightOn, setHighlightOn] = useState(false);

  // Auto-expand and scroll to a focused comment when present
  useEffect(() => {
    if (!focusCommentId || !comments.some((c) => c.id === focusCommentId)) return;
    setExpanded(true);
    const t = setTimeout(() => {
      focusedCommentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightOn(true);
      setTimeout(() => setHighlightOn(false), 3000);
    }, 200);
    return () => clearTimeout(t);
  }, [focusCommentId, comments]);

  const loadComments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("group_post_comments")
        .select("id, post_id, user_id, content, created_at")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const userIds = [...new Set((data || []).map((c) => c.user_id))];
      if (userIds.length === 0) {
        setComments([]);
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, username")
        .in("id", userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

      setComments(
        (data || []).map((c) => {
          const profile = profileMap.get(c.user_id);
          return {
            ...c,
            author_display_name: profile?.display_name || null,
            author_avatar_url: profile?.avatar_url || null,
            author_username: profile?.username || null,
          };
        })
      );
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  }, [postId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    if (!requireAuth("post a comment")) return;
    if (!currentUserId) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("group_post_comments").insert({
        post_id: postId,
        user_id: currentUserId,
        content: content.trim(),
      });
      if (error) throw error;
      setContent("");
      setShowInput(false);
      toast.success("Comment posted");
      loadComments();
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase.from("group_post_comments").delete().eq("id", commentId);
      if (error) throw error;
      toast.success("Comment deleted");
      loadComments();
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  const handleReply = (comment: Comment) => {
    const handle = comment.author_username
      ? `@${comment.author_username} `
      : `${comment.author_display_name || "Anonymous"}, `;
    setShowInput(true);
    setContent((prev) => (prev.includes(handle.trim()) ? prev : `${handle}${prev}`));
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  const handleAuthorClick = (comment: Comment) => {
    if (comment.author_username) navigate(`/${comment.author_username}`);
    else navigate(`/u/${comment.user_id}`);
  };

  const count = comments.length;
  const newCommentCount = lastVisitedAt
    ? comments.filter((c) => new Date(c.created_at) > new Date(lastVisitedAt)).length
    : 0;
  const visible = expanded ? comments : comments.slice(0, 2);
  const hasMore = count > 2;

  if (count === 0 && !currentUserId) return null;

  return (
    <div className="mt-3 pt-3 border-t border-border/50">
      <div className="flex items-center gap-2 mb-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs gap-1"
          onClick={() => setShowInput(!showInput)}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Comment
        </Button>
        {count > 0 && (
          <span className="text-xs text-muted-foreground">
            {count} {count === 1 ? "comment" : "comments"}
            {newCommentCount > 0 && (
              <span className="ml-1 inline-flex items-center rounded-full bg-destructive px-1.5 py-0 text-[10px] font-bold text-destructive-foreground">
                {newCommentCount} new
              </span>
            )}
          </span>
        )}
      </div>

      {showInput && (
        <div className="flex gap-2 mb-3">
          <Textarea
            ref={inputRef}
            placeholder="Write a comment..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[60px] text-sm resize-none"
            maxLength={500}
          />
          <Button size="sm" className="self-end" onClick={handleSubmit} disabled={submitting || !content.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}

      {visible.length > 0 && (
        <div className="space-y-2">
          {visible.map((comment) => {
            const isFocused = comment.id === focusCommentId;
            return (
            <div
              key={comment.id}
              ref={isFocused ? focusedCommentRef : undefined}
              className={`flex gap-2 group rounded-lg transition-all ${isFocused && highlightOn ? "ring-2 ring-primary p-1 -m-1" : ""}`}
            >
              <Avatar
                className="h-7 w-7 cursor-pointer hover:ring-2 hover:ring-primary transition-all shrink-0 mt-0.5"
                onClick={() => handleAuthorClick(comment)}
              >
                <AvatarImage src={comment.author_avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {comment.author_display_name?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="bg-muted/50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-sm font-medium cursor-pointer hover:underline"
                      onClick={() => handleAuthorClick(comment)}
                    >
                      {comment.author_display_name || "Anonymous"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm mt-0.5 whitespace-pre-wrap break-words">
                    <MentionText content={comment.content} />
                  </p>
                </div>

                {/* Comment reactions */}
                <div className="mt-1">
                  <GroupPostReactions targetId={comment.id} targetType="comment" />
                </div>

                {comment.user_id === currentUserId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDelete(comment.id)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
            );
          })}

          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground w-full"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Show {count - 2} more {count - 2 === 1 ? "comment" : "comments"}
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

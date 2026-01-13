import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Send, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  author: {
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
}

interface BrookCommentsProps {
  postId: string;
  currentUserId: string;
}

export const BrookComments = ({ postId, currentUserId }: BrookCommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen, postId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("brook_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Get author profiles
      const userIds = [...new Set((data || []).map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, username")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      setComments((data || []).map(comment => ({
        ...comment,
        author: profileMap.get(comment.user_id) || {
          display_name: null,
          avatar_url: null,
          username: null
        }
      })));
    } catch (error) {
      console.error("Error loading brook comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("brook_comments")
        .insert({
          post_id: postId,
          user_id: currentUserId,
          content: newComment.trim()
        });

      if (error) throw error;

      setNewComment("");
      loadComments();
    } catch (error) {
      console.error("Error adding brook comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("brook_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (error) {
      console.error("Error deleting brook comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 gap-1">
          <MessageCircle className="h-4 w-4 text-muted-foreground" />
          {comments.length > 0 && (
            <span className="text-xs text-muted-foreground">{comments.length}</span>
          )}
          <span className="text-xs text-muted-foreground">
            {isOpen ? "Hide" : "Comments"}
          </span>
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="mt-3 space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <>
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-2 items-start">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={comment.author.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {comment.author.display_name?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {comment.author.display_name || comment.author.username || "Anonymous"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(comment.created_at), "MMM d, h:mm a")}
                    </span>
                    {comment.user_id === currentUserId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(comment.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm mt-0.5 break-words">{comment.content}</p>
                </div>
              </div>
            ))}

            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 h-8 text-sm"
                maxLength={500}
              />
              <Button 
                type="submit" 
                size="sm" 
                className="h-8"
                disabled={!newComment.trim() || submitting}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};
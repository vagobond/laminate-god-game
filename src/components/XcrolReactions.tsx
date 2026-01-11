import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import SendMessageDialog from "@/components/SendMessageDialog";

const AVAILABLE_EMOJIS = ["❤️", "👍", "🔥", "😂", "😮", "😢", "🙏", "✨"];

export interface Reaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface XcrolReactionsProps {
  entryId: string;
  compact?: boolean;
  authorId?: string;
  authorName?: string;
  initialReactions?: Reaction[];
  onReactionsChange?: (reactions: Reaction[]) => void;
}

export const XcrolReactions = ({ entryId, compact = false, authorId, authorName, initialReactions, onReactionsChange }: XcrolReactionsProps) => {
  const [reactions, setReactions] = useState<Reaction[]>(initialReactions || []);
  const [userId, setUserId] = useState<string | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [friendshipLevel, setFriendshipLevel] = useState<string | null>(null);
  const pendingOps = useRef<Set<string>>(new Set());
  const hasInitialReactions = useRef(!!initialReactions);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });
  }, []);

  // Only load reactions from DB if not provided initially
  useEffect(() => {
    if (!hasInitialReactions.current) {
      loadReactions();
    }
  }, [entryId, userId]);

  // Update reactions when initialReactions prop changes
  useEffect(() => {
    if (initialReactions) {
      setReactions(initialReactions);
    }
  }, [initialReactions]);

  useEffect(() => {
    if (userId && authorId && userId !== authorId) {
      loadFriendshipLevel();
    }
  }, [userId, authorId]);

  const loadFriendshipLevel = async () => {
    if (!userId || !authorId) return;
    try {
      const { data } = await supabase
        .from("friendships")
        .select("level")
        .eq("user_id", authorId)
        .eq("friend_id", userId)
        .maybeSingle();
      
      setFriendshipLevel(data?.level || null);
    } catch (error) {
      console.error("Error loading friendship level:", error);
    }
  };

  const loadReactions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("xcrol_reactions")
        .select("emoji, user_id")
        .eq("entry_id", entryId);

      if (error) throw error;

      const grouped = (data || []).reduce((acc, r) => {
        if (!acc[r.emoji]) {
          acc[r.emoji] = { emoji: r.emoji, count: 0, hasReacted: false };
        }
        acc[r.emoji].count++;
        if (userId && r.user_id === userId) {
          acc[r.emoji].hasReacted = true;
        }
        return acc;
      }, {} as Record<string, Reaction>);

      setReactions(Object.values(grouped));
    } catch (error) {
      console.error("Error loading reactions:", error);
    }
  }, [entryId, userId]);

  const toggleReaction = useCallback(async (emoji: string) => {
    if (!userId) {
      toast.error("Sign in to react");
      return;
    }

    if (pendingOps.current.has(emoji)) return;
    pendingOps.current.add(emoji);

    const existingReaction = reactions.find(r => r.emoji === emoji && r.hasReacted);

    setReactions(prev => {
      const updated = [...prev];
      const idx = updated.findIndex(r => r.emoji === emoji);
      
      if (existingReaction) {
        if (idx !== -1) {
          if (updated[idx].count === 1) {
            updated.splice(idx, 1);
          } else {
            updated[idx] = { ...updated[idx], count: updated[idx].count - 1, hasReacted: false };
          }
        }
      } else {
        if (idx !== -1) {
          updated[idx] = { ...updated[idx], count: updated[idx].count + 1, hasReacted: true };
        } else {
          updated.push({ emoji, count: 1, hasReacted: true });
        }
      }
      // Notify parent of changes
      onReactionsChange?.(updated);
      return updated;
    });

    setPopoverOpen(false);

    try {
      if (existingReaction) {
        const { error } = await supabase
          .from("xcrol_reactions")
          .delete()
          .eq("entry_id", entryId)
          .eq("user_id", userId)
          .eq("emoji", emoji);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("xcrol_reactions")
          .insert({ entry_id: entryId, user_id: userId, emoji });

        if (error) throw error;
      }
    } catch (error) {
      console.error("Error toggling reaction:", error);
      toast.error("Failed to update reaction");
      loadReactions();
    } finally {
      pendingOps.current.delete(emoji);
    }
  }, [userId, reactions, entryId, loadReactions]);

  const canRespond = authorId && authorName && userId && userId !== authorId && friendshipLevel && 
    friendshipLevel !== "not_friend" && friendshipLevel !== "fake_friend";

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {reactions.map((reaction) => (
        <Button
          key={reaction.emoji}
          variant={reaction.hasReacted ? "secondary" : "ghost"}
          size="sm"
          className={`h-7 px-2 text-xs gap-1 ${reaction.hasReacted ? "ring-1 ring-primary/50" : ""}`}
          onClick={() => toggleReaction(reaction.emoji)}
        >
          <span>{reaction.emoji}</span>
          <span className="text-muted-foreground">{reaction.count}</span>
        </Button>
      ))}
      
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-7 ${compact ? "px-1.5" : "px-2"}`}
          >
            <Smile className="h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="flex gap-1">
            {AVAILABLE_EMOJIS.map((emoji) => {
              const existing = reactions.find(r => r.emoji === emoji);
              return (
                <Button
                  key={emoji}
                  variant={existing?.hasReacted ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 w-8 p-0 text-lg"
                  onClick={() => toggleReaction(emoji)}
                >
                  {emoji}
                </Button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      {canRespond && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 ${compact ? "px-1.5" : "px-2"} gap-1`}
            onClick={() => setMessageDialogOpen(true)}
          >
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            {!compact && <span className="text-xs text-muted-foreground">Respond</span>}
          </Button>
          <SendMessageDialog
            recipientId={authorId}
            recipientName={authorName}
            friendshipLevel={friendshipLevel}
            open={messageDialogOpen}
            onOpenChange={setMessageDialogOpen}
          />
        </>
      )}
    </div>
  );
};

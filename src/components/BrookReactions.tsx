import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Smile } from "lucide-react";
import { toast } from "sonner";

const AVAILABLE_EMOJIS = ["❤️", "👍", "🔥", "😂", "😮", "😢", "🙏", "✨"];

interface Reaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
  users: { id: string; name: string }[];
}

interface BrookReactionsProps {
  postId: string;
  currentUserId: string;
}

export const BrookReactions = ({ postId, currentUserId }: BrookReactionsProps) => {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const pendingOps = useRef<Set<string>>(new Set());

  useEffect(() => {
    loadReactions();
  }, [postId, currentUserId]);

  const loadReactions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("brook_reactions")
        .select("emoji, user_id")
        .eq("post_id", postId);

      if (error) throw error;

      // Get unique user IDs
      const userIds = [...new Set((data || []).map(r => r.user_id))];
      
      // Fetch user profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, username")
        .in("id", userIds);

      const profileMap = new Map(
        (profiles || []).map(p => [p.id, p.display_name || p.username || "Anonymous"])
      );

      const grouped = (data || []).reduce((acc, r) => {
        if (!acc[r.emoji]) {
          acc[r.emoji] = { emoji: r.emoji, count: 0, hasReacted: false, users: [] };
        }
        acc[r.emoji].count++;
        acc[r.emoji].users.push({ 
          id: r.user_id, 
          name: profileMap.get(r.user_id) || "Anonymous" 
        });
        if (r.user_id === currentUserId) {
          acc[r.emoji].hasReacted = true;
        }
        return acc;
      }, {} as Record<string, Reaction>);

      setReactions(Object.values(grouped));
    } catch (error) {
      console.error("Error loading brook reactions:", error);
    }
  }, [postId, currentUserId]);

  const toggleReaction = useCallback(async (emoji: string) => {
    if (pendingOps.current.has(emoji)) return;
    pendingOps.current.add(emoji);

    const existingReaction = reactions.find(r => r.emoji === emoji && r.hasReacted);

    // Optimistic update
    setReactions(prev => {
      const updated = [...prev];
      const idx = updated.findIndex(r => r.emoji === emoji);
      
      if (existingReaction) {
        if (idx !== -1) {
          if (updated[idx].count === 1) {
            updated.splice(idx, 1);
          } else {
            updated[idx] = { 
              ...updated[idx], 
              count: updated[idx].count - 1, 
              hasReacted: false,
              users: updated[idx].users.filter(u => u.id !== currentUserId)
            };
          }
        }
      } else {
        if (idx !== -1) {
          updated[idx] = { 
            ...updated[idx], 
            count: updated[idx].count + 1, 
            hasReacted: true,
            users: [...updated[idx].users, { id: currentUserId, name: "You" }]
          };
        } else {
          updated.push({ emoji, count: 1, hasReacted: true, users: [{ id: currentUserId, name: "You" }] });
        }
      }
      return updated;
    });

    setPopoverOpen(false);

    try {
      if (existingReaction) {
        const { error } = await supabase
          .from("brook_reactions")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", currentUserId)
          .eq("emoji", emoji);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("brook_reactions")
          .insert({ post_id: postId, user_id: currentUserId, emoji });

        if (error) throw error;
      }
    } catch (error) {
      console.error("Error toggling brook reaction:", error);
      toast.error("Failed to update reaction");
      loadReactions();
    } finally {
      pendingOps.current.delete(emoji);
    }
  }, [currentUserId, reactions, postId, loadReactions]);

  const formatUserList = (users: { id: string; name: string }[]) => {
    if (users.length === 0) return "";
    if (users.length === 1) return users[0].name;
    if (users.length === 2) return `${users[0].name} and ${users[1].name}`;
    return `${users.slice(0, -1).map(u => u.name).join(", ")}, and ${users[users.length - 1].name}`;
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1 flex-wrap">
        {reactions.map((reaction) => (
          <Tooltip key={reaction.emoji}>
            <TooltipTrigger asChild>
              <Button
                variant={reaction.hasReacted ? "secondary" : "ghost"}
                size="sm"
                className={`h-7 px-2 text-xs gap-1 ${reaction.hasReacted ? "ring-1 ring-primary/50" : ""}`}
                onClick={() => toggleReaction(reaction.emoji)}
              >
                <span>{reaction.emoji}</span>
                <span className="text-muted-foreground">{reaction.count}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm">{formatUserList(reaction.users)}</p>
            </TooltipContent>
          </Tooltip>
        ))}
        
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2">
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
      </div>
    </TooltipProvider>
  );
};
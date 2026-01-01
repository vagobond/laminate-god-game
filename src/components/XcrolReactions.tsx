import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile } from "lucide-react";
import { toast } from "sonner";

const AVAILABLE_EMOJIS = ["❤️", "👍", "🔥", "😂", "😮", "😢", "🙏", "✨"];

interface Reaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface XcrolReactionsProps {
  entryId: string;
  compact?: boolean;
}

export const XcrolReactions = ({ entryId, compact = false }: XcrolReactionsProps) => {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    loadUser();
    loadReactions();
  }, [entryId]);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);
  };

  const loadReactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("xcrol_reactions")
        .select("emoji, user_id")
        .eq("entry_id", entryId);

      if (error) throw error;

      // Group by emoji
      const grouped = (data || []).reduce((acc, r) => {
        if (!acc[r.emoji]) {
          acc[r.emoji] = { emoji: r.emoji, count: 0, hasReacted: false };
        }
        acc[r.emoji].count++;
        if (user && r.user_id === user.id) {
          acc[r.emoji].hasReacted = true;
        }
        return acc;
      }, {} as Record<string, Reaction>);

      setReactions(Object.values(grouped));
    } catch (error) {
      console.error("Error loading reactions:", error);
    }
  };

  const toggleReaction = async (emoji: string) => {
    if (!userId) {
      toast.error("Sign in to react");
      return;
    }

    setLoading(true);
    try {
      const existingReaction = reactions.find(r => r.emoji === emoji && r.hasReacted);

      if (existingReaction) {
        // Remove reaction
        const { error } = await supabase
          .from("xcrol_reactions")
          .delete()
          .eq("entry_id", entryId)
          .eq("user_id", userId)
          .eq("emoji", emoji);

        if (error) throw error;
      } else {
        // Add reaction
        const { error } = await supabase
          .from("xcrol_reactions")
          .insert({ entry_id: entryId, user_id: userId, emoji });

        if (error) throw error;
      }

      await loadReactions();
      setPopoverOpen(false);
    } catch (error) {
      console.error("Error toggling reaction:", error);
      toast.error("Failed to update reaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {reactions.map((reaction) => (
        <Button
          key={reaction.emoji}
          variant={reaction.hasReacted ? "secondary" : "ghost"}
          size="sm"
          className={`h-7 px-2 text-xs gap-1 ${reaction.hasReacted ? "ring-1 ring-primary/50" : ""}`}
          onClick={() => toggleReaction(reaction.emoji)}
          disabled={loading}
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
            disabled={loading}
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
                  disabled={loading}
                >
                  {emoji}
                </Button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Check, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface AddFriendButtonProps {
  profileUserId: string;
}

type FriendStatus = "none" | "pending_sent" | "pending_received" | "friends";

const AddFriendButton = ({ profileUserId }: AddFriendButtonProps) => {
  const [user, setUser] = useState<any>(null);
  const [status, setStatus] = useState<FriendStatus>("none");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user && profileUserId) {
      checkFriendStatus();
    }
  }, [user, profileUserId]);

  const checkFriendStatus = async () => {
    if (!user) return;

    // Check if already friends
    const { data: friendship } = await supabase
      .from("friendships")
      .select("id")
      .eq("user_id", user.id)
      .eq("friend_id", profileUserId)
      .maybeSingle();

    if (friendship) {
      setStatus("friends");
      return;
    }

    // Check for pending request sent
    const { data: sentRequest } = await supabase
      .from("friend_requests")
      .select("id")
      .eq("from_user_id", user.id)
      .eq("to_user_id", profileUserId)
      .maybeSingle();

    if (sentRequest) {
      setStatus("pending_sent");
      return;
    }

    // Check for pending request received
    const { data: receivedRequest } = await supabase
      .from("friend_requests")
      .select("id")
      .eq("from_user_id", profileUserId)
      .eq("to_user_id", user.id)
      .maybeSingle();

    if (receivedRequest) {
      setStatus("pending_received");
      return;
    }

    setStatus("none");
  };

  const handleSendRequest = async () => {
    if (!user) {
      toast.error("Please sign in to add friends");
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase
        .from("friend_requests")
        .insert({
          from_user_id: user.id,
          to_user_id: profileUserId,
          message: message.trim() || null,
        });

      if (error) throw error;

      toast.success("Friend request sent!");
      setStatus("pending_sent");
      setMessage("");
      setOpen(false);
    } catch (error: any) {
      console.error("Error sending request:", error);
      if (error.code === "23505") {
        toast.error("Friend request already sent");
      } else {
        toast.error("Failed to send friend request");
      }
    } finally {
      setSending(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!user) return;

    try {
      await supabase
        .from("friend_requests")
        .delete()
        .eq("from_user_id", user.id)
        .eq("to_user_id", profileUserId);

      toast.success("Friend request cancelled");
      setStatus("none");
    } catch (error) {
      console.error("Error cancelling request:", error);
      toast.error("Failed to cancel request");
    }
  };

  // Don't show for own profile or if not logged in
  if (!user || user.id === profileUserId) return null;

  if (status === "friends") {
    return (
      <Button variant="outline" size="sm" disabled>
        <Users className="w-4 h-4 mr-2" />
        Friends
      </Button>
    );
  }

  if (status === "pending_sent") {
    return (
      <Button variant="outline" size="sm" onClick={handleCancelRequest}>
        <Clock className="w-4 h-4 mr-2" />
        Pending
      </Button>
    );
  }

  if (status === "pending_received") {
    return (
      <Button variant="outline" size="sm" disabled>
        <Check className="w-4 h-4 mr-2" />
        Respond in notifications
      </Button>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Friend
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-4 bg-popover border border-border z-50">
        <div className="space-y-3">
          <p className="text-sm font-medium">Send a friend request</p>
          <Textarea
            placeholder="Add a message (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[80px]"
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground text-right">{message.length}/200</p>
          <div className="flex gap-2">
            <Button 
              onClick={handleSendRequest} 
              disabled={sending}
              className="flex-1"
            >
              {sending ? "Sending..." : "Send Request"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AddFriendButton;
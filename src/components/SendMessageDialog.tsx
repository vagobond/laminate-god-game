import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { MessageSquare, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UserMentionInput } from "@/components/UserMentionInput";

type FriendshipLevel = "close_friend" | "buddy" | "friendly_acquaintance" | "secret_friend" | "secret_enemy" | "not_friend" | null;

interface Platform {
  id: string;
  label: string;
  available: boolean;
}

interface SendMessageDialogProps {
  recipientId: string;
  recipientName: string;
  friendshipLevel: FriendshipLevel | string;
  availablePlatforms?: {
    linkedin: boolean;
    email: boolean;
    instagram: boolean;
    whatsapp: boolean;
    phone: boolean;
  };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Optional: links this message to a River entry (creates separate thread) */
  entryId?: string;
}

const SendMessageDialog = ({ 
  recipientId, 
  recipientName, 
  friendshipLevel,
  availablePlatforms,
  open: controlledOpen,
  onOpenChange,
  entryId,
}: SendMessageDialogProps) => {
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [message, setMessage] = useState("");
  const [platformSuggestion, setPlatformSuggestion] = useState<string>("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  // Build platforms list based on friendship level if availablePlatforms not provided
  const getPlatforms = (): Platform[] => {
    const platforms: Platform[] = [];
    
    if (availablePlatforms) {
      if (availablePlatforms.linkedin) {
        platforms.push({ id: "linkedin", label: "LinkedIn", available: true });
      }
      if (availablePlatforms.email) {
        platforms.push({ id: "email", label: "Email", available: true });
      }
      if (availablePlatforms.instagram) {
        platforms.push({ id: "instagram", label: "Instagram", available: true });
      }
      if (availablePlatforms.whatsapp) {
        platforms.push({ id: "whatsapp", label: "WhatsApp", available: true });
      }
      if (availablePlatforms.phone) {
        platforms.push({ id: "phone", label: "Phone", available: true });
      }
    } else {
      // Infer based on friendship level
      const level = friendshipLevel as FriendshipLevel;
      if (level === "close_friend" || level === "secret_friend") {
        platforms.push({ id: "whatsapp", label: "WhatsApp", available: true });
        platforms.push({ id: "phone", label: "Phone", available: true });
        platforms.push({ id: "instagram", label: "Instagram", available: true });
        platforms.push({ id: "linkedin", label: "LinkedIn", available: true });
        platforms.push({ id: "email", label: "Email", available: true });
      } else if (level === "buddy") {
        platforms.push({ id: "instagram", label: "Instagram", available: true });
        platforms.push({ id: "linkedin", label: "LinkedIn", available: true });
        platforms.push({ id: "email", label: "Email", available: true });
      } else if (level === "friendly_acquaintance") {
        platforms.push({ id: "linkedin", label: "LinkedIn", available: true });
        platforms.push({ id: "email", label: "Email", available: true });
      }
    }
    
    return platforms;
  };

  const platforms = getPlatforms();

  const handleSend = async () => {
    if (!message.trim()) {
      toast({
        title: "Message required",
        description: "Please enter a message to send.",
        variant: "destructive",
      });
      return;
    }

    if (message.length > 500) {
      toast({
        title: "Message too long",
        description: "Please keep your message under 500 characters.",
        variant: "destructive",
      });
      return;
    }

    // Use auth hook for user ID
    if (!user?.id) {
      toast({
        title: "Not logged in",
        description: "Please log in to send messages.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        from_user_id: user.id,
        to_user_id: recipientId,
        content: message.trim(),
        platform_suggestion: platformSuggestion || null,
        entry_id: entryId || null,
      });

      if (error) throw error;

      toast({
        title: "Message sent!",
        description: `Your message was sent to ${recipientName}.`,
      });
      
      setMessage("");
      setPlatformSuggestion("");
      setOpen(false);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Failed to send",
        description: "Could not send your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  // Only show if there's any valid friendship level
  if (!friendshipLevel || friendshipLevel === "not_friend" || friendshipLevel === "secret_enemy") {
    return null;
  }

  const isControlled = controlledOpen !== undefined;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Message
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send a message to {recipientName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="message">Your message</Label>
            <UserMentionInput
              value={message}
              onChange={setMessage}
              placeholder="Write a short message... Tag users with @username"
              maxLength={500}
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/500
            </p>
          </div>

          {platforms.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="platform">Suggest connecting on (optional)</Label>
              <Select value={platformSuggestion} onValueChange={setPlatformSuggestion}>
                <SelectTrigger id="platform">
                  <SelectValue placeholder="Select a platform..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No platform suggestion</SelectItem>
                  {platforms.map((platform) => (
                    <SelectItem key={platform.id} value={platform.id}>
                      Let's connect on {platform.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button 
            onClick={handleSend} 
            disabled={sending || !message.trim()}
            className="w-full gap-2"
          >
            <Send className="w-4 h-4" />
            {sending ? "Sending..." : "Send Message"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SendMessageDialog;

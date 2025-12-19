import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Inbox, Mail, MailOpen, Trash2, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Message {
  id: string;
  from_user_id: string;
  to_user_id: string;
  content: string;
  platform_suggestion: string | null;
  created_at: string;
  read_at: string | null;
  sender?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

const platformLabels: Record<string, string> = {
  linkedin: "LinkedIn",
  email: "Email",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  phone: "Phone",
};

const MessagesInbox = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch sender profiles
      const senderIds = [...new Set((data || []).map(m => m.from_user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", senderIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const messagesWithSenders = (data || []).map(m => ({
        ...m,
        sender: profileMap.get(m.from_user_id),
      }));

      setMessages(messagesWithSenders);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("id", messageId);

      setMessages(prev => 
        prev.map(m => m.id === messageId ? { ...m, read_at: new Date().toISOString() } : m)
      );
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", messageId);

      if (error) throw error;

      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast({
        title: "Message deleted",
      });
    } catch (error) {
      console.error("Error deleting message:", error);
      toast({
        title: "Failed to delete",
        variant: "destructive",
      });
    }
  };

  const unreadCount = messages.filter(
    m => m.to_user_id === currentUserId && !m.read_at
  ).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Loading messages...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Inbox className="w-5 h-5" />
          Messages
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount} new
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No messages yet
          </p>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => {
              const isReceived = message.to_user_id === currentUserId;
              const isUnread = isReceived && !message.read_at;
              
              return (
                <div
                  key={message.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    isUnread ? "bg-primary/5 border-primary/20" : "bg-secondary/30"
                  }`}
                  onClick={() => isUnread && markAsRead(message.id)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar 
                      className="w-10 h-10 cursor-pointer"
                      onClick={() => navigate(`/profile/${message.from_user_id}`)}
                    >
                      <AvatarImage src={message.sender?.avatar_url || undefined} />
                      <AvatarFallback>
                        {(message.sender?.display_name || "?").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span 
                          className="font-medium cursor-pointer hover:text-primary"
                          onClick={() => navigate(`/profile/${message.from_user_id}`)}
                        >
                          {message.sender?.display_name || "Unknown"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {isReceived ? "→ you" : "← sent by you"}
                        </span>
                        {isUnread && (
                          <Mail className="w-4 h-4 text-primary" />
                        )}
                        {!isUnread && isReceived && (
                          <MailOpen className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <p className="mt-1 text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      {message.platform_suggestion && message.platform_suggestion !== "none" && (
                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-primary/10 rounded text-xs text-primary">
                          <ExternalLink className="w-3 h-3" />
                          Let's connect on {platformLabels[message.platform_suggestion] || message.platform_suggestion}
                        </div>
                      )}
                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMessage(message.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MessagesInbox;

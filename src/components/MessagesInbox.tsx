import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Inbox, Mail, MailOpen, Trash2, ExternalLink, Reply, UserPlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import SendMessageDialog from "./SendMessageDialog";
import MarkdownContent from "./MarkdownContent";

interface SenderProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  linkedin_url: string | null;
  contact_email: string | null;
  instagram_url: string | null;
  whatsapp: string | null;
  phone_number: string | null;
  link: string | null;
}

interface Message {
  id: string;
  from_user_id: string;
  to_user_id: string;
  content: string;
  platform_suggestion: string | null;
  created_at: string;
  read_at: string | null;
  sender?: SenderProfile;
  recipient?: SenderProfile;
  type: "message" | "friend_request";
}

const platformLabels: Record<string, string> = {
  linkedin: "LinkedIn",
  email: "Email",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  phone: "Phone",
};

const getPlatformUrl = (platform: string, sender?: SenderProfile): string | null => {
  if (!sender) return null;
  
  switch (platform) {
    case "linkedin":
      return sender.linkedin_url;
    case "email":
      return sender.contact_email ? `mailto:${sender.contact_email}` : null;
    case "instagram":
      return sender.instagram_url;
    case "whatsapp":
      return sender.whatsapp ? `https://wa.me/${sender.whatsapp.replace(/\D/g, '')}` : null;
    case "phone":
      return sender.phone_number ? `tel:${sender.phone_number}` : null;
    default:
      return sender.link;
  }
};

const MessagesInbox = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
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

      // Fetch regular messages
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (messagesError) throw messagesError;

      // Fetch friend requests with messages (only pending ones sent to user)
      const { data: friendRequestsData, error: friendRequestsError } = await supabase
        .from("friend_requests")
        .select("*")
        .eq("to_user_id", user.id)
        .not("message", "is", null)
        .order("created_at", { ascending: false });

      if (friendRequestsError) throw friendRequestsError;

      // Filter out friend requests with empty messages
      const friendRequestsWithMessages = (friendRequestsData || []).filter(
        fr => fr.message && fr.message.trim() !== ""
      );

      // Collect all user IDs for profile lookup
      const messageUserIds = (messagesData || []).flatMap(m => [m.from_user_id, m.to_user_id]);
      const friendRequestUserIds = friendRequestsWithMessages.map(fr => fr.from_user_id);
      const allUserIds = [...new Set([...messageUserIds, ...friendRequestUserIds])];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, linkedin_url, contact_email, instagram_url, whatsapp, phone_number, link")
        .in("id", allUserIds);

      const profileMap = new Map<string, SenderProfile>(profiles?.map(p => [p.id, p as SenderProfile]) || []);

      // Transform regular messages
      const regularMessages: Message[] = (messagesData || []).map(m => ({
        ...m,
        sender: profileMap.get(m.from_user_id),
        recipient: profileMap.get(m.to_user_id),
        type: "message" as const,
      }));

      // Transform friend requests into message format
      const friendRequestMessages: Message[] = friendRequestsWithMessages.map(fr => ({
        id: fr.id,
        from_user_id: fr.from_user_id,
        to_user_id: fr.to_user_id,
        content: fr.message!,
        platform_suggestion: null,
        created_at: fr.created_at,
        read_at: null, // Friend requests don't have read status
        sender: profileMap.get(fr.from_user_id),
        recipient: profileMap.get(fr.to_user_id),
        type: "friend_request" as const,
      }));

      // Combine and sort by date
      const allMessages = [...regularMessages, ...friendRequestMessages].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setMessages(allMessages);
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
      
      // Dispatch event to notify NotificationBell to refresh
      window.dispatchEvent(new CustomEvent('messages-updated'));
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const deleteMessage = async (messageId: string, type: "message" | "friend_request") => {
    try {
      if (type === "message") {
        const { error } = await supabase
          .from("messages")
          .delete()
          .eq("id", messageId);

        if (error) throw error;
      }
      // Don't allow deleting friend requests from here - they should be handled in friends list

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
    m => m.to_user_id === currentUserId && !m.read_at && m.type === "message"
  ).length;

  const friendRequestCount = messages.filter(m => m.type === "friend_request").length;

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
          {friendRequestCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {friendRequestCount} friend request{friendRequestCount > 1 ? "s" : ""}
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
              const isUnread = isReceived && !message.read_at && message.type === "message";
              const isFriendRequest = message.type === "friend_request";
              
              return (
                <div
                  key={`${message.type}-${message.id}`}
                  className={`p-4 rounded-lg border transition-colors ${
                    isFriendRequest 
                      ? "bg-amber-500/10 border-amber-500/30" 
                      : isUnread 
                        ? "bg-primary/5 border-primary/20" 
                        : "bg-secondary/30"
                  }`}
                  onClick={() => isUnread && markAsRead(message.id)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar 
                      className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/u/${message.from_user_id}`);
                      }}
                    >
                      <AvatarImage src={message.sender?.avatar_url || undefined} />
                      <AvatarFallback>
                        {(message.sender?.display_name || "?").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span 
                          className="font-medium cursor-pointer hover:text-primary hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/u/${message.from_user_id}`);
                          }}
                        >
                          {message.sender?.display_name || "Unknown"}
                        </span>
                        {isFriendRequest ? (
                          <Badge variant="outline" className="text-amber-600 border-amber-500/50">
                            <UserPlus className="w-3 h-3 mr-1" />
                            Friend Request
                          </Badge>
                        ) : (
                          <>
                            <span className="text-xs text-muted-foreground">→</span>
                            <span 
                              className="font-medium cursor-pointer hover:text-primary hover:underline"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/u/${message.to_user_id}`);
                              }}
                            >
                              {message.to_user_id === currentUserId 
                                ? "you" 
                                : (message.recipient?.display_name || "Unknown")}
                            </span>
                            {isUnread && (
                              <Mail className="w-4 h-4 text-primary" />
                            )}
                            {!isUnread && isReceived && (
                              <MailOpen className="w-4 h-4 text-muted-foreground" />
                            )}
                          </>
                        )}
                      </div>
                      <MarkdownContent 
                        content={message.content} 
                        className="mt-1 text-sm break-words block"
                      />
                      {isFriendRequest && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 text-amber-600 border-amber-500/50 hover:bg-amber-500/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate("/profile?tab=friends");
                          }}
                        >
                          <UserPlus className="w-3 h-3 mr-1" />
                          Respond to Request
                        </Button>
                      )}
                      {message.platform_suggestion && message.platform_suggestion !== "none" && (() => {
                        const platformUrl = getPlatformUrl(message.platform_suggestion, message.sender);
                        return platformUrl ? (
                          <a
                            href={platformUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-primary/10 rounded text-xs text-primary hover:bg-primary/20 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3 h-3" />
                            Let's connect on {platformLabels[message.platform_suggestion] || message.platform_suggestion}
                          </a>
                        ) : (
                          <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-primary/10 rounded text-xs text-primary">
                            <ExternalLink className="w-3 h-3" />
                            Let's connect on {platformLabels[message.platform_suggestion] || message.platform_suggestion}
                          </div>
                        );
                      })()}
                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      {isReceived && !isFriendRequest && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReplyingTo(message);
                          }}
                        >
                          <Reply className="w-4 h-4" />
                        </Button>
                      )}
                      {!isFriendRequest && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMessage(message.id, message.type);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {replyingTo && (
        <SendMessageDialog
          recipientId={replyingTo.from_user_id}
          recipientName={replyingTo.sender?.display_name || "Unknown"}
          friendshipLevel="buddy"
          open={!!replyingTo}
          onOpenChange={(open) => {
            if (!open) {
              setReplyingTo(null);
              loadMessages();
            }
          }}
        />
      )}
    </Card>
  );
};

export default MessagesInbox;

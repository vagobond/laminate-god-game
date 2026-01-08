import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Inbox, Mail, MailOpen, Trash2, ExternalLink, Reply, UserPlus, ChevronDown, ChevronUp, ArrowLeft, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import SendMessageDialog from "./SendMessageDialog";
import MarkdownContent from "./MarkdownContent";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

interface ConversationThread {
  otherUserId: string;
  otherUser: SenderProfile | undefined;
  messages: Message[];
  unreadCount: number;
  latestMessage: Message;
  hasFriendRequest: boolean;
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
  const [threads, setThreads] = useState<ConversationThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ConversationThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [viewingMessage, setViewingMessage] = useState<Message | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const navigate = useNavigate();

  const toggleExpanded = (messageId: string) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const isLongMessage = (content: string) => content.length > 150;

  useEffect(() => {
    loadMessages();
  }, []);

  // Group messages into threads whenever messages change
  useEffect(() => {
    if (!currentUserId) return;

    const threadMap = new Map<string, Message[]>();

    messages.forEach(message => {
      const otherUserId = message.from_user_id === currentUserId 
        ? message.to_user_id 
        : message.from_user_id;
      
      if (!threadMap.has(otherUserId)) {
        threadMap.set(otherUserId, []);
      }
      threadMap.get(otherUserId)!.push(message);
    });

    const groupedThreads: ConversationThread[] = Array.from(threadMap.entries()).map(([otherUserId, msgs]) => {
      // Sort messages by date ascending (oldest first) for the thread view
      const sortedMessages = [...msgs].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      const latestMessage = msgs.reduce((latest, msg) => 
        new Date(msg.created_at) > new Date(latest.created_at) ? msg : latest
      );

      const unreadCount = msgs.filter(
        m => m.to_user_id === currentUserId && !m.read_at && m.type === "message"
      ).length;

      const hasFriendRequest = msgs.some(m => m.type === "friend_request");

      // Get the other user's profile from any message
      const otherUser = msgs[0]?.from_user_id === otherUserId 
        ? msgs[0]?.sender 
        : msgs[0]?.recipient;

      return {
        otherUserId,
        otherUser,
        messages: sortedMessages,
        unreadCount,
        latestMessage,
        hasFriendRequest,
      };
    });

    // Sort threads by latest message date (most recent first)
    groupedThreads.sort(
      (a, b) => new Date(b.latestMessage.created_at).getTime() - new Date(a.latestMessage.created_at).getTime()
    );

    setThreads(groupedThreads);
  }, [messages, currentUserId]);

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
        read_at: null,
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

  const totalUnreadCount = threads.reduce((sum, t) => sum + t.unreadCount, 0);
  const friendRequestCount = threads.filter(t => t.hasFriendRequest).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Loading messages...
        </CardContent>
      </Card>
    );
  }

  // Thread detail view
  if (selectedThread) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedThread(null)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Avatar 
              className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
              onClick={() => navigate(`/u/${selectedThread.otherUserId}`)}
            >
              <AvatarImage src={selectedThread.otherUser?.avatar_url || undefined} />
              <AvatarFallback>
                {(selectedThread.otherUser?.display_name || "?").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span 
              className="cursor-pointer hover:text-primary hover:underline"
              onClick={() => navigate(`/u/${selectedThread.otherUserId}`)}
            >
              {selectedThread.otherUser?.display_name || "Unknown"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {selectedThread.messages.map((message) => {
              const isReceived = message.to_user_id === currentUserId;
              const isUnread = isReceived && !message.read_at && message.type === "message";
              const isFriendRequest = message.type === "friend_request";

              // Mark as read when viewing
              if (isUnread) {
                markAsRead(message.id);
              }
              
              return (
                <div
                  key={`${message.type}-${message.id}`}
                  className={`p-3 rounded-lg ${
                    isFriendRequest 
                      ? "bg-amber-500/10 border border-amber-500/30" 
                      : isReceived
                        ? "bg-secondary/50 mr-8"
                        : "bg-primary/10 ml-8"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      {isFriendRequest && (
                        <Badge variant="outline" className="text-amber-600 border-amber-500/50 mb-2">
                          <UserPlus className="w-3 h-3 mr-1" />
                          Friend Request
                        </Badge>
                      )}
                      {/* Message content */}
                      {isLongMessage(message.content) && !expandedMessages.has(message.id) ? (
                        <div>
                          <MarkdownContent 
                            content={message.content.slice(0, 150) + "..."} 
                            className="text-sm break-words block"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-1 h-6 px-2 text-xs text-primary"
                            onClick={() => toggleExpanded(message.id)}
                          >
                            <ChevronDown className="w-3 h-3 mr-1" />
                            Read more
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <MarkdownContent 
                            content={message.content} 
                            className="text-sm break-words block"
                          />
                          {isLongMessage(message.content) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-1 h-6 px-2 text-xs text-muted-foreground"
                              onClick={() => toggleExpanded(message.id)}
                            >
                              <ChevronUp className="w-3 h-3 mr-1" />
                              Show less
                            </Button>
                          )}
                        </div>
                      )}
                      {isFriendRequest && (
                        <div className="mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-primary border-primary/50 hover:bg-primary/10"
                            onClick={() => navigate("/profile?tab=friends")}
                          >
                            <UserPlus className="w-3 h-3 mr-1" />
                            Accept/Decline
                          </Button>
                        </div>
                      )}
                      {message.platform_suggestion && message.platform_suggestion !== "none" && (() => {
                        const platformUrl = getPlatformUrl(message.platform_suggestion, message.sender);
                        return platformUrl ? (
                          <a
                            href={platformUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-primary/10 rounded text-xs text-primary hover:bg-primary/20 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Let's connect on {platformLabels[message.platform_suggestion] || message.platform_suggestion}
                          </a>
                        ) : null;
                      })()}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!isFriendRequest && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => deleteMessage(message.id, message.type)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Reply button */}
          <div className="mt-4 pt-4 border-t">
            <Button
              className="w-full"
              onClick={() => setReplyingTo(selectedThread.messages[0])}
            >
              <Reply className="w-4 h-4 mr-2" />
              Reply to {selectedThread.otherUser?.display_name || "Unknown"}
            </Button>
          </div>
        </CardContent>

        {replyingTo && (
          <SendMessageDialog
            recipientId={selectedThread.otherUserId}
            recipientName={selectedThread.otherUser?.display_name || "Unknown"}
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
  }

  // Thread list view
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Inbox className="w-5 h-5" />
          Messages
          {totalUnreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {totalUnreadCount} new
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
        {threads.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No messages yet
          </p>
        ) : (
          <div className="space-y-2">
            {threads.map((thread) => (
              <div
                key={thread.otherUserId}
                className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-secondary/50 ${
                  thread.hasFriendRequest 
                    ? "bg-amber-500/10 border-amber-500/30" 
                    : thread.unreadCount > 0
                      ? "bg-primary/5 border-primary/20" 
                      : "bg-secondary/30"
                }`}
                onClick={() => setSelectedThread(thread)}
              >
                <div className="flex items-center gap-3">
                  <Avatar 
                    className="w-12 h-12"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/u/${thread.otherUserId}`);
                    }}
                  >
                    <AvatarImage src={thread.otherUser?.avatar_url || undefined} />
                    <AvatarFallback>
                      {(thread.otherUser?.display_name || "?").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {thread.otherUser?.display_name || "Unknown"}
                      </span>
                      {thread.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {thread.unreadCount}
                        </Badge>
                      )}
                      {thread.hasFriendRequest && (
                        <Badge variant="outline" className="text-amber-600 border-amber-500/50 text-xs">
                          <UserPlus className="w-3 h-3 mr-1" />
                          Request
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {thread.latestMessage.from_user_id === currentUserId && "You: "}
                      {thread.latestMessage.content.slice(0, 50)}
                      {thread.latestMessage.content.length > 50 && "..."}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(thread.latestMessage.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{thread.messages.length}</span>
                  </div>
                </div>
              </div>
            ))}
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

      {/* Full message dialog for friend requests */}
      <Dialog open={!!viewingMessage} onOpenChange={(open) => !open && setViewingMessage(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={viewingMessage?.sender?.avatar_url || undefined} />
                <AvatarFallback>
                  {(viewingMessage?.sender?.display_name || "?").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span>Message from {viewingMessage?.sender?.display_name || "Unknown"}</span>
            </DialogTitle>
            <DialogDescription>
              Friend request received {viewingMessage && formatDistanceToNow(new Date(viewingMessage.created_at), { addSuffix: true })}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 p-4 bg-secondary/30 rounded-lg">
            <MarkdownContent 
              content={viewingMessage?.content || ""} 
              className="text-sm break-words"
            />
          </div>
          <div className="mt-4 flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                if (viewingMessage?.sender) {
                  navigate(`/u/${viewingMessage.from_user_id}`);
                  setViewingMessage(null);
                }
              }}
            >
              View Profile
            </Button>
            <Button
              onClick={() => {
                setViewingMessage(null);
                navigate("/profile?tab=friends");
              }}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Accept/Decline Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default MessagesInbox;

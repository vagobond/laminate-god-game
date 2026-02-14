import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Message, ConversationThread, SenderProfile } from "./types";
import { getFirstSentence } from "./types";

export const useMessagesData = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [threads, setThreads] = useState<ConversationThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [entryPreviews, setEntryPreviews] = useState<Map<string, string>>(new Map());
  const { toast } = useToast();

  const loadMessages = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUserId(user.id);

      const [{ data: messagesData, error: messagesError }, { data: friendRequestsData, error: friendRequestsError }] = await Promise.all([
        supabase
          .from("messages")
          .select("*")
          .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
          .order("created_at", { ascending: false }),
        supabase
          .from("friend_requests")
          .select("*")
          .eq("to_user_id", user.id)
          .not("message", "is", null)
          .order("created_at", { ascending: false }),
      ]);

      if (messagesError) throw messagesError;
      if (friendRequestsError) throw friendRequestsError;

      const friendRequestsWithMessages = (friendRequestsData || []).filter(
        fr => fr.message && fr.message.trim() !== ""
      );

      const messageUserIds = (messagesData || []).flatMap(m => [m.from_user_id, m.to_user_id]);
      const friendRequestUserIds = friendRequestsWithMessages.map(fr => fr.from_user_id);
      const allUserIds = [...new Set([...messageUserIds, ...friendRequestUserIds])];

      let profileMap = new Map<string, SenderProfile>();

      if (allUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url, link")
          .in("id", allUserIds);

        profileMap = new Map(profiles?.map(p => [p.id, p as SenderProfile]) || []);
      }

      const regularMessages: Message[] = (messagesData || []).map(m => ({
        ...m,
        sender: profileMap.get(m.from_user_id),
        recipient: profileMap.get(m.to_user_id),
        type: "message" as const,
      }));

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

      const allMessages = [...regularMessages, ...friendRequestMessages].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setMessages(allMessages);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Group messages into threads
  useEffect(() => {
    if (!currentUserId) return;

    const threadMap = new Map<string, Message[]>();

    messages.forEach(message => {
      const otherUserId = message.from_user_id === currentUserId
        ? message.to_user_id
        : message.from_user_id;

      const threadKey = message.entry_id
        ? `entry:${message.entry_id}:${otherUserId}`
        : `direct:${otherUserId}`;

      if (!threadMap.has(threadKey)) {
        threadMap.set(threadKey, []);
      }
      threadMap.get(threadKey)!.push(message);
    });

    // Collect entry IDs that need previews
    const entryIds = new Set<string>();
    threadMap.forEach((msgs) => {
      const entryId = msgs[0]?.entry_id;
      if (entryId && !entryPreviews.has(entryId)) {
        entryIds.add(entryId);
      }
    });

    const fetchEntryPreviews = async () => {
      if (entryIds.size === 0) return;

      const { data } = await supabase
        .from("xcrol_entries")
        .select("id, content")
        .in("id", Array.from(entryIds));

      if (data) {
        const newPreviews = new Map(entryPreviews);
        data.forEach(entry => {
          newPreviews.set(entry.id, getFirstSentence(entry.content));
        });
        setEntryPreviews(newPreviews);
      }
    };

    fetchEntryPreviews();

    const groupedThreads: ConversationThread[] = Array.from(threadMap.entries()).map(([threadKey, msgs]) => {
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

      const isEntryThread = threadKey.startsWith("entry:");
      const entryId = isEntryThread ? msgs[0]?.entry_id : null;
      const otherUserId = isEntryThread
        ? threadKey.split(":")[2]
        : threadKey.replace("direct:", "");

      let brookId: string | null = null;
      for (const msg of msgs) {
        if (msg.platform_suggestion?.startsWith("brook_notification:")) {
          brookId = msg.platform_suggestion.replace("brook_notification:", "");
          break;
        }
      }

      let otherUser: SenderProfile | undefined;
      for (const msg of msgs) {
        if (msg.from_user_id === otherUserId && msg.sender) {
          otherUser = msg.sender;
          break;
        }
        if (msg.to_user_id === otherUserId && msg.recipient) {
          otherUser = msg.recipient;
          break;
        }
      }

      return {
        threadKey,
        otherUserId,
        otherUser,
        messages: sortedMessages,
        unreadCount,
        latestMessage,
        hasFriendRequest,
        entryId,
        entryPreview: entryId ? entryPreviews.get(entryId) : null,
        brookId,
      };
    });

    groupedThreads.sort(
      (a, b) => new Date(b.latestMessage.created_at).getTime() - new Date(a.latestMessage.created_at).getTime()
    );

    setThreads(groupedThreads);
  }, [messages, currentUserId, entryPreviews]);

  const markAsRead = useCallback(async (messageId: string) => {
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
  }, []);

  const deleteMessage = useCallback(async (messageId: string, type: "message" | "friend_request") => {
    try {
      if (type === "message") {
        const { error } = await supabase
          .from("messages")
          .delete()
          .eq("id", messageId);

        if (error) throw error;
      }

      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast({ title: "Message deleted" });
    } catch (error) {
      console.error("Error deleting message:", error);
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  }, [toast]);

  const totalUnreadCount = threads.reduce((sum, t) => sum + t.unreadCount, 0);
  const friendRequestCount = threads.filter(t => t.hasFriendRequest).length;

  return {
    threads,
    loading,
    currentUserId,
    totalUnreadCount,
    friendRequestCount,
    markAsRead,
    deleteMessage,
    loadMessages,
  };
};

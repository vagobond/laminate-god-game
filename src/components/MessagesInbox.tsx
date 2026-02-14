import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useMessagesData } from "./messages/useMessagesData";
import ThreadListView from "./messages/ThreadListView";
import ThreadDetailView from "./messages/ThreadDetailView";
import type { ConversationThread } from "./messages/types";

const MessagesInbox = () => {
  const {
    threads,
    loading,
    currentUserId,
    totalUnreadCount,
    friendRequestCount,
    markAsRead,
    deleteMessage,
    loadMessages,
  } = useMessagesData();

  const [selectedThread, setSelectedThread] = useState<ConversationThread | null>(null);

  // Load messages on mount
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Keep selected thread in sync with fresh data
  useEffect(() => {
    if (selectedThread) {
      const updated = threads.find(t => t.threadKey === selectedThread.threadKey);
      if (updated) {
        setSelectedThread(updated);
      }
    }
  }, [threads]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Loading messages...
        </CardContent>
      </Card>
    );
  }

  if (selectedThread) {
    return (
      <ThreadDetailView
        thread={selectedThread}
        currentUserId={currentUserId}
        onBack={() => setSelectedThread(null)}
        onMarkAsRead={markAsRead}
        onDeleteMessage={deleteMessage}
        onMessagesChanged={loadMessages}
      />
    );
  }

  return (
    <ThreadListView
      threads={threads}
      currentUserId={currentUserId}
      totalUnreadCount={totalUnreadCount}
      friendRequestCount={friendRequestCount}
      onSelectThread={setSelectedThread}
      onMessagesChanged={loadMessages}
    />
  );
};

export default MessagesInbox;

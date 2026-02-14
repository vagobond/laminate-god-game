import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, Reply, Waves } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SendMessageDialog from "@/components/SendMessageDialog";
import MessageBubble from "./MessageBubble";
import type { ConversationThread, Message } from "./types";

interface ThreadDetailViewProps {
  thread: ConversationThread;
  currentUserId: string | null;
  onBack: () => void;
  onMarkAsRead: (messageId: string) => void;
  onDeleteMessage: (messageId: string, type: "message" | "friend_request") => void;
  onMessagesChanged: () => void;
}

const ThreadDetailView = ({
  thread,
  currentUserId,
  onBack,
  onMarkAsRead,
  onDeleteMessage,
  onMessagesChanged,
}: ThreadDetailViewProps) => {
  const navigate = useNavigate();
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());

  const toggleExpanded = (messageId: string) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) newSet.delete(messageId);
      else newSet.add(messageId);
      return newSet;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 flex-wrap">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Avatar
            className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
            onClick={() => navigate(`/u/${thread.otherUserId}`)}
          >
            <AvatarImage src={thread.otherUser?.avatar_url || undefined} />
            <AvatarFallback>
              {(thread.otherUser?.display_name || "?").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span
            className="cursor-pointer hover:text-primary hover:underline"
            onClick={() => navigate(`/u/${thread.otherUserId}`)}
          >
            {thread.otherUser?.display_name || "Unknown"}
          </span>
          {thread.entryId && (
            <div className="flex items-center gap-2 ml-auto">
              <Badge variant="outline" className="text-blue-600 border-blue-500/50 text-xs max-w-[200px] truncate">
                <Waves className="w-3 h-3 mr-1 shrink-0" />
                <span className="truncate">
                  Re: "{thread.entryPreview || 'River Post'}"
                </span>
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-primary"
                onClick={() => navigate(`/the-river?post=${thread.entryId}`)}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                View Post
              </Button>
            </div>
          )}
          {thread.brookId && !thread.entryId && (
            <div className="flex items-center gap-2 ml-auto">
              <Badge variant="outline" className="text-cyan-600 border-cyan-500/50 text-xs">
                <Waves className="w-3 h-3 mr-1 shrink-0" />
                Brook Post
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-primary"
                onClick={() => navigate(`/brook/${thread.brookId}`)}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                View Brook
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {thread.messages.map((message) => {
            const isReceived = message.to_user_id === currentUserId;
            const isUnread = isReceived && !message.read_at && message.type === "message";

            if (isUnread) {
              onMarkAsRead(message.id);
            }

            return (
              <MessageBubble
                key={`${message.type}-${message.id}`}
                message={message}
                isReceived={isReceived}
                isExpanded={expandedMessages.has(message.id)}
                onToggleExpand={toggleExpanded}
                onDelete={onDeleteMessage}
              />
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t">
          <Button
            className="w-full"
            onClick={() => setReplyingTo(thread.messages[0])}
          >
            <Reply className="w-4 h-4 mr-2" />
            Reply to {thread.otherUser?.display_name || "Unknown"}
          </Button>
        </div>
      </CardContent>

      {replyingTo && (
        <SendMessageDialog
          recipientId={thread.otherUserId}
          recipientName={thread.otherUser?.display_name || "Unknown"}
          friendshipLevel="buddy"
          open={!!replyingTo}
          onOpenChange={(open) => {
            if (!open) {
              setReplyingTo(null);
              onMessagesChanged();
            }
          }}
          entryId={thread.entryId || undefined}
        />
      )}
    </Card>
  );
};

export default ThreadDetailView;

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Inbox, MessageCircle, UserPlus, Waves } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import SendMessageDialog from "@/components/SendMessageDialog";
import FriendRequestDialog from "./FriendRequestDialog";
import type { ConversationThread, Message } from "./types";

interface ThreadListViewProps {
  threads: ConversationThread[];
  currentUserId: string | null;
  totalUnreadCount: number;
  friendRequestCount: number;
  onSelectThread: (thread: ConversationThread) => void;
  onMessagesChanged: () => void;
}

const ThreadListView = ({
  threads,
  currentUserId,
  totalUnreadCount,
  friendRequestCount,
  onSelectThread,
  onMessagesChanged,
}: ThreadListViewProps) => {
  const navigate = useNavigate();
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [viewingMessage, setViewingMessage] = useState<Message | null>(null);

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
                key={thread.threadKey}
                className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-secondary/50 ${
                  thread.hasFriendRequest
                    ? "bg-amber-500/10 border-amber-500/30"
                    : thread.entryId
                      ? "bg-blue-500/5 border-blue-500/20"
                      : thread.brookId
                        ? "bg-cyan-500/5 border-cyan-500/20"
                        : thread.unreadCount > 0
                          ? "bg-primary/5 border-primary/20"
                          : "bg-secondary/30"
                }`}
                onClick={() => onSelectThread(thread)}
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">
                        {thread.otherUser?.display_name || "Unknown"}
                      </span>
                      {thread.entryId && (
                        <Badge variant="outline" className="text-blue-600 border-blue-500/50 text-xs max-w-[180px]">
                          <Waves className="w-3 h-3 mr-1 shrink-0" />
                          <span className="truncate">
                            Re: "{thread.entryPreview || 'River Post'}"
                          </span>
                        </Badge>
                      )}
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
                      {thread.brookId && (
                        <Badge variant="outline" className="text-blue-600 border-blue-500/50 text-xs">
                          <Waves className="w-3 h-3 mr-1" />
                          Brook Post
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
              onMessagesChanged();
            }
          }}
        />
      )}

      <FriendRequestDialog
        message={viewingMessage}
        onClose={() => setViewingMessage(null)}
      />
    </Card>
  );
};

export default ThreadListView;

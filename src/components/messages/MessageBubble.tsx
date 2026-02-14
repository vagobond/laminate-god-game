import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, ChevronDown, ChevronUp, ExternalLink, UserPlus, Waves } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import MarkdownContent from "@/components/MarkdownContent";
import type { Message, SenderProfile } from "./types";
import { isLongMessage, platformLabels, getPlatformUrl } from "./types";

interface MessageBubbleProps {
  message: Message;
  isReceived: boolean;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onDelete: (id: string, type: "message" | "friend_request") => void;
}

const MessageBubble = ({ message, isReceived, isExpanded, onToggleExpand, onDelete }: MessageBubbleProps) => {
  const navigate = useNavigate();
  const isFriendRequest = message.type === "friend_request";

  return (
    <div
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

          {isLongMessage(message.content) && !isExpanded ? (
            <div>
              <MarkdownContent
                content={message.content.slice(0, 150) + "..."}
                className="text-sm break-words block"
              />
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 h-6 px-2 text-xs text-primary"
                onClick={() => onToggleExpand(message.id)}
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
                  onClick={() => onToggleExpand(message.id)}
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

          <PlatformSuggestion message={message} />

          <p className="mt-1 text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </p>
        </div>
        {!isFriendRequest && (
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive shrink-0"
            onClick={() => onDelete(message.id, message.type)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

const PlatformSuggestion = ({ message }: { message: Message }) => {
  const navigate = useNavigate();

  if (!message.platform_suggestion || message.platform_suggestion === "none") return null;

  if (message.platform_suggestion.startsWith("brook_notification:")) {
    const brookId = message.platform_suggestion.replace("brook_notification:", "");
    return (
      <Button
        variant="outline"
        size="sm"
        className="mt-2 text-blue-600 border-blue-500/50 hover:bg-blue-500/10"
        onClick={() => navigate(`/brook/${brookId}`)}
      >
        <Waves className="w-3 h-3 mr-1" />
        View Brook
      </Button>
    );
  }

  if (message.platform_suggestion === "brook_notification") {
    return (
      <Button
        variant="outline"
        size="sm"
        className="mt-2 text-blue-600 border-blue-500/50 hover:bg-blue-500/10"
        onClick={() => navigate("/the-forest?tab=brooks")}
      >
        <Waves className="w-3 h-3 mr-1" />
        View Brooks
      </Button>
    );
  }

  const platformUrl = getPlatformUrl(message.platform_suggestion, message.sender);
  if (!platformUrl) return null;

  return (
    <a
      href={platformUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-primary/10 rounded text-xs text-primary hover:bg-primary/20 transition-colors"
    >
      <ExternalLink className="w-3 h-3" />
      Let's connect on {platformLabels[message.platform_suggestion] || message.platform_suggestion}
    </a>
  );
};

export default MessageBubble;

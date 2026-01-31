import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Edit2, MessageSquare, UserMinus } from "lucide-react";
import { getFriendshipLabel } from "@/lib/friendship-labels";

interface Friend {
  id: string;
  friend_id: string;
  level: string;
  uses_custom_type?: boolean;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface FriendItemProps {
  friend: Friend;
  isOwnProfile: boolean;
  showLevelBadge?: boolean;
  customTypeName?: string | null;
  onEdit?: (friend: Friend) => void;
  onMessage?: (friend: Friend) => void;
  onUnfriend?: (friend: Friend) => void;
}

export function FriendItem({
  friend,
  isOwnProfile,
  showLevelBadge = false,
  customTypeName,
  onEdit,
  onMessage,
  onUnfriend,
}: FriendItemProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
      <Avatar
        className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
        onClick={() => navigate(`/u/${friend.friend_id}`)}
      >
        <AvatarImage src={friend.profile?.avatar_url || undefined} />
        <AvatarFallback>
          {(friend.profile?.display_name || "?").slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => navigate(`/u/${friend.friend_id}`)}
      >
        <p className="font-medium truncate hover:text-primary transition-colors">
          {friend.profile?.display_name || "Unknown"}
        </p>
      </div>
      {showLevelBadge &&
        isOwnProfile &&
        !["secret_friend", "secret_enemy"].includes(friend.level) && (
          <Badge
            variant={friend.uses_custom_type ? "default" : "secondary"}
            className={`text-xs ${friend.uses_custom_type ? "bg-primary/80" : ""}`}
          >
            {friend.uses_custom_type && customTypeName
              ? customTypeName
              : getFriendshipLabel(friend.level)}
          </Badge>
        )}
      {isOwnProfile && (
        <div className="flex gap-1">
          {onMessage && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMessage(friend);
                  }}
                >
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Send message</TooltipContent>
            </Tooltip>
          )}
          {onEdit && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(friend);
                  }}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit friendship level</TooltipContent>
            </Tooltip>
          )}
          {onUnfriend && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnfriend(friend);
                  }}
                >
                  <UserMinus className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Unfriend</TooltipContent>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
}

export default FriendItem;

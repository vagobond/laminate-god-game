import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Check, X, Clock } from "lucide-react";

interface FriendRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  message: string | null;
  created_at: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface FriendRequestItemProps {
  request: FriendRequest;
  type: "sent" | "received";
  onAccept?: (request: FriendRequest) => void;
  onDecline?: (requestId: string) => void;
  onCancel?: (requestId: string) => void;
}

export function FriendRequestItem({
  request,
  type,
  onAccept,
  onDecline,
  onCancel,
}: FriendRequestItemProps) {
  const navigate = useNavigate();

  const targetUserId = type === "sent" ? request.to_user_id : request.from_user_id;

  if (type === "sent") {
    return (
      <div className="flex items-center gap-3 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <div
          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
          onClick={() => navigate(`/u/${targetUserId}`)}
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={request.profile?.avatar_url || undefined} />
            <AvatarFallback>
              {(request.profile?.display_name || "?").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {request.profile?.display_name || "Unknown"}
            </p>
          </div>
        </div>
        {onCancel && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onCancel(request.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Cancel request</TooltipContent>
          </Tooltip>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
      <div
        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
        onClick={() => navigate(`/u/${targetUserId}`)}
      >
        <Avatar className="h-10 w-10">
          <AvatarImage src={request.profile?.avatar_url || undefined} />
          <AvatarFallback>
            {(request.profile?.display_name || "?").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">
            {request.profile?.display_name || "Unknown"}
          </p>
          {request.message && (
            <p className="text-xs text-muted-foreground truncate">{request.message}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {onAccept && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-500/20"
                onClick={(e) => {
                  e.stopPropagation();
                  onAccept(request);
                }}
              >
                <Check className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Accept</TooltipContent>
          </Tooltip>
        )}
        {onDecline && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/20"
                onClick={(e) => {
                  e.stopPropagation();
                  onDecline(request.id);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Decline</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

export default FriendRequestItem;

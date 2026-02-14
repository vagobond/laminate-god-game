import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { FriendRequest } from "@/hooks/use-notifications";

interface FriendRequestItemProps {
  request: FriendRequest;
  onRespond: (request: FriendRequest) => void;
  onBlock: (request: FriendRequest) => void;
}

const FriendRequestItem = ({ request, onRespond, onBlock }: FriendRequestItemProps) => {
  const navigate = useNavigate();

  return (
    <div className="p-3 bg-secondary/50 rounded-lg space-y-2">
      <div className="flex items-center gap-3">
        <Avatar
          className="h-10 w-10 cursor-pointer"
          onClick={() => navigate(`/u/${request.from_user_id}`)}
        >
          <AvatarImage src={request.from_profile?.avatar_url || undefined} />
          <AvatarFallback>
            {(request.from_profile?.display_name || "?").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p
            className="font-medium truncate cursor-pointer hover:underline"
            onClick={() => navigate(`/u/${request.from_user_id}`)}
          >
            {request.from_profile?.display_name || "Unknown User"}
          </p>
          {request.message && (
            <p className="text-sm text-muted-foreground truncate">
              {request.message}
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="flex-1" onClick={() => onRespond(request)}>
          Respond
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onBlock(request)}
        >
          Block
        </Button>
      </div>
    </div>
  );
};

export default FriendRequestItem;

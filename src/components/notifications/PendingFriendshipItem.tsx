import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { PendingFriendship } from "@/hooks/use-notifications";

interface PendingFriendshipItemProps {
  friendship: PendingFriendship;
  onChooseLevel: (friendship: PendingFriendship) => void;
}

const PendingFriendshipItem = ({ friendship, onChooseLevel }: PendingFriendshipItemProps) => {
  const navigate = useNavigate();

  return (
    <div className="p-3 bg-primary/10 rounded-lg space-y-2 border border-primary/30">
      <div className="flex items-center gap-3">
        <Avatar
          className="h-10 w-10 cursor-pointer"
          onClick={() => navigate(`/u/${friendship.friend_id}`)}
        >
          <AvatarImage src={friendship.friend_profile?.avatar_url || undefined} />
          <AvatarFallback>
            {(friendship.friend_profile?.display_name || "?").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p
            className="font-medium truncate cursor-pointer hover:underline"
            onClick={() => navigate(`/u/${friendship.friend_id}`)}
          >
            {friendship.friend_profile?.display_name || "Unknown User"}
          </p>
          <p className="text-sm text-primary">
            Accepted your request! Set your friendship level.
          </p>
        </div>
      </div>
      <Button
        size="sm"
        className="w-full"
        onClick={() => onChooseLevel(friendship)}
      >
        Choose Friendship Level
      </Button>
    </div>
  );
};

export default PendingFriendshipItem;

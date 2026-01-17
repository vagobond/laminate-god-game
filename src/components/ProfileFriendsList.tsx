import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

interface Friend {
  id: string;
  friend_id: string;
  level: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface ProfileFriendsListProps {
  userId: string;
  viewerId?: string | null;
}

/**
 * Simplified friends display for profile pages.
 * Shows only confirmed friends' avatar and name (clickable to their profile).
 * Title links to The Forest page for full friend management.
 */
const ProfileFriendsList = ({ userId, viewerId }: ProfileFriendsListProps) => {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFriends();
  }, [userId, viewerId]);

  const loadFriends = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.rpc("get_visible_friends", {
        profile_id: userId,
        viewer_id: viewerId ?? null,
      });

      if (error) throw error;

      // Only include regular friends (exclude secret_friend, secret_enemy)
      const regularFriends = (data || [])
        .filter((row: any) => !["secret_friend", "secret_enemy"].includes(row.level))
        .map((row: any) => ({
          id: row.id,
          friend_id: row.friend_id,
          level: row.level,
          profile: {
            display_name: row.display_name,
            avatar_url: row.avatar_url,
          },
        }));

      setFriends(regularFriends);
    } catch (error) {
      console.error("Error loading friends:", error);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-muted-foreground text-sm">Loading friends...</p>
        </CardContent>
      </Card>
    );
  }

  if (friends.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle 
            className="text-lg flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
            onClick={() => navigate("/the-forest")}
          >
            <Users className="w-5 h-5" />
            Friends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No friends yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle 
          className="text-lg flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
          onClick={() => navigate("/the-forest")}
        >
          <Users className="w-5 h-5" />
          Friends ({friends.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {friends.map((friend) => (
            <div
              key={friend.id}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
              onClick={() => navigate(`/u/${friend.friend_id}`)}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={friend.profile?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {(friend.profile?.display_name || "?").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium truncate max-w-[100px] hover:text-primary transition-colors">
                {friend.profile?.display_name || "Unknown"}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileFriendsList;

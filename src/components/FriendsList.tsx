import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

interface FriendsListProps {
  userId: string;
  viewerId?: string | null;
  showLevels?: boolean;
}

const levelLabels: Record<string, string> = {
  close_friend: "Close Friend",
  buddy: "Buddy",
  friendly_acquaintance: "Acquaintance",
  secret_friend: "Secret Friend",
};

const FriendsList = ({ userId, viewerId, showLevels = false }: FriendsListProps) => {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [canSeeLevels, setCanSeeLevels] = useState(false);

  useEffect(() => {
    loadFriends();
    if (viewerId && viewerId !== userId) {
      checkMutualCloseFriend();
    } else if (viewerId === userId) {
      setCanSeeLevels(true);
    }
  }, [userId, viewerId]);

  const checkMutualCloseFriend = async () => {
    if (!viewerId) return;
    
    // Check if viewer and profile owner are mutual close friends
    const { data } = await supabase.rpc("are_mutual_close_friends", {
      user1_id: viewerId,
      user2_id: userId,
    });
    
    setCanSeeLevels(data === true);
  };

  const loadFriends = async () => {
    try {
      // Get friendships where this user has added friends (excluding secret friends unless it's the owner)
      const { data, error } = await supabase
        .from("friendships")
        .select("id, friend_id, level")
        .eq("user_id", userId);

      if (error) throw error;

      // Filter out secret friends for non-owners
      const visibleFriends = (data || []).filter((f) => {
        if (viewerId === userId) return true;
        return f.level !== "secret_friend";
      });

      // Load profiles
      const friendsWithProfiles = await Promise.all(
        visibleFriends.map(async (friend) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("display_name, avatar_url")
            .eq("id", friend.friend_id)
            .single();

          return {
            ...friend,
            profile: profileData || undefined,
          };
        })
      );

      setFriends(friendsWithProfiles);
    } catch (error) {
      console.error("Error loading friends:", error);
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
          <CardTitle className="text-lg flex items-center gap-2">
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
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="w-5 h-5" />
          Friends ({friends.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {friends.map((friend) => (
            <div
              key={friend.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
              onClick={() => navigate(`/u/${friend.friend_id}`)}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={friend.profile?.avatar_url || undefined} />
                <AvatarFallback>
                  {(friend.profile?.display_name || "?").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {friend.profile?.display_name || "Unknown"}
                </p>
              </div>
              {(showLevels || canSeeLevels) && friend.level !== "secret_friend" && (
                <Badge variant="secondary" className="text-xs">
                  {levelLabels[friend.level] || friend.level}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FriendsList;
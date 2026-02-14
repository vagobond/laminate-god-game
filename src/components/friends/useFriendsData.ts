import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Friend, FriendRequest, CustomFriendshipType, FriendshipLevel } from "./types";

interface UseFriendsDataProps {
  userId: string;
  viewerId?: string | null;
}

export const useFriendsData = ({ userId, viewerId }: UseFriendsDataProps) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [canSeeLevels, setCanSeeLevels] = useState(false);
  const [customFriendshipType, setCustomFriendshipType] = useState<CustomFriendshipType | null>(null);
  const [processing, setProcessing] = useState(false);

  const isOwnProfile = viewerId === userId;

  const loadCustomFriendshipType = useCallback(async () => {
    if (!viewerId) return;
    try {
      const { data, error } = await supabase
        .from("custom_friendship_types")
        .select("id, name")
        .eq("user_id", viewerId)
        .maybeSingle();
      if (error) throw error;
      setCustomFriendshipType(data);
    } catch (error) {
      console.error("Error loading custom friendship type:", error);
    }
  }, [viewerId]);

  const loadFriendRequests = useCallback(async () => {
    if (!viewerId) return;
    try {
      const [{ data: sentData, error: sentError }, { data: receivedData, error: receivedError }] = await Promise.all([
        supabase.from("friend_requests").select("id, from_user_id, to_user_id, message, created_at, nudge_sent_at").eq("from_user_id", viewerId),
        supabase.from("friend_requests").select("id, from_user_id, to_user_id, message, created_at, nudge_sent_at").eq("to_user_id", viewerId),
      ]);

      if (sentError) throw sentError;
      if (receivedError) throw receivedError;

      const sentUserIds = (sentData || []).map(r => r.to_user_id);
      const receivedUserIds = (receivedData || []).map(r => r.from_user_id);
      const allUserIds = [...new Set([...sentUserIds, ...receivedUserIds])];

      let profilesMap = new Map<string, { display_name: string | null; avatar_url: string | null }>();

      if (allUserIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", allUserIds);
        (profilesData || []).forEach(p => profilesMap.set(p.id, { display_name: p.display_name, avatar_url: p.avatar_url }));
      }

      setSentRequests((sentData || []).map(r => ({ ...r, nudge_sent_at: r.nudge_sent_at || null, profile: profilesMap.get(r.to_user_id) })));
      setReceivedRequests((receivedData || []).map(r => ({ ...r, nudge_sent_at: r.nudge_sent_at || null, profile: profilesMap.get(r.from_user_id) })));
    } catch (error) {
      console.error("Error loading friend requests:", error);
    }
  }, [viewerId]);

  const loadFriends = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_visible_friends", {
        profile_id: userId,
        viewer_id: viewerId ?? null,
      });
      if (error) throw error;

      let friendsWithCustomType: Friend[] = [];

      if (viewerId === userId) {
        const friendshipIds = (data || []).map((row: any) => row.id);
        const { data: customTypeData } = await supabase
          .from("friendships")
          .select("id, uses_custom_type")
          .in("id", friendshipIds);
        const customTypeMap = new Map((customTypeData || []).map((f: any) => [f.id, f.uses_custom_type]));

        friendsWithCustomType = (data || []).map((row: any) => ({
          id: row.id,
          friend_id: row.friend_id,
          level: row.level,
          uses_custom_type: customTypeMap.get(row.id) || false,
          profile: { display_name: row.display_name, avatar_url: row.avatar_url },
        }));
      } else {
        friendsWithCustomType = (data || []).map((row: any) => ({
          id: row.id,
          friend_id: row.friend_id,
          level: row.level,
          profile: { display_name: row.display_name, avatar_url: row.avatar_url },
        }));
      }

      setFriends(friendsWithCustomType);
    } catch (error) {
      console.error("Error loading friends:", error);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  }, [userId, viewerId]);

  const checkMutualCloseFriend = useCallback(async () => {
    if (!viewerId) return;
    const { data } = await supabase.rpc("are_mutual_close_friends", { user1_id: viewerId, user2_id: userId });
    setCanSeeLevels(data === true);
  }, [viewerId, userId]);

  useEffect(() => {
    loadFriends();
    if (viewerId && viewerId !== userId) {
      checkMutualCloseFriend();
    } else if (viewerId === userId) {
      setCanSeeLevels(true);
      loadCustomFriendshipType();
      loadFriendRequests();
    }
  }, [userId, viewerId, loadFriends, checkMutualCloseFriend, loadCustomFriendshipType, loadFriendRequests]);

  const nudgeFriendRequest = useCallback(async (requestId: string) => {
    try {
      const { error } = await supabase.from("friend_requests").update({ nudge_sent_at: new Date().toISOString() }).eq("id", requestId);
      if (error) throw error;
      setSentRequests(prev => prev.map(r => r.id === requestId ? { ...r, nudge_sent_at: new Date().toISOString() } : r));
      toast.success("Nudge sent!");
    } catch (error) {
      console.error("Error nudging request:", error);
      toast.error("Failed to send nudge");
    }
  }, []);

  const cancelSentRequest = useCallback(async (requestId: string) => {
    try {
      const { error } = await supabase.from("friend_requests").delete().eq("id", requestId);
      if (error) throw error;
      setSentRequests(prev => prev.filter(r => r.id !== requestId));
      toast.success("Friend request cancelled");
    } catch (error) {
      console.error("Error cancelling request:", error);
      toast.error("Failed to cancel request");
    }
  }, []);

  const declineRequest = useCallback(async (requestId: string) => {
    try {
      const { error } = await supabase.from("friend_requests").delete().eq("id", requestId);
      if (error) throw error;
      setReceivedRequests(prev => prev.filter(r => r.id !== requestId));
      toast.success("Friend request declined");
    } catch (error) {
      console.error("Error declining request:", error);
      toast.error("Failed to decline request");
    }
  }, []);

  const acceptRequest = useCallback(async (request: FriendRequest, level: string, useCustomType: boolean) => {
    setProcessing(true);
    try {
      const levelToUse = level === "custom" ? "buddy" : level;
      const { error } = await supabase.rpc("accept_friend_request", { request_id: request.id, friendship_level: levelToUse as any });
      if (error) throw error;

      if (level === "custom" && customFriendshipType) {
        await supabase.from("friendships").update({ uses_custom_type: true }).eq("user_id", viewerId).eq("friend_id", request.from_user_id);
      }

      toast.success("Friend request accepted!");
      setReceivedRequests(prev => prev.filter(r => r.id !== request.id));
      loadFriends();
    } catch (error) {
      console.error("Error accepting request:", error);
      toast.error("Failed to accept request");
    } finally {
      setProcessing(false);
    }
  }, [customFriendshipType, viewerId, loadFriends]);

  const unfriend = useCallback(async (friend: Friend) => {
    try {
      const { error: error1 } = await supabase.from("friendships").delete().eq("id", friend.id);
      if (error1) throw error1;
      await supabase.from("friendships").delete().eq("user_id", friend.friend_id).eq("friend_id", userId);
      setFriends(prev => prev.filter(f => f.id !== friend.id));
      toast.success(`Unfriended ${friend.profile?.display_name || "user"}`);
    } catch (error) {
      console.error("Error unfriending:", error);
      toast.error("Failed to unfriend");
    }
  }, [userId]);

  const updateFriendLevel = useCallback(async (friendId: string, level: string, usesCustomType: boolean) => {
    setProcessing(true);
    try {
      const levelToStore = usesCustomType ? "buddy" : level;
      const { error } = await supabase.from("friendships").update({ level: levelToStore as any, uses_custom_type: usesCustomType }).eq("id", friendId);
      if (error) throw error;
      setFriends(prev => prev.map(f => f.id === friendId ? { ...f, level: levelToStore, uses_custom_type: usesCustomType } : f));
      toast.success("Friendship level updated!");
    } catch (error) {
      console.error("Error updating level:", error);
      toast.error("Failed to update friendship level");
    } finally {
      setProcessing(false);
    }
  }, []);

  const regularFriends = friends.filter(f => !["secret_friend", "secret_enemy"].includes(f.level));
  const secretFriends = friends.filter(f => f.level === "secret_friend");
  const secretEnemies = friends.filter(f => f.level === "secret_enemy");

  return {
    friends,
    regularFriends,
    secretFriends,
    secretEnemies,
    sentRequests,
    receivedRequests,
    loading,
    canSeeLevels,
    customFriendshipType,
    processing,
    isOwnProfile,
    nudgeFriendRequest,
    cancelSentRequest,
    declineRequest,
    acceptRequest,
    unfriend,
    updateFriendLevel,
  };
};

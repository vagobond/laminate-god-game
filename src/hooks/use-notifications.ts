import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useUnreadMessages } from "@/hooks/use-unread-messages";

export interface FriendRequest {
  id: string;
  from_user_id: string;
  message: string | null;
  created_at: string;
  from_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface PendingFriendship {
  id: string;
  friend_id: string;
  friend_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface NewReference {
  id: string;
  from_user_id: string;
  reference_type: string;
  rating: number | null;
  created_at: string;
  from_profile?: {
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
  hasLeftReturn?: boolean;
}

const getDismissedReferenceIds = (): string[] => {
  try {
    const stored = localStorage.getItem("dismissed_reference_notifications");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const useNotifications = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [pendingFriendships, setPendingFriendships] = useState<PendingFriendship[]>([]);
  const [newReferences, setNewReferences] = useState<NewReference[]>([]);
  const { unreadCount: unreadMessageCount } = useUnreadMessages(user?.id || null);

  useEffect(() => {
    if (user) {
      loadRequests();
      loadPendingFriendships();
      loadNewReferences();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadNewReferences = async () => {
    if (!user) return;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from("user_references")
      .select("id, from_user_id, reference_type, rating, created_at")
      .eq("to_user_id", user.id)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading references:", error);
      return;
    }

    if (!data || data.length === 0) {
      setNewReferences([]);
      return;
    }

    const dismissedIds = getDismissedReferenceIds();
    const undismissedData = data.filter((ref) => !dismissedIds.includes(ref.id));

    if (undismissedData.length === 0) {
      setNewReferences([]);
      return;
    }

    const fromUserIds = [...new Set(undismissedData.map((ref) => ref.from_user_id))];

    const [profilesResult, returnRefsResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, display_name, avatar_url, username")
        .in("id", fromUserIds),
      supabase
        .from("user_references")
        .select("to_user_id")
        .eq("from_user_id", user.id)
        .in("to_user_id", fromUserIds),
    ]);

    const profilesMap = new Map(
      (profilesResult.data || []).map((p) => [p.id, p])
    );
    const returnRefSet = new Set(
      (returnRefsResult.data || []).map((r) => r.to_user_id)
    );

    const referencesWithDetails = undismissedData.map((ref) => ({
      ...ref,
      from_profile: profilesMap.get(ref.from_user_id) || undefined,
      hasLeftReturn: returnRefSet.has(ref.from_user_id),
    }));

    const unreturned = referencesWithDetails.filter((ref) => !ref.hasLeftReturn);
    setNewReferences(unreturned);
  };

  const loadRequests = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("friend_requests")
      .select("*")
      .eq("to_user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading requests:", error);
      return;
    }

    if (!data || data.length === 0) {
      setRequests([]);
      return;
    }

    const fromUserIds = [...new Set(data.map((req) => req.from_user_id))];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", fromUserIds);

    const profilesMap = new Map(
      (profiles || []).map((p) => [p.id, p])
    );

    const requestsWithProfiles = data.map((req) => ({
      ...req,
      from_profile: profilesMap.get(req.from_user_id) || undefined,
    }));

    setRequests(requestsWithProfiles);
  };

  const loadPendingFriendships = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("friendships")
      .select("id, friend_id")
      .eq("user_id", user.id)
      .eq("needs_level_set", true);

    if (error) {
      console.error("Error loading pending friendships:", error);
      return;
    }

    if (!data || data.length === 0) {
      setPendingFriendships([]);
      return;
    }

    const friendIds = [...new Set(data.map((f) => f.friend_id))];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", friendIds);

    const profilesMap = new Map(
      (profiles || []).map((p) => [p.id, p])
    );

    const friendshipsWithProfiles = data.map((friendship) => ({
      ...friendship,
      friend_profile: profilesMap.get(friendship.friend_id) || undefined,
    }));

    setPendingFriendships(friendshipsWithProfiles);
  };

  const dismissReferenceNotification = (refId: string) => {
    const dismissed = getDismissedReferenceIds();
    if (!dismissed.includes(refId)) {
      dismissed.push(refId);
      localStorage.setItem(
        "dismissed_reference_notifications",
        JSON.stringify(dismissed)
      );
    }
    setNewReferences((prev) => prev.filter((ref) => ref.id !== refId));
  };

  const totalNotifications =
    requests.length +
    pendingFriendships.length +
    unreadMessageCount +
    newReferences.length;

  return {
    user,
    requests,
    pendingFriendships,
    newReferences,
    unreadMessageCount,
    totalNotifications,
    dismissReferenceNotification,
    loadRequests,
    loadPendingFriendships,
  };
};

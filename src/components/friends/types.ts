export interface FriendProfile {
  display_name: string | null;
  avatar_url: string | null;
}

export interface Friend {
  id: string;
  friend_id: string;
  level: string;
  uses_custom_type?: boolean;
  profile?: FriendProfile;
}

export interface FriendRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  message: string | null;
  created_at: string;
  nudge_sent_at: string | null;
  profile?: FriendProfile;
}

export interface CustomFriendshipType {
  id: string;
  name: string;
}

export type FriendshipLevel = "close_friend" | "family" | "buddy" | "friendly_acquaintance" | "secret_friend" | "secret_enemy";
export type FriendshipSelection = FriendshipLevel | "custom";

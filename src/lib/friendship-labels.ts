/**
 * Centralized friendship/trust level labels
 * Used throughout the application for consistent naming
 */

export type FriendshipLevelKey = 
  | "close_friend" 
  | "family"
  | "buddy" 
  | "friendly_acquaintance" 
  | "secret_friend" 
  | "secret_enemy" 
  | "not_friend";

export interface FriendshipLevelInfo {
  label: string;
  shortLabel: string;
  description: string;
}

/**
 * Full label mapping with new names + original in parentheses
 */
export const friendshipLevelLabels: Record<FriendshipLevelKey, FriendshipLevelInfo> = {
  family: {
    label: "Blood Bound (Family)",
    shortLabel: "Blood Bound",
    description: "Independent category: phone, private email, and full birthday only. No social links.",
  },
  close_friend: {
    label: "Oath Bound (Close Friends)",
    shortLabel: "Oath Bound",
    description: "Can see your WhatsApp, phone number, or private email. Can see friendship levels in mutual close friends' lists.",
  },
  buddy: {
    label: "Companion (Buddy)",
    shortLabel: "Companion",
    description: "Can see your Instagram or other social profile. Can see your friends list without levels.",
  },
  friendly_acquaintance: {
    label: "Wayfarer (Acquaintance)",
    shortLabel: "Wayfarer",
    description: "Can see your LinkedIn or general contact email. Can see your friends list without levels.",
  },
  secret_friend: {
    label: "Shadow Ally (Secret Friend)",
    shortLabel: "Shadow Ally",
    description: "All privileges of close friend, but neither of you appears in each other's friends lists.",
  },
  secret_enemy: {
    label: "Shadow Friend (Secret Enemy)",
    shortLabel: "Shadow Friend",
    description: "They'll think you're friends, but get no access or see decoy info. Perfect for people you don't trust.",
  },
  not_friend: {
    label: "NPC (Stranger)",
    shortLabel: "NPC",
    description: "Decline the request without any friendship.",
  },
};

/**
 * Get the full label for a friendship level
 */
export function getFriendshipLabel(level: string): string {
  return friendshipLevelLabels[level as FriendshipLevelKey]?.label || level;
}

/**
 * Get the short label (just new name) for a friendship level
 */
export function getFriendshipShortLabel(level: string): string {
  return friendshipLevelLabels[level as FriendshipLevelKey]?.shortLabel || level;
}

/**
 * Get the description for a friendship level
 */
export function getFriendshipDescription(level: string): string {
  return friendshipLevelLabels[level as FriendshipLevelKey]?.description || "";
}

export interface SenderProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  link: string | null;
}

export interface Message {
  id: string;
  from_user_id: string;
  to_user_id: string;
  content: string;
  platform_suggestion: string | null;
  created_at: string;
  read_at: string | null;
  sender?: SenderProfile;
  recipient?: SenderProfile;
  type: "message" | "friend_request";
  entry_id?: string | null;
}

export interface ConversationThread {
  threadKey: string;
  otherUserId: string;
  otherUser: SenderProfile | undefined;
  messages: Message[];
  unreadCount: number;
  latestMessage: Message;
  hasFriendRequest: boolean;
  entryId?: string | null;
  entryPreview?: string | null;
  brookId?: string | null;
}

export const platformLabels: Record<string, string> = {
  linkedin: "LinkedIn",
  email: "Email",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  phone: "Phone",
};

export const getPlatformUrl = (platform: string, sender?: SenderProfile): string | null => {
  if (!sender) return null;
  return sender.link || null;
};

export const getFirstSentence = (text: string, maxLength = 60): string => {
  const match = text.match(/^[^.!?\n]+[.!?]?/);
  let sentence = match ? match[0].trim() : text.split('\n')[0].trim();
  if (sentence.length > maxLength) {
    sentence = sentence.slice(0, maxLength).trim() + "...";
  }
  return sentence;
};

export const isLongMessage = (content: string) => content.length > 150;

export interface UserProfile {
  id: string;
  display_name: string | null;
  username: string | null;
  email: string | null;
  created_at: string;
  invited_by_name?: string | null;
  invited_by_email?: string | null;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile?: {
    display_name: string | null;
    email: string | null;
  };
}

export interface FlaggedReference {
  id: string;
  reference_id: string;
  flagged_by: string;
  reason: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  reference?: {
    id: string;
    content: string;
    rating: number | null;
    reference_type: string;
    from_user_id: string;
    to_user_id: string;
  };
  flagger?: {
    display_name: string | null;
  };
  from_user?: {
    display_name: string | null;
  };
  to_user?: {
    display_name: string | null;
  };
}

export interface AllReference {
  id: string;
  content: string;
  rating: number | null;
  reference_type: string;
  from_user_id: string;
  to_user_id: string;
  created_at: string;
  from_user?: {
    display_name: string | null;
  };
  to_user?: {
    display_name: string | null;
  };
}

export interface DeletionRequest {
  id: string;
  user_id: string;
  reason: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
  profile?: {
    display_name: string | null;
    email: string | null;
    username: string | null;
  };
}

export interface WaitlistEntry {
  id: string;
  email: string;
  created_at: string;
  invited_at: string | null;
  notes: string | null;
}

export interface AdminStats {
  totalUsers: number;
  totalFriendships: number;
}

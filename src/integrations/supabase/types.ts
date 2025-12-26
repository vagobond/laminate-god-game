export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      art_i_fucked_state: {
        Row: {
          created_at: string
          encounters_completed: number
          id: string
          sharts_collected: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          encounters_completed?: number
          id?: string
          sharts_collected?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          encounters_completed?: number
          id?: string
          sharts_collected?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      country_invites: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          invite_code: string
          invitee_email: string
          invitee_id: string | null
          inviter_id: string
          is_new_country: boolean
          status: string
          target_country: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          invite_code?: string
          invitee_email: string
          invitee_id?: string | null
          inviter_id: string
          is_new_country?: boolean
          status?: string
          target_country?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          invite_code?: string
          invitee_email?: string
          invitee_id?: string | null
          inviter_id?: string
          is_new_country?: boolean
          status?: string
          target_country?: string | null
        }
        Relationships: []
      }
      custom_friendship_types: {
        Row: {
          created_at: string
          id: string
          name: string
          show_birthday_day_month: boolean
          show_birthday_year: boolean
          show_contact_email: boolean
          show_home_address: boolean
          show_hometown_coords: boolean
          show_instagram: boolean
          show_linkedin: boolean
          show_mailing_address: boolean
          show_nicknames: boolean
          show_phone: boolean
          show_private_email: boolean
          show_whatsapp: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          show_birthday_day_month?: boolean
          show_birthday_year?: boolean
          show_contact_email?: boolean
          show_home_address?: boolean
          show_hometown_coords?: boolean
          show_instagram?: boolean
          show_linkedin?: boolean
          show_mailing_address?: boolean
          show_nicknames?: boolean
          show_phone?: boolean
          show_private_email?: boolean
          show_whatsapp?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          show_birthday_day_month?: boolean
          show_birthday_year?: boolean
          show_contact_email?: boolean
          show_home_address?: boolean
          show_hometown_coords?: boolean
          show_instagram?: boolean
          show_linkedin?: boolean
          show_mailing_address?: boolean
          show_nicknames?: boolean
          show_phone?: boolean
          show_private_email?: boolean
          show_whatsapp?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dream_trips: {
        Row: {
          created_at: string
          destinations: string[]
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          destinations?: string[]
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          destinations?: string[]
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      friend_requests: {
        Row: {
          created_at: string
          from_user_id: string
          id: string
          message: string | null
          to_user_id: string
        }
        Insert: {
          created_at?: string
          from_user_id: string
          id?: string
          message?: string | null
          to_user_id: string
        }
        Update: {
          created_at?: string
          from_user_id?: string
          id?: string
          message?: string | null
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friend_requests_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_requests_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          level: Database["public"]["Enums"]["friendship_level"]
          needs_level_set: boolean
          user_id: string
          uses_custom_type: boolean
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          level: Database["public"]["Enums"]["friendship_level"]
          needs_level_set?: boolean
          user_id: string
          uses_custom_type?: boolean
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          level?: Database["public"]["Enums"]["friendship_level"]
          needs_level_set?: boolean
          user_id?: string
          uses_custom_type?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "friendships_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_deaths: {
        Row: {
          created_at: string
          death_cause: string
          id: string
          scenario_context: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          death_cause: string
          id?: string
          scenario_context?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          death_cause?: string
          id?: string
          scenario_context?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      game_sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          is_active: boolean
          survival_streak: number
          total_scenarios: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean
          survival_streak?: number
          total_scenarios?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean
          survival_streak?: number
          total_scenarios?: number
          user_id?: string | null
        }
        Relationships: []
      }
      hosting_preferences: {
        Row: {
          accommodation_type: string | null
          created_at: string
          hosting_description: string | null
          id: string
          is_open_to_hosting: boolean
          max_guests: number | null
          min_friendship_level: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accommodation_type?: string | null
          created_at?: string
          hosting_description?: string | null
          id?: string
          is_open_to_hosting?: boolean
          max_guests?: number | null
          min_friendship_level?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accommodation_type?: string | null
          created_at?: string
          hosting_description?: string | null
          id?: string
          is_open_to_hosting?: boolean
          max_guests?: number | null
          min_friendship_level?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hosting_requests: {
        Row: {
          arrival_date: string | null
          created_at: string
          departure_date: string | null
          from_user_id: string
          id: string
          message: string
          num_guests: number | null
          response_message: string | null
          status: Database["public"]["Enums"]["request_status"]
          to_user_id: string
          updated_at: string
        }
        Insert: {
          arrival_date?: string | null
          created_at?: string
          departure_date?: string | null
          from_user_id: string
          id?: string
          message: string
          num_guests?: number | null
          response_message?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          to_user_id: string
          updated_at?: string
        }
        Update: {
          arrival_date?: string | null
          created_at?: string
          departure_date?: string | null
          from_user_id?: string
          id?: string
          message?: string
          num_guests?: number | null
          response_message?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          to_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      layer_relationships: {
        Row: {
          child_layer_id: string
          created_at: string
          id: string
          parent_layer_id: string
        }
        Insert: {
          child_layer_id: string
          created_at?: string
          id?: string
          parent_layer_id: string
        }
        Update: {
          child_layer_id?: string
          created_at?: string
          id?: string
          parent_layer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "layer_relationships_child_layer_id_fkey"
            columns: ["child_layer_id"]
            isOneToOne: false
            referencedRelation: "layers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "layer_relationships_parent_layer_id_fkey"
            columns: ["parent_layer_id"]
            isOneToOne: false
            referencedRelation: "layers"
            referencedColumns: ["id"]
          },
        ]
      }
      layers: {
        Row: {
          branches_count: number
          created_at: string
          creator_name: string
          description: string | null
          domain: string | null
          github_repo_url: string | null
          id: string
          name: string
          philosophy: string | null
          total_points: number
          updated_at: string
          user_id: string | null
          vision: string | null
        }
        Insert: {
          branches_count?: number
          created_at?: string
          creator_name: string
          description?: string | null
          domain?: string | null
          github_repo_url?: string | null
          id?: string
          name: string
          philosophy?: string | null
          total_points?: number
          updated_at?: string
          user_id?: string | null
          vision?: string | null
        }
        Update: {
          branches_count?: number
          created_at?: string
          creator_name?: string
          description?: string | null
          domain?: string | null
          github_repo_url?: string | null
          id?: string
          name?: string
          philosophy?: string | null
          total_points?: number
          updated_at?: string
          user_id?: string | null
          vision?: string | null
        }
        Relationships: []
      }
      meetup_preferences: {
        Row: {
          created_at: string
          id: string
          is_open_to_meetups: boolean
          meetup_description: string | null
          min_friendship_level: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_open_to_meetups?: boolean
          meetup_description?: string | null
          min_friendship_level?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_open_to_meetups?: boolean
          meetup_description?: string | null
          min_friendship_level?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meetup_requests: {
        Row: {
          created_at: string
          from_user_id: string
          id: string
          message: string
          proposed_dates: string | null
          purpose: Database["public"]["Enums"]["meetup_purpose"]
          response_message: string | null
          status: Database["public"]["Enums"]["request_status"]
          to_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_user_id: string
          id?: string
          message: string
          proposed_dates?: string | null
          purpose: Database["public"]["Enums"]["meetup_purpose"]
          response_message?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          to_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_user_id?: string
          id?: string
          message?: string
          proposed_dates?: string | null
          purpose?: Database["public"]["Enums"]["meetup_purpose"]
          response_message?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          to_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          from_user_id: string
          id: string
          platform_suggestion: string | null
          read_at: string | null
          to_user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          from_user_id: string
          id?: string
          platform_suggestion?: string | null
          read_at?: string | null
          to_user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          from_user_id?: string
          id?: string
          platform_suggestion?: string | null
          read_at?: string | null
          to_user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birthday_day: number | null
          birthday_month: number | null
          birthday_no_year_visibility: string | null
          birthday_year: number | null
          birthday_year_visibility: string | null
          contact_email: string | null
          created_at: string
          display_name: string | null
          email: string | null
          home_address: string | null
          home_address_visibility: string | null
          hometown_city: string | null
          hometown_country: string | null
          hometown_description: string | null
          hometown_latitude: number | null
          hometown_longitude: number | null
          id: string
          instagram_url: string | null
          link: string | null
          linkedin_url: string | null
          mailing_address: string | null
          mailing_address_visibility: string | null
          nicknames: string | null
          nicknames_visibility: string | null
          phone_number: string | null
          private_email: string | null
          updated_at: string
          username: string | null
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birthday_day?: number | null
          birthday_month?: number | null
          birthday_no_year_visibility?: string | null
          birthday_year?: number | null
          birthday_year_visibility?: string | null
          contact_email?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          home_address?: string | null
          home_address_visibility?: string | null
          hometown_city?: string | null
          hometown_country?: string | null
          hometown_description?: string | null
          hometown_latitude?: number | null
          hometown_longitude?: number | null
          id: string
          instagram_url?: string | null
          link?: string | null
          linkedin_url?: string | null
          mailing_address?: string | null
          mailing_address_visibility?: string | null
          nicknames?: string | null
          nicknames_visibility?: string | null
          phone_number?: string | null
          private_email?: string | null
          updated_at?: string
          username?: string | null
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birthday_day?: number | null
          birthday_month?: number | null
          birthday_no_year_visibility?: string | null
          birthday_year?: number | null
          birthday_year_visibility?: string | null
          contact_email?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          home_address?: string | null
          home_address_visibility?: string | null
          hometown_city?: string | null
          hometown_country?: string | null
          hometown_description?: string | null
          hometown_latitude?: number | null
          hometown_longitude?: number | null
          id?: string
          instagram_url?: string | null
          link?: string | null
          linkedin_url?: string | null
          mailing_address?: string | null
          mailing_address_visibility?: string | null
          nicknames?: string | null
          nicknames_visibility?: string | null
          phone_number?: string | null
          private_email?: string | null
          updated_at?: string
          username?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      resolution_game_state: {
        Row: {
          created_at: string
          id: string
          resolutions_broken: number
          resolutions_made: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          resolutions_broken?: number
          resolutions_made?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          resolutions_broken?: number
          resolutions_made?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sly_doubt_game_state: {
        Row: {
          bloot_collected: number
          created_at: string
          id: string
          revolution_acts: number
          updated_at: string
          user_id: string
        }
        Insert: {
          bloot_collected?: number
          created_at?: string
          id?: string
          revolution_acts?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          bloot_collected?: number
          created_at?: string
          id?: string
          revolution_acts?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      social_links: {
        Row: {
          created_at: string
          friendship_level_required: string
          id: string
          label: string | null
          platform: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friendship_level_required?: string
          id?: string
          label?: string | null
          platform: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          friendship_level_required?: string
          id?: string
          label?: string | null
          platform?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_references: {
        Row: {
          content: string
          created_at: string
          from_user_id: string
          id: string
          rating: number | null
          reference_type: Database["public"]["Enums"]["reference_type"]
          to_user_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          from_user_id: string
          id?: string
          rating?: number | null
          reference_type: Database["public"]["Enums"]["reference_type"]
          to_user_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          from_user_id?: string
          id?: string
          rating?: number | null
          reference_type?: Database["public"]["Enums"]["reference_type"]
          to_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wolfemon_game_state: {
        Row: {
          created_at: string
          gold: number
          has_wolfemon: boolean
          id: string
          last_action_at: string
          sheep_count: number
          total_sheep_collected: number
          updated_at: string
          user_id: string
          wool_count: number
        }
        Insert: {
          created_at?: string
          gold?: number
          has_wolfemon?: boolean
          id?: string
          last_action_at?: string
          sheep_count?: number
          total_sheep_collected?: number
          updated_at?: string
          user_id: string
          wool_count?: number
        }
        Update: {
          created_at?: string
          gold?: number
          has_wolfemon?: boolean
          id?: string
          last_action_at?: string
          sheep_count?: number
          total_sheep_collected?: number
          updated_at?: string
          user_id?: string
          wool_count?: number
        }
        Relationships: []
      }
      xcrol_entries: {
        Row: {
          content: string
          created_at: string
          entry_date: string
          id: string
          link: string | null
          privacy_level: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          entry_date?: string
          id?: string
          link?: string | null
          privacy_level?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          entry_date?: string
          id?: string
          link?: string | null
          privacy_level?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_friend_request: {
        Args: {
          friendship_level: Database["public"]["Enums"]["friendship_level"]
          request_id: string
        }
        Returns: undefined
      }
      are_mutual_close_friends: {
        Args: { user1_id: string; user2_id: string }
        Returns: boolean
      }
      calculate_layer_points: { Args: { layer_id: string }; Returns: number }
      get_available_invites: {
        Args: { user_id: string }
        Returns: {
          existing_country_remaining: number
          new_country_remaining: number
        }[]
      }
      get_friendship_level: {
        Args: { profile_id: string; viewer_id: string }
        Returns: Database["public"]["Enums"]["friendship_level"]
      }
      get_public_hometowns: {
        Args: never
        Returns: {
          avatar_url: string
          display_name: string
          hometown_city: string
          hometown_country: string
          hometown_description: string
          hometown_latitude: number
          hometown_longitude: number
          id: string
        }[]
      }
      get_visible_friends: {
        Args: { profile_id: string; viewer_id: string }
        Returns: {
          avatar_url: string
          display_name: string
          friend_id: string
          id: string
          level: Database["public"]["Enums"]["friendship_level"]
        }[]
      }
      get_visible_profile: {
        Args: { profile_id: string; viewer_id: string }
        Returns: {
          avatar_url: string
          bio: string
          birthday_day: number
          birthday_month: number
          birthday_year: number
          contact_email: string
          display_name: string
          friendship_level: string
          home_address: string
          hometown_city: string
          hometown_country: string
          hometown_description: string
          hometown_latitude: number
          hometown_longitude: number
          id: string
          instagram_url: string
          link: string
          linkedin_url: string
          mailing_address: string
          nicknames: string
          phone_number: string
          private_email: string
          whatsapp: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_blocked: {
        Args: { blocked_id: string; blocker_id: string }
        Returns: boolean
      }
      refresh_layer_stats: { Args: never; Returns: undefined }
      resolve_username_to_id: {
        Args: { target_username: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      friendship_level:
        | "close_friend"
        | "buddy"
        | "friendly_acquaintance"
        | "secret_friend"
        | "fake_friend"
        | "not_friend"
        | "secret_enemy"
      meetup_purpose: "tourism" | "food" | "friendship" | "romance"
      reference_type: "host" | "guest" | "friendly" | "business"
      request_status: "pending" | "accepted" | "declined" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      friendship_level: [
        "close_friend",
        "buddy",
        "friendly_acquaintance",
        "secret_friend",
        "fake_friend",
        "not_friend",
        "secret_enemy",
      ],
      meetup_purpose: ["tourism", "food", "friendship", "romance"],
      reference_type: ["host", "guest", "friendly", "business"],
      request_status: ["pending", "accepted", "declined", "cancelled"],
    },
  },
} as const

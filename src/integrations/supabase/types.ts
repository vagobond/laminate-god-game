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
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          level: Database["public"]["Enums"]["friendship_level"]
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          level?: Database["public"]["Enums"]["friendship_level"]
          user_id?: string
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
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          contact_email: string | null
          created_at: string
          display_name: string | null
          email: string | null
          hometown_city: string | null
          hometown_country: string | null
          hometown_description: string | null
          hometown_latitude: number | null
          hometown_longitude: number | null
          id: string
          instagram_url: string | null
          link: string | null
          linkedin_url: string | null
          phone_number: string | null
          private_email: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          contact_email?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          hometown_city?: string | null
          hometown_country?: string | null
          hometown_description?: string | null
          hometown_latitude?: number | null
          hometown_longitude?: number | null
          id: string
          instagram_url?: string | null
          link?: string | null
          linkedin_url?: string | null
          phone_number?: string | null
          private_email?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          contact_email?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          hometown_city?: string | null
          hometown_country?: string | null
          hometown_description?: string | null
          hometown_latitude?: number | null
          hometown_longitude?: number | null
          id?: string
          instagram_url?: string | null
          link?: string | null
          linkedin_url?: string | null
          phone_number?: string | null
          private_email?: string | null
          updated_at?: string
          whatsapp?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      are_mutual_close_friends: {
        Args: { user1_id: string; user2_id: string }
        Returns: boolean
      }
      calculate_layer_points: { Args: { layer_id: string }; Returns: number }
      get_friendship_level: {
        Args: { profile_id: string; viewer_id: string }
        Returns: Database["public"]["Enums"]["friendship_level"]
      }
      refresh_layer_stats: { Args: never; Returns: undefined }
    }
    Enums: {
      friendship_level:
        | "close_friend"
        | "buddy"
        | "friendly_acquaintance"
        | "secret_friend"
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
      friendship_level: [
        "close_friend",
        "buddy",
        "friendly_acquaintance",
        "secret_friend",
      ],
    },
  },
} as const

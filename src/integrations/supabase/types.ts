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
      account_deletion_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          processed_at: string | null
          processed_by: string | null
          reason: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
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
      audit_log: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      admin_heartbeats: {
        Row: {
          user_id: string
          last_seen_at: string
        }
        Insert: {
          user_id: string
          last_seen_at?: string
        }
        Update: {
          user_id?: string
          last_seen_at?: string
        }
        Relationships: []
      }
      backup_runs: {
        Row: {
          bytes_uploaded: number
          created_at: string
          error: string | null
          files_uploaded: number
          finished_at: string | null
          id: string
          kind: string
          manifest_key: string | null
          notes: Json | null
          started_at: string
          status: string
          tables_dumped: number
        }
        Insert: {
          bytes_uploaded?: number
          created_at?: string
          error?: string | null
          files_uploaded?: number
          finished_at?: string | null
          id?: string
          kind: string
          manifest_key?: string | null
          notes?: Json | null
          started_at?: string
          status: string
          tables_dumped?: number
        }
        Update: {
          bytes_uploaded?: number
          created_at?: string
          error?: string | null
          files_uploaded?: number
          finished_at?: string | null
          id?: string
          kind?: string
          manifest_key?: string | null
          notes?: Json | null
          started_at?: string
          status?: string
          tables_dumped?: number
        }
        Relationships: []
      }
      brook_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brook_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "brook_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      brook_posts: {
        Row: {
          brook_id: string
          content: string
          created_at: string
          id: string
          link: string | null
          user_id: string
        }
        Insert: {
          brook_id: string
          content: string
          created_at?: string
          id?: string
          link?: string | null
          user_id: string
        }
        Update: {
          brook_id?: string
          content?: string
          created_at?: string
          id?: string
          link?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brook_posts_brook_id_fkey"
            columns: ["brook_id"]
            isOneToOne: false
            referencedRelation: "brooks"
            referencedColumns: ["id"]
          },
        ]
      }
      brook_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brook_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "brook_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      brooks: {
        Row: {
          created_at: string
          custom_name: string | null
          id: string
          inactivity_days: number
          invite_email: string | null
          last_post_at: string | null
          nudge_sent_at: string | null
          status: string
          updated_at: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          custom_name?: string | null
          id?: string
          inactivity_days?: number
          invite_email?: string | null
          last_post_at?: string | null
          nudge_sent_at?: string | null
          status?: string
          updated_at?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          custom_name?: string | null
          id?: string
          inactivity_days?: number
          invite_email?: string | null
          last_post_at?: string | null
          nudge_sent_at?: string | null
          status?: string
          updated_at?: string
          user1_id?: string
          user2_id?: string
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
          can_leave_reference: boolean
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
          can_leave_reference?: boolean
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
          can_leave_reference?: boolean
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
      dismissed_reference_notifications: {
        Row: {
          created_at: string
          id: string
          reference_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reference_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reference_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dismissed_reference_notifications_reference_id_fkey"
            columns: ["reference_id"]
            isOneToOne: false
            referencedRelation: "user_references"
            referencedColumns: ["id"]
          },
        ]
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
      flagged_references: {
        Row: {
          admin_notes: string | null
          created_at: string
          flagged_by: string
          id: string
          reason: string
          reference_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          flagged_by: string
          id?: string
          reason: string
          reference_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          flagged_by?: string
          id?: string
          reason?: string
          reference_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "flagged_references_reference_id_fkey"
            columns: ["reference_id"]
            isOneToOne: false
            referencedRelation: "user_references"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_requests: {
        Row: {
          created_at: string
          from_user_id: string
          id: string
          message: string | null
          nudge_sent_at: string | null
          to_user_id: string
        }
        Insert: {
          created_at?: string
          from_user_id: string
          id?: string
          message?: string | null
          nudge_sent_at?: string | null
          to_user_id: string
        }
        Update: {
          created_at?: string
          from_user_id?: string
          id?: string
          message?: string | null
          nudge_sent_at?: string | null
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
      group_comment_reactions: {
        Row: {
          comment_id: string
          created_at: string
          emoji: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          emoji: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          emoji?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "group_post_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          created_at: string
          group_id: string
          id: string
          last_visited_at: string | null
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          last_visited_at?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          last_visited_at?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "group_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      group_post_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "group_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      group_posts: {
        Row: {
          content: string
          created_at: string
          group_id: string
          id: string
          link: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          group_id: string
          id?: string
          link?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          group_id?: string
          id?: string
          link?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          avatar_url: string | null
          created_at: string
          creator_id: string
          description: string | null
          id: string
          name: string
          require_approval: boolean
          slug: string
          trust_level: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          name: string
          require_approval?: boolean
          slug: string
          trust_level?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          name?: string
          require_approval?: boolean
          slug?: string
          trust_level?: string
          updated_at?: string
        }
        Relationships: []
      }
      host_blackout_periods: {
        Row: {
          created_at: string
          end_date: string
          id: string
          kind: string
          note: string | null
          source_hosting_request_id: string | null
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          kind?: string
          note?: string | null
          source_hosting_request_id?: string | null
          start_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          kind?: string
          note?: string | null
          source_hosting_request_id?: string | null
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "host_blackout_periods_source_hosting_request_id_fkey"
            columns: ["source_hosting_request_id"]
            isOneToOne: false
            referencedRelation: "hosting_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      host_precise_addresses: {
        Row: {
          address: string
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      host_recurring_unavailability: {
        Row: {
          created_at: string
          day_of_week: number
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      hosting_preferences: {
        Row: {
          accepts_last_minute: boolean
          accommodation_type: string | null
          compensation_type_preferred: string | null
          created_at: string
          hosting_description: string | null
          id: string
          is_hosting_paused: boolean
          is_open_to_hosting: boolean
          last_activeness_probe_at: string | null
          last_probe_token: string | null
          max_guests: number | null
          min_friendship_level: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accepts_last_minute?: boolean
          accommodation_type?: string | null
          compensation_type_preferred?: string | null
          created_at?: string
          hosting_description?: string | null
          id?: string
          is_hosting_paused?: boolean
          is_open_to_hosting?: boolean
          last_activeness_probe_at?: string | null
          last_probe_token?: string | null
          max_guests?: number | null
          min_friendship_level?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accepts_last_minute?: boolean
          accommodation_type?: string | null
          compensation_type_preferred?: string | null
          created_at?: string
          hosting_description?: string | null
          id?: string
          is_hosting_paused?: boolean
          is_open_to_hosting?: boolean
          last_activeness_probe_at?: string | null
          last_probe_token?: string | null
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
          companions_note: string | null
          created_at: string
          departure_date: string | null
          from_user_id: string
          id: string
          message: string
          num_guests: number | null
          response_message: string | null
          skills_offered: string | null
          status: Database["public"]["Enums"]["request_status"]
          to_user_id: string
          trip_id: string | null
          updated_at: string
        }
        Insert: {
          arrival_date?: string | null
          companions_note?: string | null
          created_at?: string
          departure_date?: string | null
          from_user_id: string
          id?: string
          message: string
          num_guests?: number | null
          response_message?: string | null
          skills_offered?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          to_user_id: string
          trip_id?: string | null
          updated_at?: string
        }
        Update: {
          arrival_date?: string | null
          companions_note?: string | null
          created_at?: string
          departure_date?: string | null
          from_user_id?: string
          id?: string
          message?: string
          num_guests?: number | null
          response_message?: string | null
          skills_offered?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          to_user_id?: string
          trip_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hosting_requests_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      introduction_requests: {
        Row: {
          created_at: string
          id: string
          introducer_id: string
          message: string
          requester_id: string
          response_message: string | null
          status: string
          target_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          introducer_id: string
          message: string
          requester_id: string
          response_message?: string | null
          status?: string
          target_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          introducer_id?: string
          message?: string
          requester_id?: string
          response_message?: string | null
          status?: string
          target_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      invite_notification_seen: {
        Row: {
          id: string
          seen_at: string
          user_id: string
        }
        Insert: {
          id?: string
          seen_at?: string
          user_id: string
        }
        Update: {
          id?: string
          seen_at?: string
          user_id?: string
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
      meetups: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          end_datetime: string | null
          id: string
          is_open_ended: boolean
          latitude: number | null
          location_address: string | null
          location_name: string
          longitude: number | null
          start_datetime: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          end_datetime?: string | null
          id?: string
          is_open_ended?: boolean
          latitude?: number | null
          location_address?: string | null
          location_name: string
          longitude?: number | null
          start_datetime?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          end_datetime?: string | null
          id?: string
          is_open_ended?: boolean
          latitude?: number | null
          location_address?: string | null
          location_name?: string
          longitude?: number | null
          start_datetime?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          deleted_at: string | null
          entry_id: string | null
          from_user_id: string
          id: string
          platform_suggestion: string | null
          read_at: string | null
          to_user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          deleted_at?: string | null
          entry_id?: string | null
          from_user_id: string
          id?: string
          platform_suggestion?: string | null
          read_at?: string | null
          to_user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          deleted_at?: string | null
          entry_id?: string | null
          from_user_id?: string
          id?: string
          platform_suggestion?: string | null
          read_at?: string | null
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "xcrol_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string
          created_at: string
          entity_id: string
          id: string
          read_at: string | null
          type: string
          user_id: string
        }
        Insert: {
          actor_id: string
          created_at?: string
          entity_id: string
          id?: string
          read_at?: string | null
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          entity_id?: string
          id?: string
          read_at?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      oauth_authorization_codes: {
        Row: {
          client_id: string
          code: string
          code_challenge: string | null
          code_challenge_method: string | null
          created_at: string
          expires_at: string
          id: string
          redirect_uri: string
          scopes: string[]
          user_id: string
        }
        Insert: {
          client_id: string
          code?: string
          code_challenge?: string | null
          code_challenge_method?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          redirect_uri: string
          scopes?: string[]
          user_id: string
        }
        Update: {
          client_id?: string
          code?: string
          code_challenge?: string | null
          code_challenge_method?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          redirect_uri?: string
          scopes?: string[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_authorization_codes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_authorization_codes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients_public"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_clients: {
        Row: {
          client_id: string
          client_secret_hash: string | null
          created_at: string
          description: string | null
          homepage_url: string | null
          id: string
          is_verified: boolean | null
          logo_url: string | null
          name: string
          owner_id: string
          redirect_uris: string[]
          updated_at: string
        }
        Insert: {
          client_id?: string
          client_secret_hash?: string | null
          created_at?: string
          description?: string | null
          homepage_url?: string | null
          id?: string
          is_verified?: boolean | null
          logo_url?: string | null
          name: string
          owner_id: string
          redirect_uris?: string[]
          updated_at?: string
        }
        Update: {
          client_id?: string
          client_secret_hash?: string | null
          created_at?: string
          description?: string | null
          homepage_url?: string | null
          id?: string
          is_verified?: boolean | null
          logo_url?: string | null
          name?: string
          owner_id?: string
          redirect_uris?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      oauth_scopes: {
        Row: {
          category: string
          description: string
          id: string
          name: string
        }
        Insert: {
          category?: string
          description: string
          id: string
          name: string
        }
        Update: {
          category?: string
          description?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      oauth_tokens: {
        Row: {
          access_token: string
          access_token_expires_at: string
          client_id: string
          created_at: string
          id: string
          refresh_token: string | null
          refresh_token_expires_at: string | null
          revoked: boolean | null
          scopes: string[]
          user_id: string
        }
        Insert: {
          access_token?: string
          access_token_expires_at?: string
          client_id: string
          created_at?: string
          id?: string
          refresh_token?: string | null
          refresh_token_expires_at?: string | null
          revoked?: boolean | null
          scopes?: string[]
          user_id: string
        }
        Update: {
          access_token?: string
          access_token_expires_at?: string
          client_id?: string
          created_at?: string
          id?: string
          refresh_token?: string | null
          refresh_token_expires_at?: string | null
          revoked?: boolean | null
          scopes?: string[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_tokens_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_tokens_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients_public"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_user_authorizations: {
        Row: {
          client_id: string
          created_at: string
          id: string
          scopes: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          scopes?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          scopes?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_user_authorizations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_user_authorizations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients_public"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_invite_codes: {
        Row: {
          created_at: string
          email: string
          id: string
          invite_code: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          invite_code: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          invite_code?: string
          user_id?: string
        }
        Relationships: []
      }
      private_stay_feedback: {
        Row: {
          content: string
          created_at: string
          from_user_id: string
          hosting_request_id: string
          id: string
          to_user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          from_user_id: string
          hosting_request_id: string
          id?: string
          to_user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          from_user_id?: string
          hosting_request_id?: string
          id?: string
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "private_stay_feedback_hosting_request_id_fkey"
            columns: ["hosting_request_id"]
            isOneToOne: false
            referencedRelation: "hosting_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_widgets: {
        Row: {
          config: Json | null
          created_at: string
          enabled: boolean
          id: string
          updated_at: string
          user_id: string
          widget_key: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          enabled?: boolean
          id?: string
          updated_at?: string
          user_id: string
          widget_key: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          enabled?: boolean
          id?: string
          updated_at?: string
          user_id?: string
          widget_key?: string
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
          invite_verified: boolean
          last_hometown_change: string | null
          link: string | null
          linkedin_url: string | null
          mailing_address: string | null
          mailing_address_visibility: string | null
          nicknames: string | null
          nicknames_visibility: string | null
          nostr_handle: string | null
          nostr_npub: string | null
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
          invite_verified?: boolean
          last_hometown_change?: string | null
          link?: string | null
          linkedin_url?: string | null
          mailing_address?: string | null
          mailing_address_visibility?: string | null
          nicknames?: string | null
          nicknames_visibility?: string | null
          nostr_handle?: string | null
          nostr_npub?: string | null
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
          invite_verified?: boolean
          last_hometown_change?: string | null
          link?: string | null
          linkedin_url?: string | null
          mailing_address?: string | null
          mailing_address_visibility?: string | null
          nicknames?: string | null
          nicknames_visibility?: string | null
          nostr_handle?: string | null
          nostr_npub?: string | null
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
      river_replies: {
        Row: {
          content: string
          created_at: string
          entry_id: string
          id: string
          parent_reply_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          entry_id: string
          id?: string
          parent_reply_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          entry_id?: string
          id?: string
          parent_reply_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "river_replies_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "xcrol_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "river_replies_parent_reply_id_fkey"
            columns: ["parent_reply_id"]
            isOneToOne: false
            referencedRelation: "river_replies"
            referencedColumns: ["id"]
          },
        ]
      }
      river_reply_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          reply_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          reply_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          reply_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "river_reply_reactions_reply_id_fkey"
            columns: ["reply_id"]
            isOneToOne: false
            referencedRelation: "river_replies"
            referencedColumns: ["id"]
          },
        ]
      }
      rss_feed_items: {
        Row: {
          content: string | null
          created_at: string
          feed_id: string
          guid: string
          id: string
          link: string
          published_at: string
          title: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          feed_id: string
          guid: string
          id?: string
          link: string
          published_at?: string
          title: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          feed_id?: string
          guid?: string
          id?: string
          link?: string
          published_at?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rss_feed_items_feed_id_fkey"
            columns: ["feed_id"]
            isOneToOne: false
            referencedRelation: "user_rss_feeds"
            referencedColumns: ["id"]
          },
        ]
      }
      scroll_ai_usage: {
        Row: {
          action: string
          count: number
          day: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action: string
          count?: number
          day: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action?: string
          count?: number
          day?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scroll_items: {
        Row: {
          chapter_label: string | null
          created_at: string
          custom_body: string | null
          custom_title: string | null
          id: string
          item_position: number
          item_type: string
          scroll_id: string
          source_id: string | null
        }
        Insert: {
          chapter_label?: string | null
          created_at?: string
          custom_body?: string | null
          custom_title?: string | null
          id?: string
          item_position?: number
          item_type: string
          scroll_id: string
          source_id?: string | null
        }
        Update: {
          chapter_label?: string | null
          created_at?: string
          custom_body?: string | null
          custom_title?: string | null
          id?: string
          item_position?: number
          item_type?: string
          scroll_id?: string
          source_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scroll_items_scroll_id_fkey"
            columns: ["scroll_id"]
            isOneToOne: false
            referencedRelation: "scrolls"
            referencedColumns: ["id"]
          },
        ]
      }
      scroll_publication_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          publication_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          publication_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          publication_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scroll_publication_reactions_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "scroll_publications"
            referencedColumns: ["id"]
          },
        ]
      }
      scroll_publications: {
        Row: {
          blurb: string | null
          content_json: Json
          cover_image_url: string | null
          created_at: string
          id: string
          published_at: string
          scroll_id: string
          slug: string
          subtitle: string | null
          title: string
          unpublished_at: string | null
          updated_at: string
          user_id: string
          view_count: number
          visibility: string
        }
        Insert: {
          blurb?: string | null
          content_json: Json
          cover_image_url?: string | null
          created_at?: string
          id?: string
          published_at?: string
          scroll_id: string
          slug: string
          subtitle?: string | null
          title: string
          unpublished_at?: string | null
          updated_at?: string
          user_id: string
          view_count?: number
          visibility?: string
        }
        Update: {
          blurb?: string | null
          content_json?: Json
          cover_image_url?: string | null
          created_at?: string
          id?: string
          published_at?: string
          scroll_id?: string
          slug?: string
          subtitle?: string | null
          title?: string
          unpublished_at?: string | null
          updated_at?: string
          user_id?: string
          view_count?: number
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "scroll_publications_scroll_id_fkey"
            columns: ["scroll_id"]
            isOneToOne: false
            referencedRelation: "scrolls"
            referencedColumns: ["id"]
          },
        ]
      }
      scrolls: {
        Row: {
          blurb: string | null
          cover_image_url: string | null
          created_at: string
          id: string
          subtitle: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          blurb?: string | null
          cover_image_url?: string | null
          created_at?: string
          id?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          blurb?: string | null
          cover_image_url?: string | null
          created_at?: string
          id?: string
          subtitle?: string | null
          title?: string
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
      town_listings: {
        Row: {
          body: string
          category: string
          contact_info: string | null
          contact_method: string | null
          created_at: string
          expires_at: string | null
          flagged: boolean | null
          has_images: boolean | null
          id: string
          image_urls: string[] | null
          location: string | null
          price: number | null
          status: string
          subcategory: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          category: string
          contact_info?: string | null
          contact_method?: string | null
          created_at?: string
          expires_at?: string | null
          flagged?: boolean | null
          has_images?: boolean | null
          id?: string
          image_urls?: string[] | null
          location?: string | null
          price?: number | null
          status?: string
          subcategory: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          category?: string
          contact_info?: string | null
          contact_method?: string | null
          created_at?: string
          expires_at?: string | null
          flagged?: boolean | null
          has_images?: boolean | null
          id?: string
          image_urls?: string[] | null
          location?: string | null
          price?: number | null
          status?: string
          subcategory?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          buddy_note: string | null
          companions: string | null
          created_at: string
          destination_city: string | null
          destination_country: string | null
          end_date: string
          id: string
          purpose: string | null
          seeking_companions: boolean
          start_date: string
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          buddy_note?: string | null
          companions?: string | null
          created_at?: string
          destination_city?: string | null
          destination_country?: string | null
          end_date: string
          id?: string
          purpose?: string | null
          seeking_companions?: boolean
          start_date: string
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          buddy_note?: string | null
          companions?: string | null
          created_at?: string
          destination_city?: string | null
          destination_country?: string | null
          end_date?: string
          id?: string
          purpose?: string | null
          seeking_companions?: boolean
          start_date?: string
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
      tutorial_completion: {
        Row: {
          completed_at: string
          id: string
          skipped: boolean
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          skipped?: boolean
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          skipped?: boolean
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
      user_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          invite_code: string
          invitee_email: string | null
          invitee_id: string | null
          inviter_id: string
          sent_at: string | null
          status: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invite_code?: string
          invitee_email?: string | null
          invitee_id?: string | null
          inviter_id: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invite_code?: string
          invitee_email?: string | null
          invitee_id?: string | null
          inviter_id?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: []
      }
      user_references: {
        Row: {
          content: string
          created_at: string
          from_user_id: string
          hosting_request_id: string | null
          id: string
          rating: number | null
          reference_type: Database["public"]["Enums"]["reference_type"]
          revealed_at: string | null
          to_user_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          from_user_id: string
          hosting_request_id?: string | null
          id?: string
          rating?: number | null
          reference_type: Database["public"]["Enums"]["reference_type"]
          revealed_at?: string | null
          to_user_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          from_user_id?: string
          hosting_request_id?: string | null
          id?: string
          rating?: number | null
          reference_type?: Database["public"]["Enums"]["reference_type"]
          revealed_at?: string | null
          to_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_references_hosting_request_id_fkey"
            columns: ["hosting_request_id"]
            isOneToOne: false
            referencedRelation: "hosting_requests"
            referencedColumns: ["id"]
          },
        ]
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
      user_rss_feeds: {
        Row: {
          created_at: string
          feed_icon: string | null
          feed_name: string | null
          feed_url: string
          id: string
          max_items: number
          user_id: string
        }
        Insert: {
          created_at?: string
          feed_icon?: string | null
          feed_name?: string | null
          feed_url: string
          id?: string
          max_items?: number
          user_id: string
        }
        Update: {
          created_at?: string
          feed_icon?: string | null
          feed_name?: string | null
          feed_url?: string
          id?: string
          max_items?: number
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          allow_friend_requests: boolean
          created_at: string
          default_share_connections: boolean
          default_share_email: boolean
          default_share_hometown: boolean
          default_share_xcrol: boolean
          email_notifications: boolean
          emergency_contact: string | null
          friend_request_notifications: boolean
          id: string
          notify_brook_activity: boolean
          notify_group_activity: boolean
          notify_hosting_requests: boolean
          notify_meetup_requests: boolean
          notify_river_replies: boolean
          notify_world_activity: boolean
          show_online_status: boolean
          updated_at: string
          user_id: string
          weekly_digest_enabled: boolean
        }
        Insert: {
          allow_friend_requests?: boolean
          created_at?: string
          default_share_connections?: boolean
          default_share_email?: boolean
          default_share_hometown?: boolean
          default_share_xcrol?: boolean
          email_notifications?: boolean
          emergency_contact?: string | null
          friend_request_notifications?: boolean
          id?: string
          notify_brook_activity?: boolean
          notify_group_activity?: boolean
          notify_hosting_requests?: boolean
          notify_meetup_requests?: boolean
          notify_river_replies?: boolean
          notify_world_activity?: boolean
          show_online_status?: boolean
          updated_at?: string
          user_id: string
          weekly_digest_enabled?: boolean
        }
        Update: {
          allow_friend_requests?: boolean
          created_at?: string
          default_share_connections?: boolean
          default_share_email?: boolean
          default_share_hometown?: boolean
          default_share_xcrol?: boolean
          email_notifications?: boolean
          emergency_contact?: string | null
          friend_request_notifications?: boolean
          id?: string
          notify_brook_activity?: boolean
          notify_group_activity?: boolean
          notify_hosting_requests?: boolean
          notify_meetup_requests?: boolean
          notify_river_replies?: boolean
          notify_world_activity?: boolean
          show_online_status?: boolean
          updated_at?: string
          user_id?: string
          weekly_digest_enabled?: boolean
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          invited_at: string | null
          notes: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          invited_at?: string | null
          notes?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          invited_at?: string | null
          notes?: string | null
        }
        Relationships: []
      }
      weekly_digest_log: {
        Row: {
          id: string
          sent_at: string
          user_id: string
          week_number: number
          year: number
        }
        Insert: {
          id?: string
          sent_at?: string
          user_id: string
          week_number: number
          year: number
        }
        Update: {
          id?: string
          sent_at?: string
          user_id?: string
          week_number?: number
          year?: number
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
          latitude: number | null
          link: string | null
          location_label: string | null
          longitude: number | null
          privacy_level: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          entry_date?: string
          id?: string
          latitude?: number | null
          link?: string | null
          location_label?: string | null
          longitude?: number | null
          privacy_level?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          entry_date?: string
          id?: string
          latitude?: number | null
          link?: string | null
          location_label?: string | null
          longitude?: number | null
          privacy_level?: string
          user_id?: string
        }
        Relationships: []
      }
      xcrol_reactions: {
        Row: {
          created_at: string
          emoji: string
          entry_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          entry_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          entry_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "xcrol_reactions_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "xcrol_entries"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      friendship_pairs: {
        Row: {
          user_a: string | null
          user_b: string | null
        }
        Relationships: []
      }
      oauth_clients_public: {
        Row: {
          client_id: string | null
          created_at: string | null
          description: string | null
          homepage_url: string | null
          id: string | null
          is_verified: boolean | null
          logo_url: string | null
          name: string | null
          redirect_uris: string[] | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          homepage_url?: string | null
          id?: string | null
          is_verified?: boolean | null
          logo_url?: string | null
          name?: string | null
          redirect_uris?: string[] | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          homepage_url?: string | null
          id?: string | null
          is_verified?: boolean | null
          logo_url?: string | null
          name?: string | null
          redirect_uris?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
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
      backup_export_auth_password_hashes: {
        Args: never
        Returns: {
          encrypted_password: string
          id: string
        }[]
      }
      calculate_all_user_points: {
        Args: never
        Returns: {
          points: number
          user_id: string
        }[]
      }
      calculate_layer_points: { Args: { layer_id: string }; Returns: number }
      calculate_user_points: { Args: { p_user_id: string }; Returns: number }
      can_create_brook: { Args: { p_user_id: string }; Returns: boolean }
      can_delete_brook: {
        Args: { p_brook_id: string; p_user_id: string }
        Returns: boolean
      }
      can_post_in_brook: {
        Args: { p_brook_id: string; p_user_id: string }
        Returns: boolean
      }
      can_view_xcrol_entry: {
        Args: {
          p_entry_user_id: string
          p_privacy_level: string
          p_viewer_id: string
        }
        Returns: boolean
      }
      check_invite_code: { Args: { p_invite_code: string }; Returns: boolean }
      compile_scroll_draft: {
        Args: {
          p_end_date: string
          p_include_groups?: boolean
          p_include_xcrol?: boolean
          p_scroll_id: string
          p_start_date: string
        }
        Returns: number
      }
      create_oauth_app: {
        Args: {
          p_description: string
          p_homepage_url: string
          p_logo_url: string
          p_name: string
          p_redirect_uris: string[]
        }
        Returns: {
          client_id: string
          created_at: string
          description: string
          homepage_url: string
          id: string
          is_verified: boolean
          logo_url: string
          name: string
          plain_secret: string
          redirect_uris: string[]
        }[]
      }
      get_admin_profiles: {
        Args: never
        Returns: {
          created_at: string
          display_name: string
          email: string
          id: string
          username: string
        }[]
      }
      get_admin_profiles_by_ids: {
        Args: { p_ids: string[] }
        Returns: {
          display_name: string
          email: string
          id: string
          username: string
        }[]
      }
      get_authorized_app_info: {
        Args: { p_client_id: string }
        Returns: {
          description: string
          homepage_url: string
          id: string
          is_verified: boolean
          logo_url: string
          name: string
        }[]
      }
      get_available_invites: {
        Args: { user_id: string }
        Returns: {
          existing_country_remaining: number
          new_country_remaining: number
        }[]
      }
      get_connection_degree: {
        Args: { from_user_id: string; max_depth?: number; to_user_id: string }
        Returns: {
          degree: number
          path: string[]
        }[]
      }
      get_connection_degree_fast: {
        Args: { from_user_id: string; max_depth?: number; to_user_id: string }
        Returns: {
          degree: number
          path: string[]
        }[]
      }
      get_friendship_level: {
        Args: { profile_id: string; viewer_id: string }
        Returns: Database["public"]["Enums"]["friendship_level"]
      }
      get_group_member_count: {
        Args: { target_group_id: string }
        Returns: number
      }
      get_message_profiles: {
        Args: { p_user_ids: string[] }
        Returns: {
          avatar_url: string
          contact_email: string
          display_name: string
          id: string
          instagram_url: string
          link: string
          linkedin_url: string
          phone_number: string
          whatsapp: string
        }[]
      }
      get_own_profile: {
        Args: never
        Returns: {
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
          invite_verified: boolean
          last_hometown_change: string | null
          link: string | null
          linkedin_url: string | null
          mailing_address: string | null
          mailing_address_visibility: string | null
          nicknames: string | null
          nicknames_visibility: string | null
          nostr_handle: string | null
          nostr_npub: string | null
          phone_number: string | null
          private_email: string | null
          updated_at: string
          username: string | null
          whatsapp: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
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
      get_river_entries: {
        Args: {
          p_before_id?: string
          p_before_ts?: string
          p_filter?: string
          p_limit?: number
          p_offset?: number
          p_viewer_id?: string
        }
        Returns: {
          author_avatar_url: string
          author_display_name: string
          author_username: string
          content: string
          entry_date: string
          id: string
          latitude: number | null
          link: string
          location_label: string | null
          longitude: number | null
          privacy_level: string
          sort_at: string
          user_id: string
        }[]
      }
      get_river_replies: {
        Args: { p_entry_ids: string[]; p_viewer_id?: string }
        Returns: {
          avatar_url: string
          can_view_content: boolean
          content: string
          created_at: string
          display_name: string
          entry_id: string
          id: string
          parent_reply_id: string
          user_id: string
          username: string
        }[]
      }
      get_scroll_contents: {
        Args: { p_scroll_id: string }
        Returns: {
          chapter_label: string
          content: string
          custom_body: string
          custom_title: string
          group_name: string
          item_date: string
          item_id: string
          item_position: number
          item_type: string
          link: string
          privacy_level: string
          source_id: string
        }[]
      }
      get_user_invite_stats: { Args: { p_user_id: string }; Returns: Json }
      get_user_notifications:
        | { Args: { p_user_id: string }; Returns: Json }
        | {
            Args: {
              p_include_read?: boolean
              p_types?: string[]
              p_user_id: string
            }
            Returns: Json
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
      has_brook_with: {
        Args: { p_other_id: string; p_user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_publication_view: {
        Args: { p_publication_id: string }
        Returns: undefined
      }
      is_blocked: {
        Args: { blocked_id: string; blocker_id: string }
        Returns: boolean
      }
      is_group_admin: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: boolean
      }
      is_group_member: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: boolean
      }
      is_public_group: { Args: { p_group_id: string }; Returns: boolean }
      is_within_three_degrees: {
        Args: { target_id: string; viewer_id: string }
        Returns: boolean
      }
      meets_group_trust_level: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: boolean
      }
      publish_scroll: {
        Args: { p_scroll_id: string; p_visibility?: string }
        Returns: {
          blurb: string | null
          content_json: Json
          cover_image_url: string | null
          created_at: string
          id: string
          published_at: string
          scroll_id: string
          slug: string
          subtitle: string | null
          title: string
          unpublished_at: string | null
          updated_at: string
          user_id: string
          view_count: number
          visibility: string
        }
        SetofOptions: {
          from: "*"
          to: "scroll_publications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      refresh_layer_stats: { Args: never; Returns: undefined }
      resolve_username_to_id: {
        Args: { target_username: string }
        Returns: string
      }
      unpublish_publication: {
        Args: { p_publication_id: string }
        Returns: undefined
      }
      use_invite_code: {
        Args: { p_email: string; p_invite_code: string; p_user_id: string }
        Returns: boolean
      }
      validate_invite_code: {
        Args: { p_invite_code: string }
        Returns: {
          invite_id: string
          is_new_country: boolean
          is_valid: boolean
          target_country: string
        }[]
      }
      verify_oauth_client_secret: {
        Args: { p_client_id: string; p_secret: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      friendship_level:
        | "close_friend"
        | "family"
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
        "family",
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

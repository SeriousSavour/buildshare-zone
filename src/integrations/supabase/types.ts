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
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          target_resource_id: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_resource_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_resource_id?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean
          message: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          message: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          message?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      blocked_words: {
        Row: {
          created_at: string
          id: string
          severity: string
          word: string
        }
        Insert: {
          created_at?: string
          id?: string
          severity?: string
          word: string
        }
        Update: {
          created_at?: string
          id?: string
          severity?: string
          word?: string
        }
        Relationships: []
      }
      bug_reports: {
        Row: {
          created_at: string
          description: string
          email: string
          id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          email: string
          id?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          email?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_room_members: {
        Row: {
          id: string
          joined_at: string
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_room_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_group: boolean
          name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_group?: boolean
          name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_group?: boolean
          name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_flags: {
        Row: {
          admin_action: string | null
          admin_notes: string | null
          content_id: string
          content_type: string
          created_at: string
          flagged_content: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          severity: string
          status: string
          updated_at: string
          user_id: string
          violation_words: string[] | null
        }
        Insert: {
          admin_action?: string | null
          admin_notes?: string | null
          content_id: string
          content_type: string
          created_at?: string
          flagged_content: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
          updated_at?: string
          user_id: string
          violation_words?: string[] | null
        }
        Update: {
          admin_action?: string | null
          admin_notes?: string | null
          content_id?: string
          content_type?: string
          created_at?: string
          flagged_content?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
          updated_at?: string
          user_id?: string
          violation_words?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "content_flags_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_auth"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_game: {
        Row: {
          created_at: string
          featured_at: string
          game_id: string
          id: string
        }
        Insert: {
          created_at?: string
          featured_at?: string
          game_id: string
          id?: string
        }
        Update: {
          created_at?: string
          featured_at?: string
          game_id?: string
          id?: string
        }
        Relationships: []
      }
      friends: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friends_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "friends_room_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      game_comments: {
        Row: {
          content: string
          created_at: string
          game_id: string
          id: string
          is_deleted: boolean
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          game_id: string
          id?: string
          is_deleted?: boolean
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          game_id?: string
          id?: string
          is_deleted?: boolean
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_game_comments_game_id"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_game_comments_parent_id"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "game_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      game_group_members: {
        Row: {
          added_at: string
          game_id: string
          group_id: string
          id: string
          position: number | null
        }
        Insert: {
          added_at?: string
          game_id: string
          group_id: string
          id?: string
          position?: number | null
        }
        Update: {
          added_at?: string
          game_id?: string
          group_id?: string
          id?: string
          position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "game_group_members_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "game_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      game_groups: {
        Row: {
          clicks: number
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          position: number | null
          updated_at: string
        }
        Insert: {
          clicks?: number
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          position?: number | null
          updated_at?: string
        }
        Update: {
          clicks?: number
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          position?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      game_likes: {
        Row: {
          created_at: string
          game_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      game_progress: {
        Row: {
          created_at: string
          game_id: string
          id: string
          last_played_at: string
          progress_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          last_played_at?: string
          progress_data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          last_played_at?: string
          progress_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_progress_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          category: string
          created_at: string
          creator_id: string
          creator_name: string
          description: string | null
          game_url: string | null
          genre: string
          id: string
          image_url: string | null
          likes: number
          max_players: string
          plays: number
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          creator_id: string
          creator_name: string
          description?: string | null
          game_url?: string | null
          genre?: string
          id?: string
          image_url?: string | null
          likes?: number
          max_players?: string
          plays?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          creator_id?: string
          creator_name?: string
          description?: string | null
          game_url?: string | null
          genre?: string
          id?: string
          image_url?: string | null
          likes?: number
          max_players?: string
          plays?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      guidelines: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          requires_ip_consent: boolean
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          requires_ip_consent?: boolean
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          requires_ip_consent?: boolean
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          deleted_reason: string | null
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          is_deleted: boolean
          room_id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          deleted_reason?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_deleted?: boolean
          room_id: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          deleted_reason?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_deleted?: boolean
          room_id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      quests: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          name: string
          quest_type: string
          requirement_count: number
          updated_at: string
          xp_reward: number
        }
        Insert: {
          created_at?: string
          description: string
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          quest_type: string
          requirement_count?: number
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          quest_type?: string
          requirement_count?: number
          updated_at?: string
          xp_reward?: number
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_type: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_type?: string
          setting_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_type?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      tools: {
        Row: {
          category: string
          clicks: number
          created_at: string
          description: string | null
          icon: string
          id: string
          name: string
          updated_at: string
          url: string
        }
        Insert: {
          category?: string
          clicks?: number
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name: string
          updated_at?: string
          url: string
        }
        Update: {
          category?: string
          clicks?: number
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      user_auth: {
        Row: {
          created_at: string
          hash_version: number | null
          id: string
          is_active: boolean
          password_hash: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          hash_version?: number | null
          id?: string
          is_active?: boolean
          password_hash: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          hash_version?: number | null
          id?: string
          is_active?: boolean
          password_hash?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string
          game_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_guideline_acceptances: {
        Row: {
          accepted_at: string
          guideline_id: string
          guideline_version: number
          id: string
          user_id: string
        }
        Insert: {
          accepted_at?: string
          guideline_id: string
          guideline_version: number
          id?: string
          user_id: string
        }
        Update: {
          accepted_at?: string
          guideline_id?: string
          guideline_version?: number
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_guideline_acceptances_guideline_id_fkey"
            columns: ["guideline_id"]
            isOneToOne: false
            referencedRelation: "guidelines"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          auto_save: boolean | null
          created_at: string
          font_family: string | null
          font_size: string | null
          id: string
          language: string | null
          notifications_enabled: boolean | null
          sound_enabled: boolean | null
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_save?: boolean | null
          created_at?: string
          font_family?: string | null
          font_size?: string | null
          id?: string
          language?: string | null
          notifications_enabled?: boolean | null
          sound_enabled?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_save?: boolean | null
          created_at?: string
          font_family?: string | null
          font_size?: string | null
          id?: string
          language?: string | null
          notifications_enabled?: boolean | null
          sound_enabled?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_quest_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          progress: number
          quest_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          progress?: number
          quest_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          progress?: number
          quest_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quest_progress_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
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
          role?: Database["public"]["Enums"]["app_role"]
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
      user_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          session_token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          session_token: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          session_token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_auth"
            referencedColumns: ["id"]
          },
        ]
      }
      user_warnings: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          issued_at: string
          issued_by: string
          reason: string
          related_flag_id: string | null
          updated_at: string
          user_id: string
          warning_type: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          issued_at?: string
          issued_by: string
          reason: string
          related_flag_id?: string | null
          updated_at?: string
          user_id: string
          warning_type: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          issued_at?: string
          issued_by?: string
          reason?: string
          related_flag_id?: string | null
          updated_at?: string
          user_id?: string
          warning_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_warnings_related_flag_id_fkey"
            columns: ["related_flag_id"]
            isOneToOne: false
            referencedRelation: "content_flags"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_friend_request_with_context: {
        Args: { _request_id: string; _session_token: string }
        Returns: Json
      }
      accept_guideline: {
        Args: {
          _guideline_id: string
          _guideline_version: number
          _user_id: string
        }
        Returns: undefined
      }
      add_game_to_group:
        | {
            Args: {
              _game_id: string
              _group_id: string
              _session_token: string
            }
            Returns: boolean
          }
        | { Args: { _game_id: string; _group_id: string }; Returns: boolean }
      ban_user:
        | {
            Args: { _admin_session_token?: string; _target_user_id: string }
            Returns: boolean
          }
        | { Args: { _target_user_id: string }; Returns: boolean }
      check_user_game_like: {
        Args: { _game_id: string; _user_id: string }
        Returns: boolean
      }
      check_username_exists: { Args: { _username: string }; Returns: boolean }
      create_admin_user: { Args: never; Returns: string }
      create_chat_room_with_context: {
        Args: {
          _friend_id: string
          _friend_username: string
          _session_token: string
        }
        Returns: Json
      }
      create_game_group:
        | {
            Args: {
              _description?: string
              _game_ids?: string[]
              _name: string
              _session_token: string
            }
            Returns: string
          }
        | {
            Args: { _description?: string; _game_ids?: string[]; _name: string }
            Returns: string
          }
      create_game_with_context: {
        Args: {
          _category?: string
          _description: string
          _game_url: string
          _genre: string
          _image_url?: string
          _max_players: string
          _session_token: string
          _title: string
        }
        Returns: string
      }
      create_mutual_friendship: {
        Args: { _user1_id: string; _user2_id: string }
        Returns: boolean
      }
      create_secure_user_session: {
        Args: { _user_id: string }
        Returns: string
      }
      create_user_session: { Args: { _user_id: string }; Returns: string }
      delete_game_group: {
        Args: { _group_id: string; _session_token: string }
        Returns: boolean
      }
      delete_game_with_context: {
        Args: { _game_id: string; _session_token: string }
        Returns: boolean
      }
      demote_admin_to_user: {
        Args: { _admin_session_token: string; _target_username: string }
        Returns: boolean
      }
      demote_developer_to_user: {
        Args: { _admin_session_token: string; _target_username: string }
        Returns: boolean
      }
      flag_content: {
        Args: {
          _content_id: string
          _content_type: string
          _flagged_content: string
          _severity?: string
          _user_id: string
          _violation_words: string[]
        }
        Returns: string
      }
      get_active_guidelines: {
        Args: never
        Returns: {
          content: string
          created_at: string
          id: string
          requires_ip_consent: boolean
          title: string
          version: number
        }[]
      }
      get_audit_logs: {
        Args: { _admin_session_token: string; _limit?: number }
        Returns: {
          action: string
          admin_user_id: string
          admin_username: string
          created_at: string
          details: Json
          id: string
          target_resource_id: string
          target_user_id: string
          target_username: string
        }[]
      }
      get_chat_rooms_with_context: {
        Args: { _session_token: string }
        Returns: {
          created_at: string
          created_by: string
          is_group: boolean
          members: Json
          room_id: string
          room_name: string
          updated_at: string
        }[]
      }
      get_current_user_from_token: {
        Args: { _session_token: string }
        Returns: string
      }
      get_current_user_id: { Args: never; Returns: string }
      get_friends_with_context: {
        Args: { _session_token: string }
        Returns: {
          created_at: string
          friend_id: string
          friend_profile: Json
          id: string
          status: string
          updated_at: string
          user_id: string
          user_profile: Json
        }[]
      }
      get_game_comments_with_profiles: {
        Args: { _game_id: string; _session_token: string }
        Returns: {
          avatar_url: string
          content: string
          created_at: string
          id: string
          is_deleted: boolean
          user_id: string
          username: string
        }[]
      }
      get_leaderboard: {
        Args: { _limit?: number }
        Returns: {
          avatar_url: string
          display_name: string
          quests_completed: number
          total_xp: number
          user_id: string
          username: string
        }[]
      }
      get_profile_by_session: {
        Args: { _session_token: string }
        Returns: {
          avatar_url: string
          created_at: string
          display_name: string
          id: string
          updated_at: string
          user_id: string
          username: string
        }[]
      }
      get_room_members: {
        Args: { room_id: string }
        Returns: {
          avatar_url: string
          display_name: string
          user_id: string
          username: string
        }[]
      }
      get_room_members_for_user: {
        Args: { _room_id: string; _session_token: string }
        Returns: {
          avatar_url: string
          display_name: string
          user_id: string
          username: string
        }[]
      }
      get_room_members_safe: {
        Args: { _room_id: string }
        Returns: {
          avatar_url: string
          display_name: string
          user_id: string
          username: string
        }[]
      }
      get_session_user_id: { Args: never; Returns: string }
      get_user_by_session: {
        Args: { _session_token: string }
        Returns: {
          user_id: string
          username: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_room_ids: { Args: { _session_token: string }; Returns: string[] }
      get_users_with_roles: {
        Args: { _admin_session_token: string }
        Returns: {
          avatar_url: string
          created_at: string
          display_name: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          username: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hash_password: { Args: { _password: string }; Returns: string }
      increment_game_plays: {
        Args: { _game_id: string }
        Returns: {
          plays: number
        }[]
      }
      increment_group_clicks: { Args: { group_id: string }; Returns: undefined }
      insert_game_comment: {
        Args: {
          _content: string
          _game_id: string
          _parent_id?: string
          _session_token: string
        }
        Returns: {
          content: string
          created_at: string
          game_id: string
          id: string
          is_deleted: boolean
          parent_id: string
          updated_at: string
          user_id: string
        }[]
      }
      is_room_member: {
        Args: { _room_id: string; _user_id: string }
        Returns: boolean
      }
      is_user_banned: {
        Args: { _user_id: string }
        Returns: {
          ban_reason: string
          expires_at: string
          is_banned: boolean
        }[]
      }
      is_username_available: {
        Args: { _user_id: string; _username: string }
        Returns: boolean
      }
      issue_warning: {
        Args: {
          _admin_session_token?: string
          _duration_hours?: number
          _reason: string
          _related_flag_id?: string
          _user_id: string
          _warning_type: string
        }
        Returns: string
      }
      load_game_progress: {
        Args: { _game_id: string; _session_token: string }
        Returns: Json
      }
      log_admin_action: {
        Args: {
          _action: string
          _details?: Json
          _target_resource_id?: string
          _target_user_id?: string
        }
        Returns: undefined
      }
      log_admin_action_with_session: {
        Args: {
          _action: string
          _details?: Json
          _session_token: string
          _target_resource_id?: string
          _target_user_id?: string
        }
        Returns: undefined
      }
      log_security_event: {
        Args: { _details?: Json; _event_type: string; _user_id: string }
        Returns: undefined
      }
      promote_user_to_admin: {
        Args: { _admin_session_token: string; _target_username: string }
        Returns: boolean
      }
      promote_user_to_developer: {
        Args: { _admin_session_token: string; _target_username: string }
        Returns: boolean
      }
      refresh_user_session: {
        Args: { _session_token: string }
        Returns: boolean
      }
      reject_friend_request_with_context: {
        Args: { _request_id: string; _session_token: string }
        Returns: Json
      }
      remove_friend_with_context: {
        Args: { _friend_id: string; _session_token: string }
        Returns: Json
      }
      remove_game_from_group:
        | {
            Args: {
              _game_id: string
              _group_id: string
              _session_token: string
            }
            Returns: boolean
          }
        | { Args: { _game_id: string; _group_id: string }; Returns: boolean }
      save_game_progress: {
        Args: { _game_id: string; _progress_data: Json; _session_token: string }
        Returns: Json
      }
      send_friend_request_with_context: {
        Args: { _friend_username: string; _session_token: string }
        Returns: Json
      }
      set_session_context: {
        Args: { _session_token: string }
        Returns: undefined
      }
      toggle_favorite: {
        Args: { _game_id: string; _session_token: string }
        Returns: Json
      }
      toggle_game_like: {
        Args: { _game_id: string; _user_id: string }
        Returns: Json
      }
      update_content_flag: {
        Args: {
          _admin_action?: string
          _admin_notes?: string
          _admin_session_token?: string
          _flag_id: string
          _status: string
        }
        Returns: boolean
      }
      update_featured_game: { Args: never; Returns: string }
      update_game_with_context: {
        Args: {
          _description?: string
          _game_id: string
          _game_url?: string
          _genre?: string
          _image_url?: string
          _max_players?: string
          _session_token: string
          _title?: string
        }
        Returns: boolean
      }
      update_quest_progress: {
        Args: { _increment?: number; _quest_type: string; _user_id: string }
        Returns: boolean
      }
      update_username_with_context: {
        Args: { _new_username: string; _session_token: string }
        Returns: boolean
      }
      validate_password_strength: {
        Args: { _password: string }
        Returns: boolean
      }
      validate_user_input: {
        Args: { _input: string; _max_length?: number }
        Returns: boolean
      }
      validate_user_login: {
        Args: { _password: string; _username: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user" | "developer"
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
      app_role: ["admin", "user", "developer"],
    },
  },
} as const

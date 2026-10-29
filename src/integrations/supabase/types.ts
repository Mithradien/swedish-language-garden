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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      app_config: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      booking_statuses: {
        Row: {
          booking_key: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          booking_key: string
          status: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          booking_key?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_date: string
          booking_key: string
          created_at: string
          email: string | null
          end_time: string | null
          id: string
          name: string | null
          note: string | null
          phone: string | null
          regnr: string
          service: string | null
          source: string
          start_time: string
          updated_at: string
        }
        Insert: {
          booking_date: string
          booking_key: string
          created_at?: string
          email?: string | null
          end_time?: string | null
          id?: string
          name?: string | null
          note?: string | null
          phone?: string | null
          regnr: string
          service?: string | null
          source?: string
          start_time: string
          updated_at?: string
        }
        Update: {
          booking_date?: string
          booking_key?: string
          created_at?: string
          email?: string | null
          end_time?: string | null
          id?: string
          name?: string | null
          note?: string | null
          phone?: string | null
          regnr?: string
          service?: string | null
          source?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      car_storage: {
        Row: {
          created_at: string
          email: string
          kundnr: string
          lagerplats: string
          min_depth: number | null
          modell: string
          owner: string
          phone: string
          regnr: string
          tires: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string
          kundnr?: string
          lagerplats?: string
          min_depth?: number | null
          modell?: string
          owner?: string
          phone?: string
          regnr: string
          tires?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          kundnr?: string
          lagerplats?: string
          min_depth?: number | null
          modell?: string
          owner?: string
          phone?: string
          regnr?: string
          tires?: Json
          updated_at?: string
        }
        Relationships: []
      }
      customer_cars: {
        Row: {
          created_at: string
          id: string
          regnr: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          regnr: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          regnr?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      mail_settings: {
        Row: {
          enabled: boolean
          from_address: string
          host: string
          id: number
          password: string
          port: number
          site_url: string
          updated_at: string
          username: string
        }
        Insert: {
          enabled?: boolean
          from_address?: string
          host?: string
          id?: number
          password?: string
          port?: number
          site_url?: string
          updated_at?: string
          username?: string
        }
        Update: {
          enabled?: boolean
          from_address?: string
          host?: string
          id?: number
          password?: string
          port?: number
          site_url?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          city: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          phone: string | null
          postal_code: string | null
          street: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          phone?: string | null
          postal_code?: string | null
          street?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          postal_code?: string | null
          street?: string | null
        }
        Relationships: []
      }
      slot_locks: {
        Row: {
          created_at: string
          locked_by: string | null
          slot_date: string
          slot_time: string
        }
        Insert: {
          created_at?: string
          locked_by?: string | null
          slot_date: string
          slot_time: string
        }
        Update: {
          created_at?: string
          locked_by?: string | null
          slot_date?: string
          slot_time?: string
        }
        Relationships: []
      }
      status_events: {
        Row: {
          actor_id: string | null
          booking_key: string
          created_at: string
          id: string
          regnr: string
          source: string
          status: string
        }
        Insert: {
          actor_id?: string | null
          booking_key: string
          created_at?: string
          id?: string
          regnr: string
          source?: string
          status: string
        }
        Update: {
          actor_id?: string | null
          booking_key?: string
          created_at?: string
          id?: string
          regnr?: string
          source?: string
          status?: string
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
      work_orders: {
        Row: {
          booking_date: string
          booking_key: string
          depth_hb: number | null
          depth_hf: number | null
          depth_vb: number | null
          depth_vf: number | null
          finished_at: string | null
          id: string
          mechanic_id: string | null
          note: string | null
          regnr: string
          service: string | null
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          booking_date: string
          booking_key: string
          depth_hb?: number | null
          depth_hf?: number | null
          depth_vb?: number | null
          depth_vf?: number | null
          finished_at?: string | null
          id?: string
          mechanic_id?: string | null
          note?: string | null
          regnr: string
          service?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          booking_date?: string
          booking_key?: string
          depth_hb?: number | null
          depth_hf?: number | null
          depth_vb?: number | null
          depth_vf?: number | null
          finished_at?: string | null
          id?: string
          mechanic_id?: string | null
          note?: string | null
          regnr?: string
          service?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _u: string }; Returns: boolean }
      is_staff: { Args: { _u: string }; Returns: boolean }
    }
    Enums: {
      app_role: "superadmin" | "mekaniker" | "kund" | "useradmin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["superadmin", "mekaniker", "kund", "useradmin"],
    },
  },
} as const

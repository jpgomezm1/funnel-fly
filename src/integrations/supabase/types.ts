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
      deals: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          implementation_fee_usd: number
          lead_id: string
          mrr_usd: number
          notes: string | null
          start_date: string
          status: Database["public"]["Enums"]["deal_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          implementation_fee_usd?: number
          lead_id: string
          mrr_usd: number
          notes?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["deal_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          implementation_fee_usd?: number
          lead_id?: string
          mrr_usd?: number
          notes?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["deal_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          effective_from: string
          goal_type: string
          id: string
          period: string
          value_usd: number
        }
        Insert: {
          created_at?: string
          effective_from?: string
          goal_type: string
          id?: string
          period: string
          value_usd: number
        }
        Update: {
          created_at?: string
          effective_from?: string
          goal_type?: string
          id?: string
          period?: string
          value_usd?: number
        }
        Relationships: []
      }
      lead_activities: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          details: string | null
          id: string
          lead_id: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          details?: string | null
          id?: string
          lead_id: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          details?: string | null
          id?: string
          lead_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_stage_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          from_stage: Database["public"]["Enums"]["lead_stage"] | null
          id: number
          lead_id: string
          to_stage: Database["public"]["Enums"]["lead_stage"]
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          from_stage?: Database["public"]["Enums"]["lead_stage"] | null
          id?: number
          lead_id: string
          to_stage: Database["public"]["Enums"]["lead_stage"]
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          from_stage?: Database["public"]["Enums"]["lead_stage"] | null
          id?: number
          lead_id?: string
          to_stage?: Database["public"]["Enums"]["lead_stage"]
        }
        Relationships: [
          {
            foreignKeyName: "lead_stage_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          channel: Database["public"]["Enums"]["lead_channel"]
          company_name: string
          contact_name: string | null
          contact_role: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          last_activity_at: string
          notes: string | null
          owner_id: string | null
          phone: string | null
          stage: Database["public"]["Enums"]["lead_stage"]
          stage_entered_at: string
          subchannel: Database["public"]["Enums"]["lead_subchannel"]
          updated_at: string
        }
        Insert: {
          channel?: Database["public"]["Enums"]["lead_channel"]
          company_name: string
          contact_name?: string | null
          contact_role?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          last_activity_at?: string
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          stage?: Database["public"]["Enums"]["lead_stage"]
          stage_entered_at?: string
          subchannel?: Database["public"]["Enums"]["lead_subchannel"]
          updated_at?: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["lead_channel"]
          company_name?: string
          contact_name?: string | null
          contact_role?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          last_activity_at?: string
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          stage?: Database["public"]["Enums"]["lead_stage"]
          stage_entered_at?: string
          subchannel?: Database["public"]["Enums"]["lead_subchannel"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      deal_status: "ACTIVE" | "CHURNED" | "ON_HOLD"
      lead_channel: "OUTBOUND_APOLLO" | "WARM_INTRO" | "INBOUND_REDES"
      lead_stage:
        | "PROSPECTO"
        | "CONTACTADO"
        | "DESCUBRIMIENTO"
        | "DEMOSTRACION"
        | "PROPUESTA"
        | "CERRADO_GANADO"
        | "CERRADO_PERDIDO"
      lead_subchannel: "NINGUNO" | "INSTAGRAM" | "TIKTOK" | "LINKEDIN" | "OTRO"
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
      deal_status: ["ACTIVE", "CHURNED", "ON_HOLD"],
      lead_channel: ["OUTBOUND_APOLLO", "WARM_INTRO", "INBOUND_REDES"],
      lead_stage: [
        "PROSPECTO",
        "CONTACTADO",
        "DESCUBRIMIENTO",
        "DEMOSTRACION",
        "PROPUESTA",
        "CERRADO_GANADO",
        "CERRADO_PERDIDO",
      ],
      lead_subchannel: ["NINGUNO", "INSTAGRAM", "TIKTOK", "LINKEDIN", "OTRO"],
    },
  },
} as const

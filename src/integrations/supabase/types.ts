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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          check_in: string
          check_out: string
          created_at: string
          guest_id: string | null
          guests_count: number
          id: string
          paid_amount: number
          payment_method: string | null
          room_number: string
          room_type: string
          special_requests: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          check_in: string
          check_out: string
          created_at?: string
          guest_id?: string | null
          guests_count?: number
          id?: string
          paid_amount?: number
          payment_method?: string | null
          room_number: string
          room_type: string
          special_requests?: string | null
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          check_in?: string
          check_out?: string
          created_at?: string
          guest_id?: string | null
          guests_count?: number
          id?: string
          paid_amount?: number
          payment_method?: string | null
          room_number?: string
          room_type?: string
          special_requests?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_issues: {
        Row: {
          booking_id: string | null
          cost_incurred: number | null
          created_at: string
          created_by: string | null
          description: string
          guest_id: string
          id: string
          issue_type: string
          notes: string | null
          resolved: boolean | null
          room_number: string
          severity: string
        }
        Insert: {
          booking_id?: string | null
          cost_incurred?: number | null
          created_at?: string
          created_by?: string | null
          description: string
          guest_id: string
          id?: string
          issue_type: string
          notes?: string | null
          resolved?: boolean | null
          room_number: string
          severity: string
        }
        Update: {
          booking_id?: string | null
          cost_incurred?: number | null
          created_at?: string
          created_by?: string | null
          description?: string
          guest_id?: string
          id?: string
          issue_type?: string
          notes?: string | null
          resolved?: boolean | null
          room_number?: string
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_issues_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          created_at: string
          email: string | null
          id: string
          id_number: string | null
          name: string
          phone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          id_number?: string | null
          name: string
          phone: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          id_number?: string | null
          name?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      refund_requests: {
        Row: {
          amount_paid: number
          approved_at: string | null
          approved_by: string | null
          booking_id: string
          created_at: string
          deductions: number | null
          guest_id: string | null
          id: string
          items_utilized: Json | null
          reason: string
          refund_amount: number
          rejection_reason: string | null
          requested_by: string | null
          room_assessment_id: string | null
          room_number: string
          status: string
          updated_at: string
        }
        Insert: {
          amount_paid: number
          approved_at?: string | null
          approved_by?: string | null
          booking_id: string
          created_at?: string
          deductions?: number | null
          guest_id?: string | null
          id?: string
          items_utilized?: Json | null
          reason: string
          refund_amount: number
          rejection_reason?: string | null
          requested_by?: string | null
          room_assessment_id?: string | null
          room_number: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          approved_at?: string | null
          approved_by?: string | null
          booking_id?: string
          created_at?: string
          deductions?: number | null
          guest_id?: string | null
          id?: string
          items_utilized?: Json | null
          reason?: string
          refund_amount?: number
          rejection_reason?: string | null
          requested_by?: string | null
          room_assessment_id?: string | null
          room_number?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refund_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refund_requests_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refund_requests_room_assessment_id_fkey"
            columns: ["room_assessment_id"]
            isOneToOne: false
            referencedRelation: "room_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      room_assessments: {
        Row: {
          assessed_by: string | null
          assessment_date: string
          booking_id: string | null
          created_at: string
          damage_cost: number | null
          damage_description: string | null
          damages_found: boolean | null
          extra_cleaning_required: boolean | null
          guest_id: string | null
          id: string
          missing_items: Json | null
          notes: string | null
          overall_condition: string
          photos: Json | null
          room_number: string
        }
        Insert: {
          assessed_by?: string | null
          assessment_date?: string
          booking_id?: string | null
          created_at?: string
          damage_cost?: number | null
          damage_description?: string | null
          damages_found?: boolean | null
          extra_cleaning_required?: boolean | null
          guest_id?: string | null
          id?: string
          missing_items?: Json | null
          notes?: string | null
          overall_condition: string
          photos?: Json | null
          room_number: string
        }
        Update: {
          assessed_by?: string | null
          assessment_date?: string
          booking_id?: string | null
          created_at?: string
          damage_cost?: number | null
          damage_description?: string | null
          damages_found?: boolean | null
          extra_cleaning_required?: boolean | null
          guest_id?: string | null
          id?: string
          missing_items?: Json | null
          notes?: string | null
          overall_condition?: string
          photos?: Json | null
          room_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_assessments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_assessments_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      room_supplies: {
        Row: {
          booking_id: string | null
          id: string
          is_complimentary: boolean | null
          item_name: string
          quantity: number
          restocked_at: string
          restocked_by: string | null
          room_number: string
          total_cost: number
          unit_cost: number
        }
        Insert: {
          booking_id?: string | null
          id?: string
          is_complimentary?: boolean | null
          item_name: string
          quantity?: number
          restocked_at?: string
          restocked_by?: string | null
          room_number: string
          total_cost: number
          unit_cost: number
        }
        Update: {
          booking_id?: string | null
          id?: string
          is_complimentary?: boolean | null
          item_name?: string
          quantity?: number
          restocked_at?: string
          restocked_by?: string | null
          room_number?: string
          total_cost?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "room_supplies_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

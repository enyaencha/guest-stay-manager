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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      booking_notifications: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
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
      expenses: {
        Row: {
          approved_by: string | null
          category: string
          created_at: string
          date: string
          description: string
          etims_amount: number | null
          id: string
          non_etims_amount: number | null
          payment_method: string
          reference: string | null
          status: string
          supplier: string | null
          total_cost: number
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          category: string
          created_at?: string
          date?: string
          description: string
          etims_amount?: number | null
          id?: string
          non_etims_amount?: number | null
          payment_method: string
          reference?: string | null
          status?: string
          supplier?: string | null
          total_cost: number
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          category?: string
          created_at?: string
          date?: string
          description?: string
          etims_amount?: number | null
          id?: string
          non_etims_amount?: number | null
          payment_method?: string
          reference?: string | null
          status?: string
          supplier?: string | null
          total_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_transactions: {
        Row: {
          amount: number
          booking_id: string | null
          category: string
          created_at: string
          created_by: string | null
          date: string
          description: string
          id: string
          payment_method: string | null
          payment_status: string
          reference: string | null
          room_number: string | null
          type: string
          updated_at: string
          vendor: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          category: string
          created_at?: string
          created_by?: string | null
          date?: string
          description: string
          id?: string
          payment_method?: string | null
          payment_status?: string
          reference?: string | null
          room_number?: string | null
          type: string
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string
          id?: string
          payment_method?: string | null
          payment_status?: string
          reference?: string | null
          room_number?: string | null
          type?: string
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
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
      housekeeping_staff: {
        Row: {
          created_at: string
          id: string
          is_available: boolean | null
          name: string
          specialty: string[] | null
          staff_id: string | null
          tasks_assigned: number | null
          tasks_completed: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_available?: boolean | null
          name: string
          specialty?: string[] | null
          staff_id?: string | null
          tasks_assigned?: number | null
          tasks_completed?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_available?: boolean | null
          name?: string
          specialty?: string[] | null
          staff_id?: string | null
          tasks_assigned?: number | null
          tasks_completed?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "housekeeping_staff_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      housekeeping_tasks: {
        Row: {
          actual_added: Json | null
          actual_added_notes: string | null
          amenities: Json | null
          assigned_to: string | null
          assigned_to_name: string | null
          completed_at: string | null
          created_at: string
          estimated_minutes: number | null
          id: string
          notes: string | null
          priority: string
          restock_notes: string | null
          room_id: string | null
          room_name: string | null
          room_number: string
          status: string
          task_type: string
          updated_at: string
        }
        Insert: {
          actual_added?: Json | null
          actual_added_notes?: string | null
          amenities?: Json | null
          assigned_to?: string | null
          assigned_to_name?: string | null
          completed_at?: string | null
          created_at?: string
          estimated_minutes?: number | null
          id?: string
          notes?: string | null
          priority?: string
          restock_notes?: string | null
          room_id?: string | null
          room_name?: string | null
          room_number: string
          status?: string
          task_type: string
          updated_at?: string
        }
        Update: {
          actual_added?: Json | null
          actual_added_notes?: string | null
          amenities?: Json | null
          assigned_to?: string | null
          assigned_to_name?: string | null
          completed_at?: string | null
          created_at?: string
          estimated_minutes?: number | null
          id?: string
          notes?: string | null
          priority?: string
          restock_notes?: string | null
          room_id?: string | null
          room_name?: string | null
          room_number?: string
          status?: string
          task_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "housekeeping_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "housekeeping_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "housekeeping_tasks_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category: string
          created_at: string
          current_stock: number
          id: string
          is_active: boolean | null
          last_restocked: string | null
          max_stock: number
          min_stock: number
          name: string
          opening_stock: number | null
          purchases_in: number | null
          selling_price: number | null
          sku: string | null
          stock_out: number | null
          supplier: string | null
          unit: string
          unit_cost: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          current_stock?: number
          id?: string
          is_active?: boolean | null
          last_restocked?: string | null
          max_stock?: number
          min_stock?: number
          name: string
          opening_stock?: number | null
          purchases_in?: number | null
          selling_price?: number | null
          sku?: string | null
          stock_out?: number | null
          supplier?: string | null
          unit?: string
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          current_stock?: number
          id?: string
          is_active?: boolean | null
          last_restocked?: string | null
          max_stock?: number
          min_stock?: number
          name?: string
          opening_stock?: number | null
          purchases_in?: number | null
          selling_price?: number | null
          sku?: string | null
          stock_out?: number | null
          supplier?: string | null
          unit?: string
          unit_cost?: number
          updated_at?: string
        }
        Relationships: []
      }
      maintenance_issues: {
        Row: {
          assigned_to: string | null
          assigned_to_name: string | null
          category: string
          cost: number | null
          created_at: string
          description: string | null
          id: string
          priority: string
          reported_at: string
          reported_by: string | null
          resolution_notes: string | null
          resolved_at: string | null
          room_id: string | null
          room_name: string | null
          room_number: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          assigned_to_name?: string | null
          category: string
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          reported_at?: string
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          room_id?: string | null
          room_name?: string | null
          room_number: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          assigned_to_name?: string | null
          category?: string
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          reported_at?: string
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          room_id?: string | null
          room_name?: string | null
          room_number?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_issues_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "maintenance_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_issues_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_issues_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_staff: {
        Row: {
          created_at: string
          id: string
          is_available: boolean | null
          issues_assigned: number | null
          issues_resolved: number | null
          name: string
          specialty: string[] | null
          staff_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_available?: boolean | null
          issues_assigned?: number | null
          issues_resolved?: number | null
          name: string
          specialty?: string[] | null
          staff_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_available?: boolean | null
          issues_assigned?: number | null
          issues_resolved?: number | null
          name?: string
          specialty?: string[] | null
          staff_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_staff_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          booking_confirmations: boolean | null
          created_at: string
          daily_reports: boolean | null
          email_notifications: boolean | null
          id: string
          low_stock_alerts: boolean | null
          maintenance_alerts: boolean | null
          payment_alerts: boolean | null
          sms_notifications: boolean | null
          updated_at: string
          user_id: string | null
          weekly_reports: boolean | null
        }
        Insert: {
          booking_confirmations?: boolean | null
          created_at?: string
          daily_reports?: boolean | null
          email_notifications?: boolean | null
          id?: string
          low_stock_alerts?: boolean | null
          maintenance_alerts?: boolean | null
          payment_alerts?: boolean | null
          sms_notifications?: boolean | null
          updated_at?: string
          user_id?: string | null
          weekly_reports?: boolean | null
        }
        Update: {
          booking_confirmations?: boolean | null
          created_at?: string
          daily_reports?: boolean | null
          email_notifications?: boolean | null
          id?: string
          low_stock_alerts?: boolean | null
          maintenance_alerts?: boolean | null
          payment_alerts?: boolean | null
          sms_notifications?: boolean | null
          updated_at?: string
          user_id?: string | null
          weekly_reports?: boolean | null
        }
        Relationships: []
      }
      pos_items: {
        Row: {
          category: string
          cost: number
          created_at: string
          description: string | null
          id: string
          inventory_item_id: string | null
          is_available: boolean | null
          name: string
          price: number
          stock_quantity: number | null
          updated_at: string
        }
        Insert: {
          category: string
          cost?: number
          created_at?: string
          description?: string | null
          id?: string
          inventory_item_id?: string | null
          is_available?: boolean | null
          name: string
          price: number
          stock_quantity?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          cost?: number
          created_at?: string
          description?: string | null
          id?: string
          inventory_item_id?: string | null
          is_available?: boolean | null
          name?: string
          price?: number
          stock_quantity?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_transactions: {
        Row: {
          created_at: string
          guest_id: string | null
          guest_name: string | null
          id: string
          items: Json
          notes: string | null
          payment_method: string
          room_number: string | null
          staff_id: string | null
          staff_name: string | null
          status: string
          subtotal: number
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          guest_id?: string | null
          guest_name?: string | null
          id?: string
          items?: Json
          notes?: string | null
          payment_method: string
          room_number?: string | null
          staff_id?: string | null
          staff_name?: string | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          guest_id?: string | null
          guest_name?: string | null
          id?: string
          items?: Json
          notes?: string | null
          payment_method?: string
          room_number?: string | null
          staff_id?: string | null
          staff_name?: string | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_transactions_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_transactions_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          password_reset_required: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          password_reset_required?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          password_reset_required?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      property_settings: {
        Row: {
          address: string | null
          check_in_time: string | null
          check_out_time: string | null
          city: string | null
          country: string | null
          created_at: string
          currency: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          timezone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          timezone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          timezone?: string | null
          updated_at?: string
          website?: string | null
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
      reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string
          guest_id: string | null
          guest_name: string
          guest_phone: string
          id: string
          is_approved: boolean | null
          rating: number
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          guest_id?: string | null
          guest_name: string
          guest_phone: string
          id?: string
          is_approved?: boolean | null
          rating: number
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          guest_id?: string | null
          guest_name?: string
          guest_phone?: string
          id?: string
          is_approved?: boolean | null
          rating?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system_role: boolean | null
          name: string
          permissions: Database["public"]["Enums"]["app_permission"][]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system_role?: boolean | null
          name: string
          permissions?: Database["public"]["Enums"]["app_permission"][]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system_role?: boolean | null
          name?: string
          permissions?: Database["public"]["Enums"]["app_permission"][]
          updated_at?: string
        }
        Relationships: []
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
      room_types: {
        Row: {
          amenities: string[] | null
          base_price: number
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          max_occupancy: number
          name: string
          updated_at: string
        }
        Insert: {
          amenities?: string[] | null
          base_price: number
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_occupancy?: number
          name: string
          updated_at?: string
        }
        Update: {
          amenities?: string[] | null
          base_price?: number
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_occupancy?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          amenities: string[] | null
          base_price: number
          cleaning_status: string
          created_at: string
          current_booking_id: string | null
          current_guest_id: string | null
          floor: number
          id: string
          is_active: boolean | null
          maintenance_status: string
          max_occupancy: number
          name: string
          number: string
          occupancy_status: string
          room_type_id: string | null
          updated_at: string
        }
        Insert: {
          amenities?: string[] | null
          base_price: number
          cleaning_status?: string
          created_at?: string
          current_booking_id?: string | null
          current_guest_id?: string | null
          floor?: number
          id?: string
          is_active?: boolean | null
          maintenance_status?: string
          max_occupancy?: number
          name: string
          number: string
          occupancy_status?: string
          room_type_id?: string | null
          updated_at?: string
        }
        Update: {
          amenities?: string[] | null
          base_price?: number
          cleaning_status?: string
          created_at?: string
          current_booking_id?: string | null
          current_guest_id?: string | null
          floor?: number
          id?: string
          is_active?: boolean | null
          maintenance_status?: string
          max_occupancy?: number
          name?: string
          number?: string
          occupancy_status?: string
          room_type_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_current_booking_id_fkey"
            columns: ["current_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_current_guest_id_fkey"
            columns: ["current_guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          avatar_url: string | null
          contract_end_date: string | null
          created_at: string
          department: string
          email: string | null
          employment_type: string
          id: string
          joined_date: string
          name: string
          phone: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          contract_end_date?: string | null
          created_at?: string
          department: string
          email?: string | null
          employment_type?: string
          id?: string
          joined_date?: string
          name: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          contract_end_date?: string | null
          created_at?: string
          department?: string
          email?: string | null
          employment_type?: string
          id?: string
          joined_date?: string
          name?: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      staff_secrets: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          secret_code: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          secret_code: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          secret_code?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      system_preferences: {
        Row: {
          auto_backup: boolean | null
          created_at: string
          date_format: string | null
          id: string
          language: string | null
          maintenance_mode: boolean | null
          time_format: string | null
          updated_at: string
        }
        Insert: {
          auto_backup?: boolean | null
          created_at?: string
          date_format?: string | null
          id?: string
          language?: string | null
          maintenance_mode?: boolean | null
          time_format?: string | null
          updated_at?: string
        }
        Update: {
          auto_backup?: boolean | null
          created_at?: string
          date_format?: string | null
          id?: string
          language?: string | null
          maintenance_mode?: boolean | null
          time_format?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          is_active: boolean | null
          role_id: string
          updated_at: string
          user_id: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          role_id: string
          updated_at?: string
          user_id: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          role_id?: string
          updated_at?: string
          user_id?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      deactivate_expired_staff: { Args: never; Returns: undefined }
      get_user_permissions: { Args: { _user_id: string }; Returns: string[] }
      has_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role:
        | { Args: { _role_name: string; _user_id: string }; Returns: boolean }
        | { Args: { _role_name: string; _user_id: string }; Returns: boolean }
      log_audit: {
        Args: {
          _action: string
          _entity_id: string
          _entity_type: string
          _metadata?: Json
          _new_values?: Json
          _old_values?: Json
        }
        Returns: string
      }
      verify_staff_secret: { Args: { _secret: string }; Returns: boolean }
    }
    Enums: {
      app_permission:
        | "rooms.view"
        | "rooms.manage"
        | "guests.view"
        | "guests.manage"
        | "bookings.view"
        | "bookings.manage"
        | "housekeeping.view"
        | "housekeeping.manage"
        | "maintenance.view"
        | "maintenance.manage"
        | "inventory.view"
        | "inventory.manage"
        | "pos.view"
        | "pos.manage"
        | "finance.view"
        | "finance.manage"
        | "reports.view"
        | "reports.export"
        | "settings.view"
        | "settings.manage"
        | "refunds.view"
        | "refunds.approve"
        | "staff.view"
        | "staff.manage"
      app_role:
        | "administrator"
        | "manager"
        | "front_desk"
        | "housekeeping_supervisor"
        | "maintenance_staff"
        | "pos_operator"
        | "accountant"
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
      app_permission: [
        "rooms.view",
        "rooms.manage",
        "guests.view",
        "guests.manage",
        "bookings.view",
        "bookings.manage",
        "housekeeping.view",
        "housekeeping.manage",
        "maintenance.view",
        "maintenance.manage",
        "inventory.view",
        "inventory.manage",
        "pos.view",
        "pos.manage",
        "finance.view",
        "finance.manage",
        "reports.view",
        "reports.export",
        "settings.view",
        "settings.manage",
        "refunds.view",
        "refunds.approve",
        "staff.view",
        "staff.manage",
      ],
      app_role: [
        "administrator",
        "manager",
        "front_desk",
        "housekeeping_supervisor",
        "maintenance_staff",
        "pos_operator",
        "accountant",
      ],
    },
  },
} as const

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
          booking_id: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          reservation_request_id: string | null
          title: string
          type: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          reservation_request_id?: string | null
          title: string
          type: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          reservation_request_id?: string | null
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
          {
            foreignKeyName: "booking_notifications_reservation_request_id_fkey"
            columns: ["reservation_request_id"]
            isOneToOne: false
            referencedRelation: "reservation_requests"
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
          refund_request_id: string | null
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
          refund_request_id?: string | null
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
          refund_request_id?: string | null
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
          {
            foreignKeyName: "finance_transactions_refund_request_id_fkey"
            columns: ["refund_request_id"]
            isOneToOne: false
            referencedRelation: "refund_requests"
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
      guest_uploads: {
        Row: {
          file_name: string
          file_type: string | null
          file_url: string
          guest_id: string
          id: string
          uploaded_at: string
        }
        Insert: {
          file_name: string
          file_type?: string | null
          file_url: string
          guest_id: string
          id?: string
          uploaded_at?: string
        }
        Update: {
          file_name?: string
          file_type?: string | null
          file_url?: string
          guest_id?: string
          id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_uploads_guest_id_fkey"
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
          id_photo_url: string | null
          name: string
          phone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          id_number?: string | null
          id_photo_url?: string | null
          name: string
          phone: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          id_number?: string | null
          id_photo_url?: string | null
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
          brand: string
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
          brand: string
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
          brand?: string
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
      inventory_lots: {
        Row: {
          batch_code: string | null
          brand: string
          created_at: string
          expiry_date: string | null
          id: string
          inventory_item_id: string
          quantity: number
          unit_cost: number
          updated_at: string
        }
        Insert: {
          batch_code?: string | null
          brand: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          inventory_item_id: string
          quantity?: number
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          batch_code?: string | null
          brand?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          inventory_item_id?: string
          quantity?: number
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_lots_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          batch_code: string | null
          brand: string
          created_at: string
          direction: string
          expiry_date: string | null
          id: string
          inventory_item_id: string
          inventory_lot_id: string | null
          item_name: string
          notes: string | null
          quantity: number
          reference: string | null
          total_value: number
          transaction_date: string | null
          transaction_type: string
          unit: string
          unit_cost: number
        }
        Insert: {
          batch_code?: string | null
          brand: string
          created_at?: string
          direction: string
          expiry_date?: string | null
          id?: string
          inventory_item_id: string
          inventory_lot_id?: string | null
          item_name: string
          notes?: string | null
          quantity?: number
          reference?: string | null
          total_value?: number
          transaction_date?: string | null
          transaction_type: string
          unit: string
          unit_cost?: number
        }
        Update: {
          batch_code?: string | null
          brand?: string
          created_at?: string
          direction?: string
          expiry_date?: string | null
          id?: string
          inventory_item_id?: string
          inventory_lot_id?: string | null
          item_name?: string
          notes?: string | null
          quantity?: number
          reference?: string | null
          total_value?: number
          transaction_date?: string | null
          transaction_type?: string
          unit?: string
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_inventory_lot_id_fkey"
            columns: ["inventory_lot_id"]
            isOneToOne: false
            referencedRelation: "inventory_lots"
            referencedColumns: ["id"]
          },
        ]
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
          review_requests: boolean | null
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
          review_requests?: boolean | null
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
          review_requests?: boolean | null
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
          email: string | null
          full_name: string | null
          id: string
          password_reset_required: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          password_reset_required?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
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
          apply_settings: boolean
          check_in_time: string | null
          check_out_time: string | null
          city: string | null
          country: string | null
          created_at: string
          currency: string | null
          email: string | null
          id: string
          invoice_footer: string | null
          logo_url: string | null
          name: string
          phone: string | null
          tax_pin: string | null
          timezone: string | null
          updated_at: string
          vat_rate: number | null
          website: string | null
        }
        Insert: {
          address?: string | null
          apply_settings?: boolean
          check_in_time?: string | null
          check_out_time?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          invoice_footer?: string | null
          logo_url?: string | null
          name: string
          phone?: string | null
          tax_pin?: string | null
          timezone?: string | null
          updated_at?: string
          vat_rate?: number | null
          website?: string | null
        }
        Update: {
          address?: string | null
          apply_settings?: boolean
          check_in_time?: string | null
          check_out_time?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          invoice_footer?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          tax_pin?: string | null
          timezone?: string | null
          updated_at?: string
          vat_rate?: number | null
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
      reservation_requests: {
        Row: {
          created_at: string
          guest_email: string | null
          guest_name: string
          guest_phone: string
          id: string
          request_items: Json
          source: string | null
          special_requests: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          guest_email?: string | null
          guest_name: string
          guest_phone: string
          id?: string
          request_items?: Json
          source?: string | null
          special_requests?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          guest_email?: string | null
          guest_name?: string
          guest_phone?: string
          id?: string
          request_items?: Json
          source?: string | null
          special_requests?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      review_requests: {
        Row: {
          booking_id: string | null
          channel: string
          created_at: string
          guest_email: string | null
          guest_id: string | null
          guest_name: string
          guest_phone: string | null
          id: string
          sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          channel?: string
          created_at?: string
          guest_email?: string | null
          guest_id?: string | null
          guest_name: string
          guest_phone?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          channel?: string
          created_at?: string
          guest_email?: string | null
          guest_id?: string | null
          guest_name?: string
          guest_phone?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_requests_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string | null
          cleanliness_rating: number | null
          comfort_rating: number | null
          comment: string | null
          created_at: string
          guest_id: string | null
          guest_name: string
          guest_phone: string
          housekeeping_task_id: string | null
          id: string
          internal_notes: string | null
          is_approved: boolean | null
          maintenance_issue_id: string | null
          rating: number
          responded_at: string | null
          response: string | null
          room_number: string | null
          staff_rating: number | null
          updated_at: string
          value_rating: number | null
        }
        Insert: {
          booking_id?: string | null
          cleanliness_rating?: number | null
          comfort_rating?: number | null
          comment?: string | null
          created_at?: string
          guest_id?: string | null
          guest_name: string
          guest_phone: string
          housekeeping_task_id?: string | null
          id?: string
          internal_notes?: string | null
          is_approved?: boolean | null
          maintenance_issue_id?: string | null
          rating: number
          responded_at?: string | null
          response?: string | null
          room_number?: string | null
          staff_rating?: number | null
          updated_at?: string
          value_rating?: number | null
        }
        Update: {
          booking_id?: string | null
          cleanliness_rating?: number | null
          comfort_rating?: number | null
          comment?: string | null
          created_at?: string
          guest_id?: string | null
          guest_name?: string
          guest_phone?: string
          housekeeping_task_id?: string | null
          id?: string
          internal_notes?: string | null
          is_approved?: boolean | null
          maintenance_issue_id?: string | null
          rating?: number
          responded_at?: string | null
          response?: string | null
          room_number?: string | null
          staff_rating?: number | null
          updated_at?: string
          value_rating?: number | null
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
          {
            foreignKeyName: "reviews_housekeeping_task_id_fkey"
            columns: ["housekeeping_task_id"]
            isOneToOne: false
            referencedRelation: "housekeeping_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_maintenance_issue_id_fkey"
            columns: ["maintenance_issue_id"]
            isOneToOne: false
            referencedRelation: "maintenance_issues"
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
          address: string | null
          agreed_hours: number | null
          annual_leave_days: number | null
          avatar_url: string | null
          contract_end_date: string | null
          created_at: string
          department: string
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employment_type: string
          id: string
          joined_date: string
          name: string
          notes: string | null
          phone: string | null
          salary: number | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          agreed_hours?: number | null
          annual_leave_days?: number | null
          avatar_url?: string | null
          contract_end_date?: string | null
          created_at?: string
          department: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employment_type?: string
          id?: string
          joined_date?: string
          name: string
          notes?: string | null
          phone?: string | null
          salary?: number | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          agreed_hours?: number | null
          annual_leave_days?: number | null
          avatar_url?: string | null
          contract_end_date?: string | null
          created_at?: string
          department?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employment_type?: string
          id?: string
          joined_date?: string
          name?: string
          notes?: string | null
          phone?: string | null
          salary?: number | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      staff_leave_requests: {
        Row: {
          created_at: string
          end_date: string
          id: string
          leave_type: string | null
          reason: string | null
          staff_id: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          leave_type?: string | null
          reason?: string | null
          staff_id: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          leave_type?: string | null
          reason?: string | null
          staff_id?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_leave_requests_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_salaries: {
        Row: {
          base_salary: number
          bonuses: number
          created_at: string
          deductions: number
          id: string
          month: string
          net_salary: number
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          payment_status: string
          staff_id: string
          updated_at: string
        }
        Insert: {
          base_salary?: number
          bonuses?: number
          created_at?: string
          deductions?: number
          id?: string
          month: string
          net_salary?: number
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_status?: string
          staff_id: string
          updated_at?: string
        }
        Update: {
          base_salary?: number
          bonuses?: number
          created_at?: string
          deductions?: number
          id?: string
          month?: string
          net_salary?: number
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_status?: string
          staff_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_salaries_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
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
      staff_timesheets: {
        Row: {
          activity_types: string[] | null
          break_minutes: number | null
          created_at: string
          end_time: string
          id: string
          notes: string | null
          staff_id: string
          start_time: string
          status: string
          total_hours: number
          updated_at: string
          work_date: string
        }
        Insert: {
          activity_types?: string[] | null
          break_minutes?: number | null
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          staff_id: string
          start_time: string
          status?: string
          total_hours?: number
          updated_at?: string
          work_date: string
        }
        Update: {
          activity_types?: string[] | null
          break_minutes?: number | null
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          staff_id?: string
          start_time?: string
          status?: string
          total_hours?: number
          updated_at?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_timesheets_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      system_preferences: {
        Row: {
          apply_settings: boolean
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
          apply_settings?: boolean
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
          apply_settings?: boolean
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
      get_or_create_guest: {
        Args: {
          email_input: string
          id_number_input: string
          name_input: string
          phone_input: string
        }
        Returns: {
          id: string
          name: string
        }[]
      }
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
      lookup_bookings_by_phone: {
        Args: { phone_input: string }
        Returns: {
          booking_id: string
          check_in: string
          check_out: string
          created_at: string
          guest_id: string
          guest_name: string
          guests_count: number
          paid_amount: number
          room_number: string
          room_type: string
          special_requests: string
          status: string
          total_amount: number
        }[]
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
        | "housekeeping.create"
        | "maintenance.create"
        | "inventory.create"
        | "bookings.create"
        | "pos.create"
        | "refunds.create"
        | "finance.create"
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
        "housekeeping.create",
        "maintenance.create",
        "inventory.create",
        "bookings.create",
        "pos.create",
        "refunds.create",
        "finance.create",
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

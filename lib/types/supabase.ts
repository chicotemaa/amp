export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: number;
          name: string;
          location: string | null;
          type: string | null;
          status: string | null;
          progress: number | null;
          start_date: string | null;
          end_date: string | null;
          team_size: number | null;
          budget: number | null;
          image: string | null;
          client_id: number | null;
          on_track: boolean | null;
          description: string | null;
          client_status_summary: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          location?: string | null;
          type?: string | null;
          status?: string | null;
          progress?: number | null;
          start_date?: string | null;
          end_date?: string | null;
          team_size?: number | null;
          budget?: number | null;
          image?: string | null;
          client_id?: number | null;
          on_track?: boolean | null;
          description?: string | null;
          client_status_summary?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          location?: string | null;
          type?: string | null;
          status?: string | null;
          progress?: number | null;
          start_date?: string | null;
          end_date?: string | null;
          team_size?: number | null;
          budget?: number | null;
          image?: string | null;
          client_id?: number | null;
          on_track?: boolean | null;
          description?: string | null;
          client_status_summary?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["role_type"];
          full_name: string | null;
          employee_id: number | null;
          client_id: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role: Database["public"]["Enums"]["role_type"];
          full_name?: string | null;
          employee_id?: number | null;
          client_id?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["role_type"];
          full_name?: string | null;
          employee_id?: number | null;
          client_id?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          name: string;
          type: string;
          stage: string;
          version: string;
          file_url: string;
          mime_type: string;
          size_bytes: number;
          description: string | null;
          is_photo: boolean;
          project_id: number;
          is_client_visible: boolean;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: string;
          stage: string;
          version: string;
          file_url: string;
          mime_type: string;
          size_bytes: number;
          description?: string | null;
          is_photo: boolean;
          project_id: number;
          is_client_visible?: boolean;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: string;
          stage?: string;
          version?: string;
          file_url?: string;
          mime_type?: string;
          size_bytes?: number;
          description?: string | null;
          is_photo?: boolean;
          project_id?: number;
          is_client_visible?: boolean;
          uploaded_at?: string;
        };
        Relationships: [];
      };
      project_budgets: {
        Row: {
          id: string;
          project_id: number;
          version: number;
          label: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: number;
          version: number;
          label: string;
          description: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: number;
          version?: number;
          label?: string;
          description?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      project_budget_items: {
        Row: {
          id: string;
          budget_id: string;
          category: string;
          description: string;
          unit: string;
          qty_planned: number;
          price_unit_planned: number;
          qty_actual: number;
          price_unit_actual: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          budget_id: string;
          category: string;
          description: string;
          unit: string;
          qty_planned: number;
          price_unit_planned: number;
          qty_actual: number;
          price_unit_actual: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          budget_id?: string;
          category?: string;
          description?: string;
          unit?: string;
          qty_planned?: number;
          price_unit_planned?: number;
          qty_actual?: number;
          price_unit_actual?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: number;
          name: string;
          company: string;
          email: string;
          phone: string | null;
          last_interaction: string | null;
          status: string;
          notification_prefs: string[];
          avatar: string | null;
          created_at: string;
        };
        Insert: {
          id: number;
          name: string;
          company: string;
          email: string;
          phone?: string | null;
          last_interaction?: string | null;
          status: string;
          notification_prefs?: string[];
          avatar?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          company?: string;
          email?: string;
          phone?: string | null;
          last_interaction?: string | null;
          status?: string;
          notification_prefs?: string[];
          avatar?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      client_projects: {
        Row: {
          client_id: number;
          project_id: number;
        };
        Insert: {
          client_id: number;
          project_id: number;
        };
        Update: {
          client_id?: number;
          project_id?: number;
        };
        Relationships: [];
      };
      employees: {
        Row: {
          id: number;
          name: string;
          role: string;
          department: string;
          email: string;
          phone: string | null;
          status: string;
          avatar: string | null;
          hours_this_week: number;
          created_at: string;
        };
        Insert: {
          id: number;
          name: string;
          role: string;
          department: string;
          email: string;
          phone?: string | null;
          status: string;
          avatar?: string | null;
          hours_this_week?: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          role?: string;
          department?: string;
          email?: string;
          phone?: string | null;
          status?: string;
          avatar?: string | null;
          hours_this_week?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      employee_projects: {
        Row: {
          employee_id: number;
          project_id: number;
        };
        Insert: {
          employee_id: number;
          project_id: number;
        };
        Update: {
          employee_id?: number;
          project_id?: number;
        };
        Relationships: [];
      };
      project_members: {
        Row: {
          id: string;
          project_id: number;
          profile_id: string;
          assignment_role: string;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: number;
          profile_id: string;
          assignment_role: string;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: number;
          profile_id?: string;
          assignment_role?: string;
          is_primary?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          id: number;
          title: string;
          project_id: number;
          report_date: string;
          status: string;
          author_id: number;
          is_client_visible: boolean;
          created_at: string;
        };
        Insert: {
          id: number;
          title: string;
          project_id: number;
          report_date: string;
          status: string;
          author_id: number;
          is_client_visible?: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          title?: string;
          project_id?: number;
          report_date?: string;
          status?: string;
          author_id?: number;
          is_client_visible?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: number;
          type: string;
          description: string;
          amount: number;
          txn_date: string;
          category: string;
          project_id: number | null;
          project_name: string;
          created_at: string;
        };
        Insert: {
          id: number;
          type: string;
          description: string;
          amount: number;
          txn_date: string;
          category: string;
          project_id?: number | null;
          project_name: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          type?: string;
          description?: string;
          amount?: number;
          txn_date?: string;
          category?: string;
          project_id?: number | null;
          project_name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      project_phases: {
        Row: {
          id: string;
          project_id: number;
          name: string;
          phase_order: number;
          planned_progress: number;
          actual_progress: number;
          start_date: string | null;
          end_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: number;
          name: string;
          phase_order: number;
          planned_progress?: number;
          actual_progress?: number;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: number;
          name?: string;
          phase_order?: number;
          planned_progress?: number;
          actual_progress?: number;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      work_packages: {
        Row: {
          id: string;
          project_id: number;
          phase_id: string;
          name: string;
          budget_category: string;
          unit: string;
          planned_qty: number;
          executed_qty: number;
          weight: number;
          planned_unit_cost: number;
          planned_hours_per_unit: number;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: number;
          phase_id: string;
          name: string;
          budget_category?: string;
          unit?: string;
          planned_qty: number;
          executed_qty?: number;
          weight?: number;
          planned_unit_cost?: number;
          planned_hours_per_unit?: number;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: number;
          phase_id?: string;
          name?: string;
          budget_category?: string;
          unit?: string;
          planned_qty?: number;
          executed_qty?: number;
          weight?: number;
          planned_unit_cost?: number;
          planned_hours_per_unit?: number;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      milestones: {
        Row: {
          id: string;
          project_id: number;
          phase_id: string | null;
          name: string;
          due_date: string;
          completed_at: string | null;
          status: string;
          is_client_visible: boolean;
          validated_at: string | null;
          validated_by: number | null;
          field_completed_at: string | null;
          field_completed_by: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: number;
          phase_id?: string | null;
          name: string;
          due_date: string;
          completed_at?: string | null;
          status?: string;
          is_client_visible?: boolean;
          validated_at?: string | null;
          validated_by?: number | null;
          field_completed_at?: string | null;
          field_completed_by?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: number;
          phase_id?: string | null;
          name?: string;
          due_date?: string;
          completed_at?: string | null;
          status?: string;
          is_client_visible?: boolean;
          validated_at?: string | null;
          validated_by?: number | null;
          field_completed_at?: string | null;
          field_completed_by?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      progress_updates: {
        Row: {
          id: string;
          project_id: number;
          phase_id: string | null;
          work_package_id: string | null;
          report_date: string;
          progress_delta: number;
          executed_qty: number | null;
          note: string | null;
          reported_by: number | null;
          is_client_visible: boolean;
          validated_by: number | null;
          validated_at: string | null;
          validation_status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: number;
          phase_id?: string | null;
          work_package_id?: string | null;
          report_date: string;
          progress_delta?: number;
          executed_qty?: number | null;
          note?: string | null;
          reported_by?: number | null;
          is_client_visible?: boolean;
          validated_by?: number | null;
          validated_at?: string | null;
          validation_status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: number;
          phase_id?: string | null;
          work_package_id?: string | null;
          report_date?: string;
          progress_delta?: number;
          executed_qty?: number | null;
          note?: string | null;
          reported_by?: number | null;
          is_client_visible?: boolean;
          validated_by?: number | null;
          validated_at?: string | null;
          validation_status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      incidents: {
        Row: {
          id: string;
          project_id: number;
          phase_id: string | null;
          title: string;
          incident_type: string;
          severity: string;
          impact_days: number;
          impact_cost: number;
          owner_id: number | null;
          status: string;
          opened_at: string;
          resolved_at: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: number;
          phase_id?: string | null;
          title: string;
          incident_type: string;
          severity: string;
          impact_days?: number;
          impact_cost?: number;
          owner_id?: number | null;
          status?: string;
          opened_at?: string;
          resolved_at?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: number;
          phase_id?: string | null;
          title?: string;
          incident_type?: string;
          severity?: string;
          impact_days?: number;
          impact_cost?: number;
          owner_id?: number | null;
          status?: string;
          opened_at?: string;
          resolved_at?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      materials: {
        Row: {
          id: string;
          project_id: number;
          name: string;
          unit: string;
          planned_qty: number;
          current_stock: number;
          reorder_point: number;
          location: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: number;
          name: string;
          unit: string;
          planned_qty?: number;
          current_stock?: number;
          reorder_point?: number;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: number;
          name?: string;
          unit?: string;
          planned_qty?: number;
          current_stock?: number;
          reorder_point?: number;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      material_movements: {
        Row: {
          id: string;
          material_id: string;
          project_id: number;
          movement_type: string;
          quantity: number;
          note: string | null;
          created_by: number | null;
          movement_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          material_id: string;
          project_id: number;
          movement_type: string;
          quantity: number;
          note?: string | null;
          created_by?: number | null;
          movement_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          material_id?: string;
          project_id?: number;
          movement_type?: string;
          quantity?: number;
          note?: string | null;
          created_by?: number | null;
          movement_date?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      labor_entries: {
        Row: {
          id: string;
          project_id: number;
          phase_id: string | null;
          work_package_id: string | null;
          payment_batch_id: string | null;
          employee_id: number;
          work_date: string;
          hours_worked: number;
          hourly_rate: number;
          amount_paid: number;
          payment_status: string;
          notes: string | null;
          created_by: number | null;
          approved_by: number | null;
          approved_at: string | null;
          paid_by: number | null;
          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: number;
          phase_id?: string | null;
          work_package_id?: string | null;
          payment_batch_id?: string | null;
          employee_id: number;
          work_date: string;
          hours_worked?: number;
          hourly_rate?: number;
          amount_paid?: number;
          payment_status?: string;
          notes?: string | null;
          created_by?: number | null;
          approved_by?: number | null;
          approved_at?: string | null;
          paid_by?: number | null;
          paid_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: number;
          phase_id?: string | null;
          work_package_id?: string | null;
          payment_batch_id?: string | null;
          employee_id?: number;
          work_date?: string;
          hours_worked?: number;
          hourly_rate?: number;
          amount_paid?: number;
          payment_status?: string;
          notes?: string | null;
          created_by?: number | null;
          approved_by?: number | null;
          approved_at?: string | null;
          paid_by?: number | null;
          paid_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      labor_payment_batches: {
        Row: {
          id: string;
          project_id: number;
          batch_number: string;
          period_start: string;
          period_end: string;
          total_amount: number;
          status: string;
          notes: string | null;
          created_by: number | null;
          approved_by: number | null;
          approved_at: string | null;
          paid_by: number | null;
          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: number;
          batch_number: string;
          period_start: string;
          period_end: string;
          total_amount?: number;
          status?: string;
          notes?: string | null;
          created_by?: number | null;
          approved_by?: number | null;
          approved_at?: string | null;
          paid_by?: number | null;
          paid_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: number;
          batch_number?: string;
          period_start?: string;
          period_end?: string;
          total_amount?: number;
          status?: string;
          notes?: string | null;
          created_by?: number | null;
          approved_by?: number | null;
          approved_at?: string | null;
          paid_by?: number | null;
          paid_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      site_daily_logs: {
        Row: {
          id: string;
          project_id: number;
          phase_id: string | null;
          log_date: string;
          weather_condition: string;
          weather_impact: string;
          workforce_count: number;
          hours_worked: number;
          hours_lost: number;
          notes: string | null;
          created_by: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: number;
          phase_id?: string | null;
          log_date: string;
          weather_condition?: string;
          weather_impact?: string;
          workforce_count?: number;
          hours_worked?: number;
          hours_lost?: number;
          notes?: string | null;
          created_by?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: number;
          phase_id?: string | null;
          log_date?: string;
          weather_condition?: string;
          weather_impact?: string;
          workforce_count?: number;
          hours_worked?: number;
          hours_lost?: number;
          notes?: string | null;
          created_by?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      project_budget_control: {
        Row: {
          id: string;
          project_id: number;
          baseline_amount: number;
          current_amount: number;
          committed_amount: number;
          spent_amount: number;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: number;
          baseline_amount: number;
          current_amount: number;
          committed_amount?: number;
          spent_amount?: number;
          updated_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: number;
          baseline_amount?: number;
          current_amount?: number;
          committed_amount?: number;
          spent_amount?: number;
          updated_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      change_orders: {
        Row: {
          id: string;
          project_id: number;
          reason: string;
          amount_delta: number;
          days_delta: number;
          status: string;
          requested_by: number | null;
          approved_by: number | null;
          approved_at: string | null;
          operator_reviewed_at: string | null;
          client_comment: string | null;
          client_reviewed_at: string | null;
          client_visible: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: number;
          reason: string;
          amount_delta?: number;
          days_delta?: number;
          status?: string;
          requested_by?: number | null;
          approved_by?: number | null;
          approved_at?: string | null;
          operator_reviewed_at?: string | null;
          client_comment?: string | null;
          client_reviewed_at?: string | null;
          client_visible?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: number;
          reason?: string;
          amount_delta?: number;
          days_delta?: number;
          status?: string;
          requested_by?: number | null;
          approved_by?: number | null;
          approved_at?: string | null;
          operator_reviewed_at?: string | null;
          client_comment?: string | null;
          client_reviewed_at?: string | null;
          client_visible?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      impersonation_audit: {
        Row: {
          id: string;
          operator_user_id: string;
          viewed_role: Database["public"]["Enums"]["role_type"];
          reason: string | null;
          started_at: string;
          ended_at: string | null;
        };
        Insert: {
          id?: string;
          operator_user_id: string;
          viewed_role: Database["public"]["Enums"]["role_type"];
          reason?: string | null;
          started_at?: string;
          ended_at?: string | null;
        };
        Update: {
          id?: string;
          operator_user_id?: string;
          viewed_role?: Database["public"]["Enums"]["role_type"];
          reason?: string | null;
          started_at?: string;
          ended_at?: string | null;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          entity_type: string;
          entity_id: string;
          project_id: number | null;
          action: string;
          from_state: string | null;
          to_state: string | null;
          actor_profile_id: string;
          actor_role: Database["public"]["Enums"]["role_type"];
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          entity_type: string;
          entity_id: string;
          project_id?: number | null;
          action: string;
          from_state?: string | null;
          to_state?: string | null;
          actor_profile_id: string;
          actor_role: Database["public"]["Enums"]["role_type"];
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          entity_type?: string;
          entity_id?: string;
          project_id?: number | null;
          action?: string;
          from_state?: string | null;
          to_state?: string | null;
          actor_profile_id?: string;
          actor_role?: Database["public"]["Enums"]["role_type"];
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      suppliers: {
        Row: {
          id: number;
          name: string;
          contact_name: string | null;
          email: string | null;
          phone: string | null;
          category: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id: number;
          name: string;
          contact_name?: string | null;
          email?: string | null;
          phone?: string | null;
          category?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          contact_name?: string | null;
          email?: string | null;
          phone?: string | null;
          category?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      purchase_orders: {
        Row: {
          id: string;
          project_id: number;
          material_id: string | null;
          supplier_id: number;
          phase_id: string | null;
          work_package_id: string | null;
          category: string;
          description: string;
          unit: string;
          quantity: number;
          unit_cost: number;
          total_amount: number;
          order_date: string;
          expected_date: string | null;
          due_date: string | null;
          invoice_number: string | null;
          received_date: string | null;
          payment_date: string | null;
          status: string;
          notes: string | null;
          created_by: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: number;
          material_id?: string | null;
          supplier_id: number;
          phase_id?: string | null;
          work_package_id?: string | null;
          category: string;
          description: string;
          unit?: string;
          quantity?: number;
          unit_cost?: number;
          total_amount?: number;
          order_date?: string;
          expected_date?: string | null;
          due_date?: string | null;
          invoice_number?: string | null;
          received_date?: string | null;
          payment_date?: string | null;
          status?: string;
          notes?: string | null;
          created_by?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: number;
          material_id?: string | null;
          supplier_id?: number;
          phase_id?: string | null;
          work_package_id?: string | null;
          category?: string;
          description?: string;
          unit?: string;
          quantity?: number;
          unit_cost?: number;
          total_amount?: number;
          order_date?: string;
          expected_date?: string | null;
          due_date?: string | null;
          invoice_number?: string | null;
          received_date?: string | null;
          payment_date?: string | null;
          status?: string;
          notes?: string | null;
          created_by?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      purchase_order_payments: {
        Row: {
          id: string;
          purchase_order_id: string;
          project_id: number;
          amount: number;
          payment_date: string;
          reference: string | null;
          notes: string | null;
          created_by: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          purchase_order_id: string;
          project_id: number;
          amount: number;
          payment_date?: string;
          reference?: string | null;
          notes?: string | null;
          created_by?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          purchase_order_id?: string;
          project_id?: number;
          amount?: number;
          payment_date?: string;
          reference?: string | null;
          notes?: string | null;
          created_by?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      project_certificates: {
        Row: {
          id: string;
          project_id: number;
          phase_id: string | null;
          certificate_number: string;
          description: string;
          issue_date: string;
          due_date: string | null;
          amount: number;
          status: string;
          client_visible: boolean;
          notes: string | null;
          created_by: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: number;
          phase_id?: string | null;
          certificate_number: string;
          description: string;
          issue_date?: string;
          due_date?: string | null;
          amount: number;
          status?: string;
          client_visible?: boolean;
          notes?: string | null;
          created_by?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: number;
          phase_id?: string | null;
          certificate_number?: string;
          description?: string;
          issue_date?: string;
          due_date?: string | null;
          amount?: number;
          status?: string;
          client_visible?: boolean;
          notes?: string | null;
          created_by?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      project_certificate_collections: {
        Row: {
          id: string;
          certificate_id: string;
          project_id: number;
          amount: number;
          collection_date: string;
          reference: string | null;
          notes: string | null;
          created_by: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          certificate_id: string;
          project_id: number;
          amount: number;
          collection_date?: string;
          reference?: string | null;
          notes?: string | null;
          created_by?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          certificate_id?: string;
          project_id?: number;
          amount?: number;
          collection_date?: string;
          reference?: string | null;
          notes?: string | null;
          created_by?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      project_contracts: {
        Row: {
          id: string;
          project_id: number;
          contract_number: string;
          title: string;
          status: string;
          signed_date: string | null;
          start_date: string | null;
          end_date: string | null;
          original_amount: number;
          client_visible: boolean;
          notes: string | null;
          created_by: number | null;
          published_by: number | null;
          published_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: number;
          contract_number: string;
          title: string;
          status?: string;
          signed_date?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          original_amount: number;
          client_visible?: boolean;
          notes?: string | null;
          created_by?: number | null;
          published_by?: number | null;
          published_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: number;
          contract_number?: string;
          title?: string;
          status?: string;
          signed_date?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          original_amount?: number;
          client_visible?: boolean;
          notes?: string | null;
          created_by?: number | null;
          published_by?: number | null;
          published_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      project_contract_amendments: {
        Row: {
          id: string;
          contract_id: string;
          project_id: number;
          amendment_number: string;
          title: string;
          amendment_type: string;
          status: string;
          effective_date: string;
          amount_delta: number;
          days_delta: number;
          client_visible: boolean;
          description: string | null;
          created_by: number | null;
          submitted_by: number | null;
          submitted_at: string | null;
          approved_by: number | null;
          approved_at: string | null;
          published_by: number | null;
          published_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          contract_id: string;
          project_id: number;
          amendment_number: string;
          title: string;
          amendment_type?: string;
          status?: string;
          effective_date?: string;
          amount_delta?: number;
          days_delta?: number;
          client_visible?: boolean;
          description?: string | null;
          created_by?: number | null;
          submitted_by?: number | null;
          submitted_at?: string | null;
          approved_by?: number | null;
          approved_at?: string | null;
          published_by?: number | null;
          published_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          contract_id?: string;
          project_id?: number;
          amendment_number?: string;
          title?: string;
          amendment_type?: string;
          status?: string;
          effective_date?: string;
          amount_delta?: number;
          days_delta?: number;
          client_visible?: boolean;
          description?: string | null;
          created_by?: number | null;
          submitted_by?: number | null;
          submitted_at?: string | null;
          approved_by?: number | null;
          approved_at?: string | null;
          published_by?: number | null;
          published_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      project_agenda_events: {
        Row: {
          id: string;
          project_id: number;
          phase_id: string | null;
          title: string;
          description: string | null;
          category: string;
          starts_at: string;
          ends_at: string | null;
          is_all_day: boolean;
          status: string;
          priority: string;
          assigned_to: number | null;
          reminder_at: string | null;
          created_by: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: number;
          phase_id?: string | null;
          title: string;
          description?: string | null;
          category?: string;
          starts_at: string;
          ends_at?: string | null;
          is_all_day?: boolean;
          status?: string;
          priority?: string;
          assigned_to?: number | null;
          reminder_at?: string | null;
          created_by?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: number;
          phase_id?: string | null;
          title?: string;
          description?: string | null;
          category?: string;
          starts_at?: string;
          ends_at?: string | null;
          is_all_day?: boolean;
          status?: string;
          priority?: string;
          assigned_to?: number | null;
          reminder_at?: string | null;
          created_by?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_notification_reads: {
        Row: {
          id: string;
          user_id: string;
          notification_key: string;
          read_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          notification_key: string;
          read_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          notification_key?: string;
          read_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      user_notification_preferences: {
        Row: {
          id: string;
          user_id: string;
          email_enabled: boolean;
          email_for_reminder_due: boolean;
          email_for_reminder_upcoming: boolean;
          email_for_due_today: boolean;
          email_for_overdue: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email_enabled?: boolean;
          email_for_reminder_due?: boolean;
          email_for_reminder_upcoming?: boolean;
          email_for_due_today?: boolean;
          email_for_overdue?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email_enabled?: boolean;
          email_for_reminder_due?: boolean;
          email_for_reminder_upcoming?: boolean;
          email_for_due_today?: boolean;
          email_for_overdue?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      agenda_notification_deliveries: {
        Row: {
          id: string;
          user_id: string;
          notification_key: string;
          channel: string;
          recipient: string;
          subject: string;
          status: string;
          sent_at: string | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          notification_key: string;
          channel: string;
          recipient: string;
          subject: string;
          status?: string;
          sent_at?: string | null;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          notification_key?: string;
          channel?: string;
          recipient?: string;
          subject?: string;
          status?: string;
          sent_at?: string | null;
          error_message?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      monthly_cashflow: {
        Row: {
          month_key: string;
          ingresos: number;
          egresos: number;
        };
        Insert: {
          month_key: string;
          ingresos?: number;
          egresos?: number;
        };
        Update: {
          month_key?: string;
          ingresos?: number;
          egresos?: number;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      role_type: "operator" | "pm" | "inspector" | "client";
    };
    CompositeTypes: Record<string, never>;
  };
}

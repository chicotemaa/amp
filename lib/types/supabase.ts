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
          created_at?: string;
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
      reports: {
        Row: {
          id: number;
          title: string;
          project_id: number;
          report_date: string;
          status: string;
          author_id: number;
          created_at: string;
        };
        Insert: {
          id: number;
          title: string;
          project_id: number;
          report_date: string;
          status: string;
          author_id: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          title?: string;
          project_id?: number;
          report_date?: string;
          status?: string;
          author_id?: number;
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
      milestones: {
        Row: {
          id: string;
          project_id: number;
          phase_id: string | null;
          name: string;
          due_date: string;
          completed_at: string | null;
          status: string;
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
          created_at?: string;
        };
        Relationships: [];
      };
      progress_updates: {
        Row: {
          id: string;
          project_id: number;
          phase_id: string | null;
          report_date: string;
          progress_delta: number;
          note: string | null;
          reported_by: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: number;
          phase_id?: string | null;
          report_date: string;
          progress_delta?: number;
          note?: string | null;
          reported_by?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: number;
          phase_id?: string | null;
          report_date?: string;
          progress_delta?: number;
          note?: string | null;
          reported_by?: number | null;
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
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

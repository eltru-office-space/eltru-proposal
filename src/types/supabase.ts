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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agent_feedback: {
        Row: {
          chat_message_id: string | null
          correction_text: string | null
          created_at: string
          id: string
          project_id: string
          promoted_to_rule: boolean
          rating: string
          user_id: string
        }
        Insert: {
          chat_message_id?: string | null
          correction_text?: string | null
          created_at?: string
          id?: string
          project_id: string
          promoted_to_rule?: boolean
          rating: string
          user_id: string
        }
        Update: {
          chat_message_id?: string | null
          correction_text?: string | null
          created_at?: string
          id?: string
          project_id?: string
          promoted_to_rule?: boolean
          rating?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_agent_feedback_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: Json
          content_type: string
          created_at: string
          id: string
          is_read: boolean
          project_id: string
          role: string
        }
        Insert: {
          content: Json
          content_type: string
          created_at?: string
          id?: string
          is_read?: boolean
          project_id: string
          role: string
        }
        Update: {
          content?: Json
          content_type?: string
          created_at?: string
          id?: string
          is_read?: boolean
          project_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      client_dna: {
        Row: {
          budget_range: string | null
          client_id: string
          id: string
          notes: string | null
          preferred_brands: string[] | null
          preferred_colors: string[] | null
          style_preference: string | null
          updated_at: string
        }
        Insert: {
          budget_range?: string | null
          client_id: string
          id?: string
          notes?: string | null
          preferred_brands?: string[] | null
          preferred_colors?: string[] | null
          style_preference?: string | null
          updated_at?: string
        }
        Update: {
          budget_range?: string | null
          client_id?: string
          id?: string
          notes?: string | null
          preferred_brands?: string[] | null
          preferred_colors?: string[] | null
          style_preference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_dna_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          company_name: string
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          notes: string | null
          phone: string | null
          salesperson_id: string
        }
        Insert: {
          address?: string | null
          company_name: string
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          salesperson_id: string
        }
        Update: {
          address?: string | null
          company_name?: string
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          salesperson_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      global_rules: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          rule_text: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          rule_text: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          rule_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "global_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      kit_cache: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          display_price: number | null
          hero_image_url: string | null
          id: string
          last_synced_at: string | null
          name: string
          odoo_bom_id: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_price?: number | null
          hero_image_url?: string | null
          id?: string
          last_synced_at?: string | null
          name: string
          odoo_bom_id: number
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_price?: number | null
          hero_image_url?: string | null
          id?: string
          last_synced_at?: string | null
          name?: string
          odoo_bom_id?: number
        }
        Relationships: []
      }
      kit_components_cache: {
        Row: {
          id: string
          is_optional: boolean
          kit_cache_id: string
          notes: string | null
          product_cache_id: string
          quantity: number
        }
        Insert: {
          id?: string
          is_optional?: boolean
          kit_cache_id: string
          notes?: string | null
          product_cache_id: string
          quantity?: number
        }
        Update: {
          id?: string
          is_optional?: boolean
          kit_cache_id?: string
          notes?: string | null
          product_cache_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "kit_components_cache_kit_cache_id_fkey"
            columns: ["kit_cache_id"]
            isOneToOne: false
            referencedRelation: "kit_cache"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kit_components_cache_product_cache_id_fkey"
            columns: ["product_cache_id"]
            isOneToOne: false
            referencedRelation: "product_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      odoo_sync_log: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          products_added: number | null
          products_flagged: number | null
          products_updated: number | null
          started_at: string
          status: string
          sync_type: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          products_added?: number | null
          products_flagged?: number | null
          products_updated?: number | null
          started_at?: string
          status: string
          sync_type: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          products_added?: number | null
          products_flagged?: number | null
          products_updated?: number | null
          started_at?: string
          status?: string
          sync_type?: string
        }
        Relationships: []
      }
      option_sets: {
        Row: {
          id: string
          label: string
          proposal_section_id: string
          sort_order: number
          subtotal: number | null
        }
        Insert: {
          id?: string
          label: string
          proposal_section_id: string
          sort_order?: number
          subtotal?: number | null
        }
        Update: {
          id?: string
          label?: string
          proposal_section_id?: string
          sort_order?: number
          subtotal?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "option_sets_proposal_section_id_fkey"
            columns: ["proposal_section_id"]
            isOneToOne: false
            referencedRelation: "proposal_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      product_aliases: {
        Row: {
          alias_name: string
          created_at: string
          created_by: string | null
          id: string
          product_cache_id: string
        }
        Insert: {
          alias_name: string
          created_at?: string
          created_by?: string | null
          id?: string
          product_cache_id: string
        }
        Update: {
          alias_name?: string
          created_at?: string
          created_by?: string | null
          id?: string
          product_cache_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_aliases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_aliases_product_cache_id_fkey"
            columns: ["product_cache_id"]
            isOneToOne: false
            referencedRelation: "product_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      product_cache: {
        Row: {
          base_price: number | null
          category: string | null
          created_at: string
          currency: string
          description: string | null
          dimensions_d: number | null
          dimensions_h: number | null
          dimensions_w: number | null
          id: string
          is_available: boolean
          last_synced_at: string | null
          name: string
          odoo_id: number
          odoo_internal_ref: string | null
          source: string
        }
        Insert: {
          base_price?: number | null
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          dimensions_d?: number | null
          dimensions_h?: number | null
          dimensions_w?: number | null
          id?: string
          is_available?: boolean
          last_synced_at?: string | null
          name: string
          odoo_id: number
          odoo_internal_ref?: string | null
          source: string
        }
        Update: {
          base_price?: number | null
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          dimensions_d?: number | null
          dimensions_h?: number | null
          dimensions_w?: number | null
          id?: string
          is_available?: boolean
          last_synced_at?: string | null
          name?: string
          odoo_id?: number
          odoo_internal_ref?: string | null
          source?: string
        }
        Relationships: []
      }
      product_images_cache: {
        Row: {
          color_name: string | null
          created_at: string
          id: string
          product_cache_id: string
          sort_order: number
          type: string
          url: string
        }
        Insert: {
          color_name?: string | null
          created_at?: string
          id?: string
          product_cache_id: string
          sort_order?: number
          type: string
          url: string
        }
        Update: {
          color_name?: string | null
          created_at?: string
          id?: string
          product_cache_id?: string
          sort_order?: number
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_cache_product_cache_id_fkey"
            columns: ["product_cache_id"]
            isOneToOne: false
            referencedRelation: "product_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      product_tags: {
        Row: {
          id: string
          product_cache_id: string
          tag: string
        }
        Insert: {
          id?: string
          product_cache_id: string
          tag: string
        }
        Update: {
          id?: string
          product_cache_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_tags_product_cache_id_fkey"
            columns: ["product_cache_id"]
            isOneToOne: false
            referencedRelation: "product_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      project_files: {
        Row: {
          file_name: string
          file_type: string
          file_url: string
          id: string
          project_id: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          file_name: string
          file_type: string
          file_url: string
          id?: string
          project_id: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          file_name?: string
          file_type?: string
          file_url?: string
          id?: string
          project_id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      project_rules: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          project_id: string
          rule_text: string
          source: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          project_id: string
          rule_text: string
          source?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          project_id?: string
          rule_text?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_project_rules_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_id: string
          created_at: string
          id: string
          name: string
          requirements_summary: string | null
          salesperson_id: string
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          name: string
          requirements_summary?: string | null
          salesperson_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          name?: string
          requirements_summary?: string | null
          salesperson_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_line_items: {
        Row: {
          color_selected: string | null
          custom_image_url: string | null
          hero_image_url: string | null
          id: string
          is_included: boolean
          is_optional: boolean
          kit_cache_id: string | null
          layout_slot: string
          notes: string | null
          odoo_product_id: number | null
          option_set_id: string
          original_catalog_price: number | null
          per_unit_price: number
          product_cache_id: string | null
          quantity: number
          sort_order: number
          swatch_image_urls: Json | null
          total_price: number
          unit_count: number
        }
        Insert: {
          color_selected?: string | null
          custom_image_url?: string | null
          hero_image_url?: string | null
          id?: string
          is_included?: boolean
          is_optional?: boolean
          kit_cache_id?: string | null
          layout_slot: string
          notes?: string | null
          odoo_product_id?: number | null
          option_set_id: string
          original_catalog_price?: number | null
          per_unit_price?: number
          product_cache_id?: string | null
          quantity?: number
          sort_order?: number
          swatch_image_urls?: Json | null
          total_price?: number
          unit_count?: number
        }
        Update: {
          color_selected?: string | null
          custom_image_url?: string | null
          hero_image_url?: string | null
          id?: string
          is_included?: boolean
          is_optional?: boolean
          kit_cache_id?: string | null
          layout_slot?: string
          notes?: string | null
          odoo_product_id?: number | null
          option_set_id?: string
          original_catalog_price?: number | null
          per_unit_price?: number
          product_cache_id?: string | null
          quantity?: number
          sort_order?: number
          swatch_image_urls?: Json | null
          total_price?: number
          unit_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposal_line_items_kit_cache_id_fkey"
            columns: ["kit_cache_id"]
            isOneToOne: false
            referencedRelation: "kit_cache"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_line_items_option_set_id_fkey"
            columns: ["option_set_id"]
            isOneToOne: false
            referencedRelation: "option_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_line_items_product_cache_id_fkey"
            columns: ["product_cache_id"]
            isOneToOne: false
            referencedRelation: "product_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_revision_notes: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          note_text: string
          proposal_id: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          note_text: string
          proposal_id: string
          version: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          note_text?: string
          proposal_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposal_revision_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_revision_notes_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_sections: {
        Row: {
          id: string
          mode: string | null
          proposal_id: string
          room_count: number | null
          sort_order: number
          title: string | null
          type: string
          unit_label: string | null
        }
        Insert: {
          id?: string
          mode?: string | null
          proposal_id: string
          room_count?: number | null
          sort_order?: number
          title?: string | null
          type: string
          unit_label?: string | null
        }
        Update: {
          id?: string
          mode?: string | null
          proposal_id?: string
          room_count?: number | null
          sort_order?: number
          title?: string | null
          type?: string
          unit_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_sections_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_snapshots: {
        Row: {
          created_at: string
          email_draft: string | null
          id: string
          pdf_url: string | null
          proposal_id: string
          snapshot_data: Json
          version: number
        }
        Insert: {
          created_at?: string
          email_draft?: string | null
          id?: string
          pdf_url?: string | null
          proposal_id: string
          snapshot_data: Json
          version: number
        }
        Update: {
          created_at?: string
          email_draft?: string | null
          id?: string
          pdf_url?: string | null
          proposal_id?: string
          snapshot_data?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposal_snapshots_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_variants: {
        Row: {
          created_at: string
          id: string
          label: string
          project_id: string
          proposal_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          project_id: string
          proposal_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          project_id?: string
          proposal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_variants_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_variants_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          cover_subtitle: string | null
          cover_title: string | null
          created_at: string
          created_by: string | null
          id: string
          mode: string
          notes_to_client: string | null
          project_id: string
          revision_note: string | null
          status: string
          template_style: string
          updated_at: string
          version: number
        }
        Insert: {
          cover_subtitle?: string | null
          cover_title?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          mode: string
          notes_to_client?: string | null
          project_id: string
          revision_note?: string | null
          status?: string
          template_style?: string
          updated_at?: string
          version?: number
        }
        Update: {
          cover_subtitle?: string | null
          cover_title?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          mode?: string
          notes_to_client?: string | null
          project_id?: string
          revision_note?: string | null
          status?: string
          template_style?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      service_line_items: {
        Row: {
          description: string
          id: string
          is_taxable: boolean
          proposal_section_id: string
          quantity: number
          sort_order: number
          total_price: number
          unit_price: number
        }
        Insert: {
          description: string
          id?: string
          is_taxable?: boolean
          proposal_section_id: string
          quantity?: number
          sort_order?: number
          total_price?: number
          unit_price?: number
        }
        Update: {
          description?: string
          id?: string
          is_taxable?: boolean
          proposal_section_id?: string
          quantity?: number
          sort_order?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_line_items_proposal_section_id_fkey"
            columns: ["proposal_section_id"]
            isOneToOne: false
            referencedRelation: "proposal_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      user_rules: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          rule_text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          rule_text: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          rule_text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_rules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          role: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          is_active?: boolean
          role?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_role: { Args: never; Returns: string }
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

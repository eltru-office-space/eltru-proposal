export interface User {
  id: string
  full_name: string
  email: string
  role: 'admin' | 'salesperson'
  is_active: boolean
  created_at: string
}

export interface Client {
  id: string
  salesperson_id: string
  company_name: string
  contact_name: string
  email: string
  phone: string
  address: string
  notes: string
  created_at: string
}

export interface ClientDNA {
  id: string
  client_id: string
  style_preference: string
  budget_range: string
  preferred_colors: string[]
  preferred_brands: string[]
  notes: string
  updated_at: string
}

export interface Project {
  id: string
  client_id: string
  salesperson_id: string
  name: string
  status: 'active' | 'proposal_sent' | 'won' | 'lost'
  requirements_summary: string
  created_at: string
  updated_at: string
}

export interface ProjectFile {
  id: string
  project_id: string
  file_name: string
  file_url: string
  file_type: 'floorplan' | 'reference' | 'other'
  uploaded_by: string
  uploaded_at: string
}

export interface ProductCache {
  id: string
  odoo_id: number
  name: string
  odoo_internal_ref: string
  source: 'preowned' | 'officestar' | 'n9ine'
  category: string
  description: string
  dimensions_w: number
  dimensions_d: number
  dimensions_h: number
  base_price: number
  currency: string
  is_available: boolean
  last_synced_at: string
  created_at: string
}

export interface ProductImage {
  id: string
  product_cache_id: string
  url: string
  type: 'hero' | 'swatch' | 'detail'
  color_name: string
  sort_order: number
}

export interface KitCache {
  id: string
  odoo_bom_id: number
  name: string
  description: string
  category: string
  hero_image_url: string
  display_price: number
  last_synced_at: string
}

export interface KitComponent {
  id: string
  kit_cache_id: string
  product_cache_id: string
  quantity: number
  is_optional: boolean
  notes: string
}

export interface Proposal {
  id: string
  project_id: string
  version: number
  status: 'draft' | 'review' | 'approved' | 'sent'
  mode: 'room_based' | 'category_based' | 'hybrid'
  cover_title: string
  cover_subtitle: string
  notes_to_client: string
  revision_note: string
  template_style: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface ProposalSection {
  id: string
  proposal_id: string
  type: 'cover' | 'room' | 'category' | 'services' | 'summary' | 'divider'
  title: string
  mode: string
  room_count: number
  unit_label: string
  sort_order: number
}

export interface OptionSet {
  id: string
  proposal_section_id: string
  label: string
  sort_order: number
  subtotal: number
}

export interface ProposalLineItem {
  id: string
  option_set_id: string
  product_cache_id: string | null
  kit_cache_id: string | null
  odoo_product_id: number | null
  quantity: number
  per_unit_price: number
  unit_count: number
  total_price: number
  original_catalog_price: number
  color_selected: string
  hero_image_url: string
  swatch_image_urls: string[]
  custom_image_url: string | null
  layout_slot: string
  is_optional: boolean
  is_included: boolean
  notes: string
  sort_order: number
}

export interface ChatMessage {
  id: string
  project_id: string
  role: 'user' | 'assistant'
  content_type:
    | 'text'
    | 'product_picker'
    | 'kit_picker'
    | 'swatch_picker'
    | 'confirmation'
    | 'proposal_plan'
    | 'review_summary'
    | 'price_edit_confirm'
    | 'substitution_picker'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any
  is_read: boolean
  created_at: string
}

export interface GlobalRule {
  id: string
  rule_text: string
  created_by: string
  is_active: boolean
  created_at: string
}

export interface UserRule {
  id: string
  user_id: string
  rule_text: string
  is_active: boolean
  created_at: string
}

export interface ProjectRule {
  id: string
  project_id: string
  rule_text: string
  source: string
  is_active: boolean
  created_at: string
}

export interface AgentFeedback {
  id: string
  project_id: string
  user_id: string
  chat_message_id: string
  rating: 'good' | 'bad'
  correction_text: string
  promoted_to_rule: boolean
  created_at: string
}

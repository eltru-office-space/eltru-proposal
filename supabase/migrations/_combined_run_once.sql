-- ============================================================
-- Migration 20240001: Users table + auth trigger
-- ============================================================

CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'salesperson'
    CHECK (role IN ('admin', 'salesperson')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'salesperson')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- ============================================================
-- Migration 20240002: Product catalog tables
-- ============================================================

CREATE TABLE public.product_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  odoo_id integer NOT NULL UNIQUE,
  name text NOT NULL,
  odoo_internal_ref text,
  source text NOT NULL CHECK (source IN ('preowned', 'officestar', 'n9ine')),
  category text,
  description text,
  dimensions_w numeric,
  dimensions_d numeric,
  dimensions_h numeric,
  base_price numeric,
  currency text NOT NULL DEFAULT 'USD',
  is_available boolean NOT NULL DEFAULT true,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.product_images_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_cache_id uuid NOT NULL REFERENCES public.product_cache(id)
    ON DELETE CASCADE,
  url text NOT NULL,
  type text NOT NULL CHECK (type IN ('hero', 'swatch', 'detail')),
  color_name text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.product_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_cache_id uuid NOT NULL REFERENCES public.product_cache(id)
    ON DELETE CASCADE,
  alias_name text NOT NULL,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.product_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_cache_id uuid NOT NULL REFERENCES public.product_cache(id)
    ON DELETE CASCADE,
  tag text NOT NULL
);

CREATE TABLE public.kit_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  odoo_bom_id integer NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  category text,
  hero_image_url text,
  display_price numeric,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.kit_components_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_cache_id uuid NOT NULL REFERENCES public.kit_cache(id)
    ON DELETE CASCADE,
  product_cache_id uuid NOT NULL REFERENCES public.product_cache(id)
    ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  is_optional boolean NOT NULL DEFAULT false,
  notes text
);

CREATE TABLE public.odoo_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type text NOT NULL CHECK (sync_type IN ('full', 'incremental')),
  status text NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  products_updated integer DEFAULT 0,
  products_added integer DEFAULT 0,
  products_flagged integer DEFAULT 0,
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
-- ============================================================
-- Migration 20240003: Agent memory / rules / feedback
-- ============================================================

CREATE TABLE public.global_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_text text NOT NULL,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rule_text text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- project_rules: project FK added in migration 4 after projects table exists
CREATE TABLE public.project_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  rule_text text NOT NULL,
  source text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'promoted_from_feedback')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- agent_feedback: project FK added in migration 4
CREATE TABLE public.agent_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  chat_message_id uuid,
  rating text NOT NULL CHECK (rating IN ('good', 'bad')),
  correction_text text,
  promoted_to_rule boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- ============================================================
-- Migration 20240004: Clients, client DNA, projects, project files
-- ============================================================

CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salesperson_id uuid NOT NULL REFERENCES public.users(id)
    ON DELETE CASCADE,
  company_name text NOT NULL,
  contact_name text,
  email text,
  phone text,
  address text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.client_dna (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL UNIQUE REFERENCES public.clients(id)
    ON DELETE CASCADE,
  style_preference text CHECK (
    style_preference IN ('modern', 'traditional', 'industrial', 'mixed')
  ),
  budget_range text CHECK (
    budget_range IN ('budget', 'mid', 'premium')
  ),
  preferred_colors text[] DEFAULT '{}',
  preferred_brands text[] DEFAULT '{}',
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id)
    ON DELETE CASCADE,
  salesperson_id uuid NOT NULL REFERENCES public.users(id)
    ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'proposal_sent', 'won', 'lost')
  ),
  requirements_summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.project_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id)
    ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL CHECK (
    file_type IN ('floorplan', 'reference', 'other')
  ),
  uploaded_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

-- Add deferred FK constraints to tables created in migration 3
ALTER TABLE public.project_rules
  ADD CONSTRAINT fk_project_rules_project
  FOREIGN KEY (project_id) REFERENCES public.projects(id)
  ON DELETE CASCADE;

ALTER TABLE public.agent_feedback
  ADD CONSTRAINT fk_agent_feedback_project
  FOREIGN KEY (project_id) REFERENCES public.projects(id)
  ON DELETE CASCADE;

-- Shared updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
-- ============================================================
-- Migration 20240005: Chat messages
-- ============================================================

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id)
    ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content_type text NOT NULL CHECK (content_type IN (
    'text',
    'product_picker',
    'kit_picker',
    'swatch_picker',
    'confirmation',
    'proposal_plan',
    'review_summary',
    'price_edit_confirm',
    'substitution_picker'
  )),
  content jsonb NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- ============================================================
-- Migration 20240006: Proposals and all child tables
-- ============================================================

CREATE TABLE public.proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id)
    ON DELETE CASCADE,
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'review', 'approved', 'sent')
  ),
  mode text NOT NULL CHECK (
    mode IN ('room_based', 'category_based', 'hybrid')
  ),
  cover_title text,
  cover_subtitle text,
  notes_to_client text,
  revision_note text,
  template_style text NOT NULL DEFAULT 'standard' CHECK (
    template_style IN ('standard', 'premium', 'minimal')
  ),
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER proposals_updated_at
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.proposal_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id)
    ON DELETE CASCADE,
  proposal_id uuid NOT NULL REFERENCES public.proposals(id)
    ON DELETE CASCADE,
  label text NOT NULL CHECK (
    label IN ('budget_version', 'premium_version', 'phase_1', 'phase_2')
  ),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.proposal_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.proposals(id)
    ON DELETE CASCADE,
  type text NOT NULL CHECK (
    type IN ('cover', 'room', 'category', 'services', 'summary', 'divider')
  ),
  title text,
  mode text CHECK (mode IN ('room_based', 'category_based')),
  room_count integer,
  unit_label text,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE public.option_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_section_id uuid NOT NULL REFERENCES public.proposal_sections(id)
    ON DELETE CASCADE,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  subtotal numeric DEFAULT 0
);

CREATE TABLE public.proposal_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  option_set_id uuid NOT NULL REFERENCES public.option_sets(id)
    ON DELETE CASCADE,
  product_cache_id uuid REFERENCES public.product_cache(id)
    ON DELETE SET NULL,
  kit_cache_id uuid REFERENCES public.kit_cache(id)
    ON DELETE SET NULL,
  odoo_product_id integer,
  quantity integer NOT NULL DEFAULT 1,
  per_unit_price numeric NOT NULL DEFAULT 0,
  unit_count integer NOT NULL DEFAULT 1,
  total_price numeric NOT NULL DEFAULT 0,
  original_catalog_price numeric,
  color_selected text,
  hero_image_url text,
  swatch_image_urls jsonb DEFAULT '[]',
  custom_image_url text,
  layout_slot text NOT NULL CHECK (layout_slot IN (
    'single_hero',
    'hero_swatch',
    'two_col',
    'option_comparison',
    'accessory_grid',
    'services',
    'summary'
  )),
  is_optional boolean NOT NULL DEFAULT false,
  is_included boolean NOT NULL DEFAULT true,
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  CONSTRAINT must_have_product_or_kit CHECK (
    product_cache_id IS NOT NULL OR kit_cache_id IS NOT NULL
  )
);

CREATE TABLE public.proposal_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.proposals(id)
    ON DELETE CASCADE,
  version integer NOT NULL,
  snapshot_data jsonb NOT NULL,
  pdf_url text,
  email_draft text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.proposal_revision_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.proposals(id)
    ON DELETE CASCADE,
  version integer NOT NULL,
  note_text text NOT NULL,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- ============================================================
-- Migration 20240007: Service line items and notifications
-- ============================================================

CREATE TABLE public.service_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_section_id uuid NOT NULL REFERENCES public.proposal_sections(id)
    ON DELETE CASCADE,
  description text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  total_price numeric NOT NULL DEFAULT 0,
  is_taxable boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'proposal_approved',
    'proposal_sent',
    'sync_complete',
    'sync_failed'
  )),
  message text NOT NULL,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- ============================================================
-- Migration 20240008: Row Level Security policies
-- ============================================================

-- Enable RLS on every table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kit_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kit_components_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.odoo_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_dna ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.option_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_revision_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ---- USERS ----
CREATE POLICY "users_read_own" ON public.users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "users_admin_read_all" ON public.users
  FOR SELECT USING (public.current_user_role() = 'admin');

CREATE POLICY "users_admin_update" ON public.users
  FOR UPDATE USING (public.current_user_role() = 'admin');

-- ---- PRODUCT CATALOG (all authenticated users can read) ----
CREATE POLICY "product_cache_read" ON public.product_cache
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "product_cache_admin_write" ON public.product_cache
  FOR ALL USING (public.current_user_role() = 'admin');

CREATE POLICY "product_images_read" ON public.product_images_cache
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "product_images_admin_write" ON public.product_images_cache
  FOR ALL USING (public.current_user_role() = 'admin');

CREATE POLICY "product_aliases_read" ON public.product_aliases
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "product_aliases_admin_write" ON public.product_aliases
  FOR ALL USING (public.current_user_role() = 'admin');

CREATE POLICY "product_tags_read" ON public.product_tags
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "product_tags_admin_write" ON public.product_tags
  FOR ALL USING (public.current_user_role() = 'admin');

CREATE POLICY "kit_cache_read" ON public.kit_cache
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "kit_cache_admin_write" ON public.kit_cache
  FOR ALL USING (public.current_user_role() = 'admin');

CREATE POLICY "kit_components_read" ON public.kit_components_cache
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "kit_components_admin_write" ON public.kit_components_cache
  FOR ALL USING (public.current_user_role() = 'admin');

CREATE POLICY "sync_log_admin_only" ON public.odoo_sync_log
  FOR ALL USING (public.current_user_role() = 'admin');

-- ---- GLOBAL RULES ----
CREATE POLICY "global_rules_read" ON public.global_rules
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "global_rules_admin_write" ON public.global_rules
  FOR ALL USING (public.current_user_role() = 'admin');

-- ---- USER RULES ----
CREATE POLICY "user_rules_own" ON public.user_rules
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "user_rules_admin_read" ON public.user_rules
  FOR SELECT USING (public.current_user_role() = 'admin');

-- ---- PROJECT RULES ----
CREATE POLICY "project_rules_own" ON public.project_rules
  FOR ALL USING (
    project_id IN (
      SELECT id FROM public.projects WHERE salesperson_id = auth.uid()
    )
  );

CREATE POLICY "project_rules_admin" ON public.project_rules
  FOR ALL USING (public.current_user_role() = 'admin');

-- ---- AGENT FEEDBACK ----
CREATE POLICY "agent_feedback_own" ON public.agent_feedback
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "agent_feedback_admin" ON public.agent_feedback
  FOR ALL USING (public.current_user_role() = 'admin');

-- ---- CLIENTS ----
CREATE POLICY "clients_own" ON public.clients
  FOR ALL USING (salesperson_id = auth.uid());

CREATE POLICY "clients_admin" ON public.clients
  FOR SELECT USING (public.current_user_role() = 'admin');

-- ---- CLIENT DNA ----
CREATE POLICY "client_dna_own" ON public.client_dna
  FOR ALL USING (
    client_id IN (
      SELECT id FROM public.clients WHERE salesperson_id = auth.uid()
    )
  );

CREATE POLICY "client_dna_admin" ON public.client_dna
  FOR SELECT USING (public.current_user_role() = 'admin');

-- ---- PROJECTS ----
CREATE POLICY "projects_own" ON public.projects
  FOR ALL USING (salesperson_id = auth.uid());

CREATE POLICY "projects_admin" ON public.projects
  FOR SELECT USING (public.current_user_role() = 'admin');

-- ---- PROJECT FILES ----
CREATE POLICY "project_files_own" ON public.project_files
  FOR ALL USING (
    project_id IN (
      SELECT id FROM public.projects WHERE salesperson_id = auth.uid()
    )
  );

CREATE POLICY "project_files_admin" ON public.project_files
  FOR SELECT USING (public.current_user_role() = 'admin');

-- ---- CHAT MESSAGES ----
CREATE POLICY "chat_messages_own" ON public.chat_messages
  FOR ALL USING (
    project_id IN (
      SELECT id FROM public.projects WHERE salesperson_id = auth.uid()
    )
  );

CREATE POLICY "chat_messages_admin" ON public.chat_messages
  FOR SELECT USING (public.current_user_role() = 'admin');

-- ---- PROPOSALS ----
CREATE POLICY "proposals_own" ON public.proposals
  FOR ALL USING (
    project_id IN (
      SELECT id FROM public.projects WHERE salesperson_id = auth.uid()
    )
  );

CREATE POLICY "proposals_admin" ON public.proposals
  FOR SELECT USING (public.current_user_role() = 'admin');

-- ---- PROPOSAL VARIANTS ----
CREATE POLICY "proposal_variants_own" ON public.proposal_variants
  FOR ALL USING (
    project_id IN (
      SELECT id FROM public.projects WHERE salesperson_id = auth.uid()
    )
  );

-- ---- PROPOSAL SECTIONS ----
CREATE POLICY "proposal_sections_own" ON public.proposal_sections
  FOR ALL USING (
    proposal_id IN (
      SELECT p.id FROM public.proposals p
      JOIN public.projects pr ON p.project_id = pr.id
      WHERE pr.salesperson_id = auth.uid()
    )
  );

-- ---- OPTION SETS ----
CREATE POLICY "option_sets_own" ON public.option_sets
  FOR ALL USING (
    proposal_section_id IN (
      SELECT ps.id FROM public.proposal_sections ps
      JOIN public.proposals p ON ps.proposal_id = p.id
      JOIN public.projects pr ON p.project_id = pr.id
      WHERE pr.salesperson_id = auth.uid()
    )
  );

-- ---- PROPOSAL LINE ITEMS ----
CREATE POLICY "proposal_line_items_own" ON public.proposal_line_items
  FOR ALL USING (
    option_set_id IN (
      SELECT os.id FROM public.option_sets os
      JOIN public.proposal_sections ps ON os.proposal_section_id = ps.id
      JOIN public.proposals p ON ps.proposal_id = p.id
      JOIN public.projects pr ON p.project_id = pr.id
      WHERE pr.salesperson_id = auth.uid()
    )
  );

-- ---- PROPOSAL SNAPSHOTS ----
CREATE POLICY "proposal_snapshots_own" ON public.proposal_snapshots
  FOR ALL USING (
    proposal_id IN (
      SELECT p.id FROM public.proposals p
      JOIN public.projects pr ON p.project_id = pr.id
      WHERE pr.salesperson_id = auth.uid()
    )
  );

-- ---- PROPOSAL REVISION NOTES ----
CREATE POLICY "proposal_revision_notes_own" ON public.proposal_revision_notes
  FOR ALL USING (
    proposal_id IN (
      SELECT p.id FROM public.proposals p
      JOIN public.projects pr ON p.project_id = pr.id
      WHERE pr.salesperson_id = auth.uid()
    )
  );

-- ---- SERVICE LINE ITEMS ----
CREATE POLICY "service_line_items_own" ON public.service_line_items
  FOR ALL USING (
    proposal_section_id IN (
      SELECT ps.id FROM public.proposal_sections ps
      JOIN public.proposals p ON ps.proposal_id = p.id
      JOIN public.projects pr ON p.project_id = pr.id
      WHERE pr.salesperson_id = auth.uid()
    )
  );

-- ---- NOTIFICATIONS ----
CREATE POLICY "notifications_own" ON public.notifications
  FOR ALL USING (user_id = auth.uid());
-- ============================================================
-- Migration 20240009: Performance indexes
-- ============================================================

-- Product search (full-text + filter indexes)
CREATE INDEX idx_product_cache_name ON public.product_cache
  USING gin(to_tsvector('english', name));
CREATE INDEX idx_product_cache_source ON public.product_cache(source);
CREATE INDEX idx_product_cache_category ON public.product_cache(category);
CREATE INDEX idx_product_cache_available ON public.product_cache(is_available);
CREATE INDEX idx_product_cache_odoo_id ON public.product_cache(odoo_id);
CREATE INDEX idx_product_aliases_name ON public.product_aliases(alias_name);
CREATE INDEX idx_product_tags_tag ON public.product_tags(tag);

-- Chat performance
CREATE INDEX idx_chat_messages_project ON public.chat_messages(project_id);
CREATE INDEX idx_chat_messages_created ON public.chat_messages(created_at DESC);

-- Project lookups
CREATE INDEX idx_projects_salesperson ON public.projects(salesperson_id);
CREATE INDEX idx_projects_client ON public.projects(client_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_clients_salesperson ON public.clients(salesperson_id);

-- Proposal lookups
CREATE INDEX idx_proposals_project ON public.proposals(project_id);
CREATE INDEX idx_proposals_status ON public.proposals(status);
CREATE INDEX idx_proposal_sections_proposal ON public.proposal_sections(proposal_id);
CREATE INDEX idx_option_sets_section ON public.option_sets(proposal_section_id);
CREATE INDEX idx_line_items_option_set ON public.proposal_line_items(option_set_id);

-- Notifications
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(is_read);

-- Rules and feedback
CREATE INDEX idx_user_rules_user ON public.user_rules(user_id);
CREATE INDEX idx_project_rules_project ON public.project_rules(project_id);
CREATE INDEX idx_agent_feedback_project ON public.agent_feedback(project_id);
-- ============================================================
-- Migration 20240010: Storage buckets and policies
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('product-images', 'product-images', false),
  ('proposal-pdfs', 'proposal-pdfs', false),
  ('project-files', 'project-files', false),
  ('template-assets', 'template-assets', false)
ON CONFLICT (id) DO NOTHING;

-- product-images: all authenticated users can read
CREATE POLICY "product_images_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'product-images' AND auth.uid() IS NOT NULL
  );

-- product-images: only admin can upload
CREATE POLICY "product_images_admin_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images'
    AND public.current_user_role() = 'admin'
  );

-- proposal-pdfs: authenticated users can read
CREATE POLICY "proposal_pdfs_read_own" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'proposal-pdfs' AND auth.uid() IS NOT NULL
  );

-- proposal-pdfs: server can write (via service role key — no check needed)
CREATE POLICY "proposal_pdfs_service_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'proposal-pdfs'
  );

-- project-files: authenticated users can read and upload
CREATE POLICY "project_files_authenticated" ON storage.objects
  FOR ALL USING (
    bucket_id = 'project-files' AND auth.uid() IS NOT NULL
  );

-- template-assets: all authenticated users can read
CREATE POLICY "template_assets_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'template-assets' AND auth.uid() IS NOT NULL
  );

-- template-assets: only admin can upload
CREATE POLICY "template_assets_admin_write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'template-assets'
    AND public.current_user_role() = 'admin'
  );

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

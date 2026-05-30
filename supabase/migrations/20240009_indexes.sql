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

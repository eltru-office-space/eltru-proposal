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

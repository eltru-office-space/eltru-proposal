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

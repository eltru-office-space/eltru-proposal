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

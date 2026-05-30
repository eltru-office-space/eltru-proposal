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

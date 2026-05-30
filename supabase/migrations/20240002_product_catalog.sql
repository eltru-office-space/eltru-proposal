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

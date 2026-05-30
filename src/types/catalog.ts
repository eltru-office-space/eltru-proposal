export type ProductSource = 'preowned' | 'officestar' | 'n9ine'

export interface ProductImage {
  id: string
  product_cache_id: string
  url: string
  type: 'hero' | 'swatch' | 'detail'
  color_name: string | null
  sort_order: number
}

export interface ProductAlias {
  id: string
  product_cache_id: string
  alias_name: string
}

export interface ProductTag {
  id: string
  product_cache_id: string
  tag: string
}

export interface CatalogProduct {
  id: string
  odoo_id: number
  name: string
  odoo_internal_ref: string | null
  source: ProductSource
  category: string | null
  description: string | null
  dimensions_w: number | null
  dimensions_d: number | null
  dimensions_h: number | null
  base_price: number | null
  currency: string
  is_available: boolean
  last_synced_at: string | null
  created_at: string
  hero_image: ProductImage | null
}

export interface CatalogProductDetail extends CatalogProduct {
  images: ProductImage[]
  aliases: ProductAlias[]
  tags: ProductTag[]
}

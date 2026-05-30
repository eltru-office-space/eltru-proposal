// SERVER SIDE ONLY — never import this in client components

// ----------------------------------------------------------------
// Odoo field lists — what we request from each model
// ----------------------------------------------------------------

export const PRODUCT_FIELDS = [
  'id',
  'name',
  'default_code',
  'categ_id',
  'description_sale',
  'list_price',
  'active',
  'type',
  'seller_ids',
  'product_variant_ids',
  'attribute_line_ids',
  'image_1920',
  'product_image_ids',
] as const

export const STOCK_FIELDS = [
  'product_id',
  'quantity',
  'location_id',
] as const

export const BOM_FIELDS = [
  'id',
  'product_tmpl_id',
  'product_id',
  'code',
  'type',
  'bom_line_ids',
] as const

export const BOM_LINE_FIELDS = [
  'id',
  'bom_id',
  'product_id',
  'product_qty',
  'product_uom_id',
  'notes',
] as const

export const VARIANT_FIELDS = [
  'id',
  'product_tmpl_id',
  'display_name',
  'image_1920',
  'attribute_value_ids',
] as const

// ----------------------------------------------------------------
// Source determination from category name
// ----------------------------------------------------------------

export function mapOdooSource(
  product: { categ_id?: [number, string] | false }
): 'preowned' | 'officestar' | 'n9ine' {
  const categoryName =
    Array.isArray(product.categ_id) ? product.categ_id[1] : ''

  const name = categoryName.toLowerCase()

  if (name.includes('pre-owned') || name.includes('pre owned') || name.includes('used')) {
    return 'preowned'
  }
  if (name.includes('office star') || name.includes('officestar')) {
    return 'officestar'
  }
  if (name.includes('n9ine')) {
    return 'n9ine'
  }

  // Default — admin can correct per product in catalog UI
  return 'preowned'
}

// ----------------------------------------------------------------
// Map an Odoo product.template record → product_cache insert shape
// ----------------------------------------------------------------

export interface MappedProduct {
  odoo_id: number
  name: string
  odoo_internal_ref: string | null
  source: 'preowned' | 'officestar' | 'n9ine'
  category: string | null
  description: string | null
  base_price: number
  currency: string
  is_available: boolean
}

export function mapOdooProduct(raw: Record<string, unknown>): MappedProduct {
  return {
    odoo_id: raw.id as number,
    name: raw.name as string,
    odoo_internal_ref:
      raw.default_code && raw.default_code !== false
        ? String(raw.default_code)
        : null,
    source: mapOdooSource(
      raw as { categ_id?: [number, string] | false }
    ),
    category: Array.isArray(raw.categ_id)
      ? (raw.categ_id[1] as string)
      : null,
    description:
      raw.description_sale && raw.description_sale !== false
        ? String(raw.description_sale)
        : null,
    base_price: typeof raw.list_price === 'number' ? raw.list_price : 0,
    currency: 'USD',
    is_available: raw.active !== false,
  }
}

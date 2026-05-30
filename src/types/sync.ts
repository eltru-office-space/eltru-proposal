export interface SyncResult {
  id: string
  sync_type: 'full' | 'incremental'
  status: 'running' | 'completed' | 'failed'
  products_updated: number
  products_added: number
  products_flagged: number
  error_message: string | null
  started_at: string
  completed_at: string | null
}

export interface OdooProduct {
  id: number
  name: string
  default_code: string | false
  categ_id: [number, string]
  description_sale: string | false
  list_price: number
  active: boolean
  image_1920: string | false
  product_variant_ids: number[]
  attribute_line_ids: number[]
  product_image_ids: number[]
}

export interface OdooBOM {
  id: number
  product_tmpl_id: [number, string]
  product_id: [number, string] | false
  code: string | false
  type: string
  bom_line_ids: number[]
}

export interface OdooBOMLine {
  id: number
  bom_id: [number, string]
  product_id: [number, string]
  product_qty: number
  product_uom_id: [number, string]
  notes: string | false
}

export interface OdooProductVariant {
  id: number
  product_tmpl_id: [number, string]
  display_name: string
  image_1920: string | false
  attribute_value_ids: number[]
}

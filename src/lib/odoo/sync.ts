// SERVER SIDE ONLY — never import this in client components

import type { SupabaseClient } from '@supabase/supabase-js'
import { getOdooClient } from './client'
import { mapOdooProduct, PRODUCT_FIELDS, BOM_FIELDS, BOM_LINE_FIELDS, VARIANT_FIELDS } from './mappings'
import { downloadAndStoreImage, sleep } from './images'
import type { OdooBOM, OdooBOMLine, OdooProductVariant } from '@/types/sync'

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

async function createSyncLog(
  supabase: SupabaseClient,
  syncType: 'full' | 'incremental'
): Promise<string> {
  const { data, error } = await supabase
    .from('odoo_sync_log')
    .insert({
      sync_type: syncType,
      status: 'running',
      products_updated: 0,
      products_added: 0,
      products_flagged: 0,
    })
    .select('id')
    .single()

  if (error || !data) throw new Error(`Failed to create sync log: ${error?.message}`)
  return data.id as string
}

async function updateSyncLog(
  supabase: SupabaseClient,
  logId: string,
  patch: {
    status?: 'running' | 'completed' | 'failed'
    products_updated?: number
    products_added?: number
    products_flagged?: number
    error_message?: string
    completed_at?: string
  }
): Promise<void> {
  const { error } = await supabase
    .from('odoo_sync_log')
    .update(patch)
    .eq('id', logId)

  if (error) console.error('[sync] Failed to update sync log:', error.message)
}

// ----------------------------------------------------------------
// syncProducts
// ----------------------------------------------------------------

export async function syncProducts(
  supabase: SupabaseClient,
  logId: string,
  domain: unknown[] = [['active', '=', true]]
): Promise<{ added: number; updated: number; activeOdooIds: number[] }> {
  const odoo = getOdooClient()

  console.log('[sync] Fetching products from Odoo...')
  const rawProducts = await odoo.searchRead<Record<string, unknown>>(
    'product.template',
    domain,
    [...PRODUCT_FIELDS]
  )

  console.log(`[sync] Found ${rawProducts.length} products in Odoo`)

  let added = 0
  let updated = 0
  const activeOdooIds: number[] = []

  for (let i = 0; i < rawProducts.length; i++) {
    const raw = rawProducts[i]
    const mapped = mapOdooProduct(raw)
    activeOdooIds.push(mapped.odoo_id)

    // Check if product already exists
    const { data: existing } = await supabase
      .from('product_cache')
      .select('id')
      .eq('odoo_id', mapped.odoo_id)
      .single()

    const { data: upserted, error: upsertError } = await supabase
      .from('product_cache')
      .upsert(
        {
          ...mapped,
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: 'odoo_id' }
      )
      .select('id')
      .single()

    if (upsertError) {
      console.error(`[sync] Failed to upsert product ${mapped.odoo_id}:`, upsertError.message)
      continue
    }

    const productCacheId = upserted?.id as string
    existing ? updated++ : added++

    // ---- Hero image ----
    const heroBase64 = raw.image_1920
    if (heroBase64 && heroBase64 !== false && typeof heroBase64 === 'string') {
      const storagePath = `products/${mapped.odoo_id}/hero.jpg`
      const path = await downloadAndStoreImage(supabase, heroBase64, storagePath)

      if (path) {
        const { data: bucketData } = supabase.storage
          .from('product-images')
          .getPublicUrl(storagePath)

        await supabase.from('product_images_cache').upsert(
          {
            product_cache_id: productCacheId,
            url: bucketData.publicUrl,
            type: 'hero',
            sort_order: 0,
          },
          { onConflict: 'product_cache_id,type,sort_order' }
        )
      }

      // Throttle between image downloads
      await sleep(100)
    }

    // ---- Variant / swatch images ----
    const variantIds = Array.isArray(raw.product_variant_ids)
      ? (raw.product_variant_ids as number[])
      : []

    if (variantIds.length > 0) {
      const variants = await odoo.searchRead<OdooProductVariant>(
        'product.product',
        [['id', 'in', variantIds]],
        [...VARIANT_FIELDS]
      )

      for (const variant of variants) {
        if (!variant.image_1920) continue

        const storagePath = `products/${mapped.odoo_id}/swatch_${variant.id}.jpg`
        const path = await downloadAndStoreImage(
          supabase,
          variant.image_1920,
          storagePath
        )

        if (path) {
          const { data: bucketData } = supabase.storage
            .from('product-images')
            .getPublicUrl(storagePath)

          const colorName = variant.display_name.includes('(')
            ? variant.display_name.replace(/^.*\((.+)\)$/, '$1')
            : variant.display_name

          await supabase.from('product_images_cache').upsert(
            {
              product_cache_id: productCacheId,
              url: bucketData.publicUrl,
              type: 'swatch',
              color_name: colorName,
              sort_order: variant.id,
            },
            { onConflict: 'product_cache_id,type,sort_order' }
          )
        }

        await sleep(100)
      }
    }

    // Log progress every 50 products
    if ((i + 1) % 50 === 0) {
      console.log(`[sync] Processed ${i + 1}/${rawProducts.length} products`)
      await updateSyncLog(supabase, logId, {
        products_added: added,
        products_updated: updated,
      })
    }
  }

  return { added, updated, activeOdooIds }
}

// ----------------------------------------------------------------
// flagUnavailableProducts
// ----------------------------------------------------------------

export async function flagUnavailableProducts(
  supabase: SupabaseClient,
  activeOdooIds: number[]
): Promise<number> {
  if (activeOdooIds.length === 0) return 0

  const { data: allCached, error } = await supabase
    .from('product_cache')
    .select('id, odoo_id')

  if (error) throw new Error(`Failed to fetch product cache: ${error.message}`)

  const activeSet = new Set(activeOdooIds)
  const toFlag = (allCached ?? []).filter(
    (p: { id: string; odoo_id: number }) => !activeSet.has(p.odoo_id)
  )

  if (toFlag.length === 0) return 0

  const idsToFlag = toFlag.map((p: { id: string }) => p.id)

  const { error: flagError } = await supabase
    .from('product_cache')
    .update({ is_available: false })
    .in('id', idsToFlag)

  if (flagError) throw new Error(`Failed to flag unavailable products: ${flagError.message}`)

  console.log(`[sync] Flagged ${toFlag.length} products as unavailable`)
  return toFlag.length
}

// ----------------------------------------------------------------
// syncBOMs
// ----------------------------------------------------------------

export async function syncBOMs(supabase: SupabaseClient): Promise<void> {
  const odoo = getOdooClient()

  console.log('[sync] Fetching BOMs from Odoo...')
  const boms = await odoo.searchRead<OdooBOM>(
    'mrp.bom',
    [],
    [...BOM_FIELDS]
  )

  console.log(`[sync] Found ${boms.length} BOMs`)

  for (const bom of boms) {
    // Upsert kit_cache row
    const { data: kit, error: kitError } = await supabase
      .from('kit_cache')
      .upsert(
        {
          odoo_bom_id: bom.id,
          name: Array.isArray(bom.product_tmpl_id)
            ? bom.product_tmpl_id[1]
            : `BOM #${bom.id}`,
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: 'odoo_bom_id' }
      )
      .select('id')
      .single()

    if (kitError || !kit) {
      console.error(`[sync] Failed to upsert BOM ${bom.id}:`, kitError?.message)
      continue
    }

    const kitCacheId = kit.id as string

    if (!bom.bom_line_ids || bom.bom_line_ids.length === 0) continue

    // Fetch BOM lines
    const lines = await odoo.searchRead<OdooBOMLine>(
      'mrp.bom.line',
      [['id', 'in', bom.bom_line_ids]],
      [...BOM_LINE_FIELDS]
    )

    let displayPrice = 0

    for (const line of lines) {
      const productOdooId = Array.isArray(line.product_id)
        ? (line.product_id[0] as number)
        : null

      if (!productOdooId) continue

      // Look up product_cache_id by odoo_id
      const { data: product } = await supabase
        .from('product_cache')
        .select('id, base_price')
        .eq('odoo_id', productOdooId)
        .single()

      if (!product) continue

      displayPrice += (product.base_price ?? 0) * line.product_qty

      await supabase.from('kit_components_cache').upsert(
        {
          kit_cache_id: kitCacheId,
          product_cache_id: product.id,
          quantity: line.product_qty,
          is_optional: false,
          notes: line.notes ? String(line.notes) : null,
        },
        { onConflict: 'kit_cache_id,product_cache_id' }
      )
    }

    // Update display_price on kit_cache
    await supabase
      .from('kit_cache')
      .update({ display_price: displayPrice })
      .eq('id', kitCacheId)
  }

  console.log('[sync] BOM sync complete')
}

// ----------------------------------------------------------------
// runFullSync
// ----------------------------------------------------------------

export async function runFullSync(supabase: SupabaseClient): Promise<Record<string, unknown>> {
  const logId = await createSyncLog(supabase, 'full')

  try {
    const { added, updated, activeOdooIds } = await syncProducts(
      supabase,
      logId,
      [['active', '=', true]]
    )

    const flagged = await flagUnavailableProducts(supabase, activeOdooIds)

    await syncBOMs(supabase)

    const completedAt = new Date().toISOString()
    await updateSyncLog(supabase, logId, {
      status: 'completed',
      products_added: added,
      products_updated: updated,
      products_flagged: flagged,
      completed_at: completedAt,
    })

    const { data: log } = await supabase
      .from('odoo_sync_log')
      .select('*')
      .eq('id', logId)
      .single()

    return (log ?? {}) as Record<string, unknown>
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[sync] Full sync failed:', message)

    await updateSyncLog(supabase, logId, {
      status: 'failed',
      error_message: message,
      completed_at: new Date().toISOString(),
    })

    throw err
  }
}

// ----------------------------------------------------------------
// runIncrementalSync
// ----------------------------------------------------------------

export async function runIncrementalSync(
  supabase: SupabaseClient,
  since: Date
): Promise<Record<string, unknown>> {
  const logId = await createSyncLog(supabase, 'incremental')

  try {
    // Odoo write_date format: 'YYYY-MM-DD HH:MM:SS'
    const sinceStr = since.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '')

    const { added, updated } = await syncProducts(supabase, logId, [
      ['active', '=', true],
      ['write_date', '>=', sinceStr],
    ])

    // No flag pass on incremental — only full sync does that
    await syncBOMs(supabase)

    const completedAt = new Date().toISOString()
    await updateSyncLog(supabase, logId, {
      status: 'completed',
      products_added: added,
      products_updated: updated,
      completed_at: completedAt,
    })

    const { data: log } = await supabase
      .from('odoo_sync_log')
      .select('*')
      .eq('id', logId)
      .single()

    return (log ?? {}) as Record<string, unknown>
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[sync] Incremental sync failed:', message)

    await updateSyncLog(supabase, logId, {
      status: 'failed',
      error_message: message,
      completed_at: new Date().toISOString(),
    })

    throw err
  }
}

// SERVER SIDE ONLY — never import this in client components

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Decode a base64 image string from Odoo and upload it to Supabase Storage.
 *
 * Returns the storage path on success, null on any failure.
 * Never throws — a single bad image should never abort a full sync.
 */
export async function downloadAndStoreImage(
  supabase: SupabaseClient,
  base64ImageData: string,
  storagePath: string
): Promise<string | null> {
  try {
    if (!base64ImageData || base64ImageData === 'false') return null

    // Detect MIME type from base64 data-URI prefix, or default to jpeg
    let mimeType = 'image/jpeg'
    let rawBase64 = base64ImageData

    if (base64ImageData.startsWith('data:')) {
      const match = base64ImageData.match(/^data:(image\/[a-z+]+);base64,(.+)$/)
      if (!match) {
        console.warn(`[images] Unrecognised base64 prefix for ${storagePath}`)
        return null
      }
      mimeType = match[1]
      rawBase64 = match[2]
    }

    // Convert base64 → Buffer → Uint8Array (Node-compatible)
    const buffer = Buffer.from(rawBase64, 'base64')
    const uint8 = new Uint8Array(buffer)

    const { error } = await supabase.storage
      .from('product-images')
      .upload(storagePath, uint8, {
        contentType: mimeType,
        upsert: true,
      })

    if (error) {
      console.error(`[images] Storage upload failed for ${storagePath}:`, error.message)
      return null
    }

    return storagePath
  } catch (err) {
    console.error(`[images] Unexpected error for ${storagePath}:`, err)
    return null
  }
}

/** Small delay helper used between image downloads to avoid hammering Odoo */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

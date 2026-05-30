import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '@/types/supabase'

function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

async function verifyAdmin(): Promise<string | null> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = getAdminClient()
  const { data } = await admin.from('users').select('role').eq('id', user.id).single()
  return data?.role === 'admin' ? user.id : null
}

const AddSchema = z.object({
  url: z.string().url(),
  type: z.enum(['hero', 'swatch', 'detail']),
  color_name: z.string().max(100).optional(),
  sort_order: z.number().int().optional(),
})

const DeleteSchema = z.object({ image_id: z.string().uuid() })

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const userId = await verifyAdmin()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { productId } = await params
  const body = await request.json().catch(() => null)
  const parsed = AddSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const admin = getAdminClient()
  const { data, error } = await admin
    .from('product_images_cache')
    .insert({
      product_cache_id: productId,
      url: parsed.data.url,
      type: parsed.data.type,
      color_name: parsed.data.color_name ?? null,
      sort_order: parsed.data.sort_order ?? 99,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  request: NextRequest,
  { params: _params }: { params: Promise<{ productId: string }> }
) {
  const userId = await verifyAdmin()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const parsed = DeleteSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const admin = getAdminClient()

  // Only allow deleting 'detail' (custom) images — not synced hero/swatch
  const { data: img } = await admin
    .from('product_images_cache')
    .select('type, url')
    .eq('id', parsed.data.image_id)
    .single()

  if (!img) return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  if (img.type !== 'detail') {
    return NextResponse.json(
      { error: 'Cannot delete synced images. Only custom uploaded images can be deleted.' },
      { status: 400 }
    )
  }

  // Delete from storage — extract path from URL
  const url = img.url as string
  const pathMatch = url.match(/product-images\/(.+)$/)
  if (pathMatch) {
    await admin.storage.from('product-images').remove([pathMatch[1]])
  }

  const { error } = await admin
    .from('product_images_cache')
    .delete()
    .eq('id', parsed.data.image_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

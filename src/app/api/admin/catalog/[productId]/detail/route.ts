import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  // Verify authenticated (any role can view details)
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { productId } = await params
  const admin = getAdminClient()

  const [{ data: product }, { data: images }, { data: aliases }, { data: tags }] =
    await Promise.all([
      admin.from('product_cache').select('*').eq('id', productId).single(),
      admin.from('product_images_cache').select('*').eq('product_cache_id', productId).order('sort_order'),
      admin.from('product_aliases').select('*').eq('product_cache_id', productId),
      admin.from('product_tags').select('*').eq('product_cache_id', productId),
    ])

  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    ...product,
    images: images ?? [],
    aliases: aliases ?? [],
    tags: tags ?? [],
    hero_image: (images ?? []).find((i: { type: string }) => i.type === 'hero') ?? null,
  })
}

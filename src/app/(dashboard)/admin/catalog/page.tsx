import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import ProductTable from '@/components/admin/ProductTable'
import type { CatalogProduct } from '@/types/catalog'

const PAGE_SIZE = 50

function getAdminClient() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export default async function AdminCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; source?: string; available?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = getAdminClient()
  const { data: profile } = await admin.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { page: pageStr, source, available } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  // Build filter
  let query = admin
    .from('product_cache')
    .select('*', { count: 'exact' })

  if (source && source !== 'all') {
    query = query.eq('source', source)
  }
  if (available === 'true') {
    query = query.eq('is_available', true)
  }

  const { data: rawProducts, count } = await query
    .order('name')
    .range(offset, offset + PAGE_SIZE - 1)

  const productIds = (rawProducts ?? []).map((p: { id: string }) => p.id)

  // Fetch hero images for this page
  const { data: heroImages } = productIds.length
    ? await admin
        .from('product_images_cache')
        .select('*')
        .in('product_cache_id', productIds)
        .eq('type', 'hero')
    : { data: [] }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const heroMap: Record<string, any> = Object.fromEntries(
    (heroImages ?? []).map((img) => [(img as { product_cache_id: string }).product_cache_id, img])
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const products: CatalogProduct[] = (rawProducts ?? []).map((p: any) => ({
    ...p,
    hero_image: heroMap[p.id] ?? null,
  }))

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Product Catalog</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          {count ?? 0} products synced from Odoo
        </p>
      </div>

      <ProductTable
        products={products}
        totalCount={count ?? 0}
        page={page}
        pageSize={PAGE_SIZE}
        isAdmin={true}
      />
    </div>
  )
}

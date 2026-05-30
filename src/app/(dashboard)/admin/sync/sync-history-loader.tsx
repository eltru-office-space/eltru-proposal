import { createClient as createAdminClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import SyncHistory from '@/components/admin/SyncHistory'
import type { SyncResult } from '@/types/sync'

export default async function SyncHistoryLoader() {
  const admin = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { data: logs } = await admin
    .from('odoo_sync_log')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(20)

  return <SyncHistory logs={(logs ?? []) as SyncResult[]} />
}

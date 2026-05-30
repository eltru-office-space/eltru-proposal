/**
 * Admin-authenticated proxy to the Odoo sync route.
 * The browser can't call /api/sync/odoo directly (needs the secret),
 * so this route verifies the user is an admin and then calls the sync
 * function directly (server-to-server, no HTTP hop needed).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { runFullSync, runIncrementalSync } from '@/lib/odoo/sync'
import type { Database } from '@/types/supabase'

function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getAdminClient()
  const { data: profile } = await admin.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as { type?: string }
  const syncType = body.type === 'incremental' ? 'incremental' : 'full'

  try {
    let result: Record<string, unknown>
    if (syncType === 'incremental') {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
      result = await runIncrementalSync(admin, since)
    } else {
      result = await runFullSync(admin)
    }
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

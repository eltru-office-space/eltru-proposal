// SERVER SIDE ONLY — this is a Next.js Route Handler (server-only)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { runFullSync, runIncrementalSync } from '@/lib/odoo/sync'

// Use the service-role client so sync can bypass RLS
function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Supabase service role credentials not configured')
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  })
}

export async function POST(request: NextRequest) {
  // ---- Auth check ----
  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  const secret = process.env.ADMIN_INVITE_SECRET

  if (!secret || token !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ---- Parse body ----
  let syncType: 'full' | 'incremental' = 'full'

  try {
    const body = await request.json().catch(() => ({})) as { type?: string }
    if (body.type === 'incremental') syncType = 'incremental'
  } catch {
    // Ignore malformed body — default to 'full'
  }

  // ---- Run sync ----
  try {
    const supabase = getServiceSupabase()

    let result: Record<string, unknown>

    if (syncType === 'incremental') {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
      result = await runIncrementalSync(supabase, since)
    } else {
      result = await runFullSync(supabase)
    }

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown sync error'
    console.error('[api/sync/odoo] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

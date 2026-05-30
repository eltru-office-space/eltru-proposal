'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, RefreshCw, Zap } from 'lucide-react'
import SyncHistoryLoader from './sync-history-loader'
import type { SyncResult } from '@/types/sync'

export default function SyncPage() {
  const [loading, setLoading] = useState<'full' | 'incremental' | null>(null)
  const [result, setResult] = useState<SyncResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const secret = process.env.NEXT_PUBLIC_APP_URL // not the secret — we call from the browser
  // The sync route uses ADMIN_INVITE_SECRET — this must be called server-to-server.
  // For the UI trigger, we proxy through a lightweight admin route.
  async function triggerSync(type: 'full' | 'incremental') {
    setLoading(type)
    setResult(null)
    setError(null)

    try {
      const res = await fetch('/api/admin/sync/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      const data = await res.json() as SyncResult & { error?: string }
      if (!res.ok) { setError(data.error ?? 'Sync failed'); return }
      setResult(data)
      setRefreshKey((k) => k + 1)
    } catch {
      setError('Network error. Check the server logs.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Odoo Sync</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Sync product data from Odoo into the catalog cache.
        </p>
      </div>

      {/* Trigger section */}
      <Card className="border-zinc-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-zinc-900">Trigger Sync</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button
              onClick={() => triggerSync('full')}
              disabled={!!loading}
              className="bg-zinc-900 hover:bg-zinc-700 text-white gap-2"
            >
              {loading === 'full'
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Running Full Sync…</>
                : <><RefreshCw className="h-4 w-4" /> Run Full Sync</>}
            </Button>
            <Button
              variant="outline"
              onClick={() => triggerSync('incremental')}
              disabled={!!loading}
              className="border-zinc-300 gap-2"
            >
              {loading === 'incremental'
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Running…</>
                : <><Zap className="h-4 w-4" /> Run Incremental Sync (last 24h)</>}
            </Button>
          </div>

          {result && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
              Sync complete — <strong>{result.products_added}</strong> products added,{' '}
              <strong>{result.products_updated}</strong> updated,{' '}
              <strong>{result.products_flagged}</strong> flagged as unavailable.
            </div>
          )}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* History section */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-zinc-900">Sync History</h2>
        <SyncHistoryLoader key={refreshKey} />
      </div>
    </div>
  )
}

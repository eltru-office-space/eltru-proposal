'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X, Plus, Loader2 } from 'lucide-react'
import type { ProductAlias } from '@/types/catalog'

interface AliasManagerProps {
  productId: string
  initialAliases: ProductAlias[]
}

export default function AliasManager({ productId, initialAliases }: AliasManagerProps) {
  const [aliases, setAliases] = useState<ProductAlias[]>(initialAliases)
  const [input, setInput] = useState('')
  const [adding, setAdding] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleAdd() {
    const trimmed = input.trim()
    if (!trimmed) return
    setAdding(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/catalog/${productId}/aliases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alias_name: trimmed }),
      })
      const data = await res.json() as ProductAlias & { error?: string }
      if (!res.ok) { setError(data.error ?? 'Failed to add alias'); return }
      setAliases((prev) => [...prev, data])
      setInput('')
    } catch {
      setError('Network error')
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove(aliasId: string) {
    setRemovingId(aliasId)
    setError(null)
    try {
      const res = await fetch(`/api/admin/catalog/${productId}/aliases`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alias_id: aliasId }),
      })
      if (!res.ok) { setError('Failed to remove alias'); return }
      setAliases((prev) => prev.filter((a) => a.id !== aliasId))
    } catch {
      setError('Network error')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-zinc-900">Search Aliases</p>
        <p className="text-xs text-zinc-500 mt-0.5">
          Alternate names so the AI can find this product when salespeople use different terminology.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 min-h-[32px]">
        {aliases.map((alias) => (
          <span
            key={alias.id}
            className="inline-flex items-center gap-1 bg-zinc-100 text-zinc-700 text-xs rounded-full px-2.5 py-1"
          >
            {alias.alias_name}
            <button
              onClick={() => handleRemove(alias.id)}
              disabled={removingId === alias.id}
              className="text-zinc-400 hover:text-zinc-700 ml-0.5"
              aria-label="Remove alias"
            >
              {removingId === alias.id
                ? <Loader2 className="h-3 w-3 animate-spin" />
                : <X className="h-3 w-3" />}
            </button>
          </span>
        ))}
        {aliases.length === 0 && (
          <span className="text-xs text-zinc-400">No aliases yet</span>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. task chair, desk chair…"
          className="text-sm border-zinc-300 h-8"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Button
          onClick={handleAdd}
          disabled={adding || !input.trim()}
          size="sm"
          className="bg-zinc-900 hover:bg-zinc-700 text-white h-8 gap-1"
        >
          {adding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          Add
        </Button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

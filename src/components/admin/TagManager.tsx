'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X, Plus, Loader2 } from 'lucide-react'
import type { ProductTag } from '@/types/catalog'

interface TagManagerProps {
  productId: string
  initialTags: ProductTag[]
}

export default function TagManager({ productId, initialTags }: TagManagerProps) {
  const [tags, setTags] = useState<ProductTag[]>(initialTags)
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
      const res = await fetch(`/api/admin/catalog/${productId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: trimmed }),
      })
      const data = await res.json() as ProductTag & { error?: string }
      if (!res.ok) { setError(data.error ?? 'Failed to add tag'); return }
      setTags((prev) => [...prev, data])
      setInput('')
    } catch {
      setError('Network error')
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove(tagId: string) {
    setRemovingId(tagId)
    setError(null)
    try {
      const res = await fetch(`/api/admin/catalog/${productId}/tags`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag_id: tagId }),
      })
      if (!res.ok) { setError('Failed to remove tag'); return }
      setTags((prev) => prev.filter((t) => t.id !== tagId))
    } catch {
      setError('Network error')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-zinc-900">Tags</p>

      <div className="flex flex-wrap gap-2 min-h-[32px]">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs rounded-full px-2.5 py-1"
          >
            {tag.tag}
            <button
              onClick={() => handleRemove(tag.id)}
              disabled={removingId === tag.id}
              className="text-blue-400 hover:text-blue-700 ml-0.5"
              aria-label="Remove tag"
            >
              {removingId === tag.id
                ? <Loader2 className="h-3 w-3 animate-spin" />
                : <X className="h-3 w-3" />}
            </button>
          </span>
        ))}
        {tags.length === 0 && (
          <span className="text-xs text-zinc-400">No tags yet</span>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. ergonomic, height-adjustable…"
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

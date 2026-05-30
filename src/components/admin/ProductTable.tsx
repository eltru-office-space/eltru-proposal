'use client'

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Image from 'next/image'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import ProductEditPanel from './ProductEditPanel'
import type { CatalogProduct, CatalogProductDetail, ProductSource } from '@/types/catalog'

const SOURCE_BADGE: Record<ProductSource, { label: string; className: string }> = {
  preowned:   { label: 'Pre-Owned',   className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
  officestar: { label: 'Office Star', className: 'bg-purple-100 text-purple-700 hover:bg-purple-100' },
  n9ine:      { label: 'N9ine',       className: 'bg-orange-100 text-orange-700 hover:bg-orange-100' },
}

interface ProductTableProps {
  products: CatalogProduct[]
  totalCount: number
  page: number
  pageSize: number
  isAdmin: boolean
}

export default function ProductTable({
  products, totalCount, page, pageSize, isAdmin,
}: ProductTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Client-side search/filter on the loaded page
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [sourceFilter, setSourceFilter] = useState(searchParams.get('source') ?? 'all')
  const [availableOnly, setAvailableOnly] = useState(searchParams.get('available') === 'true')

  // Edit panel state
  const [editProduct, setEditProduct] = useState<CatalogProductDetail | null>(null)
  const [loadingEdit, setLoadingEdit] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = !search
        || p.name.toLowerCase().includes(search.toLowerCase())
        || (p.odoo_internal_ref ?? '').toLowerCase().includes(search.toLowerCase())
      const matchSource = sourceFilter === 'all' || p.source === sourceFilter
      const matchAvail = !availableOnly || p.is_available
      return matchSearch && matchSource && matchAvail
    })
  }, [products, search, sourceFilter, availableOnly])

  function pushParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v); else params.delete(k)
    })
    router.push(`${pathname}?${params.toString()}`)
  }

  async function openEdit(productId: string) {
    setLoadingEdit(productId)
    setPanelOpen(true)
    try {
      const res = await fetch(`/api/admin/catalog/${productId}/detail`)
      if (res.ok) {
        const data = await res.json() as CatalogProductDetail
        setEditProduct(data)
      }
    } finally {
      setLoadingEdit(null)
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <>
      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Input
          placeholder="Search name or SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-56 text-sm border-zinc-300"
        />

        <Select value={sourceFilter} onValueChange={(v) => {
          setSourceFilter(v)
          pushParams({ source: v === 'all' ? '' : v, page: '1' })
        }}>
          <SelectTrigger className="h-8 w-40 text-sm border-zinc-300">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="preowned">Pre-Owned</SelectItem>
            <SelectItem value="officestar">Office Star</SelectItem>
            <SelectItem value="n9ine">N9ine</SelectItem>
          </SelectContent>
        </Select>

        <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => {
              setAvailableOnly(e.target.checked)
              pushParams({ available: e.target.checked ? 'true' : '', page: '1' })
            }}
            className="rounded border-zinc-300"
          />
          Available only
        </label>

        {isAdmin && (
          <div className="ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/sync')}
              className="h-8 border-zinc-300 text-xs gap-1.5"
            >
              <RefreshCw className="h-3 w-3" />
              Trigger Sync
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="border border-zinc-200 rounded-xl bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50 hover:bg-zinc-50">
              <TableHead className="w-14 text-zinc-600 font-medium">Image</TableHead>
              <TableHead className="text-zinc-600 font-medium">Name</TableHead>
              <TableHead className="text-zinc-600 font-medium">SKU</TableHead>
              <TableHead className="text-zinc-600 font-medium">Category</TableHead>
              <TableHead className="text-zinc-600 font-medium">Source</TableHead>
              <TableHead className="text-zinc-600 font-medium text-right">Price</TableHead>
              <TableHead className="text-zinc-600 font-medium">Avail.</TableHead>
              <TableHead className="text-zinc-600 font-medium">Last Synced</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-zinc-400 text-sm py-12">
                  {products.length === 0
                    ? 'No products yet. Run an Odoo sync to populate the catalog.'
                    : 'No products match your filters.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => {
                const badge = SOURCE_BADGE[p.source] ?? SOURCE_BADGE.preowned
                return (
                  <TableRow
                    key={p.id}
                    className="hover:bg-zinc-50 cursor-pointer"
                    onClick={() => openEdit(p.id)}
                  >
                    <TableCell>
                      {p.hero_image ? (
                        <Image
                          src={p.hero_image.url}
                          alt={p.name}
                          width={40}
                          height={40}
                          className="rounded object-cover w-10 h-10"
                          unoptimized
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-zinc-100" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-zinc-900 text-sm max-w-[200px]">
                      <span className="truncate block">{p.name}</span>
                    </TableCell>
                    <TableCell className="text-zinc-500 text-sm">
                      {p.odoo_internal_ref ?? '—'}
                    </TableCell>
                    <TableCell className="text-zinc-500 text-sm max-w-[140px]">
                      <span className="truncate block">{p.category ?? '—'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${badge.className} text-xs`}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell className="text-zinc-900 text-sm text-right">
                      {p.base_price != null ? `$${p.base_price.toLocaleString()}` : '—'}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-block w-2 h-2 rounded-full ${p.is_available ? 'bg-emerald-500' : 'bg-red-400'}`} />
                    </TableCell>
                    <TableCell className="text-zinc-400 text-xs">
                      {p.last_synced_at
                        ? new Date(p.last_synced_at).toLocaleDateString()
                        : 'Never'}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={loadingEdit === p.id}
                          onClick={() => openEdit(p.id)}
                          className="h-7 px-2 text-xs text-zinc-500 hover:text-zinc-900"
                        >
                          Edit
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-sm text-zinc-500">
        <span>
          {filtered.length === 0
            ? 'No results'
            : `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, totalCount)} of ${totalCount} products`}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => pushParams({ page: String(page - 1) })}
            className="h-8 border-zinc-300 gap-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => pushParams({ page: String(page + 1) })}
            className="h-8 border-zinc-300 gap-1"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Edit panel */}
      <ProductEditPanel
        product={editProduct}
        open={panelOpen}
        onClose={() => { setPanelOpen(false); setEditProduct(null) }}
        isAdmin={isAdmin}
      />
    </>
  )
}

'use client'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import AliasManager from './AliasManager'
import TagManager from './TagManager'
import ImageGallery from './ImageGallery'
import type { CatalogProductDetail } from '@/types/catalog'

const SOURCE_BADGE: Record<string, { label: string; className: string }> = {
  preowned:   { label: 'Pre-Owned',    className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
  officestar: { label: 'Office Star',  className: 'bg-purple-100 text-purple-700 hover:bg-purple-100' },
  n9ine:      { label: 'N9ine',        className: 'bg-orange-100 text-orange-700 hover:bg-orange-100' },
}

interface ProductEditPanelProps {
  product: CatalogProductDetail | null
  open: boolean
  onClose: () => void
  isAdmin: boolean
}

function formatDimensions(w: number | null, d: number | null, h: number | null) {
  if (!w && !d && !h) return '—'
  return [w, d, h].map((v) => (v ? `${v}"` : '—')).join(' × ')
}

export default function ProductEditPanel({
  product,
  open,
  onClose,
  isAdmin,
}: ProductEditPanelProps) {
  if (!product) return null

  const sourceBadge = SOURCE_BADGE[product.source] ?? SOURCE_BADGE.preowned

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:w-[480px] sm:max-w-[480px] overflow-y-auto p-0"
      >
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 sticky top-0 bg-white z-10 border-b border-zinc-100">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-base font-semibold text-zinc-900 leading-tight">
                {product.name}
              </SheetTitle>
              <p className="text-xs text-zinc-400 mt-0.5">
                Odoo #{product.odoo_id}
                {product.odoo_internal_ref && ` · SKU: ${product.odoo_internal_ref}`}
              </p>
            </div>
            <Badge className={`${sourceBadge.className} text-xs shrink-0`}>
              {sourceBadge.label}
            </Badge>
          </div>
        </SheetHeader>

        <div className="px-6 py-5 space-y-6">
          {/* Images */}
          <ImageGallery
            productId={product.id}
            odooId={product.odoo_id}
            initialImages={product.images}
            isAdmin={isAdmin}
          />

          <Separator className="bg-zinc-100" />

          {/* Aliases — admin only */}
          {isAdmin && (
            <>
              <AliasManager productId={product.id} initialAliases={product.aliases} />
              <Separator className="bg-zinc-100" />
              <TagManager productId={product.id} initialTags={product.tags} />
              <Separator className="bg-zinc-100" />
            </>
          )}

          {/* Details */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-zinc-900">Details</p>
            <dl className="space-y-2 text-sm">
              {[
                ['Category', product.category ?? '—'],
                ['Dimensions (W × D × H)', formatDimensions(product.dimensions_w, product.dimensions_d, product.dimensions_h)],
                ['Base Price', product.base_price != null ? `$${product.base_price.toLocaleString()}` : '—'],
                ['Last Synced', product.last_synced_at
                  ? new Date(product.last_synced_at).toLocaleDateString()
                  : 'Never'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-zinc-500 shrink-0">{label}</dt>
                  <dd className="text-zinc-900 text-right">{value}</dd>
                </div>
              ))}
            </dl>
            {isAdmin && (
              <p className="text-xs text-zinc-400 pt-1">
                Product details sync from Odoo. To change price or category, update in Odoo and re-sync.
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Upload, Loader2, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { ProductImage } from '@/types/catalog'

const MAX_FILE_SIZE_MB = 5

interface ImageGalleryProps {
  productId: string
  odooId: number
  initialImages: ProductImage[]
  isAdmin: boolean
}

export default function ImageGallery({ productId, odooId, initialImages, isAdmin }: ImageGalleryProps) {
  const [images, setImages] = useState<ProductImage[]>(initialImages)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hero = images.find((i) => i.type === 'hero')
  const swatches = images.filter((i) => i.type === 'swatch')
  const custom = images.filter((i) => i.type === 'detail')

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setError('Only JPG and PNG files are supported')
      return
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_FILE_SIZE_MB}MB`)
      return
    }

    setUploading(true)
    try {
      const supabase = createClient()
      const timestamp = Date.now()
      const storagePath = `products/${odooId}/custom_${timestamp}.jpg`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(storagePath, file, { contentType: file.type, upsert: false })

      if (uploadError) { setError(uploadError.message); return }

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(storagePath)

      const res = await fetch(`/api/admin/catalog/${productId}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlData.publicUrl, type: 'detail' }),
      })
      const data = await res.json() as ProductImage & { error?: string }
      if (!res.ok) { setError(data.error ?? 'Failed to register image'); return }
      setImages((prev) => [...prev, data])
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDelete(imageId: string) {
    setDeletingId(imageId)
    setError(null)
    try {
      const res = await fetch(`/api/admin/catalog/${productId}/images`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_id: imageId }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setError(data.error ?? 'Failed to delete image')
        return
      }
      setImages((prev) => prev.filter((i) => i.id !== imageId))
    } catch {
      setError('Network error')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-zinc-900">Images</p>

      {/* Hero image */}
      <div className="rounded-lg overflow-hidden bg-zinc-100 flex items-center justify-center" style={{ height: 220 }}>
        {hero ? (
          <Image
            src={hero.url}
            alt="Hero"
            width={400}
            height={220}
            className="w-full h-full object-contain"
            unoptimized
          />
        ) : (
          <span className="text-xs text-zinc-400">No hero image</span>
        )}
      </div>

      {/* Swatches */}
      {swatches.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {swatches.map((sw) => (
            <div key={sw.id} className="relative group" title={sw.color_name ?? ''}>
              <Image
                src={sw.url}
                alt={sw.color_name ?? 'swatch'}
                width={60}
                height={60}
                className="rounded-md object-cover border border-zinc-200"
                unoptimized
              />
              {sw.color_name && (
                <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-b-md truncate px-1">
                  {sw.color_name}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Custom uploaded images */}
      {custom.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {custom.map((img) => (
            <div key={img.id} className="relative group">
              <Image
                src={img.url}
                alt="Custom"
                width={60}
                height={60}
                className="rounded-md object-cover border border-zinc-200"
                unoptimized
              />
              {isAdmin && (
                <button
                  onClick={() => handleDelete(img.id)}
                  disabled={deletingId === img.id}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Delete image"
                >
                  {deletingId === img.id
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <Trash2 className="h-3 w-3" />}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {isAdmin && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="border-zinc-300 h-8 gap-1.5 text-xs"
          >
            {uploading
              ? <><Loader2 className="h-3 w-3 animate-spin" /> Uploading…</>
              : <><Upload className="h-3 w-3" /> Upload Custom Image</>}
          </Button>
        </>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

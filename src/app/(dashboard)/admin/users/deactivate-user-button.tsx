'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export default function DeactivateUserButton({ userId }: { userId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDeactivate() {
    if (!confirm('Deactivate this user? They will be logged out immediately.')) return

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: false }),
      })

      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json() as { error?: string }
        alert(data.error ?? 'Failed to deactivate user')
      }
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDeactivate}
      disabled={loading}
      className="text-zinc-500 hover:text-red-600 hover:bg-red-50 h-7 px-2 text-xs"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Deactivate'}
    </Button>
  )
}

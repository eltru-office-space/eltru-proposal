'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[DashboardError]', error)
  }, [error])

  return (
    <div className="p-8 max-w-lg mx-auto mt-16">
      <Card className="border-zinc-200 shadow-sm">
        <CardHeader className="flex flex-row items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
          <CardTitle className="text-base font-semibold text-zinc-900">
            Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-zinc-500">
            {error.message ?? 'An unexpected error occurred.'}
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={reset}
              className="border-zinc-300"
            >
              Try again
            </Button>
            <Link
              href="/dashboard"
              className="inline-flex items-center text-sm text-white bg-zinc-900 hover:bg-zinc-700 rounded-lg px-3 py-1.5 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

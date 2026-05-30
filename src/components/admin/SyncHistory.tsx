'use client'

import { useState } from 'react'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Loader2, ChevronDown } from 'lucide-react'
import type { SyncResult } from '@/types/sync'

function formatDuration(started: string, completed: string | null) {
  if (!completed) return 'In progress'
  const ms = new Date(completed).getTime() - new Date(started).getTime()
  const s = Math.round(ms / 1000)
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`
}

export default function SyncHistory({ logs }: { logs: SyncResult[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (logs.length === 0) {
    return <p className="text-sm text-zinc-400">No sync history yet.</p>
  }

  return (
    <div className="border border-zinc-200 rounded-xl bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-zinc-50 hover:bg-zinc-50">
            <TableHead className="text-zinc-600 font-medium">Started</TableHead>
            <TableHead className="text-zinc-600 font-medium">Type</TableHead>
            <TableHead className="text-zinc-600 font-medium">Status</TableHead>
            <TableHead className="text-zinc-600 font-medium text-right">Added</TableHead>
            <TableHead className="text-zinc-600 font-medium text-right">Updated</TableHead>
            <TableHead className="text-zinc-600 font-medium text-right">Flagged</TableHead>
            <TableHead className="text-zinc-600 font-medium">Duration</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <>
              <TableRow
                key={log.id}
                className={`hover:bg-zinc-50 ${log.status === 'failed' ? 'cursor-pointer' : ''}`}
                onClick={() => log.status === 'failed' && setExpanded(expanded === log.id ? null : log.id)}
              >
                <TableCell className="text-zinc-600 text-sm">
                  {new Date(log.started_at).toLocaleString()}
                </TableCell>
                <TableCell className="text-zinc-600 text-sm capitalize">{log.sync_type}</TableCell>
                <TableCell>
                  {log.status === 'completed' && (
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs">Completed</Badge>
                  )}
                  {log.status === 'failed' && (
                    <Badge className="bg-red-100 text-red-600 hover:bg-red-100 text-xs gap-1">
                      Failed
                      <ChevronDown className={`h-3 w-3 transition-transform ${expanded === log.id ? 'rotate-180' : ''}`} />
                    </Badge>
                  )}
                  {log.status === 'running' && (
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Running
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-zinc-900 text-sm text-right">{log.products_added}</TableCell>
                <TableCell className="text-zinc-900 text-sm text-right">{log.products_updated}</TableCell>
                <TableCell className="text-zinc-500 text-sm text-right">{log.products_flagged}</TableCell>
                <TableCell className="text-zinc-500 text-sm">
                  {formatDuration(log.started_at, log.completed_at)}
                </TableCell>
              </TableRow>
              {expanded === log.id && log.error_message && (
                <TableRow key={`${log.id}-error`}>
                  <TableCell colSpan={7} className="bg-red-50 py-2 px-4">
                    <p className="text-xs text-red-600 font-mono">{log.error_message}</p>
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

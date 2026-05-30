'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserPlus, Loader2 } from 'lucide-react'

export default function InviteUserDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'salesperson'>('salesperson')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, full_name: fullName, role }),
      })

      const data = await res.json() as { message?: string; error?: string }

      if (!res.ok) {
        setError(data.error ?? 'Failed to send invite')
        return
      }

      setSuccess(`Invite sent to ${email}`)
      setFullName('')
      setEmail('')
      setRole('salesperson')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleOpenChange(val: boolean) {
    if (!val) {
      setError(null)
      setSuccess(null)
    }
    setOpen(val)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-zinc-900 hover:bg-zinc-700 text-white gap-2">
          <UserPlus className="h-4 w-4" />
          Invite User
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-zinc-900">Invite a new user</DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-emerald-600 font-medium">{success}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
              className="border-zinc-300"
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="invite-name" className="text-zinc-700">
                Full Name
              </Label>
              <Input
                id="invite-name"
                placeholder="Jane Smith"
                required
                minLength={2}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="border-zinc-300"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="invite-email" className="text-zinc-700">
                Email
              </Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="jane@eltru.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-zinc-300"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="invite-role" className="text-zinc-700">
                Role
              </Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as 'admin' | 'salesperson')}
              >
                <SelectTrigger id="invite-role" className="border-zinc-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="salesperson">Salesperson</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3 pt-1">
              <Button
                type="submit"
                disabled={loading}
                className="bg-zinc-900 hover:bg-zinc-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  'Send Invite'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="border-zinc-300"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

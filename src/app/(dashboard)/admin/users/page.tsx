import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import InviteUserDialog from './invite-user-dialog'
import DeactivateUserButton from './deactivate-user-button'

interface UserRow {
  id: string
  full_name: string
  email: string
  role: 'admin' | 'salesperson'
  is_active: boolean
  created_at: string
}

async function getUsers(currentUserId: string) {
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { data: currentUser } = await adminClient
    .from('users')
    .select('role')
    .eq('id', currentUserId)
    .single()

  if (currentUser?.role !== 'admin') return { users: null, role: currentUser?.role }

  const { data: users } = await adminClient
    .from('users')
    .select('id, full_name, email, role, is_active, created_at')
    .order('created_at', { ascending: false })

  return { users: users as UserRow[], role: 'admin' as const }
}

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { users, role } = await getUsers(user.id)

  if (role !== 'admin' || !users) {
    return (
      <div className="p-8 max-w-lg mx-auto mt-16 text-center space-y-4">
        <p className="text-zinc-600 font-medium">Access denied</p>
        <p className="text-sm text-zinc-400">
          You need admin privileges to view this page.
        </p>
        <a
          href="/dashboard"
          className="inline-flex items-center text-sm text-zinc-600 border border-zinc-300 rounded-lg px-3 py-1.5 hover:bg-zinc-50 transition-colors"
        >
          ← Back to Dashboard
        </a>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Users</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Manage team members and invite new users.
          </p>
        </div>
        <InviteUserDialog />
      </div>

      <div className="border border-zinc-200 rounded-xl bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50 hover:bg-zinc-50">
              <TableHead className="text-zinc-600 font-medium">Name</TableHead>
              <TableHead className="text-zinc-600 font-medium">Email</TableHead>
              <TableHead className="text-zinc-600 font-medium">Role</TableHead>
              <TableHead className="text-zinc-600 font-medium">Status</TableHead>
              <TableHead className="text-zinc-600 font-medium">Joined</TableHead>
              <TableHead className="text-zinc-600 font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id} className="hover:bg-zinc-50">
                <TableCell className="font-medium text-zinc-900">
                  {u.full_name || '—'}
                </TableCell>
                <TableCell className="text-zinc-600 text-sm">{u.email}</TableCell>
                <TableCell>
                  {u.role === 'admin' ? (
                    <Badge className="bg-zinc-900 text-white hover:bg-zinc-800 text-xs">
                      Admin
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-zinc-300 text-zinc-600 text-xs"
                    >
                      Salesperson
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {u.is_active ? (
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs">
                      Active
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-zinc-200 text-zinc-400 text-xs"
                    >
                      Inactive
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-zinc-500 text-sm">
                  {format(new Date(u.created_at), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  {u.id !== user.id && u.is_active && (
                    <DeactivateUserButton userId={u.id} />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

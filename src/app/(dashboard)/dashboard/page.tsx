import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FolderOpen, FileText, Users } from 'lucide-react'

async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { data: profile } = await adminClient
    .from('users')
    .select('full_name, email, role')
    .eq('id', user.id)
    .single()

  return profile as { full_name: string; email: string; role: string } | null
}

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const stats = [
    { label: 'Active Projects', value: 0, icon: FolderOpen },
    { label: 'Proposals Sent', value: 0, icon: FileText },
    { label: 'Clients', value: 0, icon: Users },
  ]

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">
          Welcome back, {user.full_name || user.email}
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Here&apos;s what&apos;s happening in your workspace.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="border-zinc-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-zinc-600">
                {label}
              </CardTitle>
              <Icon className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-zinc-900">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent projects placeholder */}
      <Card className="border-zinc-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-zinc-900">
            Recent Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-400">Coming in Session 2-1</p>
        </CardContent>
      </Card>
    </div>
  )
}

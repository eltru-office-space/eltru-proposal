import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const InviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  role: z.enum(['admin', 'salesperson']),
})

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function POST(request: NextRequest) {
  // ---- Auth: verify requesting user is authenticated ----
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ---- Auth: verify role = 'admin' from public.users (not JWT) ----
  const adminClient = getAdminClient()
  const { data: profile } = await adminClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ---- Validate body ----
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = InviteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { email, full_name, role } = parsed.data

  // ---- Send invite via Supabase Admin ----
  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    email,
    { data: { full_name, role } }
  )

  if (inviteError) {
    console.error('[invite] Supabase invite error:', inviteError.message)
    return NextResponse.json(
      { error: 'Failed to send invite. User may already exist.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ message: `Invite sent to ${email}` })
}

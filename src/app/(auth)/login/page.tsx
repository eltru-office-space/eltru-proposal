import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LoginForm from './login-form'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  // If already logged in, go to dashboard
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  const { error } = await searchParams

  const errorMessages: Record<string, string> = {
    invalid_link: 'Your invite link is invalid or has expired.',
    account_inactive: 'Your account has been deactivated. Contact your admin.',
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <LoginForm serverError={error ? (errorMessages[error] ?? null) : null} />
    </div>
  )
}

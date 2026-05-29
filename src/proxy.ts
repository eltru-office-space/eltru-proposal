import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isDashboard = pathname.startsWith('/dashboard')
  const isAdmin = pathname.startsWith('/admin')
  const isAuthRoute = pathname.startsWith('/api/auth')
  const isLogin = pathname === '/login'

  // Allow public auth API routes
  if (isAuthRoute) return NextResponse.next()

  // Skip Supabase session check when env vars are not yet configured
  const supabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('http') &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseConfigured) {
    return NextResponse.next()
  }

  const { supabaseResponse, user } = await updateSession(request)
  const isAuthed = !!user

  if (!isAuthed && (isDashboard || isAdmin)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthed && isLogin) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

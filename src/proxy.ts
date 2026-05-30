import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isDashboard = pathname.startsWith('/dashboard')
  const isAdmin = pathname.startsWith('/admin')
  const isAuthRoute = pathname.startsWith('/api/auth')
  const isLogin = pathname === '/login'

  // Always allow public auth API routes
  if (isAuthRoute) return NextResponse.next()

  // Skip all Supabase checks when env vars are not yet configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

  const supabaseConfigured =
    supabaseUrl.startsWith('http') && !!supabaseAnonKey

  if (!supabaseConfigured) return NextResponse.next()

  // ---- Refresh session via SSR client ----
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  const isAuthed = !!user

  // Redirect unauthenticated users away from protected routes
  if (!isAuthed && (isDashboard || isAdmin)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect authenticated users away from login
  if (isAuthed && isLogin) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // ---- is_active check for authenticated users on protected routes ----
  if (isAuthed && user && (isDashboard || isAdmin) && serviceRoleKey) {
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    const { data: profile } = await adminClient
      .from('users')
      .select('is_active')
      .eq('id', user.id)
      .single()

    if (profile && profile.is_active === false) {
      // Sign them out and redirect
      await supabase.auth.signOut()
      return NextResponse.redirect(
        new URL('/login?error=account_inactive', request.url)
      )
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

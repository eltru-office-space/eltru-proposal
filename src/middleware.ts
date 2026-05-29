import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  const isAuthed = !!user
  const isDashboard = pathname.startsWith('/dashboard')
  const isAdmin = pathname.startsWith('/admin')
  const isAuthRoute = pathname.startsWith('/api/auth')
  const isLogin = pathname === '/login'

  // Allow public auth API routes
  if (isAuthRoute) return supabaseResponse

  // Redirect unauthenticated users away from protected routes
  if (!isAuthed && (isDashboard || isAdmin)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect authenticated users away from login
  if (isAuthed && isLogin) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Admin route protection — role check happens server-side in the page
  // Middleware just ensures the user is authenticated; the admin page
  // redirects to /dashboard if the role is not 'admin'
  if (isAdmin && !isAuthed) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

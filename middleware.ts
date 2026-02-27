
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host')
  const adminDomain = process.env.ADMIN_DOMAIN || 'zoro-secure-control-net.com'
  const appDomain = process.env.APP_DOMAIN || 'app.zoro-pilot.com'

  // 1. Logic for Admin Domain
  if (hostname === adminDomain) {
    // If we're at the root of the admin domain, rewrite to the secure BO folder
    if (url.pathname === '/') {
      url.pathname = '/bo-zoro-control-2026-secure'
      return NextResponse.rewrite(url)
    }
    
    // Allow access only to BO related sub-paths
    if (!url.pathname.startsWith('/bo-zoro-control-2026-secure') && 
        !url.pathname.startsWith('/login') && 
        !url.pathname.startsWith('/auth')) {
      // Forbidden or redirect to login on the admin domain
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  // 2. Logic for Main App Domain
  if (hostname === appDomain) {
    // Block direct access to the secure BO path from the main app domain
    if (url.pathname.startsWith('/bo-zoro-control-2026-secure')) {
      return new NextResponse('Access Denied', { status: 403 })
    }
  }

  // 3. Fallback for unknown domains (optional but safer)
  if (hostname !== adminDomain && hostname !== appDomain && process.env.NODE_ENV === 'production') {
    // You might want to allow this for local development (localhost)
    // but in production, we only want our two domains
  }

  // Always update session to keep the user logged in
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public assets)
     * - login (login page)
     * - auth (auth callback routes)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|login|auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}


import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host')
  const adminDomain = process.env.ADMIN_DOMAIN || 'zoro-secure-control-net.com'
  const appDomain = process.env.APP_DOMAIN || 'app.zoro-pilot.company'

  const sessionResponse = await updateSession(request)

  // 1. Logic for Admin Domain
  if (hostname === adminDomain) {
    // If updateSession already decided to redirect (e.g. to /login or /onboarding), respect it
    if (sessionResponse.status >= 300 && sessionResponse.status < 400) {
      return sessionResponse
    }

    // Set a context cookie for the client components
    sessionResponse.cookies.set('zoro-platform-context', 'admin', { httpOnly: false, sameSite: 'lax' })

    // If the path doesn't already start with the secret BO folder, rewrite it
    if (!url.pathname.startsWith('/bo-zoro-control-2026-secure') && 
        !url.pathname.startsWith('/login') && 
        !url.pathname.startsWith('/auth') &&
        !url.pathname.startsWith('/_next') &&
        !url.pathname.match(/\.(?:svg|png|jpg|jpeg|gif|webp|ico)$/)) {
      
      // Rewrite all admin domain paths to the secret BO folder
      url.pathname = `/bo-zoro-control-2026-secure${url.pathname === '/' ? '' : url.pathname}`
      
      // Create rewrite response but keep cookies from sessionResponse
      const rewriteResponse = NextResponse.rewrite(url)
      
      // Copy cookies from sessionResponse to rewriteResponse
      sessionResponse.cookies.getAll().forEach(cookie => {
        rewriteResponse.cookies.set(cookie.name, cookie.value, cookie)
      })
      
      return rewriteResponse
    }
    
    return sessionResponse
  }

  // 2. Logic for Main App Domain
  if (hostname === appDomain) {
    // If updateSession already decided to redirect, respect it
    if (sessionResponse.status >= 300 && sessionResponse.status < 400) {
      return sessionResponse
    }

    sessionResponse.cookies.set('zoro-platform-context', 'app', { httpOnly: false, sameSite: 'lax' })
    
    // Block direct access to the secure BO path from the main app domain
    if (url.pathname.startsWith('/bo-zoro-control-2026-secure')) {
      return new NextResponse('Access Denied', { status: 403 })
    }

    return sessionResponse
  }

  // 3. Fallback for localhost (local development)
  if (hostname?.includes('localhost') || hostname?.includes('127.0.0.1')) {
    // Keep standard behavior for dev
    return sessionResponse
  } else if (hostname !== adminDomain && hostname !== appDomain && process.env.NODE_ENV === 'production') {
    // In production, only allow our two domains
    return new NextResponse('Domain Not Allowed', { status: 403 })
  }

  // Always update session to keep the user logged in
  return sessionResponse
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


import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    // Check if onboarding is needed
    const { data: profile } = await supabase
      .from('profiles')
      .select('rbac_role, onboarding_completed, organization_id')
      .eq('id', user.id)
      .single()

    const isDG = profile?.rbac_role === 'admin' || profile?.rbac_role === 'executive'
    const isEmployee = profile?.rbac_role === 'member' || profile?.rbac_role === 'manager'

    const needsDGOnboarding = isDG && !profile?.onboarding_completed
    const needsEmployeeOnboarding = isEmployee && !profile?.onboarding_completed

    const isLoginPage = request.nextUrl.pathname.startsWith('/login')
    const isDGOnboardingPage = request.nextUrl.pathname.startsWith('/onboarding')
    const isEmployeeOnboardingPage = request.nextUrl.pathname.startsWith('/employee-onboarding')

    // Redirect DG to their onboarding
    if (needsDGOnboarding && !isDGOnboardingPage) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }

    // Redirect employee to their onboarding
    if (needsEmployeeOnboarding && !isEmployeeOnboardingPage) {
      const url = request.nextUrl.clone()
      url.pathname = '/employee-onboarding'
      return NextResponse.redirect(url)
    }

    // If user is on the wrong onboarding page, redirect to correct one or home
    if (isDGOnboardingPage && !needsDGOnboarding) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
    if (isEmployeeOnboardingPage && !needsEmployeeOnboarding) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    // no user, respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    
    // Pass current path as next parameter to redirect back after login
    url.searchParams.set('next', request.nextUrl.pathname)
    
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { safeCompare } from '../utils'

// Routes that require exec role
const EXEC_ONLY_ROUTES = [
  '/dashboard/hub',
  '/dashboard/watchtower',
  '/dashboard/services',
  '/dashboard/media-buyer', // Main WhatsApp page (not /dashboard/media-buyer/[id]/...)
]

function isExecOnlyRoute(pathname: string): boolean {
  // Check if it's the main media-buyer page (not a sub-route like /media-buyer/[id]/whatsapp)
  if (pathname === '/dashboard/media-buyer') {
    return true
  }

  // Check other exec-only routes
  return EXEC_ONLY_ROUTES.some(
    (route) => route !== '/dashboard/media-buyer' && pathname.startsWith(route),
  )
}

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
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  const API_SECRET_KEY = process.env.PRIVATE_API_KEY

  if (user) {
    if (request.nextUrl.pathname === '/login') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    // Check exec-only routes
    const role = user.user_metadata?.role ?? 'exec'
    if (isExecOnlyRoute(request.nextUrl.pathname) && role !== 'exec') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  } else if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  } else if (request.nextUrl.pathname.startsWith('/api')) {
    const apiKey = request.headers.get('x-api-key')

    // If no key provided, block
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 401 })
    }

    // Use constant-time comparison to prevent timing attacks
    const isValid = await safeCompare(apiKey, process.env.PRIVATE_API_KEY!)

    if (!isValid) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}

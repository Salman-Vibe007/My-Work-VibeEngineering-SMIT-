import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

const publicRoutes = ['/', '/templates', '/pricing', '/features', '/about', '/contact', '/privacy', '/terms', '/disclaimer']
const authRoutes = ['/signin', '/signup', '/forgot-password', '/reset-password']

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isApiRoute = pathname.startsWith('/api')
  if (isApiRoute) {
    return NextResponse.next()
  }

  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET })
  const isLoggedIn = !!token

  const isPublicRoute = publicRoutes.includes(pathname)
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  if (!isLoggedIn && !isPublicRoute) {
    const signInUrl = new URL('/signin', request.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
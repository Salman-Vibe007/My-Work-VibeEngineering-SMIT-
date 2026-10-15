import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

const publicRoutes = ['/', '/templates', '/pricing', '/features', '/about', '/contact', '/privacy', '/terms', '/disclaimer']
const authRoutes = ['/signin', '/signup', '/forgot-password', '/reset-password']

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const pathname = req.nextUrl.pathname

  const isPublicRoute = publicRoutes.includes(pathname)
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))
  const isApiRoute = pathname.startsWith('/api')

  if (isApiRoute) {
    return NextResponse.next()
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  if (!isLoggedIn && !isPublicRoute) {
    const signInUrl = new URL('/signin', req.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
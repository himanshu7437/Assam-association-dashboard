import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js proxy routing filter (replaces middleware.ts)
 * Protects dashboard routes and redirects unauthenticated users.
 */
export function proxy(request: NextRequest) {
  const adminAuthCookie = request.cookies.get('admin_auth');
  const { pathname } = request.nextUrl;

  // Protect all dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!adminAuthCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect root to dashboard (or login if not authenticated)
  if (pathname === '/') {
    if (adminAuthCookie) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // If trying to access login page while authenticated
  if (pathname === '/login' && adminAuthCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Apply proxy filter to root, dashboard routes, and login
  matcher: ['/', '/dashboard/:path*', '/login'],
};

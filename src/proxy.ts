import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js 16.2.0 Proxy (formerly Middleware)
 * Protects the dashboard routes from unauthorized access.
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Protect all dashboard routes
  if (pathname.startsWith('/dashboard')) {
    const authCookie = request.cookies.get('admin_auth');
    if (!authCookie) {
      // Redirect to login if the custom admin_auth cookie is missing
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // If going to login but already authenticated, redirect to more efficient dashboard path
  if (pathname === '/login') {
    const authCookie = request.cookies.get('admin_auth');
    if (authCookie) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Use matcher for performance optimization
  matcher: ['/dashboard/:path*', '/login'],
};

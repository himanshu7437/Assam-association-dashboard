import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Protect all dashboard routes
  if (pathname.startsWith('/dashboard')) {
    const authCookie = request.cookies.get('admin_auth');
    if (!authCookie) {
      // Redirect to login if cookie is missing
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // If going to login but already authenticated, redirect to dashboard
  if (pathname === '/login') {
    const authCookie = request.cookies.get('admin_auth');
    if (authCookie) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};

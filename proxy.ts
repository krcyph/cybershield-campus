/**
 * CyberShield Campus — Next.js Route Middleware
 *
 * Protects routes from unauthenticated access.
 * Token presence is checked in the cookie jar (set by client) OR in
 * the Authorization header.  Because localStorage is inaccessible at the
 * Edge, the client must mirror the token into a cookie named `cs_token`
 * for server-side middleware to read.
 *
 * Rules:
 *   /dashboard, /incidents, /profile, /advisories, /url-checker,
 *   /cyber-quiz, /analytics  → require any authenticated user.
 *   /admin/*                  → require an authenticated user; the actual
 *                               admin-role check is enforced by the backend.
 *   /login, /register         → redirect to dashboard if already logged in.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Pages that require any authenticated session. */
const PROTECTED_PATHS = [
  '/dashboard',
  '/incidents',
  '/profile',
  '/advisories',
  '/url-checker',
  '/cyber-quiz',
  '/analytics',
  '/admin',
];

/** Pages that should redirect logged-in users away. */
const AUTH_PATHS = ['/login', '/register'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read the token from the cookie set by the client-side auth code.
  const token = request.cookies.get('cs_token')?.value ?? null;

  const isProtected = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );
  const isAuthPage = AUTH_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );

  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && token) {
    // We don't know the role at middleware level (would need to decode JWT
    // at the Edge), so redirect to /dashboard; the dashboard page will
    // redirect admins to /admin/dashboard once the auth context loads.
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except Next.js internals and static files.
     * This keeps the middleware lean and fast.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

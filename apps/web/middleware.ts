/**
 * Runs before every page: without a login cookie, go to /login.
 * (Whether the token is still valid is checked by the API; see lib/api.ts.)
 */
import { NextResponse, type NextRequest } from 'next/server';

const TOKEN_COOKIE = 'eduplatform_token'; // same name as in lib/session.ts
const OPEN_PAGES = ['/login', '/logout'];

export function middleware(request: NextRequest) {
  const loggedIn = request.cookies.has(TOKEN_COOKIE);
  const open = OPEN_PAGES.some((page) => request.nextUrl.pathname.startsWith(page));

  if (!loggedIn && !open) return NextResponse.redirect(new URL('/login', request.url));
  if (loggedIn && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }
  return NextResponse.next();
}

// Every page, but not Next.js's own files and images.
export const config = { matcher: ['/((?!_next/|favicon.ico).*)'] };

/**
 * /logout: clears the login cookie and goes to the login page.
 * Used by the "Log out" button (POST) and when the session has ended (GET, from lib/api.ts).
 */
import { NextResponse, type NextRequest } from 'next/server';
import { TOKEN_COOKIE } from '../../lib/session';

function logout(request: NextRequest) {
  // 303 = "see the login page", always opened with GET (also after the POST of the button).
  const response = NextResponse.redirect(new URL('/login', request.url), 303);
  response.cookies.delete(TOKEN_COOKIE);
  return response;
}

export const GET = logout;
export const POST = logout;

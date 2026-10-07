/**
 * /logout: ends the login session at the API (the token stops working at once, ADR-0028),
 * clears the login cookie and goes to the login page.
 * Used by the "Log out" button (POST) and when the session has ended (GET, from lib/api.ts).
 */
import { NextResponse, type NextRequest } from 'next/server';
import { endSession } from '../../lib/api';
import { TOKEN_COOKIE } from '../../lib/session';

async function logout(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  if (token) await endSession(token);
  // 303 = "see the login page", always opened with GET (also after the POST of the button).
  const response = NextResponse.redirect(new URL('/login', request.url), 303);
  response.cookies.delete(TOKEN_COOKIE);
  return response;
}

export const GET = logout;
export const POST = logout;

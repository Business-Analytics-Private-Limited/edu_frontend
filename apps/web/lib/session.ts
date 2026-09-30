/**
 * The login session: the token from the API, kept in a cookie that the browser's JavaScript
 * can't read (httpOnly). Only the Next.js server reads it, and sends it to the API.
 */
import 'server-only';
import { cookies } from 'next/headers';

/** Name of the cookie. Different from the admin console's, because cookies are shared across ports. */
export const TOKEN_COOKIE = 'eduplatform_token';

export async function getToken(): Promise<string | undefined> {
  return (await cookies()).get(TOKEN_COOKIE)?.value;
}

export async function setToken(token: string) {
  (await cookies()).set(TOKEN_COOKIE, token, {
    httpOnly: true, // not readable by JavaScript in the browser
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    path: '/',
    maxAge: 8 * 60 * 60, // 8 hours, like the token itself
  });
}

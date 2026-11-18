/**
 * Calls the backend API from the Next.js SERVER (pages and actions), with the logged-in
 * person's token.
 *
 *   const dashboard = await api<Dashboard>('/super-admin/dashboard');
 *   await api('/super-admin/organizations', { method: 'POST', body: { ... } });
 *
 * - 401 (not logged in / session ended): goes to /logout, which clears the cookie and shows login.
 * - 403 "Change your temporary password first": goes to /change-password (ADR-0028).
 * - 403 on a page: shows the "No access" message instead of a crash.
 * - Other errors throw ApiError with the API's message, for forms to show.
 */
import 'server-only';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getToken } from './session';

const API_URL = process.env.API_URL ?? 'http://localhost:3000/api/v1';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    /** The API's whole answer, for extra fields such as `twoFactorRequired`. */
    readonly details: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** false for the login call, which is made before there is a token. */
  withToken?: boolean;
}

export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, withToken = true } = options;
  const token = withToken ? await getToken() : undefined;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(await visitor()),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store', // always fresh data
  });

  if (response.status === 401 && withToken) redirect('/logout');
  const data = await response.json().catch(() => ({}));
  if (response.status === 403 && data.message === CHANGE_PASSWORD_FIRST) {
    redirect('/change-password');
  }
  if (response.status === 403 && method === 'GET') redirect('/no-access');

  if (!response.ok) throw new ApiError(response.status, messageOf(data), data);
  return data as T;
}

/** The API's answer while someone still has a temporary password (ADR-0028). */
const CHANGE_PASSWORD_FIRST = 'Change your temporary password first';

/**
 * The visitor's address, passed on to the API (ADR-0028). The API is called from this server,
 * so without it every visitor would look the same: one rate limit for everybody, and no
 * address in the audit log. Next.js sets x-forwarded-for; in production the web server in front
 * (nginx, ...) must set it to the real address.
 */
async function visitor(): Promise<Record<string, string>> {
  try {
    const address = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim();
    return address ? { 'X-Forwarded-For': address } : {};
  } catch {
    return {}; // not inside a request (e.g. during a build)
  }
}

/** Ends the login session at the API (logout), ignoring errors: the cookie goes anyway. */
export async function endSession(token: string): Promise<void> {
  await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, ...(await visitor()) },
    cache: 'no-store',
  }).catch(() => undefined);
}

/** The API's error message. Validation errors come as a list; they are joined into one line. */
function messageOf(data: { message?: string | string[] }): string {
  if (Array.isArray(data.message)) return data.message.join('. ');
  return data.message ?? 'Something went wrong';
}

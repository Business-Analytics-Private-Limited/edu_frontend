/**
 * Calls the backend API from the Next.js SERVER (pages and actions), with the logged-in
 * person's token.
 *
 *   const institutions = await api<Institution[]>('/institutions');
 *   await api('/institutions', { method: 'POST', body: { name, code, type } });
 *
 * - 401 (not logged in / session ended): goes to /logout, which clears the cookie and shows login.
 * - 403 on a page: shows the "No access" message instead of a crash.
 * - Other errors throw ApiError with the API's message, for forms to show.
 */
import 'server-only';
import { redirect } from 'next/navigation';
import { getToken } from './session';

const API_URL = process.env.API_URL ?? 'http://localhost:3000/api/v1';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
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
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store', // always fresh data
  });

  if (response.status === 401 && withToken) redirect('/logout');
  if (response.status === 403 && method === 'GET') redirect('/no-access');

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(response.status, messageOf(data));
  return data as T;
}

/** The API's error message. Validation errors come as a list; they are joined into one line. */
function messageOf(data: { message?: string | string[] }): string {
  if (Array.isArray(data.message)) return data.message.join('. ');
  return data.message ?? 'Something went wrong';
}

/** For server actions: the message to show when an API call failed. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'The server is not reachable. Is the backend running?';
}

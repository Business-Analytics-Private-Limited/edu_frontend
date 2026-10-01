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

/** Sends a form with a file (multipart) to the API, e.g. a student document. */
export async function apiUpload<T = unknown>(path: string, form: FormData): Promise<T> {
  const token = await getToken();
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form, // fetch sets the multipart Content-Type with its boundary
    cache: 'no-store',
  });
  if (response.status === 401) redirect('/logout');
  const data = await response.json().catch(() => ({}));
  if (response.status === 413) throw new ApiError(413, 'The file is bigger than 5 MB');
  if (!response.ok) throw new ApiError(response.status, messageOf(data));
  return data as T;
}

/**
 * Passes a file download from the API through to the browser (route handlers), with the
 * user's token, which never reaches the browser.
 */
export async function apiDownload(path: string): Promise<Response> {
  const token = await getToken();
  const response = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  });
  if (!response.ok || !response.body) {
    return new Response(response.status === 404 ? 'File not found' : 'Not allowed', {
      status: response.status === 404 ? 404 : 403,
    });
  }
  const headers = new Headers();
  for (const name of ['content-type', 'content-length', 'content-disposition', 'cache-control']) {
    const value = response.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new Response(response.body, { status: 200, headers });
}

/**
 * Calling the backend API from the Next.js SERVER.
 *
 * Why only from the server: the user's access token must never reach browser JavaScript
 * (security baseline). Server components and route handlers call these functions; the
 * browser only ever talks to this Next.js app.
 *
 * Types come from @eduplatform/api (the copy of the backend contract), so a changed API shows
 * up as a TypeScript error after `pnpm api:sync`.
 */
import 'server-only';
import type { ApiProblem, ApiResponse } from '@eduplatform/api';

/** Base URL of the backend API, e.g. http://localhost:3000/api/v1 (set in .env.local). */
const API_URL = process.env.API_URL ?? 'http://localhost:3000/api/v1';

/** Thrown when the API answers with an error. `problem` has the details (RFC 9457). */
export class ApiError extends Error {
  constructor(readonly problem: ApiProblem) {
    super(problem.detail ?? problem.title);
  }
}

/** GET a JSON endpoint. Phase 2 adds the user's access token here. */
async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    cache: 'no-store', // always fresh data; pages decide their own caching later
    headers: { accept: 'application/json' },
  });
  if (!response.ok) throw new ApiError((await response.json()) as ApiProblem);
  return (await response.json()) as T;
}

/** GET /health: is the backend running? */
export function getHealth(): Promise<ApiResponse<'/health', 'get'>> {
  return apiGet('/health');
}

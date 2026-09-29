/**
 * Types of the backend API, generated from openapi.json by `pnpm api:sync`.
 *
 * `paths` describes every endpoint. Example: the JSON body of GET /health on success is
 *
 *   ApiResponse<'/health', 'get'>
 *
 * See apps/web/lib/api.ts for how the apps call the API with these types.
 */
import type { paths } from './generated/openapi';

export type { components, operations, paths } from './generated/openapi';

type Method = 'get' | 'put' | 'post' | 'delete' | 'patch';

/** The JSON body of a successful (200) response of one endpoint. */
export type ApiResponse<
  P extends keyof paths,
  M extends Method & keyof paths[P],
> = paths[P][M] extends { responses: { 200: { content: { 'application/json': infer Body } } } }
  ? Body
  : never;

/**
 * An error response from the API (RFC 9457 problem details), the same shape for every
 * endpoint. Show `title`/`detail` to users; quote `requestId` when reporting a problem.
 */
export interface ApiProblem {
  type: string;
  title: string;
  status: number;
  code: string;
  detail?: string;
  requestId?: string;
  errors?: { path: string; code: string; message: string }[];
}

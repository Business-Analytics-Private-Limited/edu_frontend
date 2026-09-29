# Working with the API

The frontend knows the backend only through its **API contract**, an OpenAPI document. This repository keeps a copy of it in `packages/api/openapi.json`, and TypeScript types generated from that copy.

## Reading data in a page

Pages call the backend from the Next.js **server**, never from the browser (the user's token must stay on the server). The pattern, from `apps/web`:

```ts
// lib/api.ts: one typed function per endpoint
export function getHealth(): Promise<ApiResponse<'/health', 'get'>> {
  return apiGet('/health');
}

// app/page.tsx: a server component
const health = await getHealth();
health.data.status;   // TypeScript knows this field from the contract
```

`ApiResponse<'/path', 'method'>` gives the JSON body of a successful response. Failed calls throw `ApiError`, whose `problem` field holds the API's error details.

## When the backend changes

The backend team announces contract changes in their pull request. Then:

1. `pnpm api:sync` (with the backend running), or
   `pnpm api:sync -- --from <path to openapi.json>` (with a file from the backend team).
2. `pnpm typecheck`: every page or function using a changed endpoint shows an error. Fix them.
3. Commit `packages/api/openapi.json` and `packages/api/src/generated/openapi.ts` together with the fixes.

CI runs `pnpm api:check`, which fails if someone edited the contract or the types by hand.

## Where to learn what an endpoint does

- Swagger UI at http://localhost:3000/api/docs (backend running): every endpoint, its fields, examples and error codes, with "Try it out".
- The Postman collection from the backend team.
- Conventions every endpoint follows (pagination, errors, headers) are summarised in Swagger's descriptions; the backend team owns the full document.

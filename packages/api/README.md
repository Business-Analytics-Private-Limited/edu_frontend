# API contract (copy)

`@eduplatform/api`: this repository's copy of the backend API contract, and the TypeScript types generated from it. It is the only link between frontend and backend.

| File | What it is | Edit? |
|---|---|---|
| `openapi.json` | The backend's API contract, copied by `pnpm api:sync` | never by hand |
| `src/generated/openapi.ts` | Types generated from `openapi.json` | never by hand |
| `src/index.ts` | Helper types: `ApiResponse<'/path', 'get'>`, `ApiProblem` | yes |
| `scripts/sync.mjs` | The sync and check script | rarely |

## When the backend changes an API

1. Start the backend (`pnpm dev` in the backend repository), or get `openapi.json` from the backend team.
2. From this repository's root:

   ```sh
   pnpm api:sync                                    # from the running backend
   pnpm api:sync -- --from ..\eduplatform-backend\packages\contracts\dist\openapi.json   # from a file
   ```

3. `pnpm typecheck` shows every place that must change.
4. Commit `openapi.json` and `src/generated/openapi.ts` together with your fixes.

To browse the API: Swagger UI at http://localhost:3000/api/docs when the backend runs, or the backend team's Postman collection.

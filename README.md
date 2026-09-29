# EduPlatform frontend (working name)

The web app and super admin console of EduPlatform, a multi-tenant management platform for educational institutions.

This repository contains **only frontend code**. The backend (services, API, database, product design documents) lives in the separate **eduplatform-backend** repository. The two are linked by exactly one thing: the **API contract** (`packages/api/openapi.json`).

## Getting started (Windows)

Prerequisites: Node.js 24 LTS (see `.nvmrc`), pnpm 10 (`corepack enable` in an administrator terminal).

```sh
pnpm install
copy .env.example apps\web\.env.local     # where the backend API runs
copy .env.example apps\admin\.env.local
pnpm dev                                  # starts both apps
```

| URL | App |
|---|---|
| http://localhost:3001 | Web app (institution staff, parents, students) |
| http://localhost:3003 | Super admin console |

The apps show data only when the backend is running (ask the backend team, or run it from its repository). Without it, pages still open and say the API is not reachable.

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Both apps in watch mode |
| `pnpm dev:web` / `pnpm dev:admin` | One app |
| `pnpm build` | Production build |
| `pnpm lint` | Code rules |
| `pnpm typecheck` | TypeScript errors, including API mismatches after a sync |
| `pnpm format` | Formats all code |
| `pnpm api:sync` | Copies the latest API contract from the backend and regenerates the types ([details](docs/working-with-the-api.md)) |
| `pnpm api:check` | Checks the generated types match the contract (run in CI) |

Before you push: `pnpm lint && pnpm typecheck && pnpm build`. CI runs the same.

## Folders

| Folder / file | What it is |
|---|---|
| `apps/web/` | Next.js app for institution staff, parents and students. `app/` = pages, `lib/api.ts` = calling the backend |
| `apps/admin/` | Next.js super admin console |
| `packages/api/` | The copy of the backend API contract and the TypeScript types generated from it |
| `packages/ui/` | Shared UI components (Tailwind + shadcn/ui from Phase 2) |
| `packages/config/` | Shared TypeScript settings |
| `docs/` | Frontend guides |
| `.github/workflows/` | CI |
| `package.json`, `pnpm-workspace.yaml`, `turbo.json` | Commands, packages, task runner |
| `eslint.config.mjs`, `.prettierrc.json`, `.editorconfig` | Code rules and formatting |
| `.env.example` | Template for each app's `.env.local` |
| `CLAUDE.md` | The working agreement: rules for this repository |

Generated folders, never edited or committed: `node_modules/`, `.next/`, `.turbo/`.

## Learning the API

- **Swagger UI:** http://localhost:3000/api/docs while the backend runs.
- **Postman:** the collection from the backend team.
- **Types:** `@eduplatform/api` in your editor; hover a response to see its fields.

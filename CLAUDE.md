# Working agreement for this repository

This is the **frontend** repository of EduPlatform: Next.js web app and super admin console. The backend is a separate repository (eduplatform-backend); product and architecture decisions are recorded there in `docs/` and `docs/adr/`. If a frontend change needs a backend change, the backend changes first.

## Rules

1. **The API contract is the only link to the backend.** Types come from `@eduplatform/api` (`packages/api/openapi.json`, updated with `pnpm api:sync`). Never hand-write types for API responses, and never edit `openapi.json` or `src/generated/` by hand.
2. **Tokens never reach the browser.** Only Next.js server code (server components, route handlers, `lib/api.ts`) calls the API with the user's token. The session lives in an `httpOnly` cookie.
3. **The frontend hides, the API decides.** Screens hide what a user can't do (sidebar from `/me/bootstrap`, a `<Can permission>` component from Phase 2), but every rule is enforced by the API. Never treat hiding as security.
4. **Show "Module not available" or "No access" pages**, never broken screens, when a module or permission is missing.
5. **Errors:** API errors are RFC 9457 problems (`ApiProblem`); show `title`/`detail`, and include `requestId` in anything a user may report.
6. **Time zone, currency and date format come from the institution's settings**, never from the browser or hard-coded values.
7. **UI text is written so it can be translated later** (English first; Telugu and Hindi later).
8. Don't reuse the previous single-institute product's name anywhere. "EduPlatform" is a working name.

## Stack

Next.js (App Router) + React + TypeScript (strict), pnpm + Turborepo, Tailwind CSS + shadcn/ui (from Phase 2). Node.js 24.

## Code style

Code must be easy to read for new developers and interns: a short comment at the top of each file saying what it is for, comments that explain *why*, and small components.

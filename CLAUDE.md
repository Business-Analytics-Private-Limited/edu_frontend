# Working agreement for this repository

This is the **frontend** repository of EduPlatform: the web app (`apps/web`, an organization's staff) and the super admin console (`apps/admin`, EduPlatform staff). The backend is a separate repository (eduplatform-backend); product and architecture decisions are recorded there in `docs/` and `docs/adr/`. If a frontend change needs a backend change, the backend changes first.

## Rules

1. **Simple, conventional code.** Code must be easy to read for freshers and interns. Every page follows the same pattern: `page.tsx` (server component that loads data with `api()`), `actions.ts` (server actions for forms), `<ActionForm>` for every form. No extra layers, generators or clever abstractions.
2. **Tokens never reach the browser.** Only Next.js server code (`lib/api.ts`, pages, server actions, route handlers) calls the API with the user's token. The token lives in an `httpOnly` cookie (`eduplatform_token` for web, `eduplatform_admin_token` for admin).
3. **The frontend hides, the API decides.** Screens hide what a user can't do: `can(me, permission)` for menus, `canAt(me, permission, place)` for buttons on a record of an institution / campus (`lib/me.ts`). Every rule is enforced by the API. Never treat hiding as security.
4. **Show the "No access" page**, never a broken screen, when the API answers 403 (`lib/api.ts` does this for pages).
5. **API types** live in each app's `lib/types.ts`, written from Swagger (http://localhost:3000/api/docs). Keep them in line with the backend's responses.
6. **UI text is written so it can be translated later** (English first; Telugu and Hindi later).
7. **Every page opened from another page has a way back:** `<PageHeader back={{ href: '/students', label: 'Back to students' }} />` on details, "new", settings and other sub-pages. Keep the context in `href` where the parent page has one (e.g. the campus or date). Only pages in the menu with no parent page go without.
8. **Every action tells the user what happened.** A server action returns `{ success: '…' }` or `{ error }`, never `{}`; `<ActionForm>` then shows it in the form and as a pop-up alert. Ask "Are you sure?" with `confirmMessage` (or `confirmDialog()`), never the browser's `confirm()`. An action that redirects calls `await flash('…')` before `redirect()`.
9. Don't reuse the previous single-institute product's name anywhere. "EduPlatform" is a working name.

## Stack

Next.js 15 (App Router, server actions) + React 19 + TypeScript (strict), Tailwind CSS 4, npm workspaces (one `node_modules`). Node.js 22+.

## Code style

A short comment at the top of each file saying what it is for, comments that explain *why*, small components. Before pushing: `npm run lint && npm run typecheck && npm run build`.

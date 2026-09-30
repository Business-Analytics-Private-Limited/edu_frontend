# EduPlatform frontend (working name)

The two websites of EduPlatform, a platform for schools and colleges. The backend (API, database, design documents) lives in the separate **eduplatform-backend** repository. The frontend talks to it only via HTTP: `http://localhost:3000/api/v1`, documented in Swagger at http://localhost:3000/api/docs.

| App | URL | Who logs in | What they do |
|---|---|---|---|
| **Super admin console** (`apps/admin`) | http://localhost:3003 | EduPlatform staff | Dashboard; create organizations with their first admin; switch modules on/off; suspend / activate; **predefined roles** (what Director, Principal, Campus admin… may do, for every organization); change password |
| **Web app** (`apps/web`) | http://localhost:3001 | An organization's staff | Dashboard (your roles and places, numbers for your part, quick actions); organization; institutions and campuses; users with **roles at places**; own roles (View / Create / Edit / Delete grid); audit log (who, where, what); change password |

Everyone in an organization uses the same web app, but sees only what their roles allow, **where** they apply: a Campus admin sees and manages only their campus, a Principal their institution, an Organization admin everything.

## Getting started (Windows)

Prerequisites: Node.js 22 or newer, and the backend running (see its README).

```sh
npm install  # ONE install for both apps (one node_modules at the top)
copy .env.example apps\web\.env.local
copy .env.example apps\admin\.env.local
npm run dev  # starts both apps
```

Try it:

1. Open http://localhost:3003 and log in as the super admin (the `SEED_SUPER_ADMIN_...` values in the backend's `.env`).
2. **Organizations → New organization**: fill in the organization and its first admin.
3. Open http://localhost:3001 and log in with that admin's email and password.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Both apps in watch mode |
| `npm run dev:web` / `npm run dev:admin` | One app |
| `npm run build` | Production build of both apps |
| `npm run lint` | Code rules |
| `npm run typecheck` | TypeScript errors |
| `npm run format` | Formats all code |

Before you push: `npm run lint && npm run typecheck && npm run build`. CI runs the same.

## How a page works (read this first)

Every page follows the same pattern. Take **Institutions** (`apps/web/app/(app)/institutions/`):

| File | Runs on | What it does |
|---|---|---|
| `page.tsx` | server | Loads data with `api('/institutions')` and renders the table and the "Add institution" form |
| `actions.ts` | server | `createInstitution(...)`: what happens when the form is sent. Calls the API, returns `{ error }` or `{ success }` |
| `[id]/page.tsx` | server | One institution: `/institutions/<id>` |

The flow when a user adds an institution:

```
browser form ──> actions.ts createInstitution() ──> POST /api/v1/institutions (with the user's token)
                        │                                     │
                        │ <── { error: "code already used" } ─┘ (shown above the form)
                        └── revalidatePath('/institutions') ──> page.tsx loads the list again
```

The shared pieces:

| File | What it does |
|---|---|
| `lib/api.ts` | `api(path, { method, body })`: calls the backend with the login token. Session ended → login page; no permission → "No access" page |
| `lib/session.ts` | The login token, kept in an **httpOnly cookie** (browser JavaScript can't read it) |
| `middleware.ts` | Runs before every page: no login cookie → `/login` |
| `app/login/` | Login page + `actions.ts` that calls `/auth/login` and stores the token |
| `app/logout/route.ts` | Clears the cookie, goes to `/login` |
| `app/(app)/layout.tsx` (web) / `app/(console)/layout.tsx` (admin) | The sidebar menu and header around every page after login |
| `lib/me.ts` (web) | `getMe()` = who is logged in; `can(me, 'access.user.view')` = may they do this somewhere? (menus); `canAt(me, 'platform.campus.update', { institutionId, campusId })` = may they do it **here**? (buttons) |
| `packages/ui` | Buttons, cards, tables, form fields, `ActionForm` (every form) and the page frame |

**Hiding a button is not security.** The backend checks every permission again; the frontend only hides what the user can't use.

## Adding a page

1. Find the endpoint in Swagger (http://localhost:3000/api/docs) and add the response type to `lib/types.ts`.
2. Create `app/(app)/<name>/page.tsx` that calls `api<YourType>('/<endpoint>')`.
3. For forms: add a server action to `app/(app)/<name>/actions.ts` and use `<ActionForm action={...}>`.
4. Add the menu item in `app/(app)/layout.tsx` with the permission it needs.
5. `npm run lint && npm run typecheck && npm run build`.

## Folders

| Folder / file | What it is |
|---|---|
| `apps/web/` | Web app for an organization's staff |
| `apps/admin/` | Super admin console |
| `packages/ui/` | Shared components and styles (Tailwind) |
| `.github/workflows/` | CI |
| `package.json` | Commands, and the list of apps/packages (`workspaces`) |
| `eslint.config.mjs`, `.prettierrc.json`, `.editorconfig` | Code rules and formatting |
| `.env.example` | Template for each app's `.env.local` |
| `CLAUDE.md` | The working agreement: rules for this repository |

Generated folders, never edited or committed: `node_modules/`, `.next/`.

# UI

`@eduplatform/ui`: the design system shared by the web app and the super admin console. Tailwind CSS 4 with shadcn/ui-style components (copied into this package, so we own and can change them).

## Using it in an app

1. In the app's `app/globals.css`: `@import '@eduplatform/ui/styles.css';`
2. In code: `import { Button, Card, AppShell } from '@eduplatform/ui';`

## What's in it

| File | What it is |
|---|---|
| `src/styles.css` | Tailwind setup and the theme: colours as CSS variables (`--primary`, `--sidebar`, …) used through Tailwind names (`bg-primary`, `text-muted-foreground`) |
| `src/components/button.tsx` | `Button`: variants default, outline, ghost, destructive, link; sizes sm, default, lg, icon; `asChild` to style a link |
| `src/components/card.tsx` | `Card` with `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` |
| `src/components/form.tsx` | `Label`, `Input` |
| `src/components/badge.tsx` | `Badge`: small status labels (default, success, warning, destructive, outline) |
| `src/components/toaster.tsx` | `toast()` and `<Toaster>`: pop-up messages in the corner. `<ActionForm>` shows every success and error this way; a server action that redirects leaves its message with `flash()` (each app's `lib/flash.ts`) |
| `src/components/empty-state.tsx` | `EmptyState`: icon + message, for empty lists and "No access" pages |
| `src/shell/app-shell.tsx` | `AppShell`: sidebar + header page frame, with a mobile menu |
| `src/shell/page-header.tsx` | `PageHeader`: page title, description, actions, and `back` ("← Back to …"): give `back` to every page opened from another page (details, "new", settings) |
| `src/shell/user-badge.tsx` | `UserBadge`: signed-in person's initials and name |
| `src/lib/cn.ts` | `cn()`: joins class names; the caller's classes win over defaults |

## Rules

- Use theme colours (`bg-primary`, `border-border`), never raw colours like `bg-blue-600`, so tenant branding can change them later.
- Put a component here only when both apps use it; otherwise keep it in the app.
- Every component file starts with a comment showing how to use it.

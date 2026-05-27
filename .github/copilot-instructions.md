# GitHub Copilot Instructions — Audit Monitoring System

## Project Overview

This is a **Next.js 15 full-stack application** for maritime audit management. It tracks vessel audits, findings, auditors, and compliance documents. The frontend and API routes are co-located in the same Next.js project (App Router). The database is **MySQL**, accessed via `mysql2/promise` connection pooling.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Database | MySQL via `mysql2/promise` |
| Styling | Tailwind CSS 3 |
| Auth | JWT (`jsonwebtoken`) + `bcryptjs` |
| Validation | Zod |
| Forms | `react-hook-form` |
| Notifications | `react-hot-toast` |
| Icons | `@heroicons/react` |
| Date utils | `date-fns` |
| Charts | `recharts` |
| File uploads | `multer` |
| Email | `nodemailer` |
| Cron jobs | `node-cron` |

---

## Directory Structure

```
src/
  app/               # Next.js App Router pages and API routes
    api/             # API route handlers (one folder per resource)
    [resource]/      # Frontend pages per resource
  components/        # Shared UI components
    ui/              # Primitive components: Button, Badge, Card, Table, Modal, etc.
  contexts/          # React contexts (AuthContext)
  controllers/       # Business logic / DB query layer (called by API routes)
  cron/              # Scheduled jobs (reminderCron.ts)
  lib/               # Core utilities: db.ts, auth.ts, api.ts, email.ts
  middleware/        # auth.middleware.ts, rbac.middleware.ts
  types/             # TypeScript types (src/types/index.ts)
  utils/             # helpers.ts, fileUpload.ts
  validators/        # Zod schemas (schemas.ts)
database/
  schema.sql         # Full DB schema
  migrations/        # Numbered SQL migration files
public/
  uploads/           # Uploaded finding attachments
```

---

## Architecture Conventions

### API Routes
- Live in `src/app/api/[resource]/route.ts` (and `[id]/route.ts` for single-record operations).
- Each route handler calls the corresponding `Controller` class from `src/controllers/`.
- Always authenticate with `getAuthUser(request)` from `@/middleware/auth.middleware`.
- Return `NextResponse.json({ success: true, data: ... })` on success, `{ success: false, error: "..." }` on failure.
- Use appropriate HTTP status codes: 200, 201, 400, 401, 403, 404, 500.

### Controllers
- Live in `src/controllers/[resource].controller.ts`.
- Are plain TypeScript classes with `static async` methods.
- Execute raw SQL via the `query()` helper from `@/lib/db`.
- All list queries support soft-delete filtering: `WHERE deleted_at IS NULL` by default.
- Pagination is done with `getPaginationParams()` from `@/utils/helpers`.

### Database
- Use `query<T>(sql, params)` from `src/lib/db.ts` for all DB access. Never query the DB directly inside API route handlers.
- Always use parameterised queries (no string interpolation of user input).
- All resource tables have `deleted_at` and `deleted_by` columns for soft-delete. Never use hard `DELETE` for main entities.
- Migrations are numbered SQL files in `database/migrations/`. Always add a new numbered migration file for schema changes; do not edit existing ones.

### Authentication & RBAC
- JWT is stored in `localStorage` under the key `"token"`.
- On the server, verify tokens with `verifyToken()` from `@/lib/auth`.
- Three legacy roles: `Admin`, `Encoder`, `Viewer`. A full RBAC system (roles/permissions tables) also exists.
- `src/middleware/rbac.middleware.ts` defines `PERMISSIONS` map for each action.
- On the frontend, use `useAuth()` from `AuthContext`; `hasRole(["Admin", "Encoder"])` guards UI elements.
- `canEdit = hasRole(["Admin", "Encoder"])` is the standard pattern in page components.

### Frontend Pages
- All pages are under `src/app/[resource]/page.tsx` and are `"use client"` components.
- Wrap every page in `<ProtectedRoute><AppLayout>...</AppLayout></ProtectedRoute>`.
- Fetch data in `useEffect` using the typed API helpers in `src/lib/api.ts`.
- Display loading state with `<LoadingSpinner />` while data is fetched.
- Show success/error feedback with `toast.success()` / `toast.error()` from `react-hot-toast`.

### API Client (`src/lib/api.ts`)
- `getApiUrl(path)` builds URLs that respect the optional `BASE_PATH` env var (for Apache subdirectory deployment).
- All API calls go through the typed `api.get / api.post / api.put / api.delete` helpers, which automatically attach the `Authorization: Bearer <token>` header.
- `handleResponse<T>()` unwraps the `{ success, data }` envelope automatically.

---

## Core Domain Types (`src/types/index.ts`)

```ts
type AuditStatus    = "Planned" | "Ongoing" | "Completed" | "Closed"
type FindingCategory = "Major" | "Minor" | "Observation"
type FindingStatus  = "Open" | "In Progress" | "Submitted" | "Closed" | "Overdue"
type VesselStatus   = "Active" | "Inactive"
```

Key entities: `User`, `Vessel`, `AuditType`, `AuditParty`, `AuditCompany`, `Auditor`, `Audit`, `Finding`, `AuditAttachment`, `AuditResult`.

---

## UI Component Library (`src/components/ui/`)

Use these primitives — do not introduce new component libraries:

| Component | Usage |
|---|---|
| `<Button variant="secondary" size="sm">` | Actions |
| `<Badge variant="default|warning|info|success|danger">` | Status labels |
| `<Card>` | Content containers |
| `<Table columns={...} data={...}>` | Data tables |
| `<Modal>` | Dialogs and drawers |
| `<Input>`, `<Select>` | Form fields |
| `<LoadingSpinner>` | Loading states |
| `<Pagination>` | Paginated lists |

Import from `@/components/ui/[Component]`.

---

## Validation

- Define Zod schemas in `src/validators/schemas.ts`.
- Validate request bodies inside API route handlers using `schema.safeParse(body)`.
- Return `400` with `{ success: false, error: "..." }` on validation failure.

---

## File Uploads

- Handled by `multer` via a utility in `src/utils/fileUpload.ts`.
- Uploaded files are stored under `public/uploads/findings/`.
- File upload routes do **not** use `"Content-Type": "application/json"` — send as `multipart/form-data`.

---

## Deployment

- Supports Apache reverse proxy with an optional subdirectory base path.
- `next.config.ts` reads `process.env.BASE_PATH` for `basePath` and `assetPrefix`.
- `NEXT_PUBLIC_BASE_PATH` must be set for client-side URL construction.
- Environment variables required: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `BASE_PATH`, `NEXT_PUBLIC_BASE_PATH`.

---

## Coding Standards

- **TypeScript**: use explicit types; avoid `any` except when interfacing with raw DB results.
- **No hard deletes** on main entities — always soft-delete.
- **Parameterised SQL only** — never concatenate user input into queries.
- **No new npm dependencies** without discussing with the user.
- **Follow existing patterns**: new resources should follow the same `route → controller → db query` chain as existing ones.
- **Print support**: pages that need printing wrap non-printable elements in `className="no-print"` and use `window.print()`.
- **Tailwind only** for styling — no inline style objects unless strictly necessary.
- **Date formatting** via `date-fns` (`format`, `parseISO`, etc.) — do not use `new Date().toLocaleDateString()`.

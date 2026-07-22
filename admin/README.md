# Ailernova Admin Portal

The internal operations console for the Ailernova learning platform — a separate
**Next.js 14 + TypeScript** app that talks to the existing Express backend. It reuses
the platform's design language (Nunito, indigo `#4F46E5`, soft indigo-tinted shadows,
20px cards, lucide icons) but is tuned for dense, fast, professional operations work.

## Architecture

```
admin/                       ← this Next.js app (App Router)
  app/(portal)/…             ← authenticated modules (dashboard, users, content, …)
  app/login                  ← sign-in
  components/                ← DataTable, charts, states, Sidebar/Topbar, Modal/Drawer
  lib/                       ← api client, auth context, theme tokens, types, format
server/src/routes/admin.js   ← NEW admin API (in the existing backend), mounted at /api/admin
server/src/controllers/admin ← admin controllers (auth, dashboard, users, content, …)
server/scripts/admin-setup.js← DB migration + Super Admin seed
```

The admin app never re-implements business logic — it calls `/api/admin/*`, which is a
thin, RBAC-guarded layer over the same services/tables the student app uses.

## Setup

### 1. Backend — apply schema + seed the Super Admin (one time)

Credentials are read from env (never hardcoded in the frontend). Dev fallbacks exist.

```bash
cd server
# optional overrides (recommended for production):
#   ADMIN_SEED_EMAIL=you@ailernova.com  ADMIN_SEED_PASSWORD='a-strong-password'
npm run admin:setup
```

This is idempotent. It adds `users.admin_role/is_active/deactivated_at`, creates
`audit_logs` / `announcements` / `app_settings`, seeds default settings, and ensures a
`super_admin` exists (dev default: `saurabh@ailernova.com` / `pwd123`, bcrypt-hashed).

Then run the backend as usual: `cd server && npm run dev` (port 5000).

### 2. Admin frontend

```bash
cd admin
cp .env.local.example .env.local     # points the /api proxy at the backend (default :5000)
npm install
npm run dev                          # http://localhost:4000
```

Sign in with the seeded Super Admin credentials.

## Roles & permissions (RBAC)

`admin_role` on the user row gates the portal (separate from the STUDENT/TEACHER/ADMIN
enum, so elevating someone never disturbs their learner data).

| Role | Scope |
|------|-------|
| `super_admin` | Everything, incl. managing other admins |
| `admin` | Everything except Super-Admin management |
| `content_manager` | Content, AI Teacher, Announcements, Reports |
| `support` | Users (view/reset-password/deactivate), Reports, Audit |

Every mutation is recorded to `audit_logs` (actor, module, action, before/after).

## Modules

Dashboard · Users · Content (catalog + Brain Gym question workflow + mock tests) ·
Reports · AI Teacher (monitor + non-runtime config) · Announcements · Settings · Audit Logs.

Modules with no real backend yet (e.g. tutor Sessions, AI-Teacher prompt *versioning*)
are shown as **Pending** with an honest banner rather than faked.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A QA workflow app for manufacturing: operators submit part rejections, QC heads set dispositions, and approvers sign off. Each role gets a dedicated page with no cross-role access.

## Commands

### Client (React + Vite + Tailwind)
```bash
cd client
npm install
npm run dev       # Vite dev server on :5173
npm run build     # tsc + vite build
npm run lint      # eslint
```

### Server (Express + TypeScript)
```bash
cd server
npm install
npm run dev       # ts-node-dev with hot reload on :3001
npm run build     # tsc → dist/
npm start         # node dist/index.js
```

### Docker (production-like)
```bash
# from repo root — requires .env at root
docker-compose up --build
```
The docker-compose build expects the root `.env` to supply all vars (both `VITE_*` and server vars).

## Environment variables

| File | Purpose |
|---|---|
| `server/.env` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PORT`, `JWT_SECRET` |
| `client/.env` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL` |
| `.env` (root) | All of the above — consumed by docker-compose |

`VITE_API_URL` must point to the running Express server (e.g. `http://localhost:3001`).

## Architecture

### Monorepo layout
```
qa-workflow/
  client/     # React SPA
  server/     # Express API
  model/      # Shared TypeScript types (types.ts)
  database/   # schema.sql — run manually in Supabase SQL Editor
```

`model/types.ts` is the single source of truth for all domain types. Both server middleware and client pages import from it via relative paths (`../../model/types`). `client/src/types.ts` re-exports from there.

### Auth design (important)
This app uses **custom username/password auth, not Supabase Auth**. The `users` table is application-managed. Login flow:
1. Client POSTs credentials to `POST /auth/login` on the Express server
2. Server verifies bcrypt hash against the `users` table via the **service role key** (bypasses Supabase RLS)
3. Server returns a JWT signed with `JWT_SECRET`; client stores it in `localStorage`
4. All subsequent API calls send `Authorization: Bearer <token>`; `requireAuth` middleware verifies the JWT and attaches `req.user`

The client-side Supabase client (`client/src/lib/supabase.ts`) exists but is unused — all data access goes through the Express API via `client/src/lib/api.ts` (`apiFetch`).

All API calls from the client go through `apiFetch` in `client/src/lib/api.ts`, which automatically attaches the JWT from `localStorage`.

### Role-to-route mapping
| Role | Route | Can do |
|---|---|---|
| `operator`, `engineer` | `/operator` | Submit rejections |
| `qc_head` | `/qc` | Set disposition on pending rejections |
| `approver` | `/approvals` | Approve or reject dispositions |
| `inventory_manager` | `/inventory` | View approved dispositions |

`RoleRoute` in `router.tsx` enforces access — unauthenticated or wrong-role users are redirected to `/login`. The login page has a sign-up toggle, but sign-up always creates an `operator` role — other roles must be created via `POST /auth/register` directly.

### Data / status flow
Rejections move through a linear state machine driven by **Supabase DB triggers**:

1. Rejection inserted → `status: pending_disposition`
2. Disposition inserted → trigger `on_disposition_inserted` sets rejection `status: pending_approval`
3. Approval inserted → trigger `on_approval_inserted` sets disposition `approval_status` and rejection `status` to `approved` or `rejected`

Status transitions happen in the DB, not in application code.

### Server API routes
All routes except `/auth/*` require a valid JWT. `submitted_by` and `decided_by` fields are never trusted from the request body — they are injected server-side from `req.user`.

| Route | Methods | Notes |
|---|---|---|
| `/auth/login` | POST | |
| `/auth/register` | POST | |
| `/auth/me` | GET | |
| `/products` | GET, POST | |
| `/rejections` | GET, POST | GET returns `*, products(*)` |
| `/dispositions` | GET, POST, PATCH /:id | GET returns `*, rejections(*, products(*))` |
| `/approvals` | GET, POST | GET returns `*, dispositions(*, rejections(*, products(*)))` |

### Database
Schema is in `database/schema.sql` — apply it manually via the Supabase SQL editor. If re-running, uncomment the DROP statements at the bottom first.

Tables: `users`, `products`, `rejections`, `dispositions`, `approvals`.

`products` has a `product_type` enum: `fins`, `bottom_roll`, `sleeve`, `case`, `palette`. Products are currently seeded manually — there is no UI for managing them.

`rejections` columns: `product_id` (FK → products), `quantity`, `rejection_reason` (free text), `submitted_by` (FK → users), `status`.

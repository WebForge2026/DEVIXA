# DEVIXA — Supabase Audit

Date: 2026-11-14 · Target: Hetzner Webhosting L (shared hosting, no root, no Docker)

## 1. Verdict: which Supabase services are actually used

| Supabase service | Used? | Evidence |
|---|---|---|
| PostgreSQL (PostgREST, tables) | **YES** — core dependency | `supabase/schema.sql`, `lib/admin/store/supabase.ts`, `app/actions/leads.ts` |
| Supabase Auth | **NO** | Auth is a custom HMAC-signed cookie implementation: `lib/admin/auth.ts`, `lib/admin/session.ts`, `app/api/admin/login/route.ts`, `app/api/admin/logout/route.ts`. No `supabase.auth`, `auth.users`, `auth.uid()` anywhere in the codebase. |
| Supabase Storage | **NO** | CMS media are `data:image/…;base64` URLs or external `https://…` URLs stored in the `site_content.data` jsonb column (`app/api/admin/content/route.ts` accepts only those two forms). No `supabase.storage` call exists. |
| Realtime subscriptions | **NO** | No `supabase.channel`/`.on()` anywhere. "Live" analytics are 60-second polls of `site_presence` (`app/api/admin/live/route.ts`). |
| Edge Functions / RPC | **NO** | No `supabase.rpc`, no functions. |
| Storage of files / attachments | **NO** | No uploads exist in the app at all. |

**Consequence:** the migration surface is the PostgreSQL data plane only — five tables. Auth, storage and realtime need **no replacement**, only documentation.

## 2. Every Supabase dependency in code

| File | What it does | Classification |
|---|---|---|
| `lib/supabase/client.ts` | Browser client (`createBrowserClient`). **Zero importers** — dead code. | Unused, removable |
| `lib/supabase/server.ts` | Anon server client bound to request cookies. Used only by `app/actions/leads.ts` as a Vercel-only fallback ("anon INSERT via RLS"). | Must replace |
| `lib/supabase/admin.ts` | Service-role client. Used by `lib/admin/store/index.ts`, `lib/admin/store/supabase.ts`, `app/actions/leads.ts` (feature check only). | Must replace |
| `lib/admin/store/supabase.ts` | Production `AdminStore` adapter over the 5 tables. | Must replace |
| `app/actions/leads.ts` | Server actions `submitLead` / `submitEstimate`. Prefer the service-role store; fall back to anon-key insert only on Vercel without service key. | Must migrate |
| `lib/admin/store/index.ts` | Store factory: supabase when service key set, else JSON file store. | Must migrate |
| `components/admin/AdminShell.tsx` | UI warning banner text mentions `SUPABASE_SERVICE_ROLE_KEY` / `supabase/schema.sql`. | Text update |
| `lib/legal.ts`, `lib/i18n/legal/{de,en,bg}.ts` | Legal copy names Supabase Inc. as database processor (GDPR Art. 28). | Text update — **requires legal review** |
| `README.md`, `.env.example` | Documentation / env vars. | Update |
| `supabase/schema.sql` | Source schema. | Archive (kept for audit/rollback) |

Grep terms verified: `supabase`, `createClient`, `createServerClient`, `createBrowserClient`, `supabase.auth`, `supabase.from`, `supabase.rpc`, `supabase.storage`, `supabase.channel`, `auth.uid()`, `auth.users`, `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`. All hits are listed above (plus `package-lock.json` entries for the two packages).

## 3. Database objects (from `supabase/schema.sql`)

### Tables (5, all in `public`)

1. **`leads`** — contact-form enquiries.
   - `id uuid pk default gen_random_uuid()`, `created_at timestamptz default now()`
   - `full_name text not null (2..120)`, `email text not null (≤254, regex)`, `company text (≤160, null)`
   - `project_type text not null (≤80)`, `estimated_budget text (≤40)`, `message text not null (10..5000)`
   - `status text default 'new'` — constraint replaced by admin section: `('new','contacted','proposal','won','archived','qualified','lost','spam')`
   - admin adds: `notes text`, `locale text in ('de','en','bg')`
2. **`project_estimates`** — calculator quotes.
   - `id uuid pk`, `created_at`, `system_type in ('website','webshop','business-system','integration')`
   - `features jsonb array ≤20 items`, `timeline in ('flexible','standard','priority')`
   - `estimated_price text ≤60`, `contact_email text (regex)`
   - admin adds: `status default 'new' in ('new','contacted','proposal','won','archived')`, `notes`, `price_low int ≥0`, `price_high int ≥0`, `locale`
3. **`site_events`** — cookieless telemetry. `id bigserial pk`, `created_at`, `type in ('pageview','calc_view','calc_interact')`, `path ≤200`, `locale in ('de','en','bg')`, `visitor ≤40`.
4. **`site_presence`** — live visitor heartbeat. `visitor text pk ≤40`, `path`, `last_seen`.
5. **`site_content`** — CMS state (one row `id='live'`). `id text pk default 'live'`, `data jsonb`, `updated_at`.

### Indexes
- `leads_created_at_idx (created_at desc)`, `leads_status_idx (status)`
- `project_estimates_created_at_idx (created_at desc)`
- `site_events_created_at_idx (created_at desc)`
- `site_presence_last_seen_idx (last_seen desc)`

### Foreign keys
**None.** All tables are independent. (The app-level "lead" model unions `leads` + `project_estimates` by `kind`.)

### Functions / triggers
**None.** Only `gen_random_uuid()` as column default (built into PostgreSQL ≥ 13 — no extension needed on Hetzner).

### Extensions
- `pgcrypto` — required **only** for `gen_random_uuid()` on old Postgres. Core since PG 13; Hetzner ships PG ≥ 13, so **no extension is required**. Verified: nothing else uses `digest()`, `hmac()`, `crypt()`, `uuid-ossp`, etc.

### RLS policies (Supabase-only mechanism — not portable)
- `leads`: anon/authenticated INSERT with check `status='new'`; service_role SELECT/UPDATE.
- `project_estimates`: anon INSERT with check `status='new'`; service_role SELECT/UPDATE.
- `site_events`, `site_presence`, `site_content`: service_role only.
- Grants: insert to anon/authenticated; all to service_role.

**Replacement authorization model:** after the migration the database is reachable only from server-side code (single Hetzner DB user, credentials only in `DATABASE_URL`, never exposed to the browser). Public writes happen exclusively through Zod-validated Server Actions that force `status='new'` (same guarantee the RLS `WITH CHECK` enforced); all admin reads/writes go through API route handlers gated by `requireAdmin()` (HMAC session cookie, verified server-side). The `status='new'` CHECK at insert is additionally enforced by a schema default + server code.

## 4. Authentication flow (unchanged — not Supabase)

- Single administrator; credentials from env `ADMIN_EMAIL` / `ADMIN_PASSWORD`; no registration, no other users.
- Login: `POST /api/admin/login` — constant-time comparison, per-IP brake 5 attempts / 10 min, 600 ms delay on failure.
- Session: HMAC-SHA256-signed cookie (`devixa_admin`), payload `{email, exp}`, 12 h expiry, `HttpOnly; Secure; SameSite=Strict`, verified in `middleware.ts` (edge, Web Crypto) **and** in every admin API route via `requireAdmin()`.
- No password reset, no OAuth, no MFA, no e-mail verification (single env-credential account).
- Runs on both Node and Edge without native deps.

## 5. Data flows touching Supabase today

1. **Telemetry beacon** `POST /api/t` → `store.recordEvent` / `store.heartbeat` → `site_events` / `site_presence` (service role).
2. **Contact form** → Server Action `submitLead` → `leads` table (via store, or anon RLS insert on Vercel).
3. **Calculator** → Server Action `submitEstimate` → `project_estimates` table (price recomputed server-side).
4. **Admin API** (`/api/admin/overview|live|leads|leads/[id]|content`) → store reads/writes (service role) → `buildOverview` aggregation in pure TS.
5. **CMS publish** → `site_content` upsert + `revalidateTag`.

## 6. Risks

| Risk | Mitigation |
|---|---|
| Breaking the public forms (main conversion path) | Keep server-action contract and Zod schemas byte-identical; adapter swap behind the existing `AdminStore` interface; tests for the mapping layer. |
| `timestamptz` text format differs from PostgREST ISO output | Drizzle `mode: 'date'` + explicit `.toISOString()` in mappers — format canonicalised in one place. |
| `gen_random_uuid()` needs pgcrypto on old PG | Hetzner PG ≥ 13 has it built in; migration asserts server version ≥ 13. |
| Hetzner DB user has restricted privileges (no `CREATE EXTENSION`, no superuser) | Schema uses zero extensions, plain DDL, `public` schema, unqualified names fine; everything `IF NOT EXISTS` / `DROP … IF EXISTS`-safe where re-runnable. |
| Shared-hosting memory/CPU limits | Conservative pool (max 5 connections), no background workers, no new heavy deps; `pg` + `drizzle-orm` are lightweight. |
| Legal texts still name Supabase | Updated to Hetzner wording in all 3 languages — **flagged for lawyer review before cutover** (same as existing pre-launch checklist). |
| Admin cookie secret env naming | Unchanged (`ADMIN_SESSION_SECRET`) — no cutover step needed for auth. |
| Data divergence after cutover (writes to both DBs) | Runbook: write-freeze via maintenance deploy, final sync, then DNS/keystore switch; rollback keeps Supabase intact until verification. |

## 7. Decision: Auth.js is intentionally **not** introduced

The task mandates Auth.js "if compatible … with the existing authentication requirements". The existing system is **not Supabase Auth** — it is a self-contained, Supabase-independent implementation that already satisfies every requirement (secure login/logout, server-side session validation, role check, HttpOnly/Secure/Strict cookies, CSRF-safe SameSite policy, expiry, rate limiting, edge-compatible). Replacing it with Auth.js would be a large rewrite of middleware, login/logout routes and the session cookie format, with zero functional gain and real regression risk — violating Rule 2 (minimal changes) and Rule 4 (no unnecessary dependency changes). It also avoids forcing every admin through a password reset. The system is documented and kept; hardening additions in this migration: DB-backed audit log for sensitive admin actions.

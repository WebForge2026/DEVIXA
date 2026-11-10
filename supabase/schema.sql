-- =============================================================================
-- DEVIXA — Supabase schema
-- Run in the Supabase SQL editor (project region: EU, e.g. eu-central-1 Frankfurt).
-- Model: the public site may only INSERT. Reading, updating and deleting is
-- reserved for service_role (back-office / internal tooling).
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- leads
-- -----------------------------------------------------------------------------
create table if not exists public.leads (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  full_name        text not null check (char_length(full_name) between 2 and 120),
  email            text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  company          text check (char_length(company) <= 160),
  project_type     text not null check (char_length(project_type) <= 80),
  estimated_budget text check (char_length(estimated_budget) <= 40),
  message          text not null check (char_length(message) between 10 and 5000),
  status           text not null default 'new'
                   check (status in ('new', 'contacted', 'qualified', 'won', 'lost', 'spam'))
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_status_idx on public.leads (status);

-- -----------------------------------------------------------------------------
-- project_estimates
-- -----------------------------------------------------------------------------
create table if not exists public.project_estimates (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  system_type     text not null check (system_type in ('website', 'webshop', 'business-system', 'integration')),
  features        jsonb not null default '[]'::jsonb check (jsonb_typeof(features) = 'array' and jsonb_array_length(features) <= 20),
  timeline        text not null check (timeline in ('flexible', 'standard', 'priority')),
  estimated_price text not null check (char_length(estimated_price) <= 60),
  contact_email   text not null check (char_length(contact_email) <= 254 and contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

create index if not exists project_estimates_created_at_idx on public.project_estimates (created_at desc);

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.leads enable row level security;
alter table public.project_estimates enable row level security;

-- Start from zero privileges for client roles, then grant exactly INSERT.
revoke all on public.leads from anon, authenticated;
revoke all on public.project_estimates from anon, authenticated;
grant insert on public.leads to anon, authenticated;
grant insert on public.project_estimates to anon, authenticated;

grant all on public.leads to service_role;
grant all on public.project_estimates to service_role;

drop policy if exists "public can submit leads" on public.leads;
create policy "public can submit leads"
  on public.leads for insert
  to anon, authenticated
  with check (status = 'new');

drop policy if exists "service role reads leads" on public.leads;
create policy "service role reads leads"
  on public.leads for select
  to service_role
  using (true);

drop policy if exists "service role manages leads" on public.leads;
create policy "service role manages leads"
  on public.leads for update
  to service_role
  using (true) with check (true);

drop policy if exists "public can submit estimates" on public.project_estimates;
create policy "public can submit estimates"
  on public.project_estimates for insert
  to anon, authenticated
  with check (true);

drop policy if exists "service role reads estimates" on public.project_estimates;
create policy "service role reads estimates"
  on public.project_estimates for select
  to service_role
  using (true);

-- No SELECT / UPDATE / DELETE policies exist for anon or authenticated:
-- with RLS enabled, those operations are denied by default.

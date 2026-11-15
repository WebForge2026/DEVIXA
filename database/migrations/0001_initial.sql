-- =============================================================================
-- DEVIXA — MariaDB schema  ·  migration 0001_initial
-- Target: MariaDB ≥ 10.2 (Hetzner Webhosting L / konsoleH), shared hosting:
-- no extensions, no special privileges, single pre-created database.
-- Portable successor of supabase/schema.sql (PostgreSQL).
-- Safe to re-run: everything is IF NOT EXISTS. InnoDB.
--
-- vs. the PostgreSQL original, three CHECK constraints are intentionally
-- enforced in the application layer instead (Zod schemas already validate
-- them on every write):
--   * e-mail format regex  (MariaDB cannot use REGEXP inside CHECK)
--   * features json array + ≤ 20 items  (no jsonb_typeof in MariaDB)
-- Data types: uuid → varchar(36) (UUID()), timestamptz → datetime(3) UTC,
-- jsonb → json, bigserial → bigint auto_increment.
-- =============================================================================


create table if not exists leads (
  id               varchar(36) primary key default (uuid()),
  created_at       datetime(3) not null default current_timestamp(3),
  full_name        text not null check (char_length(full_name) between 2 and 120),
  email            text not null check (char_length(email) <= 254),
  company          text check (char_length(company) <= 160),
  project_type     text not null check (char_length(project_type) <= 80),
  estimated_budget text check (char_length(estimated_budget) <= 40),
  message          text not null check (char_length(message) between 10 and 5000),
  status           varchar(10) not null default 'new'
                   check (status in ('new', 'contacted', 'proposal', 'won', 'archived', 'qualified', 'lost', 'spam')),
  notes            text,
  locale           varchar(2) check (locale in ('de', 'en', 'bg'))
) engine = innodb;

create index if not exists leads_created_at_idx on leads (created_at desc);
create index if not exists leads_status_idx on leads (status);

create table if not exists project_estimates (
  id              varchar(36) primary key default (uuid()),
  created_at      datetime(3) not null default current_timestamp(3),
  system_type     varchar(16) not null check (system_type in ('website', 'webshop', 'business-system', 'integration')),
  features        json not null,
  timeline        varchar(9) not null check (timeline in ('flexible', 'standard', 'priority')),
  estimated_price varchar(60) not null,
  contact_email   text not null check (char_length(contact_email) <= 254),
  status          varchar(10) not null default 'new' check (status in ('new', 'contacted', 'proposal', 'won', 'archived')),
  notes           text,
  price_low       int check (price_low >= 0),
  price_high      int check (price_high >= 0),
  locale          varchar(2) check (locale in ('de', 'en', 'bg'))
) engine = innodb;

create index if not exists project_estimates_created_at_idx on project_estimates (created_at desc);

create table if not exists site_events (
  id         bigint auto_increment primary key,
  created_at datetime(3) not null default current_timestamp(3),
  type       varchar(13) not null check (type in ('pageview', 'calc_view', 'calc_interact')),
  path       varchar(200) not null,
  locale     varchar(2) not null check (locale in ('de', 'en', 'bg')),
  visitor    varchar(40) not null
) engine = innodb;

create index if not exists site_events_created_at_idx on site_events (created_at desc);

create table if not exists site_presence (
  visitor   varchar(40) primary key,
  path      varchar(200) not null,
  last_seen datetime(3) not null default current_timestamp(3)
) engine = innodb;

create index if not exists site_presence_last_seen_idx on site_presence (last_seen desc);

create table if not exists site_content (
  id         varchar(10) primary key default 'live',
  data       json not null,
  updated_at datetime(3) not null default current_timestamp(3)
) engine = innodb;

create table if not exists audit_log (
  id         bigint auto_increment primary key,
  created_at datetime(3) not null default current_timestamp(3),
  action     varchar(80) not null,
  actor      varchar(254),
  detail     json not null,
  ip         varchar(45)
) engine = innodb;

create index if not exists audit_log_created_at_idx on audit_log (created_at desc);


-- =============================================================================
-- DEVIXA — migration 0002_rate_limits
-- DB-backed sliding-window rate limiting for the PHP backend (PHP shares no
-- in-memory state between requests). Housekeeping deletes stale rows.
-- =============================================================================


create table if not exists _rate_limits (
  rkey       varchar(80) primary key,
  -- JSON array of unix-ms timestamps
  hits       text not null,
  updated_at datetime(3) not null default current_timestamp(3)
) engine = innodb;


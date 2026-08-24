-- Abracadish: funnel analytics (Photo -> Recipe -> Cooking session, per
-- app_idea.md's north-star metric). Run this once in the Supabase Dashboard
-- -> SQL Editor (after schema.sql and schema_scans.sql).
-- Safe to re-run: every statement is idempotent.

create extension if not exists pgcrypto;

create table if not exists funnel_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null
    check (event_type in (
      'photo_captured',
      'dish_recognized',
      'matches_viewed',
      'recipe_selected',
      'cooking_started',
      'cooking_completed'
    )),
  dish_name text,
  recipe_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists funnel_events_session_id_idx on funnel_events (session_id);
create index if not exists funnel_events_event_type_idx on funnel_events (event_type);

alter table funnel_events enable row level security;

-- Write-only from the client: anyone (signed in or not, same rationale as
-- the ai-generated recipe insert policy) can log their own funnel events.
-- No select policy — funnel analysis happens via the Dashboard's SQL editor
-- (which runs as postgres and bypasses RLS), not through the app's anon key.
drop policy if exists "Anyone can log funnel events" on funnel_events;
create policy "Anyone can log funnel events"
  on funnel_events for insert
  to anon, authenticated
  with check (true);

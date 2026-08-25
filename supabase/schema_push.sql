-- Abracadish: Web Push subscriptions, for streak-reminder notifications.
-- Run this once in the Supabase Dashboard -> SQL Editor (after schema.sql).
-- Safe to re-run: every statement is idempotent.

create extension if not exists pgcrypto;

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_id_idx on push_subscriptions (user_id);

alter table push_subscriptions enable row level security;

-- No select policy for regular clients — the streak-reminder sender reads
-- across all users via the service-role key (lib/supabaseAdminClient.js),
-- which bypasses RLS entirely, same pattern as the AI-generated recipe
-- insert policy's rationale for open writes.
drop policy if exists "Users manage their own push subscriptions" on push_subscriptions;
create policy "Users manage their own push subscriptions"
  on push_subscriptions for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

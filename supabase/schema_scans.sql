-- Abracadish: user scan history.
-- Run this once in the Supabase Dashboard -> SQL Editor (after schema.sql).
-- Safe to re-run: every statement is idempotent.

create extension if not exists pgcrypto;

create table if not exists scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  dish_name text not null,
  confidence numeric,
  cuisine text,
  region text,
  confirmed_ingredients jsonb not null default '[]'::jsonb,
  possible_ingredients jsonb not null default '[]'::jsonb,
  answers jsonb not null default '{}'::jsonb,
  restaurant_name text,
  location jsonb,
  location_label text,
  created_at timestamptz not null default now()
);

create index if not exists scans_user_id_idx on scans (user_id);

alter table scans enable row level security;

drop policy if exists "Users can view their own scans" on scans;
create policy "Users can view their own scans"
  on scans for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own scans" on scans;
create policy "Users can insert their own scans"
  on scans for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own scans" on scans;
create policy "Users can delete their own scans"
  on scans for delete
  using (auth.uid() = user_id);

-- Scan photos: stored at "<user_id>/<random>.jpg" in a public bucket (photos
-- are just food pictures, not sensitive) so the client can render them
-- straight from a public URL without signing. Uploads/deletes are still
-- RLS-restricted to each user's own folder.
alter table scans add column if not exists image_path text;

insert into storage.buckets (id, name, public)
values ('scan-photos', 'scan-photos', true)
on conflict (id) do nothing;

drop policy if exists "Users can upload their own scan photos" on storage.objects;
create policy "Users can upload their own scan photos"
  on storage.objects for insert
  with check (
    bucket_id = 'scan-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can delete their own scan photos" on storage.objects;
create policy "Users can delete their own scan photos"
  on storage.objects for delete
  using (
    bucket_id = 'scan-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

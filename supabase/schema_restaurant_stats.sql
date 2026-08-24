-- Abracadish: restaurant social proof ("N people have scanned dishes here").
-- Run this once in the Supabase Dashboard -> SQL Editor (after schema_scans.sql).
-- Safe to re-run: every statement is idempotent.

-- `scans` RLS normally restricts every reader to their own rows (see
-- schema_scans.sql), which is right for the raw data but means the app
-- can't show cross-user social proof without it. This function is
-- `security definer` so it bypasses that RLS, but it only ever returns an
-- aggregate count and a handful of dish names — never who scanned them, when,
-- or anything else from the row — so it can't be used to snoop on another
-- user's activity, only to answer "has anyone scanned a dish at this named
-- restaurant, and what did they find."
create or replace function get_restaurant_scan_stats(p_restaurant_name text)
returns table (total_count bigint, sample_dishes text[])
language sql
stable
security definer
set search_path = public
as $$
  select
    count(*)::bigint as total_count,
    coalesce((array_agg(distinct dish_name))[1:5], '{}') as sample_dishes
  from scans
  where p_restaurant_name is not null
    and trim(p_restaurant_name) <> ''
    and lower(trim(restaurant_name)) = lower(trim(p_restaurant_name));
$$;

grant execute on function get_restaurant_scan_stats(text) to anon, authenticated;

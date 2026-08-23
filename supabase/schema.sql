-- Abracadish: recipe catalog + pgvector similarity retrieval.
-- Run this once in the Supabase Dashboard -> SQL Editor.
-- Safe to re-run: every statement is idempotent.

create extension if not exists vector;

create table if not exists recipes (
  id text primary key,
  title text not null,
  cuisine text,
  protein text,
  sauce text,
  garnish text,
  match_type text not null default 'similar'
    check (match_type in ('official', 'likely', 'similar', 'ai-generated')),
  servings integer,
  ingredients jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  source jsonb not null default '{}'::jsonb,
  embedding vector(768),
  created_at timestamptz not null default now()
);

alter table recipes enable row level security;

drop policy if exists "Public read access" on recipes;
create policy "Public read access" on recipes for select using (true);

-- Lets a signed-in user add a recipe Gemini generated for one of their scans
-- (a "Cook me" fallback when nothing in the catalog matched). Scoped
-- to match_type = 'ai-generated' so it can't be used to plant fake official
-- recipes.
drop policy if exists "Authenticated users can add AI-generated recipes" on recipes;
create policy "Authenticated users can add AI-generated recipes"
  on recipes for insert
  to authenticated
  with check (match_type = 'ai-generated');

-- Cosine-similarity search over the recipe catalog. Returns similarity as
-- 1 - cosine_distance, so 1.0 is a perfect match and 0.0 is unrelated.
create or replace function match_recipes(query_embedding vector(768), match_count int default 5)
returns table (
  id text,
  title text,
  cuisine text,
  protein text,
  sauce text,
  garnish text,
  match_type text,
  servings integer,
  ingredients jsonb,
  steps jsonb,
  source jsonb,
  similarity float
)
language sql stable
as $$
  select
    id, title, cuisine, protein, sauce, garnish, match_type, servings, ingredients, steps, source,
    1 - (embedding <=> query_embedding) as similarity
  from recipes
  where embedding is not null
  order by embedding <=> query_embedding
  limit match_count;
$$;

grant execute on function match_recipes(vector, int) to anon, authenticated;

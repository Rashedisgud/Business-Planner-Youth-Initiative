-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query) once
-- you've created your project. Matches the data model in README.md section 6.

create extension if not exists "pgcrypto";

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  current_stage integer not null default 1,
  current_question_index integer not null default 0,
  stage1_answers jsonb not null default '{}'::jsonb,
  stage2_answers jsonb not null default '{}'::jsonb,
  stage3_answers jsonb not null default '{}'::jsonb,
  stage1_feedback text,
  created_at timestamptz not null default now()
);

-- The backend talks to Supabase with the service role key, which bypasses
-- Row Level Security entirely, so RLS is enabled here mainly as a safety net
-- in case a future anon/browser key ever gets pointed at this table.
alter table sessions enable row level security;

-- Singleton table for the "About the founder" section. The check constraint
-- guarantees there is ever only one row (id = 1), so the backend can always
-- read/update it without worrying about which row to target.
create table if not exists founder (
  id integer primary key default 1,
  name text,
  bio text,
  photo_url text,
  updated_at timestamptz not null default now(),
  constraint founder_singleton check (id = 1)
);

insert into founder (id) values (1) on conflict (id) do nothing;

alter table founder enable row level security;

-- Customer reviews shown on the home page. Only added/edited/removed by the
-- admin (via ADMIN_PASSWORD) - there is no public review submission form.
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  role_or_company text,
  quote text not null,
  rating integer not null default 5 check (rating between 1 and 5),
  created_at timestamptz not null default now()
);

alter table reviews enable row level security;

-- Accounts (Supabase Auth). Sessions created while signed in are tagged with
-- the owner so they show up under "My plans" - everything in this app is free,
-- so this is just for saving/resuming plans, not gating access.
alter table sessions add column if not exists user_id uuid references auth.users(id) on delete set null;

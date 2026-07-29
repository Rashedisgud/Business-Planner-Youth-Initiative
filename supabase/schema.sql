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

-- The people shown in the "About the founder" section. Two fixed rows rather
-- than a free-form list: id 1 is the founder, id 2 the co-founder. Keeping the
-- ids fixed means the backend always knows which row it is addressing, and the
-- page always renders the two in the same order.
create table if not exists founder (
  id integer primary key default 1,
  name text,
  bio text,
  photo_url text,
  updated_at timestamptz not null default now(),
  constraint founder_singleton check (id = 1)
);

-- Originally this table held one row and the constraint enforced it. Widening
-- it in place so existing projects pick up the co-founder without losing the
-- founder they already filled in.
alter table founder drop constraint if exists founder_singleton;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'founder_people'
  ) then
    alter table founder add constraint founder_people check (id in (1, 2));
  end if;
end $$;

insert into founder (id) values (1) on conflict (id) do nothing;
insert into founder (id) values (2) on conflict (id) do nothing;

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

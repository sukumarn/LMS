-- Extend user_role with INSTRUCTOR; rename USER → LEARNER
alter type public.user_role add value if not exists 'INSTRUCTOR';

do $$
begin
  if exists (
    select 1 from pg_enum
    where enumtypid = 'public.user_role'::regtype
      and enumlabel = 'USER'
  ) then
    alter type public.user_role rename value 'USER' to 'LEARNER';
  end if;
end $$;

-- Per-organization role enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'client_role') then
    create type public.client_role as enum ('ADMIN', 'INSTRUCTOR', 'LEARNER');
  end if;
  if not exists (select 1 from pg_type where typname = 'client_status') then
    create type public.client_status as enum ('ACTIVE', 'INACTIVE');
  end if;
  if not exists (select 1 from pg_type where typname = 'membership_status') then
    create type public.membership_status as enum ('ACTIVE', 'INVITED', 'SUSPENDED');
  end if;
end $$;

-- One row per company
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status public.client_status not null default 'ACTIVE',
  plan text not null default 'starter',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- User membership per organization (ADMIN | INSTRUCTOR | LEARNER)
create table if not exists public.client_memberships (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role public.client_role not null,
  status public.membership_status not null default 'ACTIVE',
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(client_id, user_id)
);

-- Seed organizations
insert into public.clients (id, name, slug, status, plan)
values
  ('b1776b77-2994-49fb-bb10-6db11ad1f001', 'Operator Campus', 'operator-campus', 'ACTIVE', 'enterprise'),
  ('b1776b77-2994-49fb-bb10-6db11ad1f002', 'Northstar Academy', 'northstar-academy', 'ACTIVE', 'growth')
on conflict (id) do update
set name = excluded.name,
    slug = excluded.slug,
    status = excluded.status,
    plan = excluded.plan,
    updated_at = now();

-- Add organization scope to all content tables (nullable first for backfill)
alter table public.courses add column if not exists client_id uuid references public.clients(id) on delete cascade;
alter table public.lessons add column if not exists client_id uuid references public.clients(id) on delete cascade;
alter table public.lesson_materials add column if not exists client_id uuid references public.clients(id) on delete cascade;
alter table public.lesson_quizzes add column if not exists client_id uuid references public.clients(id) on delete cascade;
alter table public.quiz_questions add column if not exists client_id uuid references public.clients(id) on delete cascade;
alter table public.enrollments add column if not exists client_id uuid references public.clients(id) on delete cascade;
alter table public.quiz_attempts add column if not exists client_id uuid references public.clients(id) on delete cascade;
alter table public.quiz_attempts add column if not exists user_id uuid references public.users(id) on delete set null;

-- Backfill existing data into the first organization
update public.courses set client_id = 'b1776b77-2994-49fb-bb10-6db11ad1f001' where client_id is null;

update public.lessons set client_id = public.courses.client_id
from public.courses
where public.courses.id = public.lessons.course_id and public.lessons.client_id is null;

update public.lesson_materials set client_id = public.lessons.client_id
from public.lessons
where public.lessons.id = public.lesson_materials.lesson_id and public.lesson_materials.client_id is null;

update public.lesson_quizzes set client_id = public.lessons.client_id
from public.lessons
where public.lessons.id = public.lesson_quizzes.lesson_id and public.lesson_quizzes.client_id is null;

update public.quiz_questions set client_id = public.lesson_quizzes.client_id
from public.lesson_quizzes
where public.lesson_quizzes.id = public.quiz_questions.quiz_id and public.quiz_questions.client_id is null;

update public.enrollments set client_id = public.courses.client_id
from public.courses
where public.courses.id = public.enrollments.course_id and public.enrollments.client_id is null;

update public.quiz_attempts set client_id = public.lesson_quizzes.client_id
from public.lesson_quizzes
where public.lesson_quizzes.id = public.quiz_attempts.quiz_id and public.quiz_attempts.client_id is null;

-- Lock down organization scope
alter table public.courses alter column client_id set not null;
alter table public.lessons alter column client_id set not null;
alter table public.lesson_materials alter column client_id set not null;
alter table public.lesson_quizzes alter column client_id set not null;
alter table public.quiz_questions alter column client_id set not null;
alter table public.enrollments alter column client_id set not null;

-- Replace global slug uniqueness with per-organization uniqueness
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'courses_slug_key'
      and conrelid = 'public.courses'::regclass
  ) then
    alter table public.courses drop constraint courses_slug_key;
  end if;
exception
  when undefined_table then null;
end $$;

create unique index if not exists courses_client_slug_key on public.courses(client_id, slug);

-- Indexes
create index if not exists courses_client_id_idx on public.courses(client_id);
create index if not exists courses_client_status_idx on public.courses(client_id, status);
create index if not exists lessons_client_course_idx on public.lessons(client_id, course_id);
create index if not exists enrollments_client_user_idx on public.enrollments(client_id, user_id);
create index if not exists enrollments_client_course_idx on public.enrollments(client_id, course_id);
create index if not exists client_memberships_user_idx on public.client_memberships(user_id);
create index if not exists client_memberships_client_idx on public.client_memberships(client_id);
create index if not exists quiz_attempts_client_idx on public.quiz_attempts(client_id);
create index if not exists quiz_attempts_user_id_idx on public.quiz_attempts(user_id);

-- Seed memberships
insert into public.client_memberships (client_id, user_id, role, status)
values
  ('b1776b77-2994-49fb-bb10-6db11ad1f001', '7c5ba5cb-1c82-4d54-bf51-7f8f6fa2d401', 'ADMIN', 'ACTIVE'),
  ('b1776b77-2994-49fb-bb10-6db11ad1f002', '7c5ba5cb-1c82-4d54-bf51-7f8f6fa2d401', 'ADMIN', 'ACTIVE'),
  ('b1776b77-2994-49fb-bb10-6db11ad1f001', 'f52f5c34-faf4-4919-bf74-0da8c28dce83', 'LEARNER', 'ACTIVE')
on conflict (client_id, user_id) do update
set role = excluded.role,
    status = excluded.status,
    updated_at = now();

update public.courses set created_by_id = '7c5ba5cb-1c82-4d54-bf51-7f8f6fa2d401' where created_by_id is null;

-- RLS
alter table public.clients enable row level security;
alter table public.client_memberships enable row level security;

drop policy if exists "clients are visible to members" on public.clients;
create policy "clients are visible to members"
on public.clients for select
using (
  exists (
    select 1 from public.client_memberships as cm
    where cm.client_id = clients.id
      and cm.user_id = auth.uid()
      and cm.status = 'ACTIVE'
  )
);

drop policy if exists "client memberships are readable by tenant members" on public.client_memberships;
create policy "client memberships are readable by tenant members"
on public.client_memberships for select
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.client_memberships as cm
    where cm.user_id = auth.uid()
      and cm.client_id = client_memberships.client_id
      and cm.status = 'ACTIVE'
  )
);

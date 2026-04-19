create extension if not exists "pgcrypto";

create type public.user_role as enum ('ADMIN', 'USER');
create type public.course_status as enum ('DRAFT', 'PUBLISHED', 'ARCHIVED');
create type public.enrollment_status as enum ('ACTIVE', 'COMPLETED', 'CANCELLED');

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  role public.user_role not null default 'USER',
  image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  short_description text not null,
  description text not null,
  category text not null,
  level text not null,
  instructor_name text not null,
  thumbnail_url text,
  price_in_cents integer not null default 0,
  status public.course_status not null default 'DRAFT',
  created_by_id uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists courses_status_idx on public.courses(status);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  slug text not null,
  description text not null,
  video_url text not null,
  duration_minutes integer not null,
  position integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(course_id, slug),
  unique(course_id, position)
);

create table if not exists public.lesson_materials (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null unique references public.lessons(id) on delete cascade,
  title text not null,
  type text not null,
  url text not null,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lesson_quizzes (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null unique references public.lessons(id) on delete cascade,
  title text not null,
  description text,
  question_count integer not null default 0,
  time_limit_minutes integer not null default 10,
  pass_percentage integer not null default 70,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  progress_percent integer not null default 0,
  status public.enrollment_status not null default 'ACTIVE',
  enrolled_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, course_id)
);

alter table public.users enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_materials enable row level security;
alter table public.lesson_quizzes enable row level security;
alter table public.enrollments enable row level security;

drop policy if exists "published courses are visible" on public.courses;
create policy "published courses are visible"
on public.courses
for select
using (status = 'PUBLISHED');

drop policy if exists "published course lessons are visible" on public.lessons;
create policy "published course lessons are visible"
on public.lessons
for select
using (
  exists (
    select 1
    from public.courses
    where public.courses.id = lessons.course_id
      and public.courses.status = 'PUBLISHED'
  )
);

drop policy if exists "published lesson materials are visible" on public.lesson_materials;
create policy "published lesson materials are visible"
on public.lesson_materials
for select
using (
  exists (
    select 1
    from public.lessons
    join public.courses on public.courses.id = public.lessons.course_id
    where public.lessons.id = lesson_materials.lesson_id
      and public.courses.status = 'PUBLISHED'
  )
);

drop policy if exists "published lesson quizzes are visible" on public.lesson_quizzes;
create policy "published lesson quizzes are visible"
on public.lesson_quizzes
for select
using (
  exists (
    select 1
    from public.lessons
    join public.courses on public.courses.id = public.lessons.course_id
    where public.lessons.id = lesson_quizzes.lesson_id
      and public.courses.status = 'PUBLISHED'
  )
);

insert into public.users (id, name, email, role)
values
  ('7c5ba5cb-1c82-4d54-bf51-7f8f6fa2d401', 'Sukumar', 'suku86@gmail.com', 'ADMIN'),
  ('f52f5c34-faf4-4919-bf74-0da8c28dce83', 'Learning User', 'learner@nova-lms.dev', 'LEARNER')
on conflict (email) do update
set name = excluded.name,
    role = excluded.role;

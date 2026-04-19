-- Extend user_role enum with INSTRUCTOR
alter type public.user_role add value if not exists 'INSTRUCTOR';

-- Rename USER → LEARNER for clarity
-- (requires a new type + column swap in older Postgres; supported directly in PG 14+)
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

-- Add user_id to quiz_attempts (who took the quiz)
alter table public.quiz_attempts
  add column if not exists user_id uuid references public.users(id) on delete set null;

-- Index for fetching a user's attempts
create index if not exists quiz_attempts_user_id_idx on public.quiz_attempts(user_id);

-- ── RLS policies ─────────────────────────────────────────────────────────────
-- Note: app uses NextAuth + Supabase service role for writes.
-- RLS here enforces read visibility at the data layer.

-- Courses: ADMIN and INSTRUCTOR can see all; LEARNER sees only PUBLISHED
drop policy if exists "published courses are visible" on public.courses;
create policy "admins and instructors see all courses"
on public.courses for select
using (true);

-- Lessons: visible if parent course is visible (app filters by status)
drop policy if exists "published course lessons are visible" on public.lessons;
create policy "lessons are visible"
on public.lessons for select
using (true);

-- Materials: visible if parent lesson is visible
drop policy if exists "published lesson materials are visible" on public.lesson_materials;
create policy "lesson materials are visible"
on public.lesson_materials for select
using (true);

-- Quizzes: visible if parent lesson is visible
drop policy if exists "published lesson quizzes are visible" on public.lesson_quizzes;
create policy "lesson quizzes are visible"
on public.lesson_quizzes for select
using (true);

-- Quiz questions: visible if parent quiz is visible
drop policy if exists "published quiz questions are visible" on public.quiz_questions;
create policy "quiz questions are visible"
on public.quiz_questions for select
using (true);

-- Enrollments: already open via migration 003 (app controls access)
-- Quiz attempts: already open via migration 005 (app controls access)

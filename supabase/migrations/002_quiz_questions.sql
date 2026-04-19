create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.lesson_quizzes(id) on delete cascade,
  question text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_option text not null check (correct_option in ('A', 'B', 'C', 'D')),
  position integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(quiz_id, position)
);

alter table public.quiz_questions enable row level security;

create policy "published quiz questions are visible"
on public.quiz_questions
for select
using (
  exists (
    select 1
    from public.lesson_quizzes
    join public.lessons on public.lessons.id = public.lesson_quizzes.lesson_id
    join public.courses on public.courses.id = public.lessons.course_id
    where public.lesson_quizzes.id = quiz_questions.quiz_id
      and public.courses.status = 'PUBLISHED'
  )
);

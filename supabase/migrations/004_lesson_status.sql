create type public.lesson_status as enum ('DRAFT', 'PUBLISHED', 'ARCHIVED');

alter table public.lessons
  add column if not exists status public.lesson_status not null default 'DRAFT';

create index if not exists lessons_status_idx on public.lessons(status);

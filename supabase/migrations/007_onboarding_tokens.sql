create table if not exists public.onboarding_tokens (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  org_name text not null,
  org_plan text not null default 'starter',
  expires_at timestamptz not null default now() + interval '7 days',
  used_at timestamptz,
  used_by_user_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists onboarding_tokens_token_idx on public.onboarding_tokens(token);

create extension if not exists pgcrypto;

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  rating smallint not null check (rating between 1 and 5),
  emoji text not null,
  label text not null,
  created_at timestamptz not null default now()
);

create index if not exists feedback_created_at_idx
  on public.feedback (created_at desc);

alter table public.feedback enable row level security;

revoke all on table public.feedback from anon, authenticated;
grant select, insert on table public.feedback to service_role;

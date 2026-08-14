-- Run after the two existing migrations.
-- One row represents one creator and one custom public message link.
create table if not exists public.creators (
  id uuid primary key default gen_random_uuid(),
  handle text not null unique check (handle ~ '^[a-z0-9_]{3,30}$'),
  dashboard_key_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_recipient_created_at_idx
  on public.messages (recipient_handle, created_at desc);

alter table public.creators enable row level security;
revoke all on public.creators from anon, authenticated;

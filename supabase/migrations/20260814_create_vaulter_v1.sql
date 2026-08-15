-- Run this in Supabase SQL Editor (or `supabase db push`).
create extension if not exists pgcrypto;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  body text not null check (char_length(btrim(body)) between 1 and 300),
  recipient_handle text not null default 'danilocinoj',
  created_at timestamptz not null default now()
);

-- Public/browser clients have no policies. The server uses a service-role key only.
alter table public.messages enable row level security;
revoke all on public.messages from anon, authenticated;

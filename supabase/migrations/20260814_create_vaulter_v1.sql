-- Run this in Supabase SQL Editor (or `supabase db push`).
create extension if not exists pgcrypto;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  body text not null check (char_length(btrim(body)) between 1 and 300),
  recipient_handle text not null default 'danilocinoj',
  created_at timestamptz not null default now()
);

create table if not exists public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  first_name text null check (char_length(first_name) <= 80),
  email text null,
  phone text null,
  consent boolean not null check (consent is true),
  created_at timestamptz not null default now(),
  source text null,
  constraint waitlist_has_contact check (email is not null or phone is not null)
);

create unique index if not exists waitlist_entries_email_unique on public.waitlist_entries (lower(email)) where email is not null;
create unique index if not exists waitlist_entries_phone_unique on public.waitlist_entries (phone) where phone is not null;

-- Public/browser clients have no policies. The server uses a service-role key only.
alter table public.messages enable row level security;
alter table public.waitlist_entries enable row level security;
revoke all on public.messages from anon, authenticated;
revoke all on public.waitlist_entries from anon, authenticated;

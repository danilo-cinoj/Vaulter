-- Removes the legacy contact-collection table from deployments that used it.
drop table if exists public.waitlist_entries;

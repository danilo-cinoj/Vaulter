-- Run after 20260814_create_vaulter_v1.sql.
-- Images are stored in a private bucket and can only be accessed through server code.
alter table public.messages
  add column if not exists image_path text,
  add column if not exists image_content_type text check (image_content_type in ('image/jpeg', 'image/png', 'image/webp'));

alter table public.messages alter column body drop not null;
alter table public.messages drop constraint if exists messages_body_check;
alter table public.messages drop constraint if exists messages_has_content;
alter table public.messages add constraint messages_has_content
  check (char_length(btrim(coalesce(body, ''))) between 1 and 300 or image_path is not null);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('message-images', 'message-images', false, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = false,
  file_size_limit = 8388608,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- Do not create storage.objects policies for anon or authenticated roles.
-- The service-role key used by API routes bypasses RLS; browsers cannot list or read files.

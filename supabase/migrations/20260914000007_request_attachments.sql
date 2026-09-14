-- 0007 Change-request attachments: a private storage bucket plus a table that
-- records each object. Objects live at <organization_id>/<request_id>/<file>,
-- and storage policies read the organization out of the path.

-- --------------------------------------------------------------------------
-- Helper: the organization id encoded in an object path, or NULL.
-- --------------------------------------------------------------------------
create or replace function vigil.path_organization(p_name text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when split_part(p_name, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then split_part(p_name, '/', 1)::uuid
    else null
  end;
$$;
grant execute on function vigil.path_organization(text) to authenticated, service_role;

-- --------------------------------------------------------------------------
-- Bucket. Private: every read is a signed URL minted by the app.
-- --------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'request-attachments',
  'request-attachments',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf']
)
on conflict (id) do nothing;

create policy "request attachments: read own organization"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'request-attachments'
    and (vigil.is_staff() or vigil.is_org_member(vigil.path_organization(name)))
  );

create policy "request attachments: upload into own organization"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'request-attachments'
    and (vigil.is_staff() or vigil.is_org_member(vigil.path_organization(name)))
  );

create policy "request attachments: delete own or staff"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'request-attachments'
    and (vigil.is_staff() or owner = (select auth.uid()))
  );

-- --------------------------------------------------------------------------
-- change_request_attachments
-- --------------------------------------------------------------------------
create table public.change_request_attachments (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organizations (id) on delete cascade,
  change_request_id  uuid not null references public.change_requests (id) on delete cascade,
  bucket_id          text not null default 'request-attachments',
  object_path        text not null unique,
  file_name          text not null,
  content_type       text not null,
  size_bytes         integer not null,
  uploaded_by        uuid references public.profiles (id) on delete set null,
  created_at         timestamptz not null default now(),
  constraint change_request_attachments_size check (size_bytes >= 0 and size_bytes <= 10485760),
  constraint change_request_attachments_path_org check (vigil.path_organization(object_path) = organization_id)
);

create index change_request_attachments_request_idx on public.change_request_attachments (change_request_id);
create index change_request_attachments_org_idx on public.change_request_attachments (organization_id);

-- The request must belong to the same organization as the attachment.
create or replace function vigil.enforce_same_org_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_other uuid;
begin
  select organization_id into v_other from public.change_requests where id = new.change_request_id;
  if v_other is null or v_other <> new.organization_id then
    raise exception 'change request % does not belong to organization %', new.change_request_id, new.organization_id
      using errcode = '23503';
  end if;
  return new;
end;
$$;

create trigger change_request_attachments_enforce_same_org
  before insert or update of change_request_id, organization_id on public.change_request_attachments
  for each row execute function vigil.enforce_same_org_request();

alter table public.change_request_attachments enable row level security;

create policy change_request_attachments_select on public.change_request_attachments
  for select to authenticated
  using (vigil.is_staff() or vigil.is_org_member(organization_id));

create policy change_request_attachments_insert on public.change_request_attachments
  for insert to authenticated
  with check (vigil.is_staff() or vigil.is_org_member(organization_id));

create policy change_request_attachments_delete on public.change_request_attachments
  for delete to authenticated
  using (
    vigil.is_staff()
    or uploaded_by = (select auth.uid())
    or vigil.has_org_role(organization_id, array['owner','manager']::public.org_role[])
  );

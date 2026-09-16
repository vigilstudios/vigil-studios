-- Two-stage customer retirement. Archived customers stay recoverable but are
-- hidden from normal staff/customer views. A compact, non-relational ledger
-- survives a permanent purge.

alter table public.organizations add column archived_at timestamptz;
create index organizations_archived_idx on public.organizations (archived_at) where archived_at is not null;

drop trigger organizations_protect_columns on public.organizations;
create trigger organizations_protect_columns
  before update on public.organizations
  for each row execute function vigil.protect_columns_from_customers(
    'id', 'slug', 'status', 'archived_at', 'notes', 'created_by', 'created_at'
  );

create table public.customer_deletion_log (
  id                    uuid primary key default gen_random_uuid(),
  former_organization_id uuid not null,
  organization_name     text not null,
  organization_slug     text not null,
  billing_email         text,
  snapshot              jsonb not null default '{}'::jsonb,
  cleanup               jsonb not null default '{}'::jsonb,
  archived_at           timestamptz,
  deleted_at            timestamptz not null default now(),
  deleted_by            uuid
);

create index customer_deletion_log_deleted_idx on public.customer_deletion_log (deleted_at desc);
alter table public.customer_deletion_log enable row level security;
create policy customer_deletion_log_admin_select on public.customer_deletion_log
  for select to authenticated using (vigil.is_admin());

comment on table public.customer_deletion_log is
  'Minimal compliance/operations record retained after a customer and all tenant data are purged.';

create or replace function vigil.purge_organization(
  p_organization_id uuid,
  p_snapshot jsonb,
  p_cleanup jsonb,
  p_deleted_by uuid
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org public.organizations%rowtype;
  v_entity_ids uuid[];
begin
  if auth.role() <> 'service_role' and not vigil.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  select * into v_org from public.organizations where id = p_organization_id for update;
  if v_org.id is null then raise exception 'Customer not found' using errcode = 'P0002'; end if;
  if v_org.archived_at is null then raise exception 'Archive the customer before permanent deletion' using errcode = '22023'; end if;

  select array_agg(id) into v_entity_ids from (
    select p_organization_id as id
    union all select id from public.projects where organization_id = p_organization_id
    union all select id from public.websites where organization_id = p_organization_id
    union all select id from public.domains where organization_id = p_organization_id
    union all select id from public.deployments where organization_id = p_organization_id
    union all select id from public.subscriptions where organization_id = p_organization_id
    union all select id from public.orders where organization_id = p_organization_id
    union all select id from public.change_requests where organization_id = p_organization_id
  ) entities;

  delete from public.provider_links where entity_id = any(coalesce(v_entity_ids, array[]::uuid[]));
  delete from public.orders where organization_id = p_organization_id;
  insert into public.customer_deletion_log
    (former_organization_id, organization_name, organization_slug, billing_email, snapshot, cleanup, archived_at, deleted_by)
  values
    (v_org.id, v_org.name, v_org.slug, v_org.billing_email, coalesce(p_snapshot, '{}'::jsonb), coalesce(p_cleanup, '{}'::jsonb), v_org.archived_at, p_deleted_by);
  delete from public.organizations where id = p_organization_id;
end;
$$;

grant execute on function vigil.purge_organization(uuid, jsonb, jsonb, uuid) to authenticated, service_role;

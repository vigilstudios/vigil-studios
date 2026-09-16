-- Make archive/restore atomic and remember pre-archive project/site states.

alter table public.organizations add column archive_snapshot jsonb;

drop trigger organizations_protect_columns on public.organizations;
create trigger organizations_protect_columns
  before update on public.organizations
  for each row execute function vigil.protect_columns_from_customers(
    'id', 'slug', 'status', 'archived_at', 'archive_snapshot', 'notes', 'created_by', 'created_at'
  );

create or replace function vigil.archive_organization(p_organization_id uuid, p_actor_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org public.organizations%rowtype;
  v_now timestamptz := now();
  v_snapshot jsonb;
begin
  if auth.role() <> 'service_role' and not vigil.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  select * into v_org from public.organizations where id = p_organization_id for update;
  if v_org.id is null then raise exception 'Customer not found' using errcode = 'P0002'; end if;
  if v_org.archived_at is not null then return; end if;

  select jsonb_build_object(
    'organization_status', v_org.status,
    'projects', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'status', status)) from public.projects where organization_id = p_organization_id), '[]'::jsonb),
    'websites', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'status', status, 'status_reason', status_reason)) from public.websites where organization_id = p_organization_id), '[]'::jsonb)
  ) into v_snapshot;

  update public.subscriptions set status = 'canceled', canceled_at = v_now, cancel_at_period_end = false
    where organization_id = p_organization_id and status in ('incomplete', 'trialing', 'active', 'past_due', 'unpaid', 'paused');
  update public.websites set status = 'archived', status_reason = 'Customer archived'
    where organization_id = p_organization_id;
  update public.projects set status = 'cancelled'
    where organization_id = p_organization_id and status in ('draft', 'intake', 'in_progress', 'review', 'approved');
  update public.provisioning_jobs set status = 'canceled', locked_by = null, locked_at = null
    where organization_id = p_organization_id and status in ('queued', 'running');
  update public.orders set status = 'expired'
    where organization_id = p_organization_id and status in ('pending', 'paid', 'failed');
  update public.organizations set status = 'closed', archived_at = v_now, archive_snapshot = v_snapshot
    where id = p_organization_id;
  insert into public.audit_events (organization_id, actor_kind, actor_user_id, action, entity_type, entity_id, after)
    values (p_organization_id, 'staff', p_actor_id, 'organization.archived', 'organization', p_organization_id, jsonb_build_object('archived_at', v_now));
end;
$$;

create or replace function vigil.restore_organization(p_organization_id uuid, p_actor_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org public.organizations%rowtype;
  v_item record;
begin
  if auth.role() <> 'service_role' and not vigil.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  select * into v_org from public.organizations where id = p_organization_id for update;
  if v_org.id is null then raise exception 'Customer not found' using errcode = 'P0002'; end if;
  if v_org.archived_at is null then raise exception 'Customer is not archived' using errcode = '22023'; end if;

  for v_item in select * from jsonb_to_recordset(coalesce(v_org.archive_snapshot->'projects', '[]'::jsonb)) as x(id uuid, status public.project_status)
  loop
    update public.projects set status = v_item.status where id = v_item.id and organization_id = p_organization_id;
  end loop;
  for v_item in select * from jsonb_to_recordset(coalesce(v_org.archive_snapshot->'websites', '[]'::jsonb)) as x(id uuid, status public.website_status, status_reason text)
  loop
    update public.websites set status = v_item.status, status_reason = v_item.status_reason where id = v_item.id and organization_id = p_organization_id;
  end loop;
  update public.organizations
    set status = coalesce((v_org.archive_snapshot->>'organization_status')::public.organization_status, 'active'), archived_at = null, archive_snapshot = null
    where id = p_organization_id;
  insert into public.audit_events (organization_id, actor_kind, actor_user_id, action, entity_type, entity_id)
    values (p_organization_id, 'staff', p_actor_id, 'organization.restored', 'organization', p_organization_id);
end;
$$;

grant execute on function vigil.archive_organization(uuid, uuid) to authenticated, service_role;
grant execute on function vigil.restore_organization(uuid, uuid) to authenticated, service_role;

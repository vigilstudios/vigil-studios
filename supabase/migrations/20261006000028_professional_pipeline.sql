-- Canonical build document. Repository is an export, never a second editor database.
create table public.design_workspaces (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects(id) on delete cascade,
  website_id uuid not null unique references public.websites(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_definition jsonb not null,
  revision integer not null default 1 check (revision > 0),
  engine_version text not null,
  repository_revision integer,
  repository_commit text,
  generated_files jsonb not null default '{}'::jsonb,
  pending_files jsonb not null default '{}'::jsonb,
  sync_token uuid,
  sync_until timestamptz,
  sync_error text,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(site_definition) = 'object'),
  check (repository_revision is null or repository_revision <= revision)
);
create function vigil.validate_design_workspace() returns trigger language plpgsql
set search_path = '' as $$
begin
  if not exists (select 1 from public.websites w join public.projects p on p.id=w.project_id
    where w.id=new.website_id and p.id=new.project_id and p.organization_id=new.organization_id
    and w.organization_id=new.organization_id and p.kind='professional') then
    raise exception 'Workspace must belong to its Professional project and website' using errcode='23514';
  end if;
  return new;
end $$;
create trigger design_workspace_identity before insert or update on public.design_workspaces
for each row execute function vigil.validate_design_workspace();
create trigger design_workspaces_updated before update on public.design_workspaces
for each row execute function vigil.set_updated_at();
alter table public.design_workspaces enable row level security;
create policy design_workspaces_staff on public.design_workspaces for all to authenticated
using (vigil.is_staff()) with check (vigil.is_staff());

-- Atomically allocate all identity-bearing rows. Order lock + customer advisory lock
-- close both repeated-event and distinct-purchases-for-the-same-customer races.
create function public.allocate_order_project(p_order_id uuid, p_slug text, p_provider public.provider,
  p_customer_ref text default null) returns jsonb language plpgsql security definer
set search_path = '' as $$
declare o public.orders; org uuid; proj uuid; web uuid;
begin
  select * into o from public.orders where id=p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if o.status not in ('paid','provisioned') then raise exception 'Order is not paid'; end if;
  perform pg_advisory_xact_lock(hashtextextended(o.email || ':' || lower(trim(o.business_name)), 0));
  org := o.organization_id;
  if org is null and p_customer_ref is not null then
    select entity_id into org from public.provider_links
    where provider=p_provider and resource_kind='customer' and external_id=p_customer_ref
      and entity_type='organization';
  end if;
  if org is null then
    -- A verified buyer's email and business identity, never just an arbitrary email.
    select id into org from public.organizations
    where billing_email=o.email and lower(trim(name))=lower(trim(o.business_name))
      and archived_at is null order by created_at limit 1;
  end if;
  if org is null then
    insert into public.organizations(name,slug,billing_email)
    values(o.business_name,left(p_slug,26)||'-'||replace(o.id::text,'-',''),o.email) returning id into org;
  end if;
  if not exists (select 1 from public.organizations where id=org and archived_at is null) then
    raise exception 'Customer is archived or missing';
  end if;
  if not exists(select 1 from public.organization_invites where organization_id=org and email=o.email
    and revoked_at is null and expires_at>now()) and not exists (
    select 1 from public.organization_members m join public.profiles p on p.id=m.user_id
    where m.organization_id=org and m.status='active' and p.email=o.email
  ) then
    insert into public.organization_invites(organization_id,email,role,expires_at)
    values(org,o.email,'owner',now()+interval '90 days');
  end if;
  proj := o.project_id;
  if proj is null then
    select id into proj from public.projects where source_ref='order:'||o.id;
  end if;
  if proj is null then
    insert into public.projects(organization_id,name,kind,status,template_slug,source_ref)
    values(org,o.business_name||' website',o.project_kind,'intake',o.template_slug,'order:'||o.id)
    returning id into proj;
  end if;
  if not exists(select 1 from public.projects where id=proj and organization_id=org and kind=o.project_kind) then
    raise exception 'Purchase project identity mismatch';
  end if;
  select id into web from public.websites where project_id=proj;
  if web is null then
    insert into public.websites(organization_id,project_id,name,template_slug,hosting_mode)
    values(org,proj,o.business_name||' website',o.template_slug,'dedicated') returning id into web;
  end if;
  update public.orders set organization_id=org,project_id=proj where id=o.id;
  return jsonb_build_object('organizationId',org,'projectId',proj,'websiteId',web);
end $$;
revoke all on function public.allocate_order_project(uuid,text,public.provider,text) from public,anon,authenticated;
grant execute on function public.allocate_order_project(uuid,text,public.provider,text) to service_role;

-- Durable lease prevents overlapping exports from writing older revisions on top of newer ones.
create function public.claim_design_sync(p_project_id uuid, p_token uuid) returns boolean
language sql security definer set search_path = '' as $$
  with claimed as (update public.design_workspaces set sync_token=p_token,
    sync_until=now()+interval '15 minutes' where project_id=p_project_id
    and (sync_until is null or sync_until<now()) returning id)
  select exists(select 1 from claimed);
$$;
revoke all on function public.claim_design_sync(uuid,uuid) from public,anon,authenticated;
grant execute on function public.claim_design_sync(uuid,uuid) to service_role;

-- One manual subscription per purchase, including a crash before order linkage.
create unique index subscriptions_order_source on public.subscriptions ((metadata->>'source'))
where metadata->>'source' like 'order:%';

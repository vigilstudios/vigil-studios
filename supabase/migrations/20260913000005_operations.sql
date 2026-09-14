-- 0005 Operations: audit events, provisioning jobs, webhook inbox, notifications.

-- --------------------------------------------------------------------------
-- audit_events: append-only. Rows enter only through vigil.log_audit_event
-- or the status-change trigger; there is no insert policy.
-- --------------------------------------------------------------------------
create table public.audit_events (
  id               bigint generated always as identity primary key,
  organization_id  uuid references public.organizations (id) on delete cascade,
  actor_kind       public.actor_kind not null,
  actor_user_id    uuid references public.profiles (id) on delete set null,
  action           text not null,                   -- 'website.status_changed', 'member.invited' ...
  entity_type      text not null,
  entity_id        uuid,
  before           jsonb,
  after            jsonb,
  metadata         jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  constraint audit_events_action_format check (action ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$')
);

create index audit_events_org_idx on public.audit_events (organization_id, created_at desc);
create index audit_events_entity_idx on public.audit_events (entity_type, entity_id, created_at desc);
create index audit_events_created_idx on public.audit_events (created_at desc);

create or replace function vigil.log_audit_event(
  p_action       text,
  p_entity_type  text,
  p_entity_id    uuid,
  p_org          uuid default null,
  p_before       jsonb default null,
  p_after        jsonb default null,
  p_metadata     jsonb default '{}'::jsonb,
  p_actor_kind   public.actor_kind default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_kind  public.actor_kind;
  v_id    bigint;
begin
  -- A caller may only write audit rows about organizations it can see.
  if p_org is not null and v_actor is not null
     and not (vigil.is_staff() or vigil.is_org_member(p_org)) then
    raise exception 'not a member of organization %', p_org using errcode = '42501';
  end if;

  v_kind := coalesce(
    p_actor_kind,
    case
      when v_actor is null then 'system'::public.actor_kind
      when vigil.is_staff() then 'staff'::public.actor_kind
      else 'user'::public.actor_kind
    end
  );

  insert into public.audit_events
    (organization_id, actor_kind, actor_user_id, action, entity_type, entity_id, before, after, metadata)
  values
    (p_org, v_kind, v_actor, p_action, p_entity_type, p_entity_id, p_before, p_after, coalesce(p_metadata, '{}'::jsonb))
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function vigil.log_audit_event(text, text, uuid, uuid, jsonb, jsonb, jsonb, public.actor_kind)
  to authenticated, service_role;

-- Every status change on a lifecycle table becomes an audit row, whatever
-- code path made it.
create or replace function vigil.audit_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old text := to_jsonb(old) ->> 'status';
  v_new text := to_jsonb(new) ->> 'status';
  v_org uuid := coalesce(
    (to_jsonb(new) ->> 'organization_id')::uuid,
    case when tg_table_name = 'organizations' then new.id end
  );
begin
  if v_old is distinct from v_new then
    insert into public.audit_events
      (organization_id, actor_kind, actor_user_id, action, entity_type, entity_id, before, after)
    values (
      v_org,
      case
        when (select auth.uid()) is null then 'system'::public.actor_kind
        when vigil.is_staff() then 'staff'::public.actor_kind
        else 'user'::public.actor_kind
      end,
      (select auth.uid()),
      tg_table_name || '.status_changed',
      tg_table_name,
      new.id,
      jsonb_build_object('status', v_old),
      jsonb_build_object('status', v_new)
    );
  end if;
  return new;
end;
$$;

create trigger projects_audit_status
  after update of status on public.projects
  for each row execute function vigil.audit_status_change();
create trigger websites_audit_status
  after update of status on public.websites
  for each row execute function vigil.audit_status_change();
create trigger domains_audit_status
  after update of status on public.domains
  for each row execute function vigil.audit_status_change();
create trigger subscriptions_audit_status
  after update of status on public.subscriptions
  for each row execute function vigil.audit_status_change();
create trigger deployments_audit_status
  after update of status on public.deployments
  for each row execute function vigil.audit_status_change();
create trigger organizations_audit_status
  after update of status on public.organizations
  for each row execute function vigil.audit_status_change();

-- --------------------------------------------------------------------------
-- provisioning_jobs: durable, idempotent work with retries and a lease.
-- --------------------------------------------------------------------------
create table public.provisioning_jobs (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid references public.organizations (id) on delete cascade,
  website_id       uuid references public.websites (id) on delete cascade,
  domain_id        uuid references public.domains (id) on delete cascade,
  kind             text not null,                   -- handler name: 'website.provision', 'domain.verify' ...
  idempotency_key  text not null unique,
  status           public.job_status not null default 'queued',
  payload          jsonb not null default '{}'::jsonb,
  result           jsonb,
  error            jsonb,
  attempts         integer not null default 0,
  max_attempts     integer not null default 5,
  scheduled_for    timestamptz not null default now(),
  locked_by        text,
  locked_at        timestamptz,
  started_at       timestamptz,
  finished_at      timestamptz,
  created_by       uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint provisioning_jobs_kind_format check (kind ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'),
  constraint provisioning_jobs_attempts check (max_attempts >= 1 and attempts >= 0)
);

create index provisioning_jobs_due_idx
  on public.provisioning_jobs (scheduled_for)
  where status = 'queued';
create index provisioning_jobs_org_idx on public.provisioning_jobs (organization_id, created_at desc);
create index provisioning_jobs_status_idx on public.provisioning_jobs (status, updated_at desc);

create trigger provisioning_jobs_set_updated_at
  before update on public.provisioning_jobs
  for each row execute function vigil.set_updated_at();

create trigger provisioning_jobs_audit_status
  after update of status on public.provisioning_jobs
  for each row execute function vigil.audit_status_change();

-- Claim up to p_limit due jobs for a worker. SKIP LOCKED keeps concurrent
-- runners from double-claiming; the lease lets a crashed runner's job be
-- reclaimed after p_lease_seconds.
create or replace function vigil.claim_jobs(
  p_worker        text,
  p_limit         integer default 10,
  p_lease_seconds integer default 300
)
returns setof public.provisioning_jobs
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (vigil.is_staff() or (select auth.role()) = 'service_role') then
    raise exception 'staff or service role only' using errcode = '42501';
  end if;

  return query
  with due as (
    select j.id
    from public.provisioning_jobs j
    where (
        j.status = 'queued' and j.scheduled_for <= now()
      ) or (
        j.status = 'running' and j.locked_at < now() - make_interval(secs => p_lease_seconds)
      )
    order by j.scheduled_for
    limit greatest(p_limit, 1)
    for update skip locked
  )
  update public.provisioning_jobs j
    set status = 'running',
        locked_by = p_worker,
        locked_at = now(),
        started_at = coalesce(j.started_at, now()),
        attempts = j.attempts + 1
    from due
    where j.id = due.id
    returning j.*;
end;
$$;

grant execute on function vigil.claim_jobs(text, integer, integer) to authenticated, service_role;

-- --------------------------------------------------------------------------
-- webhook_events: provider inbox, idempotent on (provider, event_id).
-- --------------------------------------------------------------------------
create table public.webhook_events (
  id             uuid primary key default gen_random_uuid(),
  provider       public.provider not null,
  event_id       text not null,
  event_type     text not null,
  payload        jsonb not null,
  status         public.webhook_status not null default 'received',
  error          jsonb,
  received_at    timestamptz not null default now(),
  processed_at   timestamptz,
  unique (provider, event_id)
);

create index webhook_events_status_idx on public.webhook_events (status, received_at);

-- --------------------------------------------------------------------------
-- notifications: per-user, optionally scoped to an organization.
-- --------------------------------------------------------------------------
create table public.notifications (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles (id) on delete cascade,
  organization_id  uuid references public.organizations (id) on delete cascade,
  kind             text not null,
  title            text not null,
  body             text,
  href             text,
  read_at          timestamptz,
  created_at       timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc)
  where read_at is null;

-- --------------------------------------------------------------------------
-- RLS
-- --------------------------------------------------------------------------
alter table public.audit_events enable row level security;
alter table public.provisioning_jobs enable row level security;
alter table public.webhook_events enable row level security;
alter table public.notifications enable row level security;

-- audit: members read their organization's history; staff read all. No
-- insert/update/delete policies: writes go through definer functions only.
create policy audit_events_select on public.audit_events for select to authenticated
  using (vigil.is_staff() or (organization_id is not null and vigil.is_org_member(organization_id)));

-- jobs: staff only. Customers see provisioning progress through
-- websites.status / domains.status and their status_reason, never raw jobs.
create policy provisioning_jobs_staff_all on public.provisioning_jobs for all to authenticated
  using (vigil.is_staff()) with check (vigil.is_staff());

-- webhooks: staff only.
create policy webhook_events_staff_all on public.webhook_events for all to authenticated
  using (vigil.is_staff()) with check (vigil.is_staff());

-- notifications: the recipient reads and marks read; staff/service create.
create policy notifications_select_own on public.notifications for select to authenticated
  using (user_id = (select auth.uid()) or vigil.is_staff());
create policy notifications_update_own on public.notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy notifications_staff_insert on public.notifications for insert to authenticated
  with check (vigil.is_staff());
create policy notifications_delete_own on public.notifications for delete to authenticated
  using (user_id = (select auth.uid()) or vigil.is_staff());

create trigger notifications_protect_columns
  before update on public.notifications
  for each row execute function vigil.protect_columns_from_customers(
    'id', 'user_id', 'organization_id', 'kind', 'title', 'body', 'href', 'created_at'
  );

-- API wrappers (see 0002 for the reasoning).
create or replace function public.log_audit_event(
  p_action       text,
  p_entity_type  text,
  p_entity_id    uuid default null,
  p_org          uuid default null,
  p_before       jsonb default null,
  p_after        jsonb default null,
  p_metadata     jsonb default '{}'::jsonb
)
returns bigint
language sql
security invoker
set search_path = ''
as $$
  select vigil.log_audit_event(p_action, p_entity_type, p_entity_id, p_org, p_before, p_after, p_metadata, null);
$$;
grant execute on function public.log_audit_event(text, text, uuid, uuid, jsonb, jsonb, jsonb)
  to authenticated, service_role;

create or replace function public.claim_jobs(
  p_worker        text,
  p_limit         integer default 10,
  p_lease_seconds integer default 300
)
returns setof public.provisioning_jobs
language sql
security invoker
set search_path = ''
as $$
  select * from vigil.claim_jobs(p_worker, p_limit, p_lease_seconds);
$$;
grant execute on function public.claim_jobs(text, integer, integer) to authenticated, service_role;

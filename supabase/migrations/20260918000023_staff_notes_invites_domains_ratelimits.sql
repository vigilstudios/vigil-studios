-- 0023 Owner decisions after the 18 Sep 2026 audit.
--
-- A. Staff notes move out of organizations.notes / orders.notes (readable by
--    the customer through PostgREST) into a staff-only table.
-- B. Invitations sent by a customer need an explicit acceptance from the
--    invitee. Invitations created by staff or by provisioning (the account
--    the customer just paid for) keep accepting automatically on sign-in.
-- C. Audit rows are written only by the server (service role, naming the
--    actor), staff sessions and trusted triggers; a customer session can no
--    longer call log_audit_event directly.
-- D. A hostname is owned by whoever proves control of its DNS with a
--    per-row TXT token; recording a domain no longer reserves it globally.
-- E. A durable rate limiter for the sign-in, checkout, invitation and
--    autosave actions (service role only).

-- --------------------------------------------------------------------------
-- A. staff_notes
-- --------------------------------------------------------------------------
create table public.staff_notes (
  id           uuid primary key default gen_random_uuid(),
  entity_type  text not null,
  entity_id    uuid not null,
  body         text not null,
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint staff_notes_entity_type check (entity_type in ('organization', 'order')),
  constraint staff_notes_body_length check (char_length(body) between 1 and 4000)
);

create index staff_notes_entity_idx on public.staff_notes (entity_type, entity_id, created_at desc);

create trigger staff_notes_set_updated_at
  before update on public.staff_notes
  for each row execute function vigil.set_updated_at();

alter table public.staff_notes enable row level security;
create policy staff_notes_staff_all on public.staff_notes for all to authenticated
  using (vigil.is_staff()) with check (vigil.is_staff());

insert into public.staff_notes (entity_type, entity_id, body, created_by, created_at)
select 'organization', o.id, o.notes, o.created_by, o.created_at
from public.organizations o
where o.notes is not null and btrim(o.notes) <> '';

insert into public.staff_notes (entity_type, entity_id, body, created_by, created_at)
select 'order', r.id, r.notes, r.created_by, r.created_at
from public.orders r
where r.notes is not null and btrim(r.notes) <> '';

alter table public.organizations drop column notes;
alter table public.orders drop column notes;

drop trigger organizations_protect_columns on public.organizations;
create trigger organizations_protect_columns
  before update on public.organizations
  for each row execute function vigil.protect_columns_from_customers(
    'id', 'slug', 'status', 'archived_at', 'archive_snapshot', 'created_by', 'created_at'
  );

-- Staff notes about a purged customer go with it.
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
  delete from public.staff_notes where entity_id = any(coalesce(v_entity_ids, array[]::uuid[]));
  delete from public.orders where organization_id = p_organization_id;
  insert into public.customer_deletion_log
    (former_organization_id, organization_name, organization_slug, billing_email, snapshot, cleanup, archived_at, deleted_by)
  values
    (v_org.id, v_org.name, v_org.slug, v_org.billing_email, coalesce(p_snapshot, '{}'::jsonb), coalesce(p_cleanup, '{}'::jsonb), v_org.archived_at, p_deleted_by);
  delete from public.organizations where id = p_organization_id;
end;
$$;

-- --------------------------------------------------------------------------
-- B. Invitations: consent for customer-sent invites
-- --------------------------------------------------------------------------
alter table public.organization_invites add column requires_acceptance boolean not null default true;
alter table public.organization_invites add column declined_at timestamptz;

-- Everything sent so far came from staff or provisioning.
update public.organization_invites i
   set requires_acceptance = false
 where i.invited_by is null
    or exists (select 1 from public.staff_members s where s.user_id = i.invited_by);

-- The caller decides the trust level, never the row: a customer session
-- always produces an invitation that waits for the invitee.
create or replace function vigil.set_invite_trust()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.requires_acceptance := not ((select auth.uid()) is null or vigil.is_staff());
  new.declined_at := null;
  return new;
end;
$$;

create trigger organization_invites_set_trust
  before insert on public.organization_invites
  for each row execute function vigil.set_invite_trust();

create or replace function vigil.current_email()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select lower(p.email) from public.profiles p where p.id = (select auth.uid());
$$;

-- Auto-accept only what staff or provisioning created.
create or replace function vigil.accept_invites_for_current_user()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user  uuid := (select auth.uid());
  v_email text;
  v_count integer := 0;
  r record;
begin
  if v_user is null then
    return 0;
  end if;

  select lower(email) into v_email from public.profiles where id = v_user;
  if v_email is null then
    return 0;
  end if;

  for r in
    select * from public.organization_invites i
    where i.email = v_email
      and i.accepted_at is null
      and i.revoked_at is null
      and i.declined_at is null
      and i.expires_at > now()
      and not i.requires_acceptance
  loop
    insert into public.organization_members (organization_id, user_id, role, invited_by)
    values (r.organization_id, v_user, r.role, r.invited_by)
    on conflict (organization_id, user_id) do nothing;

    update public.organization_invites
      set accepted_at = now(), accepted_by = v_user
      where id = r.id;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

-- What the signed-in person has been invited to and has not answered.
create or replace function vigil.list_my_invitations()
returns table (
  id uuid,
  organization_id uuid,
  organization_name text,
  role public.org_role,
  invited_by_name text,
  expires_at timestamptz,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select i.id, i.organization_id, o.name, i.role, coalesce(nullif(p.full_name, ''), p.email), i.expires_at, i.created_at
  from public.organization_invites i
  join public.organizations o on o.id = i.organization_id
  left join public.profiles p on p.id = i.invited_by
  where i.email = vigil.current_email()
    and i.requires_acceptance
    and i.accepted_at is null
    and i.revoked_at is null
    and i.declined_at is null
    and i.expires_at > now()
    and o.archived_at is null
  order by i.created_at desc;
$$;

create or replace function vigil.accept_invitation(p_invite uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_invite public.organization_invites%rowtype;
begin
  if v_user is null then
    raise exception 'sign in to accept an invitation' using errcode = '42501';
  end if;
  select * into v_invite from public.organization_invites where id = p_invite for update;
  if v_invite.id is null
     or v_invite.email <> vigil.current_email()
     or v_invite.accepted_at is not null
     or v_invite.revoked_at is not null
     or v_invite.declined_at is not null
     or v_invite.expires_at <= now() then
    raise exception 'that invitation is no longer open' using errcode = 'P0002';
  end if;

  insert into public.organization_members (organization_id, user_id, role, invited_by)
  values (v_invite.organization_id, v_user, v_invite.role, v_invite.invited_by)
  on conflict (organization_id, user_id) do nothing;

  update public.organization_invites
     set accepted_at = now(), accepted_by = v_user
   where id = v_invite.id;

  insert into public.audit_events (organization_id, actor_kind, actor_user_id, action, entity_type, entity_id, after)
  values (v_invite.organization_id, 'user', v_user, 'member.invite_accepted', 'organization_invite', v_invite.id,
          jsonb_build_object('role', v_invite.role));

  return v_invite.organization_id;
end;
$$;

create or replace function vigil.decline_invitation(p_invite uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_invite public.organization_invites%rowtype;
begin
  if v_user is null then
    raise exception 'sign in to decline an invitation' using errcode = '42501';
  end if;
  select * into v_invite from public.organization_invites where id = p_invite for update;
  if v_invite.id is null or v_invite.email <> vigil.current_email() or v_invite.accepted_at is not null then
    raise exception 'that invitation is no longer open' using errcode = 'P0002';
  end if;
  update public.organization_invites set declined_at = coalesce(declined_at, now()) where id = v_invite.id;
  insert into public.audit_events (organization_id, actor_kind, actor_user_id, action, entity_type, entity_id)
  values (v_invite.organization_id, 'user', v_user, 'member.invite_declined', 'organization_invite', v_invite.id);
end;
$$;

grant execute on function vigil.current_email() to authenticated, service_role;
grant execute on function vigil.list_my_invitations() to authenticated, service_role;
grant execute on function vigil.accept_invitation(uuid) to authenticated, service_role;
grant execute on function vigil.decline_invitation(uuid) to authenticated, service_role;

create or replace function public.list_my_invitations()
returns table (
  id uuid,
  organization_id uuid,
  organization_name text,
  role public.org_role,
  invited_by_name text,
  expires_at timestamptz,
  created_at timestamptz
)
language sql
security invoker
set search_path = ''
as $$ select * from vigil.list_my_invitations(); $$;

create or replace function public.accept_invitation(p_invite uuid)
returns uuid language sql security invoker set search_path = ''
as $$ select vigil.accept_invitation(p_invite); $$;

create or replace function public.decline_invitation(p_invite uuid)
returns void language sql security invoker set search_path = ''
as $$ select vigil.decline_invitation(p_invite); $$;

grant execute on function public.list_my_invitations() to authenticated, service_role;
grant execute on function public.accept_invitation(uuid) to authenticated, service_role;
grant execute on function public.decline_invitation(uuid) to authenticated, service_role;

-- --------------------------------------------------------------------------
-- C. Audit rows come from the server, staff, or trusted triggers
-- --------------------------------------------------------------------------
drop function public.log_audit_event(text, text, uuid, uuid, jsonb, jsonb, jsonb);
drop function vigil.log_audit_event(text, text, uuid, uuid, jsonb, jsonb, jsonb, public.actor_kind);

create or replace function vigil.log_audit_event(
  p_action        text,
  p_entity_type   text,
  p_entity_id     uuid,
  p_org           uuid default null,
  p_before        jsonb default null,
  p_after         jsonb default null,
  p_metadata      jsonb default '{}'::jsonb,
  p_actor_kind    public.actor_kind default null,
  p_actor_user_id uuid default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session uuid := (select auth.uid());
  v_actor   uuid;
  v_kind    public.actor_kind;
  v_id      bigint;
begin
  if v_session is not null and not vigil.is_staff() then
    -- A customer session may only produce audit rows through the triggers
    -- that describe an allowed action; the app writes its own rows with the
    -- service role and names the actor.
    if pg_trigger_depth() = 0 then
      raise exception 'audit events are recorded by the server' using errcode = '42501';
    end if;
    if p_org is null or not vigil.is_org_member(p_org) then
      raise exception 'not a member of organization %', p_org using errcode = '42501';
    end if;
    v_actor := v_session;
    v_kind := 'user'::public.actor_kind;
  else
    -- Staff session, or the service role naming the customer it acted for.
    v_actor := coalesce(v_session, p_actor_user_id);
    v_kind := coalesce(
      p_actor_kind,
      case
        when v_actor is null then 'system'::public.actor_kind
        when exists (select 1 from public.staff_members s where s.user_id = v_actor) then 'staff'::public.actor_kind
        else 'user'::public.actor_kind
      end
    );
  end if;

  insert into public.audit_events
    (organization_id, actor_kind, actor_user_id, action, entity_type, entity_id, before, after, metadata)
  values
    (p_org, v_kind, v_actor, p_action, p_entity_type, p_entity_id, p_before, p_after, coalesce(p_metadata, '{}'::jsonb))
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function vigil.log_audit_event(text, text, uuid, uuid, jsonb, jsonb, jsonb, public.actor_kind, uuid)
  to authenticated, service_role;

create or replace function public.log_audit_event(
  p_action        text,
  p_entity_type   text,
  p_entity_id     uuid default null,
  p_org           uuid default null,
  p_before        jsonb default null,
  p_after         jsonb default null,
  p_metadata      jsonb default '{}'::jsonb,
  p_actor_user_id uuid default null
)
returns bigint
language sql
security invoker
set search_path = ''
as $$
  select vigil.log_audit_event(p_action, p_entity_type, p_entity_id, p_org, p_before, p_after, p_metadata, null, p_actor_user_id);
$$;
grant execute on function public.log_audit_event(text, text, uuid, uuid, jsonb, jsonb, jsonb, uuid)
  to authenticated, service_role;

-- --------------------------------------------------------------------------
-- D. Domain ownership: prove control before a hostname is claimed
-- --------------------------------------------------------------------------
-- Each row carries the token the customer publishes at _vigil.<hostname>
-- (TXT "vigil-verify=<token>"). dns_ok is only true when that record
-- resolves, so it binds the hostname to this organization, not just to
-- the platform.
alter table public.domains
  add column verification_token text not null default md5(gen_random_uuid()::text || clock_timestamp()::text);
alter table public.domains
  add constraint domains_verification_token_format check (verification_token ~ '^[0-9a-f]{32}$');

-- Recording a hostname no longer reserves it: the same name may be pending
-- in several organizations, and exactly one may hold it once verified.
alter table public.domains drop constraint domains_hostname_key;
alter table public.domains add constraint domains_org_hostname_key unique (organization_id, hostname);
create unique index domains_hostname_claimed_idx on public.domains (hostname)
  where dns_ok = true and status <> 'released';

-- Customers cannot pick their own token or lower the bar on insert.
drop policy domains_member_insert on public.domains;
create policy domains_member_insert on public.domains
  for insert to authenticated
  with check (
    vigil.is_staff()
    or (
      vigil.has_org_role(organization_id, array['owner','manager']::public.org_role[])
      and source = 'customer_owned'
      and status = 'pending'
      and dns_ok is null
      and ssl_ok is null
      and verification = '{}'::jsonb
      and metadata = '{}'::jsonb
      and registrant = '{}'::jsonb
      and verified_at is null
      and connected_at is null
      and expires_at is null
    )
  );

create or replace function vigil.domains_assign_token()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and not vigil.is_staff() then
    new.verification_token := md5(gen_random_uuid()::text || clock_timestamp()::text);
  end if;
  return new;
end;
$$;

create trigger domains_assign_token
  before insert on public.domains
  for each row execute function vigil.domains_assign_token();

-- --------------------------------------------------------------------------
-- E. Rate limits (fixed window, one row per key)
-- --------------------------------------------------------------------------
create table vigil.rate_limits (
  key           text primary key,
  window_start  timestamptz not null,
  hits          integer not null
);

create or replace function vigil.rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now  timestamptz := now();
  v_hits integer;
begin
  if (select auth.role()) is distinct from 'service_role' then
    raise exception 'service role only' using errcode = '42501';
  end if;
  insert into vigil.rate_limits as r (key, window_start, hits)
  values (p_key, v_now, 1)
  on conflict (key) do update
    set hits = case when r.window_start < v_now - make_interval(secs => p_window_seconds) then 1 else r.hits + 1 end,
        window_start = case when r.window_start < v_now - make_interval(secs => p_window_seconds) then v_now else r.window_start end
  returning hits into v_hits;
  -- Opportunistic sweep so the table never grows past a day of keys.
  if random() < 0.01 then
    delete from vigil.rate_limits where window_start < v_now - interval '1 day';
  end if;
  return v_hits <= p_limit;
end;
$$;

revoke all on function vigil.rate_limit(text, integer, integer) from public;
grant execute on function vigil.rate_limit(text, integer, integer) to service_role;

create or replace function public.rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean language sql security invoker set search_path = ''
as $$ select vigil.rate_limit(p_key, p_limit, p_window_seconds); $$;
revoke all on function public.rate_limit(text, integer, integer) from public;
grant execute on function public.rate_limit(text, integer, integer) to service_role;

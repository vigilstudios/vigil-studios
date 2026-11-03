-- Website evidence, without new subscriptions or automatic provider enrollment.
-- Connections are explicitly enabled by staff. No customer site is enrolled by this migration.
create table public.website_measurement_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  website_id uuid not null references public.websites(id) on delete cascade,
  kind text not null check (kind in ('traffic','quality_mobile','quality_desktop','field_performance','site_security','repository_security','search')),
  enabled boolean not null default false,
  revision integer not null default 1 check (revision > 0),
  last_attempt_at timestamptz,
  last_success_at timestamptz,
  last_error_code text check (last_error_code is null or last_error_code ~ '^[a-z_]{1,80}$'),
  next_run_at timestamptz not null default now(),
  lease_token uuid,
  lease_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (website_id,kind),
  unique (id,organization_id,website_id)
);
create trigger measurement_connection_identity before insert or update on public.website_measurement_connections
for each row execute function vigil.enforce_same_org_references();
create trigger measurement_connection_updated before update on public.website_measurement_connections
for each row execute function vigil.set_updated_at();
create index measurement_due on public.website_measurement_connections(next_run_at) where enabled;

create table public.website_measurement_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  website_id uuid not null references public.websites(id) on delete cascade,
  connection_id uuid not null,
  connection_revision integer not null check (connection_revision > 0),
  observed_at timestamptz not null,
  expires_at timestamptz not null,
  target_origin text not null check (target_origin ~ '^https://[a-zA-Z0-9.-]+$'),
  schema_version integer not null default 1 check (schema_version = 1),
  coverage text not null check (coverage in ('complete','partial','insufficient')),
  payload jsonb not null check (jsonb_typeof(payload)='object' and octet_length(payload::text) <= 524288),
  created_at timestamptz not null default now(),
  foreign key (connection_id,organization_id,website_id)
    references public.website_measurement_connections(id,organization_id,website_id) on delete cascade,
  check (expires_at > observed_at)
);
create index measurement_snapshot_history on public.website_measurement_snapshots(connection_id,observed_at desc);
create index measurement_snapshot_scope on public.website_measurement_snapshots(organization_id,website_id,observed_at desc);

create table public.measurement_runner_health (
  runner text primary key check (runner in ('analytics','jobs')),
  started_at timestamptz not null,
  finished_at timestamptz,
  status text not null check(status in ('running','ok','error'))
);

alter table public.website_measurement_connections enable row level security;
alter table public.website_measurement_snapshots enable row level security;
alter table public.measurement_runner_health enable row level security;
revoke all on public.website_measurement_connections,public.website_measurement_snapshots,public.measurement_runner_health from anon,authenticated;
grant select (id,organization_id,website_id,kind,enabled,revision,last_attempt_at,last_success_at,last_error_code,next_run_at,created_at,updated_at)
  on public.website_measurement_connections to authenticated;
grant select on public.website_measurement_snapshots,public.measurement_runner_health to authenticated;
grant all on public.website_measurement_connections,public.website_measurement_snapshots,public.measurement_runner_health to service_role;
create policy measurement_connection_read on public.website_measurement_connections for select to authenticated
using (vigil.is_staff() or vigil.is_org_member(organization_id));
create policy measurement_snapshot_read on public.website_measurement_snapshots for select to authenticated
using (vigil.is_staff() or vigil.is_org_member(organization_id));
create policy measurement_health_staff on public.measurement_runner_health for select to authenticated using (vigil.is_staff());

-- The live origin is the immutable measurement target for a run. Re-check at commit.
create function vigil.measurement_origin(p_website uuid) returns text
language sql stable security definer set search_path='' as $$
  select split_part(w.live_url,'/',1)||'//'||lower(split_part(w.live_url,'/',3))
  from public.websites w join public.organizations o on o.id=w.organization_id
  where w.id=p_website and w.status='live' and o.archived_at is null
    and w.live_url ~ '^https://[a-zA-Z0-9.-]+(/[^[:space:]]*)?$'
    and split_part(w.live_url,'/',3) !~ '^[0-9.]+$'
    and split_part(w.live_url,'/',3) !~* '(^|\.)(localhost|local|internal|test|invalid)$'
$$;
revoke all on function vigil.measurement_origin(uuid) from public,anon,authenticated;

create function public.configure_website_measurement(p_website uuid,p_kind text,p_enabled boolean,p_search_property text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare w public.websites; cid uuid; origin text;
begin
  if auth.uid() is null or not vigil.is_staff() then raise exception 'Staff required' using errcode='42501'; end if;
  select * into w from public.websites where id=p_website;
  if w.id is null then raise exception 'Website unavailable' using errcode='22023'; end if;
  if p_kind not in ('traffic','quality_mobile','quality_desktop','field_performance','site_security','repository_security','search') or p_enabled is null
    then raise exception 'Invalid measurement' using errcode='22023'; end if;
  origin:=vigil.measurement_origin(w.id);
  if p_enabled and origin is null then raise exception 'A live public HTTPS website is required' using errcode='22023'; end if;
  if p_enabled and p_kind='traffic' and not exists(select 1 from public.provider_links where entity_type='website' and entity_id=w.id and provider='vercel' and resource_kind='site')
    then raise exception 'Map the website Vercel project first' using errcode='22023'; end if;
  if p_enabled and p_kind='repository_security' and not exists(select 1 from public.provider_links where entity_type='website' and entity_id=w.id and resource_kind='repository')
    then raise exception 'Map the website repository first' using errcode='22023'; end if;
  if p_kind='search' and p_enabled then
    -- Exact host only. A property cannot select another tenant's website.
    if p_search_property is not null then
      if p_search_property not in (origin||'/', 'sc-domain:'||split_part(origin,'/',3)) then
        raise exception 'Use the exact live website property' using errcode='22023';
      end if;
      delete from public.provider_links where provider='other' and resource_kind='search_console_property' and entity_type='website' and entity_id=w.id;
      insert into public.provider_links(provider,resource_kind,external_id,entity_type,entity_id)
      values('other','search_console_property',p_search_property,'website',w.id);
    end if;
    if not exists(select 1 from public.provider_links where provider='other' and resource_kind='search_console_property' and entity_type='website' and entity_id=w.id
      and external_id in (origin||'/', 'sc-domain:'||split_part(origin,'/',3))) then
      raise exception 'An authorized matching Search Console property is required' using errcode='22023';
    end if;
  end if;
  insert into public.website_measurement_connections(organization_id,website_id,kind,enabled)
  values(w.organization_id,w.id,p_kind,p_enabled)
  on conflict(website_id,kind) do update set enabled=excluded.enabled,revision=website_measurement_connections.revision+1,
    next_run_at=now(),lease_token=null,lease_expires_at=null,last_error_code=null,last_success_at=null
  returning id into cid;
  perform vigil.log_audit_event(p_action=>'measurement.configured',p_entity_type=>'website',p_entity_id=>w.id,p_org=>w.organization_id,
    p_after=>jsonb_build_object('kind',p_kind,'enabled',p_enabled));
  return cid;
end $$;
revoke all on function public.configure_website_measurement(uuid,text,boolean,text) from public,anon;
grant execute on function public.configure_website_measurement(uuid,text,boolean,text) to authenticated;

create function public.claim_website_measurement(p_connection uuid default null)
returns setof public.website_measurement_connections language plpgsql security definer set search_path='' as $$
begin
  if auth.role() is distinct from 'service_role' then raise exception 'Service role required' using errcode='42501'; end if;
  return query with candidate as (
    select c.id from public.website_measurement_connections c
    where c.enabled and c.next_run_at<=now() and (p_connection is null or c.id=p_connection)
      and (c.lease_expires_at is null or c.lease_expires_at<now()) and vigil.measurement_origin(c.website_id) is not null
    order by c.next_run_at,c.id for update skip locked limit 1
  ) update public.website_measurement_connections c set lease_token=gen_random_uuid(),lease_expires_at=now()+interval '4 minutes',last_attempt_at=now()
    from candidate x where c.id=x.id returning c.*;
end $$;
revoke all on function public.claim_website_measurement(uuid) from public,anon,authenticated;
grant execute on function public.claim_website_measurement(uuid) to service_role;

create function public.finish_website_measurement(p_connection uuid,p_revision integer,p_lease uuid,p_origin text,
  p_payload jsonb default null,p_coverage text default 'complete',p_observed timestamptz default now(),p_error text default null)
returns boolean language plpgsql security definer set search_path='' as $$
declare c public.website_measurement_connections; refresh interval; expiry interval;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'Service role required' using errcode='42501'; end if;
  select * into c from public.website_measurement_connections where id=p_connection for update;
  if c.id is null or not c.enabled or c.revision<>p_revision or c.lease_token is null or c.lease_token is distinct from p_lease
    or c.lease_expires_at is null or c.lease_expires_at<=now() or vigil.measurement_origin(c.website_id) is distinct from p_origin then return false; end if;
  refresh:=case when c.kind in ('quality_mobile','quality_desktop') then interval '7 days'
    when c.kind='traffic' then interval '6 hours' else interval '1 day' end;
  expiry:=case when c.kind in ('quality_mobile','quality_desktop') then interval '8 days'
    when c.kind='traffic' then interval '12 hours' else interval '2 days' end;
  if p_error is null then
    if p_payload is null or p_observed>now()+interval '5 minutes' or p_observed<now()-interval '1 day' then
      raise exception 'Invalid measurement evidence' using errcode='22023'; end if;
    insert into public.website_measurement_snapshots(organization_id,website_id,connection_id,connection_revision,observed_at,expires_at,target_origin,coverage,payload)
    values(c.organization_id,c.website_id,c.id,c.revision,p_observed,p_observed+expiry,p_origin,p_coverage,p_payload);
    update public.website_measurement_connections set last_success_at=p_observed,last_error_code=null,next_run_at=now()+refresh,lease_token=null,lease_expires_at=null where id=c.id;
  else
    update public.website_measurement_connections set last_error_code=p_error,next_run_at=now()+interval '6 hours',lease_token=null,lease_expires_at=null where id=c.id;
  end if;
  return true;
end $$;
revoke all on function public.finish_website_measurement(uuid,integer,uuid,text,jsonb,text,timestamptz,text) from public,anon,authenticated;
grant execute on function public.finish_website_measurement(uuid,integer,uuid,text,jsonb,text,timestamptz,text) to service_role;

-- Cleanup is deliberately bounded to derived measurements, never customer business records.
create function public.prune_website_measurements() returns void language plpgsql security definer set search_path='' as $$
begin
  if auth.role() is distinct from 'service_role' then raise exception 'Service role required' using errcode='42501'; end if;
  delete from public.website_measurement_snapshots where created_at<now()-interval '100 days';
end $$;
revoke all on function public.prune_website_measurements() from public,anon,authenticated;
grant execute on function public.prune_website_measurements() to service_role;

create function public.refresh_website_measurement(p_connection uuid) returns void language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or not vigil.is_staff() then raise exception 'Staff required' using errcode='42501'; end if;
  update public.website_measurement_connections set next_run_at=now()
    where id=p_connection and enabled and (last_attempt_at is null or last_attempt_at<now()-interval '1 hour');
  if not found then raise exception 'Connection unavailable or checked within the last hour' using errcode='22023'; end if;
end $$;
revoke all on function public.refresh_website_measurement(uuid) from public,anon;
grant execute on function public.refresh_website_measurement(uuid) to authenticated;

-- A changed provider association invalidates an in-flight run and its old read model.
-- Provider links remain the only place external resource identifiers are persisted.
create function vigil.invalidate_measurement_binding() returns trigger language plpgsql security definer set search_path='' as $$
declare link record; old_site uuid; new_site uuid;
begin
  if tg_op<>'INSERT' then old_site:=case when old.entity_type='website' then old.entity_id end; end if;
  if tg_op<>'DELETE' then new_site:=case when new.entity_type='website' then new.entity_id end; end if;
  for link in select * from (values
    (old_site,case when tg_op<>'INSERT' then old.resource_kind end),
    (new_site,case when tg_op<>'DELETE' then new.resource_kind end)
  ) v(website_id,resource_kind) where website_id is not null group by website_id,resource_kind loop
    update public.website_measurement_connections set revision=revision+1,last_success_at=null,next_run_at=now(),lease_token=null,lease_expires_at=null
    where website_id=link.website_id and kind=case link.resource_kind when 'site' then 'traffic' when 'repository' then 'repository_security' when 'search_console_property' then 'search' else '' end;
  end loop;
  if tg_op='DELETE' then return old;end if;return new;
end $$;
create trigger measurement_provider_binding after insert or update or delete on public.provider_links
for each row execute function vigil.invalidate_measurement_binding();

-- Future outcome analysis needs structured, witnessed stage history. Existing historical
-- free-text events stay unchanged; do not invent prior stage or response timestamps.
alter table public.lead_events add column details jsonb not null default '{}'::jsonb
  check (jsonb_typeof(details)='object' and octet_length(details::text)<=4096);
create or replace function vigil.lead_status_event() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.status is distinct from old.status then
    insert into public.lead_events(lead_id,organization_id,kind,body,actor_user_id,details)
    values(new.id,new.organization_id,'status_changed',old.status::text||' → '||new.status::text,auth.uid(),
      jsonb_build_object('from',old.status::text,'to',new.status::text,'evidence','recorded_stage_change'));
  end if;
  return new;
end $$;

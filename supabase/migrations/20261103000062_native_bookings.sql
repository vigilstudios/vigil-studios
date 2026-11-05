-- Native appointments: opt-in website activation, Care+ eligibility and one reservation source.
create schema if not exists extensions;
create extension if not exists btree_gist with schema extensions;
insert into public.features(code,name,description,value_kind,default_value)
values('bookings.enabled','Vigil bookings','Standard native appointment scheduling on a compatible website. Setup and activation required.','boolean','false') on conflict(code) do nothing;
insert into public.plan_features(plan_id,feature_code,value)
select id,'bookings.enabled',to_jsonb(code in ('care','growth','priority')) from public.plans
on conflict(plan_id,feature_code) do nothing;

create table public.booking_settings (
 website_id uuid primary key references public.websites(id), organization_id uuid not null references public.organizations(id),
 enabled boolean not null default false, component_ready boolean not null default false,
 time_zone text not null default 'UTC', minimum_notice integer not null default 60 check(minimum_notice between 0 and 43200),
 horizon_days integer not null default 90 check(horizon_days between 1 and 180), change_notice integer not null default 120 check(change_notice between 0 and 10080),
 availability_acknowledged_at timestamptz, updated_at timestamptz not null default now(), unique(website_id,organization_id)
);
create table public.booking_resources (
 id uuid primary key default gen_random_uuid(), website_id uuid not null, organization_id uuid not null,
 name text not null check(length(name) between 1 and 120), active boolean not null default true,
 hours jsonb not null default '[]', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(website_id,organization_id) references public.booking_settings(website_id,organization_id), unique(id,website_id,organization_id)
);
create table public.booking_services (
 id uuid primary key default gen_random_uuid(), website_id uuid not null, organization_id uuid not null, resource_id uuid not null,
 name text not null check(length(name) between 1 and 120), description text not null default '' check(length(description)<=600),
 duration integer not null check(duration between 15 and 480 and duration%15=0),
 buffer_before integer not null default 0 check(buffer_before between 0 and 120 and buffer_before%15=0),
 buffer_after integer not null default 0 check(buffer_after between 0 and 120 and buffer_after%15=0),
 mode text not null check(mode in ('instant','approval')), active boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(resource_id,website_id,organization_id) references public.booking_resources(id,website_id,organization_id), unique(id,website_id,organization_id)
);
create table public.booking_blocks (
 id uuid primary key default gen_random_uuid(), resource_id uuid not null, website_id uuid not null, organization_id uuid not null,
 starts_at timestamptz not null, ends_at timestamptz not null, reason text not null default '' check(length(reason)<=300),
 created_at timestamptz not null default now(), check(ends_at>starts_at and ends_at<=starts_at+interval '180 days'),
 foreign key(resource_id,website_id,organization_id) references public.booking_resources(id,website_id,organization_id)
);
create index booking_blocks_lookup on public.booking_blocks(resource_id,starts_at,ends_at);
create table public.appointments (
 id uuid primary key default gen_random_uuid(), website_id uuid not null, organization_id uuid not null,
 service_id uuid not null, resource_id uuid not null, lead_id uuid references public.leads(id),
 service_name text not null, time_zone text not null, confirmation_mode text not null check(confirmation_mode in ('instant','approval')),
 status text not null check(status in ('requested','confirmed','declined','cancelled','completed','no_show','expired')),
 starts_at timestamptz not null, ends_at timestamptz not null,
 reserved_from timestamptz not null, reserved_until timestamptz not null,
 duration integer not null, buffer_before integer not null, buffer_after integer not null,
 requested_start_at timestamptz, request_expires_at timestamptz,
 contact jsonb not null, notes text not null default '' check(length(notes)<=2000),
 submission_key uuid, submission_hash text, guest_token_hash text,
 revision integer not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(website_id,submission_key), unique(id,website_id,organization_id),
 foreign key(service_id,website_id,organization_id) references public.booking_services(id,website_id,organization_id),
 foreign key(resource_id,website_id,organization_id) references public.booking_resources(id,website_id,organization_id),
 check(ends_at>starts_at and duration between 15 and 480 and duration%15=0),
 check(buffer_before between 0 and 120 and buffer_after between 0 and 120),
 check(ends_at=starts_at+duration*interval '1 minute' and reserved_from=starts_at-buffer_before*interval '1 minute' and reserved_until=ends_at+buffer_after*interval '1 minute'),
 check(submission_hash is null or submission_hash ~ '^[a-f0-9]{64}$'), check(guest_token_hash is null or guest_token_hash ~ '^[a-f0-9]{64}$')
);
-- Reuse btree_gist in its existing namespace instead of moving an installed extension.
do $$declare op_schema text;begin
 select n.nspname into op_schema from pg_extension e join pg_namespace n on n.oid=e.extnamespace where e.extname='btree_gist';
 execute format('alter table public.appointments add constraint appointments_no_overlap exclude using gist (resource_id %I.gist_uuid_ops with =, tstzrange(reserved_from,reserved_until,''[)'') with &&) where(status=''confirmed'')',op_schema);
end$$;
create index appointments_agenda on public.appointments(organization_id,starts_at,id);
create index appointments_lead on public.appointments(lead_id) where lead_id is not null;
create index appointments_expiry on public.appointments(request_expires_at) where status='requested';
create table public.appointment_events (
 id bigint generated always as identity primary key, appointment_id uuid not null, website_id uuid not null, organization_id uuid not null,
 kind text not null, details jsonb not null default '{}', actor_user_id uuid references public.profiles(id), created_at timestamptz not null default now(),
 foreign key(appointment_id,website_id,organization_id) references public.appointments(id,website_id,organization_id)
);
create index appointment_events_timeline on public.appointment_events(appointment_id,id);

-- Server-owned children; customers use narrowly validated RPCs, including staff.
do $$declare t text;begin
 foreach t in array array['booking_settings','booking_resources','booking_services','booking_blocks','appointments','appointment_events'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon,authenticated',t);
  execute format('grant select on public.%I to authenticated',t);
  execute format('grant all on public.%I to service_role',t);
  execute format('create policy booking_tenant_read on public.%I for select to authenticated using (vigil.is_staff() or vigil.is_org_member(organization_id))',t);
 end loop;
end$$;
-- Guest hashes and idempotency credentials are not part of the authenticated DTO.
revoke select on public.appointments from authenticated;
grant select(id,website_id,organization_id,service_id,resource_id,lead_id,service_name,time_zone,confirmation_mode,status,starts_at,ends_at,reserved_from,reserved_until,duration,buffer_before,buffer_after,requested_start_at,request_expires_at,contact,notes,revision,created_at,updated_at) on public.appointments to authenticated;
grant usage,select on sequence public.appointment_events_id_seq to service_role;

create function vigil.booking_entitled(p_website uuid) returns boolean language sql stable security definer set search_path='' as $$
 select coalesce((select coalesce(o.value,pf.value,f.default_value)='true'::jsonb
 from public.websites w cross join public.features f
 left join lateral (select s.plan_id from public.subscriptions s join public.plans p on p.id=s.plan_id where s.organization_id=w.organization_id and (s.website_id is null or s.website_id=w.id) and s.status in ('active','trialing','past_due') order by p.tier_rank desc,s.created_at desc limit 1) ap on true
 left join public.plan_features pf on pf.plan_id=ap.plan_id and pf.feature_code=f.code
 left join public.entitlement_overrides o on o.organization_id=w.organization_id and o.feature_code=f.code and (o.expires_at is null or o.expires_at>now())
 where w.id=p_website and f.code='bookings.enabled'),false)
$$;
create function vigil.booking_manage(p_website uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare org uuid;begin
 select w.organization_id into org from public.websites w join public.organizations o on o.id=w.organization_id where w.id=p_website and o.archived_at is null;
 if org is null or auth.uid() is null or not(vigil.is_staff() or vigil.has_org_role(org,array['owner','manager']::public.org_role[])) then raise exception 'Booking manager required' using errcode='42501';end if;
 return org;
end$$;
create function vigil.booking_hours_valid(p_hours jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare a jsonb; b jsonb; i integer:=0; j integer;begin
 if p_hours is null or jsonb_typeof(p_hours)<>'array' or jsonb_array_length(p_hours)>28 then return false;end if;
 for a in select value from jsonb_array_elements(p_hours) loop
  if jsonb_typeof(a)<>'object' or (select count(*) from jsonb_object_keys(a))<>3 or not(a ?& array['day','start','end']) or jsonb_typeof(a->'day') is distinct from 'number' or jsonb_typeof(a->'start') is distinct from 'string' or jsonb_typeof(a->'end') is distinct from 'string' or (a->>'day') !~ '^[0-6]$' or (a->>'start') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or (a->>'end') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or a->>'start'>=a->>'end' then return false;end if;
  j:=0;for b in select value from jsonb_array_elements(p_hours) loop
   if j<i and a->>'day'=b->>'day' and a->>'start'<b->>'end' and b->>'start'<a->>'end' then return false;end if;j:=j+1;
  end loop;i:=i+1;
 end loop;return true;
end$$;
alter table public.booking_resources add constraint booking_valid_hours check(vigil.booking_hours_valid(hours));

-- Only validated booking RPCs can emit these audit rows; no customer audit-write permission is widened.
create function vigil.booking_audit(p_action text,p_entity_type text,p_entity_id uuid,p_org uuid,p_after jsonb default null,p_metadata jsonb default '{}') returns void language sql security definer set search_path='' as $$
 insert into public.audit_events(organization_id,actor_kind,actor_user_id,action,entity_type,entity_id,after,metadata)
 values(p_org,case when auth.role()='service_role' then 'system'::public.actor_kind when vigil.is_staff() then 'staff'::public.actor_kind else 'user'::public.actor_kind end,case when auth.role()<>'service_role' then auth.uid() end,p_action,p_entity_type,p_entity_id,p_after,p_metadata)
$$;
create function public.configure_bookings(p_website uuid,p_settings jsonb,p_component_ready boolean default null) returns void language plpgsql security definer set search_path='' as $$
declare org uuid; s public.booking_settings; tz text;begin
 org:=vigil.booking_manage(p_website);
 insert into public.booking_settings(website_id,organization_id) values(p_website,org) on conflict do nothing;
 select * into s from public.booking_settings where website_id=p_website for update;
 if p_component_ready is not null and not vigil.is_staff() then raise exception 'Vigil must verify the website component' using errcode='42501';end if;
 tz:=p_settings->>'timeZone';
 if tz is null or not(tz='UTC' or position('/' in tz)>0) or not exists(select 1 from pg_catalog.pg_timezone_names where name=tz)
 or jsonb_typeof(p_settings->'enabled') is distinct from 'boolean' or jsonb_typeof(p_settings->'acknowledgeAvailability') is distinct from 'boolean'
 or (p_settings->>'minimumNotice')::integer not between 0 and 43200 or (p_settings->>'horizonDays')::integer not between 1 and 180 or (p_settings->>'changeNotice')::integer not between 0 and 10080
 or p_settings->>'minimumNotice' is null or p_settings->>'horizonDays' is null or p_settings->>'changeNotice' is null or not(p_settings ?& array['minimumNotice','horizonDays','changeNotice','enabled','timeZone','acknowledgeAvailability']) then raise exception 'Invalid booking settings' using errcode='22023';end if;
 if tz<>s.time_zone and exists(select 1 from public.appointments where website_id=p_website and status in ('requested','confirmed') and ends_at>now()) then raise exception 'Resolve upcoming appointments before changing the business timezone' using errcode='22023';end if;
 if (p_settings->>'enabled')::boolean then
  if not vigil.booking_entitled(p_website) then raise exception 'Care or higher required' using errcode='42501';end if;
  if not coalesce(p_component_ready,s.component_ready) or not(p_settings->>'acknowledgeAvailability')::boolean then raise exception 'Verify the website component and availability first' using errcode='22023';end if;
  if not exists(select 1 from public.websites where id=p_website and status='live') or not exists(select 1 from public.website_contact_settings c where c.website_id=p_website and cardinality(c.allowed_origins)>0) then raise exception 'Registered live website required' using errcode='22023';end if;
  if not exists(select 1 from public.booking_services bs join public.booking_resources r on r.id=bs.resource_id where bs.website_id=p_website and bs.active and r.active and jsonb_array_length(r.hours)>0) then raise exception 'Add an active service and availability' using errcode='22023';end if;
 end if;
 update public.booking_settings set enabled=(p_settings->>'enabled')::boolean,component_ready=coalesce(p_component_ready,component_ready),time_zone=tz,minimum_notice=(p_settings->>'minimumNotice')::integer,horizon_days=(p_settings->>'horizonDays')::integer,change_notice=(p_settings->>'changeNotice')::integer,availability_acknowledged_at=case when (p_settings->>'acknowledgeAvailability')::boolean then now() else availability_acknowledged_at end,updated_at=now() where website_id=p_website;
 perform vigil.booking_audit('booking.configured','website',p_website,org,p_after=>(select to_jsonb(bs) from public.booking_settings bs where bs.website_id=p_website));
end$$;
create function public.save_booking_resource(p_website uuid,p_resource jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare org uuid; rid uuid;begin
 org:=vigil.booking_manage(p_website);if not vigil.booking_entitled(p_website) then raise exception 'Care or higher required' using errcode='42501';end if;
 insert into public.booking_settings(website_id,organization_id) values(p_website,org) on conflict do nothing;
 perform 1 from public.booking_settings where website_id=p_website for update;
 rid:=coalesce((p_resource->>'id')::uuid,gen_random_uuid());
 if p_resource->>'name' is null or length(trim(p_resource->>'name')) not between 1 and 120 or jsonb_typeof(p_resource->'active') is distinct from 'boolean' or not vigil.booking_hours_valid(p_resource->'hours') then raise exception 'Invalid resource' using errcode='22023';end if;
 if exists(select 1 from public.booking_resources where id=rid and website_id<>p_website) then raise exception 'Wrong resource' using errcode='42501';end if;
 if not exists(select 1 from public.booking_resources where id=rid) and (select count(*) from public.booking_resources where website_id=p_website)>=30 then raise exception 'Resource limit reached' using errcode='22023';end if;
 insert into public.booking_resources(id,website_id,organization_id,name,active,hours) values(rid,p_website,org,trim(p_resource->>'name'),(p_resource->>'active')::boolean,p_resource->'hours')
 on conflict(id) do update set name=excluded.name,active=excluded.active,hours=excluded.hours,updated_at=now() where booking_resources.website_id=p_website and booking_resources.organization_id=org;
 if not found then raise exception 'Wrong resource' using errcode='42501';end if;
 perform vigil.booking_audit('booking.resource_saved','booking_resource',rid,org,p_after=>(select to_jsonb(r) from public.booking_resources r where r.id=rid));return rid;
end$$;
create function public.save_booking_service(p_website uuid,p_service jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare org uuid; sid uuid; rid uuid;begin
 org:=vigil.booking_manage(p_website);if not vigil.booking_entitled(p_website) then raise exception 'Care or higher required' using errcode='42501';end if;
 perform 1 from public.booking_settings where website_id=p_website for update;
 sid:=coalesce((p_service->>'id')::uuid,gen_random_uuid());rid:=(p_service->>'resourceId')::uuid;
 if not exists(select 1 from public.booking_resources where id=rid and website_id=p_website) then raise exception 'Choose this website resource' using errcode='42501';end if;
 if exists(select 1 from public.booking_services where id=sid and website_id<>p_website) then raise exception 'Wrong service' using errcode='42501';end if;
 if p_service->>'name' is null or length(trim(p_service->>'name')) not between 1 and 120 or coalesce(length(p_service->>'description'),601)>600 or p_service->>'mode' is null or p_service->>'mode' not in ('instant','approval') or jsonb_typeof(p_service->'active') is distinct from 'boolean' or not(p_service ?& array['duration','bufferBefore','bufferAfter','mode','active']) then raise exception 'Invalid service' using errcode='22023';end if;
 if not exists(select 1 from public.booking_services where id=sid) and (select count(*) from public.booking_services where website_id=p_website)>=60 then raise exception 'Service limit reached' using errcode='22023';end if;
 insert into public.booking_services(id,website_id,organization_id,resource_id,name,description,duration,buffer_before,buffer_after,mode,active)
 values(sid,p_website,org,rid,trim(p_service->>'name'),p_service->>'description',(p_service->>'duration')::integer,(p_service->>'bufferBefore')::integer,(p_service->>'bufferAfter')::integer,p_service->>'mode',(p_service->>'active')::boolean)
 on conflict(id) do update set resource_id=excluded.resource_id,name=excluded.name,description=excluded.description,duration=excluded.duration,buffer_before=excluded.buffer_before,buffer_after=excluded.buffer_after,mode=excluded.mode,active=excluded.active,updated_at=now() where booking_services.website_id=p_website and booking_services.organization_id=org;
 if not found then raise exception 'Wrong service' using errcode='42501';end if;
 perform vigil.booking_audit('booking.service_saved','booking_service',sid,org,p_after=>(select to_jsonb(b) from public.booking_services b where b.id=sid));return sid;
end$$;
create function public.save_booking_block(p_resource uuid,p_start timestamptz,p_end timestamptz,p_reason text,p_remove uuid default null) returns uuid language plpgsql security definer set search_path='' as $$
declare r public.booking_resources; org uuid; bid uuid;begin
 select * into r from public.booking_resources where id=p_resource;org:=vigil.booking_manage(r.website_id);
 perform 1 from public.booking_settings where website_id=r.website_id for update;
 if p_remove is not null then delete from public.booking_blocks where id=p_remove and resource_id=p_resource returning id into bid;if bid is null then raise exception 'Block unavailable' using errcode='22023';end if;perform vigil.booking_audit('booking.block_removed','booking_block',bid,org);return bid;end if;
 if not vigil.booking_entitled(r.website_id) then raise exception 'Care or higher required' using errcode='42501';end if;
 if p_start is null or p_end is null or not isfinite(p_start) or not isfinite(p_end) or p_end<=p_start or p_end>p_start+interval '180 days' or p_start>now()+interval '365 days' or p_reason is null or length(p_reason)>300 then raise exception 'Invalid blocked time' using errcode='22023';end if;
 insert into public.booking_blocks(resource_id,website_id,organization_id,starts_at,ends_at,reason) values(r.id,r.website_id,org,p_start,p_end,p_reason) returning id into bid;
 perform vigil.booking_audit('booking.time_blocked','booking_block',bid,org);return bid;
end$$;

-- All public access is mediated by the verified server. Origin registration also applies in SQL.
create function vigil.booking_public_site(p_website uuid,p_origin text,p_new boolean default true) returns public.booking_settings
language plpgsql security definer set search_path='' as $$
declare s public.booking_settings;begin
 if auth.role() is distinct from 'service_role' then raise exception 'Service only' using errcode='42501';end if;
 select bs.* into s from public.booking_settings bs join public.websites w on w.id=bs.website_id
 join public.organizations o on o.id=w.organization_id join public.website_contact_settings c on c.website_id=w.id
 where w.id=p_website and w.status='live' and o.archived_at is null and p_origin=any(c.allowed_origins) for share of w,o,c;
 if s.website_id is null or (p_new and (not s.enabled or not s.component_ready or not vigil.booking_entitled(p_website))) then raise exception 'Bookings unavailable' using errcode='42501';end if;
 return s;
end$$;
-- Compare instants in UTC; weekly windows are interpreted in the business timezone.
create function vigil.booking_window_free(p_resource uuid,p_start timestamptz,p_duration integer,p_before integer,p_after integer,p_skip uuid default null,p_now timestamptz default now())
returns boolean language plpgsql stable security definer set search_path='' as $$
declare r public.booking_resources; s public.booking_settings; a timestamp; b timestamp;begin
 select * into r from public.booking_resources where id=p_resource;
 select * into s from public.booking_settings where website_id=r.website_id;
 if r.id is null or not r.active or p_start is null or not isfinite(p_start) or p_start<p_now+s.minimum_notice*interval '1 minute' or p_start>p_now+s.horizon_days*interval '1 day' then return false;end if;
 a:=(p_start-p_before*interval '1 minute') at time zone s.time_zone;
 b:=(p_start+(p_duration+p_after)*interval '1 minute') at time zone s.time_zone;
 if extract(second from p_start)<>0 or extract(minute from p_start at time zone s.time_zone)::integer%15<>0 or a::date<>b::date then return false;end if;
 -- Refuse windows crossing an offset change; repeated times remain distinct valid UTC slots.
 if b-a<> (p_duration+p_before+p_after)*interval '1 minute' then return false;end if;
 if not exists(select 1 from jsonb_array_elements(r.hours) h where (h->>'day')::integer=extract(dow from a)::integer and a::time>=(h->>'start')::time and b::time<=(h->>'end')::time) then return false;end if;
 return not exists(select 1 from public.booking_blocks x where x.resource_id=r.id and tstzrange(x.starts_at,x.ends_at,'[)') && tstzrange(p_start-p_before*interval '1 minute',p_start+(p_duration+p_after)*interval '1 minute','[)'))
 and not exists(select 1 from public.appointments x where x.resource_id=r.id and x.status='confirmed' and (p_skip is null or x.id<>p_skip) and tstzrange(x.reserved_from,x.reserved_until,'[)') && tstzrange(p_start-p_before*interval '1 minute',p_start+(p_duration+p_after)*interval '1 minute','[)'));
end$$;
create function public.booking_public_config(p_website uuid,p_origin text) returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.booking_settings;begin
 s:=vigil.booking_public_site(p_website,p_origin);
 return jsonb_build_object('websiteId',p_website,'businessName',(select name from public.websites where id=p_website),'timeZone',s.time_zone,'services',coalesce((select jsonb_agg(jsonb_build_object('id',b.id,'name',b.name,'description',b.description,'duration',b.duration,'mode',b.mode) order by b.name,b.id) from public.booking_services b join public.booking_resources r on r.id=b.resource_id where b.website_id=p_website and b.active and r.active),'[]'::jsonb));
end$$;
create function public.booking_public_slots(p_website uuid,p_origin text,p_service uuid,p_day date) returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.booking_settings; b public.booking_services;begin
 s:=vigil.booking_public_site(p_website,p_origin);
 select * into b from public.booking_services where id=p_service and website_id=p_website and active;
 if b.id is null or p_day is null or p_day<(now() at time zone s.time_zone)::date or p_day>(now() at time zone s.time_zone)::date+s.horizon_days then raise exception 'Invalid service or date' using errcode='22023';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('startsAt',t,'endsAt',t+b.duration*interval '1 minute') order by t)
 from generate_series(p_day::timestamp at time zone s.time_zone,(p_day+1)::timestamp at time zone s.time_zone-interval '15 minutes',interval '15 minutes') t
 where vigil.booking_window_free(b.resource_id,t,b.duration,b.buffer_before,b.buffer_after)),'[]'::jsonb);
end$$;
create function vigil.booking_receipt(a public.appointments) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('id',a.id,'serviceId',a.service_id,'status',case when a.status='requested' and a.request_expires_at<=now() then 'expired' else a.status end,'startsAt',a.starts_at,'endsAt',a.ends_at,'timeZone',a.time_zone,'serviceName',a.service_name,'requestedStart',a.requested_start_at,'changeDeadline',a.starts_at-coalesce((select change_notice from public.booking_settings where website_id=a.website_id),120)*interval '1 minute','expiresAt',a.request_expires_at)
$$;
create function public.create_public_booking(p_website uuid,p_origin text,p_service uuid,p_start timestamptz,p_key uuid,p_hash text,p_guest_hash text,p_contact jsonb,p_notes text,p_page text default '')
returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.booking_settings; b public.booking_services; a public.appointments; lid uuid;begin
 s:=vigil.booking_public_site(p_website,p_origin);
 perform 1 from public.booking_settings where website_id=p_website for update;
 s:=vigil.booking_public_site(p_website,p_origin);
 if p_key is null or p_hash is null or p_hash!~'^[a-f0-9]{64}$' or p_guest_hash is null or p_guest_hash!~'^[a-f0-9]{64}$' then raise exception 'Invalid submission' using errcode='22023';end if;
 select * into a from public.appointments where website_id=p_website and submission_key=p_key;
 if a.id is not null then
  if a.submission_hash<>p_hash or a.guest_token_hash<>p_guest_hash then raise exception 'Submission changed' using errcode='23505';end if;
  return vigil.booking_receipt(a);
 end if;
 if jsonb_typeof(p_contact) is distinct from 'object' or p_contact->>'name' is null or length(trim(p_contact->>'name')) not between 1 and 120 or p_contact->>'email' is null or length(p_contact->>'email')>254 or p_contact->>'email'!~'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or coalesce(length(p_contact->>'phone'),0)>40 or p_notes is null or length(p_notes)>2000 then raise exception 'Invalid contact' using errcode='22023';end if;
 select * into b from public.booking_services where id=p_service and website_id=p_website and active;
 if b.id is null or not vigil.booking_window_free(b.resource_id,p_start,b.duration,b.buffer_before,b.buffer_after) then raise exception 'Time unavailable' using errcode='23P01';end if;
 if not vigil.rate_limit('booking:site:'||p_website::text,100,86400) then raise exception 'Booking limit' using errcode='P0001';end if;
 -- A new unverified visitor never inherits an existing customer's private lead history.
 insert into public.leads(organization_id,website_id,source,contact,message,metadata) values(s.organization_id,p_website,'booking',p_contact,p_notes,jsonb_build_object('booking',true,'page',coalesce(nullif(left(p_page,2048),''),p_origin||'/'))) returning id into lid;
 insert into public.lead_events(lead_id,organization_id,kind,body) values(lid,s.organization_id,'received','Website appointment '||case when b.mode='instant' then 'confirmed.' else 'requested; awaiting approval.' end);
 insert into public.appointments(website_id,organization_id,service_id,resource_id,lead_id,service_name,time_zone,confirmation_mode,status,starts_at,ends_at,reserved_from,reserved_until,duration,buffer_before,buffer_after,request_expires_at,contact,notes,submission_key,submission_hash,guest_token_hash)
 values(p_website,s.organization_id,b.id,b.resource_id,lid,b.name,s.time_zone,b.mode,case when b.mode='instant' then 'confirmed' else 'requested' end,p_start,p_start+b.duration*interval '1 minute',p_start-b.buffer_before*interval '1 minute',p_start+(b.duration+b.buffer_after)*interval '1 minute',b.duration,b.buffer_before,b.buffer_after,case when b.mode='approval' then least(p_start,now()+interval '48 hours') end,p_contact,p_notes,p_key,p_hash,p_guest_hash) returning * into a;
 insert into public.appointment_events(appointment_id,website_id,organization_id,kind) values(a.id,p_website,s.organization_id,a.status);
 perform vigil.booking_audit('booking.created','appointment',a.id,a.organization_id,p_after=>vigil.booking_receipt(a));
 return vigil.booking_receipt(a);
end$$;
-- One transition function owns approvals, reschedules, attendance and guest changes.
create function vigil.booking_transition(p_id uuid,p_action text,p_revision integer,p_start timestamptz default null,p_guest boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.appointments; old public.appointments; s public.booking_settings; target timestamptz; next_status text; request_start timestamptz; mode text;begin
 select * into a from public.appointments where id=p_id;
 perform 1 from public.booking_settings where website_id=a.website_id for update;
 select * into a from public.appointments where id=p_id for update;old:=a;
 select * into s from public.booking_settings where website_id=a.website_id;
 if a.id is null or a.revision is distinct from p_revision then raise exception 'Appointment changed; refresh' using errcode='40001';end if;
 if a.status='requested' and a.request_expires_at<=now() then raise exception 'Request expired' using errcode='22023';end if;
 if a.status not in ('requested','confirmed') then raise exception 'Appointment is closed' using errcode='22023';end if;
 if p_guest and p_action not in ('cancel','reschedule') then raise exception 'Invalid guest action' using errcode='42501';end if;
 if p_guest and a.status='confirmed' and now()>=a.starts_at-s.change_notice*interval '1 minute' then raise exception 'Contact the business to change this appointment' using errcode='22023';end if;
 target:=a.starts_at;next_status:=a.status;request_start:=a.requested_start_at;
 case p_action
 when 'confirm' then if a.status<>'requested' then raise exception 'Request required' using errcode='22023';end if;next_status:='confirmed';
 when 'decline' then if a.status<>'requested' then raise exception 'Request required' using errcode='22023';end if;next_status:='declined';
 when 'cancel' then next_status:='cancelled';request_start:=null;
 when 'complete' then if a.status<>'confirmed' or a.starts_at>now() then raise exception 'Past confirmed appointment required' using errcode='22023';end if;next_status:='completed';
 when 'no_show' then if a.status<>'confirmed' or a.starts_at>now() then raise exception 'Past confirmed appointment required' using errcode='22023';end if;next_status:='no_show';
 when 'reschedule' then
  if p_start is null then raise exception 'New time required' using errcode='22023';end if;
  mode:=a.confirmation_mode;
  if p_guest and a.status='confirmed' and mode='approval' then request_start:=p_start;else target:=p_start;request_start:=null;end if;
 when 'approve_reschedule' then if a.status<>'confirmed' or request_start is null then raise exception 'Reschedule request required' using errcode='22023';end if;target:=request_start;request_start:=null;
 when 'decline_reschedule' then if request_start is null then raise exception 'Reschedule request required' using errcode='22023';end if;request_start:=null;
 else raise exception 'Unknown action' using errcode='22023';end case;
 if p_action in ('confirm','reschedule','approve_reschedule') then
  if not vigil.booking_entitled(a.website_id) or not exists(select 1 from public.booking_services where id=a.service_id and active) then raise exception 'Booking service unavailable' using errcode='42501';end if;
  if not vigil.booking_window_free(a.resource_id,coalesce(request_start,target),a.duration,a.buffer_before,a.buffer_after,a.id) then raise exception 'Time unavailable' using errcode='23P01';end if;
 end if;
 update public.appointments set status=next_status,starts_at=target,ends_at=target+duration*interval '1 minute',reserved_from=target-buffer_before*interval '1 minute',reserved_until=target+(duration+buffer_after)*interval '1 minute',requested_start_at=request_start,request_expires_at=case when next_status='requested' then least(target,now()+interval '48 hours') else null end,revision=revision+1,updated_at=now() where id=a.id returning * into a;
 insert into public.appointment_events(appointment_id,website_id,organization_id,kind,details,actor_user_id) values(a.id,a.website_id,a.organization_id,p_action,jsonb_build_object('before',vigil.booking_receipt(old),'after',vigil.booking_receipt(a),'guest',p_guest),case when not p_guest then auth.uid() end);
 perform vigil.booking_audit('booking.'||p_action,'appointment',a.id,a.organization_id,p_metadata=>jsonb_build_object('guest',p_guest));
 return vigil.booking_receipt(a);
end$$;
create function public.manage_booking(p_id uuid,p_action text,p_revision integer,p_start timestamptz default null) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 perform vigil.booking_manage((select website_id from public.appointments where id=p_id));
 return vigil.booking_transition(p_id,p_action,p_revision,p_start,false);
end$$;
create function public.manage_guest_booking(p_website uuid,p_origin text,p_id uuid,p_hash text,p_action text,p_start timestamptz default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare a public.appointments;begin
 perform vigil.booking_public_site(p_website,p_origin,false);
 select * into a from public.appointments where id=p_id and website_id=p_website and guest_token_hash=p_hash;
 if a.id is null or p_hash is null then raise exception 'Management link unavailable' using errcode='42501';end if;
 if p_action='read' then return vigil.booking_receipt(a);end if;
 return vigil.booking_transition(a.id,p_action,a.revision,p_start,true);
end$$;
create function public.expire_booking_requests() returns integer language plpgsql security definer set search_path='' as $$
declare a public.appointments; n integer:=0;begin
 if auth.role() is distinct from 'service_role' then raise exception 'Service only' using errcode='42501';end if;
 for a in select * from public.appointments where status='requested' and request_expires_at<=now() order by request_expires_at limit 100 for update skip locked loop
  update public.appointments set status='expired',revision=revision+1,updated_at=now() where id=a.id;
  insert into public.appointment_events(appointment_id,website_id,organization_id,kind) values(a.id,a.website_id,a.organization_id,'expired');n:=n+1;
 end loop;return n;
end$$;
-- Definer helpers must never be callable as a back door from PostgREST.
do $$declare f record;begin
 for f in select p.oid::regprocedure signature,n.nspname,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where (n.nspname='vigil' and p.proname like 'booking_%') or (n.nspname='public' and p.proname in ('configure_bookings','save_booking_resource','save_booking_service','save_booking_block','booking_public_config','booking_public_slots','create_public_booking','manage_booking','manage_guest_booking','expire_booking_requests')) loop
  execute format('revoke all on function %s from public,anon,authenticated,service_role',f.signature);
  if f.nspname='public' then
   if f.proname in ('configure_bookings','save_booking_resource','save_booking_service','save_booking_block','manage_booking') then execute format('grant execute on function %s to authenticated',f.signature);
   else execute format('grant execute on function %s to service_role',f.signature);end if;
  end if;
 end loop;
end$$;
create trigger booking_settings_org before insert or update on public.booking_settings for each row execute function vigil.enforce_same_org_references();
alter table public.leads add constraint booking_lead_identity unique(id,website_id,organization_id);
alter table public.appointments add constraint booking_lead_same_site foreign key(lead_id,website_id,organization_id) references public.leads(id,website_id,organization_id);
create function public.booking_eligible(p_website uuid) returns boolean language plpgsql stable security definer set search_path='' as $$
declare org uuid;begin
 select organization_id into org from public.websites where id=p_website;
 if auth.uid() is null or org is null or not(vigil.is_staff() or vigil.is_org_member(org)) then raise exception 'Not authorized' using errcode='42501';end if;
 return vigil.booking_entitled(p_website);
end$$;
revoke all on function public.booking_eligible(uuid) from public,anon;
grant execute on function public.booking_eligible(uuid) to authenticated;
create function public.block_booking_days(p_resource uuid,p_from date,p_through date,p_reason text) returns uuid language plpgsql security definer set search_path='' as $$
declare s public.booking_settings;begin
 select bs.* into s from public.booking_settings bs join public.booking_resources r on r.website_id=bs.website_id where r.id=p_resource;
 perform vigil.booking_manage(s.website_id);
 if p_from is null or p_through is null or p_through<p_from then raise exception 'Choose a date range' using errcode='22023';end if;
 return public.save_booking_block(p_resource,p_from::timestamp at time zone s.time_zone,(p_through+1)::timestamp at time zone s.time_zone,p_reason);
end$$;
revoke all on function public.block_booking_days(uuid,date,date,text) from public,anon;
grant execute on function public.block_booking_days(uuid,date,date,text) to authenticated;

-- Application credentials can append lifecycle evidence, never rewrite it.
revoke update,delete,truncate on public.appointment_events from service_role;

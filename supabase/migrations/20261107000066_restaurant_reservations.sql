-- Table reservations share the appointment ledger, lifecycle, tenant boundaries and conflict constraint.
alter table public.booking_settings add column dining_hours jsonb not null default '[]'
 check(vigil.booking_hours_valid(dining_hours));
alter table public.booking_resources
 add column kind text not null default 'person_space' check(kind in ('person_space','table')),
 add column min_party integer,
 add column max_party integer,
 add constraint booking_table_capacity check(
  (kind='person_space' and min_party is null and max_party is null) or
  (kind='table' and min_party is not null and max_party is not null and min_party between 1 and 30 and max_party between min_party and 30));
create index booking_table_best_fit on public.booking_resources(website_id,max_party,min_party desc,id) where kind='table' and active;
alter table public.booking_services
 alter column resource_id drop not null,
 add column allocation text not null default 'fixed' check(allocation in ('fixed','table_pool')),
 add constraint booking_service_allocation check((allocation='fixed' and resource_id is not null) or (allocation='table_pool' and resource_id is null));
alter table public.appointments
 add column party_size integer check(party_size between 1 and 30);
grant select(party_size) on public.appointments to authenticated;

create function vigil.booking_allocation_valid() returns trigger
language plpgsql security definer set search_path='' as $$
declare r public.booking_resources;begin
 select * into r from public.booking_resources where id=new.resource_id and website_id=new.website_id;
 if (r.kind='table' and (new.party_size is null or (new.status='confirmed' and new.party_size not between r.min_party and r.max_party)))
 or (r.kind='person_space' and new.party_size is not null) then raise exception 'Invalid reservation allocation' using errcode='23514';end if;
 return new;
end$$;
revoke all on function vigil.booking_allocation_valid() from public,anon,authenticated,service_role;
create trigger booking_allocation_valid before insert or update of resource_id,party_size,status on public.appointments
for each row execute function vigil.booking_allocation_valid();

create function public.save_booking_dining_hours(p_website uuid,p_hours jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare org uuid;begin
 org:=vigil.booking_manage(p_website);
 if not vigil.booking_entitled(p_website) then raise exception 'Care or higher required' using errcode='42501';end if;
 if not vigil.booking_hours_valid(p_hours) then raise exception 'Invalid dining hours' using errcode='22023';end if;
 insert into public.booking_settings(website_id,organization_id) values(p_website,org) on conflict do nothing;
 update public.booking_settings set dining_hours=p_hours,updated_at=now() where website_id=p_website;
 perform vigil.booking_audit('booking.dining_hours_saved','website',p_website,org,p_after=>p_hours);
end$$;

create function public.save_booking_table(p_website uuid,p_table jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare org uuid; rid uuid; lo integer; hi integer;begin
 org:=vigil.booking_manage(p_website);
 if not vigil.booking_entitled(p_website) then raise exception 'Care or higher required' using errcode='42501';end if;
 insert into public.booking_settings(website_id,organization_id) values(p_website,org) on conflict do nothing;
 perform 1 from public.booking_settings where website_id=p_website for update;
 rid:=coalesce((p_table->>'id')::uuid,gen_random_uuid());
 if exists(select 1 from public.booking_resources where id=rid and (website_id<>p_website or kind<>'table')) then raise exception 'Wrong table' using errcode='42501';end if;
 if jsonb_typeof(p_table->'active') is distinct from 'boolean' or p_table->>'name' is null or length(btrim(p_table->>'name')) not between 1 and 120
 or coalesce(p_table->>'minParty','') !~ '^([1-9]|[12][0-9]|30)$' or coalesce(p_table->>'maxParty','') !~ '^([1-9]|[12][0-9]|30)$' then raise exception 'Invalid table' using errcode='22023';end if;
 lo:=(p_table->>'minParty')::integer;hi:=(p_table->>'maxParty')::integer;
 if lo>hi then raise exception 'Invalid capacity' using errcode='22023';end if;
 if exists(select 1 from public.appointments where resource_id=rid and status='confirmed' and ends_at>now() and party_size not between lo and hi) then raise exception 'Resolve upcoming reservations before reducing capacity' using errcode='22023';end if;
 if not exists(select 1 from public.booking_resources where id=rid) and (select count(*) from public.booking_resources where website_id=p_website and kind='table')>=100 then raise exception 'Table limit reached' using errcode='22023';end if;
 insert into public.booking_resources(id,website_id,organization_id,name,active,kind,min_party,max_party)
 values(rid,p_website,org,btrim(p_table->>'name'),(p_table->>'active')::boolean,'table',lo,hi)
 on conflict(id) do update set name=excluded.name,active=excluded.active,min_party=excluded.min_party,max_party=excluded.max_party,updated_at=now()
 where booking_resources.website_id=p_website and booking_resources.kind='table';
 perform vigil.booking_audit('booking.table_saved','booking_resource',rid,org,p_after=>(select to_jsonb(r) from public.booking_resources r where r.id=rid));return rid;
end$$;

-- Callers lock booking_settings before writes. This makes best-fit selection atomic across a site's table pool.
-- The existing exclusion constraint independently rejects any overlapping confirmed allocation.
create function vigil.booking_choose_resource(p_website uuid,p_fixed uuid,p_party integer,p_start timestamptz,p_duration integer,p_before integer,p_after integer,p_skip uuid default null)
returns uuid language plpgsql stable security definer set search_path='' as $$
declare chosen uuid;begin
 if p_party is null then
  select r.id into chosen from public.booking_resources r where r.id=p_fixed and r.website_id=p_website and r.kind='person_space'
  and vigil.booking_window_free(r.id,p_start,p_duration,p_before,p_after,p_skip);
 else
  select r.id into chosen from public.booking_resources r where r.website_id=p_website and r.kind='table' and p_party between r.min_party and r.max_party
  and vigil.booking_window_free(r.id,p_start,p_duration,p_before,p_after,p_skip)
  order by r.max_party,r.min_party desc,r.id limit 1;
 end if;return chosen;
end$$;

revoke all on function public.save_booking_dining_hours(uuid,jsonb),public.save_booking_table(uuid,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.save_booking_dining_hours(uuid,jsonb),public.save_booking_table(uuid,jsonb) to authenticated;
revoke all on function vigil.booking_choose_resource(uuid,uuid,integer,timestamptz,integer,integer,integer,uuid) from public,anon,authenticated,service_role;

create function public.block_booking_dining_days(p_website uuid,p_from date,p_through date,p_reason text) returns integer
language plpgsql security definer set search_path='' as $$
declare r record; n integer:=0;begin
 perform vigil.booking_manage(p_website);
 if not vigil.booking_entitled(p_website) then raise exception 'Care or higher required' using errcode='42501';end if;
 perform 1 from public.booking_settings where website_id=p_website for update;
 for r in select id from public.booking_resources where website_id=p_website and kind='table' order by id loop
  perform public.block_booking_days(r.id,p_from,p_through,p_reason);n:=n+1;
 end loop;
 if n=0 then raise exception 'Add tables first' using errcode='22023';end if;
 return n;
end$$;
revoke all on function public.block_booking_dining_days(uuid,date,date,text) from public,anon,authenticated,service_role;
grant execute on function public.block_booking_dining_days(uuid,date,date,text) to authenticated;


create or replace function public.save_booking_resource(p_website uuid,p_resource jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare org uuid; rid uuid;begin
 org:=vigil.booking_manage(p_website);if not vigil.booking_entitled(p_website) then raise exception 'Care or higher required' using errcode='42501';end if;
 insert into public.booking_settings(website_id,organization_id) values(p_website,org) on conflict do nothing;
 perform 1 from public.booking_settings where website_id=p_website for update;
 rid:=coalesce((p_resource->>'id')::uuid,gen_random_uuid());
 if p_resource->>'name' is null or length(trim(p_resource->>'name')) not between 1 and 120 or jsonb_typeof(p_resource->'active') is distinct from 'boolean' or not vigil.booking_hours_valid(p_resource->'hours') then raise exception 'Invalid resource' using errcode='22023';end if;
 if exists(select 1 from public.booking_resources where id=rid and (website_id<>p_website or kind<>'person_space')) then raise exception 'Wrong resource' using errcode='42501';end if;
 if not exists(select 1 from public.booking_resources where id=rid) and (select count(*) from public.booking_resources where website_id=p_website and kind='person_space')>=30 then raise exception 'Resource limit reached' using errcode='22023';end if;
 insert into public.booking_resources(id,website_id,organization_id,name,active,hours) values(rid,p_website,org,trim(p_resource->>'name'),(p_resource->>'active')::boolean,p_resource->'hours')
 on conflict(id) do update set name=excluded.name,active=excluded.active,hours=excluded.hours,updated_at=now() where booking_resources.website_id=p_website and booking_resources.organization_id=org;
 if not found then raise exception 'Wrong resource' using errcode='42501';end if;
 perform vigil.booking_audit('booking.resource_saved','booking_resource',rid,org,p_after=>(select to_jsonb(r) from public.booking_resources r where r.id=rid));return rid;
end$$;
create or replace function public.save_booking_service(p_website uuid,p_service jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare org uuid; sid uuid; rid uuid; allocation_kind text;begin
 org:=vigil.booking_manage(p_website);if not vigil.booking_entitled(p_website) then raise exception 'Care or higher required' using errcode='42501';end if;
 perform 1 from public.booking_settings where website_id=p_website for update;
 sid:=coalesce((p_service->>'id')::uuid,gen_random_uuid());rid:=nullif(p_service->>'resourceId','')::uuid;allocation_kind:=coalesce(p_service->>'allocation','fixed');
 if allocation_kind not in ('fixed','table_pool') or (allocation_kind='fixed' and not exists(select 1 from public.booking_resources where id=rid and website_id=p_website and kind='person_space')) or (allocation_kind='table_pool' and rid is not null) then raise exception 'Choose this website resource' using errcode='42501';end if;
 if exists(select 1 from public.booking_services where id=sid and website_id<>p_website) then raise exception 'Wrong service' using errcode='42501';end if;
 if exists(select 1 from public.booking_services s where s.id=sid and s.allocation<>allocation_kind) and exists(select 1 from public.appointments where service_id=sid and status in ('requested','confirmed') and ends_at>now()) then raise exception 'Resolve upcoming bookings before changing service type' using errcode='22023';end if;
 if p_service->>'name' is null or length(trim(p_service->>'name')) not between 1 and 120 or coalesce(length(p_service->>'description'),601)>600 or p_service->>'mode' is null or p_service->>'mode' not in ('instant','approval') or jsonb_typeof(p_service->'active') is distinct from 'boolean' or not(p_service ?& array['duration','bufferBefore','bufferAfter','mode','active']) then raise exception 'Invalid service' using errcode='22023';end if;
 if not exists(select 1 from public.booking_services where id=sid) and (select count(*) from public.booking_services where website_id=p_website)>=60 then raise exception 'Service limit reached' using errcode='22023';end if;
 insert into public.booking_services(id,website_id,organization_id,resource_id,name,description,duration,buffer_before,buffer_after,mode,active,allocation)
 values(sid,p_website,org,rid,trim(p_service->>'name'),p_service->>'description',(p_service->>'duration')::integer,(p_service->>'bufferBefore')::integer,(p_service->>'bufferAfter')::integer,p_service->>'mode',(p_service->>'active')::boolean,allocation_kind)
 on conflict(id) do update set allocation=excluded.allocation,resource_id=excluded.resource_id,name=excluded.name,description=excluded.description,duration=excluded.duration,buffer_before=excluded.buffer_before,buffer_after=excluded.buffer_after,mode=excluded.mode,active=excluded.active,updated_at=now() where booking_services.website_id=p_website and booking_services.organization_id=org;
 if not found then raise exception 'Wrong service' using errcode='42501';end if;
 perform vigil.booking_audit('booking.service_saved','booking_service',sid,org,p_after=>(select to_jsonb(b) from public.booking_services b where b.id=sid));return sid;
end$$;
create or replace function vigil.booking_window_free(p_resource uuid,p_start timestamptz,p_duration integer,p_before integer,p_after integer,p_skip uuid default null,p_now timestamptz default now())
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
 if not exists(select 1 from jsonb_array_elements(case when r.kind='table' then s.dining_hours else r.hours end) h where (h->>'day')::integer=extract(dow from a)::integer and a::time>=(h->>'start')::time and b::time<=(h->>'end')::time) then return false;end if;
 return not exists(select 1 from public.booking_blocks x where x.resource_id=r.id and tstzrange(x.starts_at,x.ends_at,'[)') && tstzrange(p_start-p_before*interval '1 minute',p_start+(p_duration+p_after)*interval '1 minute','[)'))
 and not exists(select 1 from public.appointments x where x.resource_id=r.id and x.status='confirmed' and (p_skip is null or x.id<>p_skip) and tstzrange(x.reserved_from,x.reserved_until,'[)') && tstzrange(p_start-p_before*interval '1 minute',p_start+(p_duration+p_after)*interval '1 minute','[)'));
end$$;
create or replace function public.configure_bookings(p_website uuid,p_settings jsonb,p_component_ready boolean default null) returns void language plpgsql security definer set search_path='' as $$
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
  if not exists(select 1 from public.booking_services bs left join public.booking_resources r on r.id=bs.resource_id where bs.website_id=p_website and bs.active and ((bs.allocation='fixed' and r.active and jsonb_array_length(r.hours)>0) or (bs.allocation='table_pool' and jsonb_array_length(s.dining_hours)>0 and exists(select 1 from public.booking_resources t where t.website_id=p_website and t.kind='table' and t.active)))) then raise exception 'Add an active service and availability' using errcode='22023';end if;
 end if;
 update public.booking_settings set enabled=(p_settings->>'enabled')::boolean,component_ready=coalesce(p_component_ready,component_ready),time_zone=tz,minimum_notice=(p_settings->>'minimumNotice')::integer,horizon_days=(p_settings->>'horizonDays')::integer,change_notice=(p_settings->>'changeNotice')::integer,availability_acknowledged_at=case when (p_settings->>'acknowledgeAvailability')::boolean then now() else availability_acknowledged_at end,updated_at=now() where website_id=p_website;
 perform vigil.booking_audit('booking.configured','website',p_website,org,p_after=>(select to_jsonb(bs) from public.booking_settings bs where bs.website_id=p_website));
end$$;

-- Replace old defaulted signatures to avoid ambiguous PostgREST dispatch.
drop function public.booking_public_slots(uuid,text,uuid,date);
create or replace function public.booking_public_slots(p_website uuid,p_origin text,p_service uuid,p_day date,p_party integer default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.booking_settings; b public.booking_services;begin
 s:=vigil.booking_public_site(p_website,p_origin);
 select * into b from public.booking_services where id=p_service and website_id=p_website and active;
 if b.id is null or p_day is null or p_day<(now() at time zone s.time_zone)::date or p_day>(now() at time zone s.time_zone)::date+s.horizon_days then raise exception 'Invalid service or date' using errcode='22023';end if;
 if (b.allocation='table_pool' and (p_party is null or p_party not between 1 and 30)) or (b.allocation='fixed' and p_party is not null) then raise exception 'Choose a valid party size' using errcode='22023';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('startsAt',t,'endsAt',t+b.duration*interval '1 minute') order by t)
 from generate_series(p_day::timestamp at time zone s.time_zone,(p_day+1)::timestamp at time zone s.time_zone-interval '15 minutes',interval '15 minutes') t
 where vigil.booking_choose_resource(p_website,b.resource_id,p_party,t,b.duration,b.buffer_before,b.buffer_after) is not null),'[]'::jsonb);
end$$;
create or replace function vigil.booking_receipt(a public.appointments) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('id',a.id,'partySize',a.party_size,'serviceId',a.service_id,'status',case when a.status='requested' and a.request_expires_at<=now() then 'expired' else a.status end,'startsAt',a.starts_at,'endsAt',a.ends_at,'timeZone',a.time_zone,'serviceName',a.service_name,'requestedStart',a.requested_start_at,'changeDeadline',a.starts_at-coalesce((select change_notice from public.booking_settings where website_id=a.website_id),120)*interval '1 minute','expiresAt',a.request_expires_at)
$$;
drop function public.create_public_booking(uuid,text,uuid,timestamptz,uuid,text,text,jsonb,text,text);
create or replace function public.create_public_booking(p_website uuid,p_origin text,p_service uuid,p_start timestamptz,p_key uuid,p_hash text,p_guest_hash text,p_contact jsonb,p_notes text,p_page text default '',p_party integer default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.booking_settings; b public.booking_services; a public.appointments; lid uuid; rid uuid;begin
 s:=vigil.booking_public_site(p_website,p_origin);
 perform 1 from public.booking_settings where website_id=p_website for update;
 s:=vigil.booking_public_site(p_website,p_origin);
 if p_key is null or p_hash is null or p_hash!~'^[a-f0-9]{64}$' or p_guest_hash is null or p_guest_hash!~'^[a-f0-9]{64}$' then raise exception 'Invalid submission' using errcode='22023';end if;
 select * into a from public.appointments where website_id=p_website and submission_key=p_key;
 if a.id is not null then
  if a.submission_hash<>p_hash or a.guest_token_hash<>p_guest_hash or a.party_size is distinct from p_party then raise exception 'Submission changed' using errcode='23505';end if;
  return vigil.booking_receipt(a);
 end if;
 if jsonb_typeof(p_contact) is distinct from 'object' or p_contact->>'name' is null or length(trim(p_contact->>'name')) not between 1 and 120 or p_contact->>'email' is null or length(p_contact->>'email')>254 or p_contact->>'email'!~'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or coalesce(length(p_contact->>'phone'),0)>40 or p_notes is null or length(p_notes)>2000 then raise exception 'Invalid contact' using errcode='22023';end if;
 select * into b from public.booking_services where id=p_service and website_id=p_website and active;
 if b.id is null or (b.allocation='table_pool' and (p_party is null or p_party not between 1 and 30)) or (b.allocation='fixed' and p_party is not null) then raise exception 'Choose a valid service and party size' using errcode='22023';end if;
 rid:=vigil.booking_choose_resource(p_website,b.resource_id,p_party,p_start,b.duration,b.buffer_before,b.buffer_after);
 if rid is null then raise exception 'Time unavailable' using errcode='23P01';end if;
 if not vigil.rate_limit('booking:site:'||p_website::text,100,86400) then raise exception 'Booking limit' using errcode='P0001';end if;
 -- A new unverified visitor never inherits an existing customer's private lead history.
 insert into public.leads(organization_id,website_id,source,contact,message,metadata) values(s.organization_id,p_website,'booking',p_contact,p_notes,jsonb_build_object('booking',true,'partySize',p_party,'page',coalesce(nullif(left(p_page,2048),''),p_origin||'/'))) returning id into lid;
 insert into public.lead_events(lead_id,organization_id,kind,body) values(lid,s.organization_id,'received','Website appointment '||case when b.mode='instant' then 'confirmed.' else 'requested; awaiting approval.' end);
 insert into public.appointments(website_id,organization_id,service_id,resource_id,lead_id,service_name,time_zone,confirmation_mode,status,starts_at,ends_at,reserved_from,reserved_until,duration,buffer_before,buffer_after,request_expires_at,contact,notes,submission_key,submission_hash,guest_token_hash,party_size)
 values(p_website,s.organization_id,b.id,rid,lid,b.name,s.time_zone,b.mode,case when b.mode='instant' then 'confirmed' else 'requested' end,p_start,p_start+b.duration*interval '1 minute',p_start-b.buffer_before*interval '1 minute',p_start+(b.duration+b.buffer_after)*interval '1 minute',b.duration,b.buffer_before,b.buffer_after,case when b.mode='approval' then least(p_start,now()+interval '48 hours') end,p_contact,p_notes,p_key,p_hash,p_guest_hash,p_party) returning * into a;
 insert into public.appointment_events(appointment_id,website_id,organization_id,kind,details) values(a.id,p_website,s.organization_id,a.status,jsonb_build_object('partySize',a.party_size,'resourceId',a.resource_id));
 perform vigil.booking_audit('booking.created','appointment',a.id,a.organization_id,p_after=>vigil.booking_receipt(a));
 return vigil.booking_receipt(a);
end$$;
create or replace function vigil.booking_transition(p_id uuid,p_action text,p_revision integer,p_start timestamptz default null,p_guest boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.appointments; old public.appointments; s public.booking_settings; target timestamptz; next_status text; request_start timestamptz; mode text; rid uuid;begin
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
 rid:=a.resource_id;
 if p_action in ('confirm','reschedule','approve_reschedule') then
  if not vigil.booking_entitled(a.website_id) or not exists(select 1 from public.booking_services where id=a.service_id and active) then raise exception 'Booking service unavailable' using errcode='42501';end if;
  rid:=vigil.booking_choose_resource(a.website_id,a.resource_id,a.party_size,coalesce(request_start,target),a.duration,a.buffer_before,a.buffer_after,a.id);
  if rid is null then raise exception 'Time unavailable' using errcode='23P01';end if;
 end if;
 update public.appointments set resource_id=case when request_start is not null then a.resource_id else rid end,status=next_status,starts_at=target,ends_at=target+duration*interval '1 minute',reserved_from=target-buffer_before*interval '1 minute',reserved_until=target+(duration+buffer_after)*interval '1 minute',requested_start_at=request_start,request_expires_at=case when next_status='requested' then least(target,now()+interval '48 hours') else null end,revision=revision+1,updated_at=now() where id=a.id returning * into a;
 insert into public.appointment_events(appointment_id,website_id,organization_id,kind,details,actor_user_id) values(a.id,a.website_id,a.organization_id,p_action,jsonb_build_object('before',vigil.booking_receipt(old),'after',vigil.booking_receipt(a),'allocationBefore',old.resource_id,'allocationAfter',a.resource_id,'guest',p_guest),case when not p_guest then auth.uid() end);
 perform vigil.booking_audit('booking.'||p_action,'appointment',a.id,a.organization_id,p_metadata=>jsonb_build_object('guest',p_guest));
 return vigil.booking_receipt(a);
end$$;
revoke all on function public.booking_public_slots(uuid,text,uuid,date,integer),public.create_public_booking(uuid,text,uuid,timestamptz,uuid,text,text,jsonb,text,text,integer) from public,anon,authenticated,service_role;
grant execute on function public.booking_public_slots(uuid,text,uuid,date,integer),public.create_public_booking(uuid,text,uuid,timestamptz,uuid,text,text,jsonb,text,text,integer) to service_role;

create or replace function public.booking_public_config(p_website uuid,p_origin text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s public.booking_settings;begin
 s:=vigil.booking_public_site(p_website,p_origin);
 return jsonb_build_object(
  'websiteId',p_website,'businessName',(select name from public.websites where id=p_website),'timeZone',s.time_zone,'experience',s.experience,
  'minDate',to_char(now() at time zone s.time_zone,'YYYY-MM-DD'),'maxDate',to_char((now() at time zone s.time_zone)::date+s.horizon_days,'YYYY-MM-DD'),
  'services',coalesce((select jsonb_agg(jsonb_build_object(
   'id',b.id,'name',b.name,'description',b.description,'duration',b.duration,'mode',b.mode,'allocation',b.allocation,
   'resourceId',r.id,'resourceName',case when (s.experience->>'showResource')::boolean then r.name else null end,
   'minParty',case when b.allocation='table_pool' then (select min(t.min_party) from public.booking_resources t where t.website_id=p_website and t.kind='table' and t.active) end,
   'maxParty',case when b.allocation='table_pool' then (select max(t.max_party) from public.booking_resources t where t.website_id=p_website and t.kind='table' and t.active) end
  ) order by b.name,b.id) from public.booking_services b left join public.booking_resources r on r.id=b.resource_id
  where b.website_id=p_website and b.active and ((b.allocation='fixed' and r.active) or
   (b.allocation='table_pool' and jsonb_array_length(s.dining_hours)>0 and exists(select 1 from public.booking_resources t where t.website_id=p_website and t.kind='table' and t.active)))),'[]'::jsonb));
end$$;

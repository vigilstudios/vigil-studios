-- Shared contact infrastructure. Additive; existing leads and premium AI entitlements retained.
alter type public.lead_status add value if not exists 'booked';
alter table public.leads add column submission_key uuid, add column submission_hash text,
  add column read_at timestamptz;
alter table public.leads add column search_document tsvector generated always as (to_tsvector('simple',coalesce(contact->>'name','')||' '||coalesce(contact->>'email','')||' '||coalesce(message,''))) stored;
create index leads_search on public.leads using gin(search_document);
create unique index leads_submission_key on public.leads(website_id,submission_key) where submission_key is not null;
create index leads_unread_org on public.leads(organization_id,received_at desc) where read_at is null;

create table public.website_contact_settings (
  website_id uuid primary key references public.websites(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  enabled boolean not null default false,
  allowed_origins text[] not null default '{}',
  notification_email text not null check (char_length(notification_email) between 3 and 254 and notification_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  booking_url text check (booking_url is null or (char_length(booking_url)<=2048 and booking_url ~ '^https://[^/@[:space:]]+(/[^[:space:]]*)?$')),
  daily_limit integer not null default 100 check (daily_limit between 1 and 1000),
  updated_at timestamptz not null default now(),
  check (cardinality(allowed_origins) between 0 and 10)
);
create trigger website_contact_identity before insert or update on public.website_contact_settings
for each row execute function vigil.enforce_same_org_references();
create trigger website_contact_updated before update on public.website_contact_settings
for each row execute function vigil.set_updated_at();
alter table public.website_contact_settings enable row level security;
revoke all on public.website_contact_settings from anon,authenticated;
grant select on public.website_contact_settings to authenticated;
grant all on public.website_contact_settings to service_role;
-- Settings writes go through validated functions, including for staff.
create policy website_contact_read on public.website_contact_settings for select to authenticated
using (vigil.is_staff() or vigil.is_org_member(organization_id));

create table public.lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  kind text not null check(kind in ('received','status_changed','note','notification_sent','notification_failed')),
  body text not null check(char_length(body) between 1 and 4000),
  actor_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index lead_events_timeline on public.lead_events(lead_id,created_at);
alter table public.lead_events enable row level security;
revoke all on public.lead_events from anon,authenticated;
grant select on public.lead_events to authenticated;
grant all on public.lead_events to service_role;
create policy lead_events_read on public.lead_events for select to authenticated
using (vigil.is_staff() or vigil.is_org_member(organization_id));

create table public.lead_notifications (
  lead_id uuid primary key references public.leads(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  recipient text not null,
  status text not null default 'queued' check(status in ('queued','sent','failed','review_required')),
  attempts integer not null default 0,
  last_error text,
  provider_id text,
  -- First attempt fixes the immutable provider payload and deduplication window.
  first_attempt_at timestamptz,
  message jsonb,
  sent_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.lead_notifications enable row level security;
revoke all on public.lead_notifications from anon,authenticated;
grant select on public.lead_notifications to authenticated;
grant all on public.lead_notifications to service_role;
create policy lead_notifications_read on public.lead_notifications for select to authenticated
using (vigil.is_staff() or vigil.is_org_member(organization_id));

-- All event writers derive identity from the referenced lead; rows cannot cross tenants.
create function vigil.lead_child_identity() returns trigger language plpgsql set search_path='' as $$
begin
  if not exists(select 1 from public.leads where id=new.lead_id and organization_id=new.organization_id) then
    raise exception 'Lead identity mismatch' using errcode='23514';
  end if;
  return new;
end $$;
create trigger lead_events_identity before insert or update on public.lead_events
for each row execute function vigil.lead_child_identity();
create trigger lead_notifications_identity before insert or update on public.lead_notifications
for each row execute function vigil.lead_child_identity();

-- Browser cannot rewrite captured inquiry or idempotency evidence. Status/read state use RPCs.
revoke update on public.leads from authenticated;
grant update(status,read_at) on public.leads to authenticated;
drop trigger leads_protect_columns on public.leads;
create trigger leads_protect_columns before update on public.leads
for each row execute function vigil.protect_columns_from_customers(
'id','organization_id','website_id','source','contact','message','metadata','received_at','created_at','submission_key','submission_hash');
create function vigil.lead_status_event() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status is distinct from old.status then
  insert into public.lead_events(lead_id,organization_id,kind,body,actor_user_id)
  values(new.id,new.organization_id,'status_changed',old.status::text||' → '||new.status::text,auth.uid());
 end if;
 return new;
end $$;
create trigger leads_status_event after update of status on public.leads
for each row execute function vigil.lead_status_event();

create function public.configure_website_contact(p_website uuid,p_recipient text,p_booking text,p_enabled boolean default null,p_origins text[] default null)
returns void language plpgsql security definer set search_path='' as $$
declare w public.websites; u text; org uuid; origins text[];
begin
 select * into w from public.websites where id=p_website;
 if w.id is null or not (vigil.is_staff() or vigil.has_org_role(w.organization_id,array['owner','manager']::public.org_role[])) then
  raise exception 'Not authorized' using errcode='42501';
 end if;
 if not vigil.is_staff() and (p_enabled is not null or p_origins is not null) then
  raise exception 'Registration requires staff' using errcode='42501';
 end if;
 if p_booking is not null and (p_booking ~* '^https://[^/]*\.(local|internal|test|invalid)(/|$)' or p_booking ~ '^https://[0-9.]+(/|$)' or p_booking !~ '^https://[a-zA-Z0-9.-]+(:443)?(/[^[:space:]]*)?$' or p_booking ~ '^https://(localhost|127\.|0\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)') then
  raise exception 'Use a public HTTPS booking URL' using errcode='22023';
 end if;
 if p_origins is not null then
  foreach u in array p_origins loop
   if u !~ '^https://[a-z0-9.-]+(:443)?$' then raise exception 'Invalid origin' using errcode='22023'; end if;
   -- A registered origin must be a verified operated live URL or ready production deployment.
   if not (w.status='live' and split_part(w.live_url,'/',1)||'//'||split_part(w.live_url,'/',3)=u)
     and not exists(select 1 from public.deployments d where d.website_id=w.id and d.status='ready' and d.environment='production'
       and split_part(d.url,'/',1)||'//'||split_part(d.url,'/',3)=u) then
    raise exception 'Origin has no verified production deployment' using errcode='22023';
   end if;
  end loop;
 end if;
 if p_enabled=true and (w.status<>'live' or coalesce(cardinality(p_origins),0)=0) then
  raise exception 'Launch the website and register its origin first' using errcode='22023';
 end if;
 if not vigil.is_staff() and not exists(select 1 from public.website_contact_settings where website_id=w.id) then
  raise exception 'Staff must register this website first' using errcode='22023';
 end if;
 insert into public.website_contact_settings(website_id,organization_id,notification_email,booking_url,enabled,allowed_origins)
 values(w.id,w.organization_id,trim(p_recipient),nullif(trim(p_booking),''),coalesce(p_enabled,false),coalesce(p_origins,'{}'))
 on conflict(website_id) do update set notification_email=excluded.notification_email,booking_url=excluded.booking_url,
  enabled=coalesce(p_enabled,website_contact_settings.enabled),allowed_origins=coalesce(p_origins,website_contact_settings.allowed_origins);
end $$;
revoke all on function public.configure_website_contact(uuid,text,text,boolean,text[]) from public,anon;
grant execute on function public.configure_website_contact(uuid,text,text,boolean,text[]) to authenticated;

-- Service role only; server already validates Turnstile. Re-check registration within the transaction.
create function public.capture_website_lead(p_website uuid,p_origin text,p_key uuid,p_hash text,p_contact jsonb,p_message text,p_source text,p_page text)
returns uuid language plpgsql security definer set search_path='' as $$
declare s public.website_contact_settings; lid uuid; existing_hash text;
begin
 if auth.role() is distinct from 'service_role' then raise exception 'Service role only' using errcode='42501'; end if;
 select s0.* into s from public.website_contact_settings s0 join public.websites w on w.id=s0.website_id
 join public.organizations o on o.id=w.organization_id
 where s0.website_id=p_website and s0.enabled and p_origin=any(s0.allowed_origins)
  and w.status='live' and o.archived_at is null for share of s0,w,o;
 if s.website_id is null then raise exception 'Contact unavailable' using errcode='42501'; end if;
 if p_message is null or p_source is null or p_page is null or p_contact is null or p_key is null or p_hash is null or p_hash !~ '^[a-f0-9]{64}$' or p_contact->>'name' is null or p_contact->>'email' is null
 or char_length(p_contact->>'name') not between 1 and 120 or char_length(p_contact->>'email') not between 3 and 254
 or char_length(p_message) not between 1 and 5000 or char_length(p_source) not between 1 and 80
 or char_length(p_page)>2048 then raise exception 'Invalid inquiry' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_website::text||':'||p_key::text,0));
 select id,submission_hash into lid,existing_hash from public.leads where website_id=p_website and submission_key=p_key;
 if lid is not null then
  if existing_hash<>p_hash then raise exception 'Submission key conflict' using errcode='23505'; end if;
  return lid;
 end if;
 if not vigil.rate_limit('contact:site:'||p_website::text,s.daily_limit,86400) then
  raise exception 'Website daily inquiry limit reached' using errcode='P0001';
 end if;
 insert into public.leads(organization_id,website_id,source,contact,message,metadata,submission_key,submission_hash)
 values(s.organization_id,p_website,p_source,p_contact,p_message,jsonb_build_object('page',p_page),p_key,p_hash) returning id into lid;
 insert into public.lead_events(lead_id,organization_id,kind,body) values(lid,s.organization_id,'received','Website inquiry received.');
 insert into public.lead_notifications(lead_id,organization_id,recipient) values(lid,s.organization_id,s.notification_email);
 insert into public.provisioning_jobs(kind,idempotency_key,organization_id,website_id,payload,max_attempts)
 values('lead.notify','lead.notify:'||lid::text,s.organization_id,p_website,jsonb_build_object('lead_id',lid),8);
 return lid;
end $$;
revoke all on function public.capture_website_lead(uuid,text,uuid,text,jsonb,text,text,text) from public,anon,authenticated;
grant execute on function public.capture_website_lead(uuid,text,uuid,text,jsonb,text,text,text) to service_role;

create function public.add_lead_note(p_lead uuid,p_note text) returns void
language plpgsql security definer set search_path='' as $$
declare org uuid;
begin
 select organization_id into org from public.leads where id=p_lead;
 if org is null or auth.uid() is null or not (vigil.is_staff() or vigil.is_org_member(org)) then
 raise exception 'Not authorized' using errcode='42501'; end if;
 if char_length(trim(p_note)) not between 1 and 4000 then raise exception 'Invalid note' using errcode='22023'; end if;
 insert into public.lead_events(lead_id,organization_id,kind,body,actor_user_id) values(p_lead,org,'note',trim(p_note),auth.uid());
end $$;
revoke all on function public.add_lead_note(uuid,text) from public,anon;
grant execute on function public.add_lead_note(uuid,text) to authenticated;

-- Acknowledge provider acceptance and activity atomically; a retry cannot leave a false timeline.
create function public.acknowledge_lead_notification(p_lead uuid,p_org uuid,p_provider text)
returns void language plpgsql security definer set search_path='' as $$
declare n public.lead_notifications;
begin
 if auth.role() is distinct from 'service_role' then raise exception 'Service role only' using errcode='42501'; end if;
 select * into n from public.lead_notifications where lead_id=p_lead and organization_id=p_org for update;
 if n.lead_id is null or p_provider is null or char_length(p_provider) not between 1 and 200 then raise exception 'Notification identity mismatch' using errcode='22023'; end if;
 if n.status='sent' then return; end if;
 update public.lead_notifications set status='sent',provider_id=p_provider,sent_at=now(),last_error=null,updated_at=now() where lead_id=p_lead;
 insert into public.lead_events(lead_id,organization_id,kind,body) values(p_lead,p_org,'notification_sent','Email provider accepted the client notification. Inbox delivery is not yet confirmed.');
end $$;
revoke all on function public.acknowledge_lead_notification(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.acknowledge_lead_notification(uuid,uuid,text) to service_role;

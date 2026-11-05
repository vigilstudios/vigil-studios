-- Optional outbound copies. Provider identifiers stay in provider_links; credentials stay in Vault.
create table vigil.booking_calendar_connections (
 id uuid primary key default gen_random_uuid(), website_id uuid not null references public.booking_settings(website_id) on delete cascade,
 organization_id uuid not null references public.organizations(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade,
 account_email text not null, vault_secret_id uuid, enabled boolean not null default true,
 status text not null default 'connected' check(status in ('connected','retrying','attention','disconnected')),
 last_synced_at timestamptz, last_attempted_at timestamptz, error_code text, connected_at timestamptz not null default now(),
 lease_token uuid, lease_until timestamptz, leased_kind text, leased_entity uuid, leased_version bigint, unique(website_id,user_id)
);
create sequence vigil.booking_calendar_versions;
revoke all on sequence vigil.booking_calendar_versions from public,anon,authenticated,service_role;
create table vigil.booking_calendar_queue (
 connection_id uuid not null references vigil.booking_calendar_connections(id) on delete cascade,
 kind text not null check(kind in ('appointment','booking_block')), entity_id uuid not null,
 version bigint not null default nextval('vigil.booking_calendar_versions'), attempts integer not null default 0, next_attempt_at timestamptz not null default now(),
 primary key(connection_id,kind,entity_id)
);
create index booking_calendar_due on vigil.booking_calendar_queue(next_attempt_at);
alter table vigil.booking_calendar_connections enable row level security;
alter table vigil.booking_calendar_queue enable row level security;
revoke all on vigil.booking_calendar_connections,vigil.booking_calendar_queue from public,anon,authenticated,service_role;

create function vigil.booking_calendar_service() returns void language plpgsql set search_path='' as $$begin
 if auth.role() is distinct from 'service_role' then raise exception 'Service only' using errcode='42501';end if;
end$$;
create function vigil.booking_calendar_member(p_user uuid,p_site uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.websites w join public.organization_members m on m.organization_id=w.organization_id join public.organizations o on o.id=w.organization_id
 where w.id=p_site and m.user_id=p_user and m.status='active' and m.role in ('owner','manager') and o.archived_at is null)
$$;
create function vigil.enqueue_booking_calendar() returns trigger language plpgsql security definer set search_path='' as $$
declare site uuid; entity uuid;begin
 site:=case when tg_op='DELETE' then old.website_id else new.website_id end;
 entity:=case when tg_op='DELETE' then old.id else new.id end;
 insert into vigil.booking_calendar_queue(connection_id,kind,entity_id)
 select id,case when tg_table_name='appointments' then 'appointment' else 'booking_block' end,entity from vigil.booking_calendar_connections where website_id=site and status<>'disconnected'
 on conflict(connection_id,kind,entity_id) do update set version=nextval('vigil.booking_calendar_versions'),attempts=0,next_attempt_at=now();
 return null;
end$$;
create trigger booking_calendar_appointments after insert or update or delete on public.appointments for each row execute function vigil.enqueue_booking_calendar();
create trigger booking_calendar_blocks after insert or update or delete on public.booking_blocks for each row execute function vigil.enqueue_booking_calendar();

create function public.booking_calendar_status(p_user uuid,p_site uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare c vigil.booking_calendar_connections;begin
 perform vigil.booking_calendar_service();
 if not vigil.booking_calendar_member(p_user,p_site) then return null;end if;
 select * into c from vigil.booking_calendar_connections where user_id=p_user and website_id=p_site;
 if not found then return null;end if;
 return jsonb_build_object('id',c.id,'email',c.account_email,'enabled',c.enabled,'status',c.status,'lastSyncedAt',c.last_synced_at,'errorCode',c.error_code);
end$$;
create function public.save_booking_calendar(p_user uuid,p_site uuid,p_email text,p_refresh_token text,p_calendar text) returns uuid language plpgsql security definer set search_path='' as $$
declare cid uuid; vid uuid; org uuid;begin
 perform vigil.booking_calendar_service();
 if not vigil.booking_calendar_member(p_user,p_site) or not vigil.booking_entitled(p_site) then raise exception 'Booking manager required' using errcode='42501';end if;
 if p_email is null or length(p_email)>254 or p_email !~ '^[^[:space:]<>]+@[^[:space:]<>]+\.[^[:space:]<>]+$' or p_refresh_token is null or length(p_refresh_token) not between 10 and 4096 or p_calendar is null or length(p_calendar) not between 5 and 1024 or p_calendar='primary' then raise exception 'Invalid connection' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user::text||p_site::text,63));
 select id,vault_secret_id into cid,vid from vigil.booking_calendar_connections where user_id=p_user and website_id=p_site for update;
 if exists(select 1 from vigil.booking_calendar_connections where id=cid and lease_until>now()) then raise exception 'Sync is finishing; try again shortly' using errcode='22023';end if;
 select organization_id into org from public.booking_settings where website_id=p_site;
 if org is null then raise exception 'Review booking setup first' using errcode='22023';end if;
 cid:=coalesce(cid,gen_random_uuid());
 if exists(select 1 from public.provider_links where provider='other' and resource_kind='booking_google_calendar' and external_id=p_calendar and entity_id<>cid) then raise exception 'Calendar belongs to another connection' using errcode='42501';end if;
 if vid is null then select vault.create_secret(p_refresh_token,'vigil.booking.calendar.'||cid::text,'Personal outbound booking calendar') into vid;
 else perform vault.update_secret(vid,p_refresh_token);end if;
 if not exists(select 1 from public.provider_links where provider='other' and resource_kind='booking_google_calendar' and entity_id=cid and external_id=p_calendar) then
  delete from public.provider_links where provider='other' and ((resource_kind='booking_google_calendar' and entity_id=cid) or (resource_kind='booking_google_event' and metadata->>'connection_id'=cid::text));
 end if;
 insert into vigil.booking_calendar_connections(id,user_id,website_id,organization_id,account_email,vault_secret_id) values(cid,p_user,p_site,org,p_email,vid)
 on conflict(website_id,user_id) do update set account_email=excluded.account_email,vault_secret_id=excluded.vault_secret_id,enabled=true,status='connected',error_code=null,connected_at=now();
 insert into public.provider_links(provider,resource_kind,external_id,entity_type,entity_id) values('other','booking_google_calendar',p_calendar,'booking_calendar_connection',cid) on conflict(provider,resource_kind,external_id) do nothing;
 insert into vigil.booking_calendar_queue(connection_id,kind,entity_id) select cid,'appointment',id from public.appointments where website_id=p_site and ends_at>=now()-interval '1 day' and status in ('requested','confirmed')
 on conflict(connection_id,kind,entity_id) do update set version=nextval('vigil.booking_calendar_versions'),attempts=0,next_attempt_at=now();
 insert into vigil.booking_calendar_queue(connection_id,kind,entity_id) select cid,'booking_block',id from public.booking_blocks where website_id=p_site and ends_at>now()
 on conflict(connection_id,kind,entity_id) do update set version=nextval('vigil.booking_calendar_versions'),attempts=0,next_attempt_at=now();
 -- Reconcile prior copies as well, including cancellations made while disconnected.
 insert into vigil.booking_calendar_queue(connection_id,kind,entity_id)
 select cid,entity_type,entity_id from public.provider_links where provider='other' and resource_kind='booking_google_event' and metadata->>'connection_id'=cid::text and entity_type in ('appointment','booking_block')
 on conflict(connection_id,kind,entity_id) do update set version=nextval('vigil.booking_calendar_versions'),attempts=0,next_attempt_at=now();
 insert into public.audit_events(organization_id,actor_kind,actor_user_id,action,entity_type,entity_id,metadata) values(org,'user',p_user,'booking.calendar_connected','booking_calendar_connection',cid,jsonb_build_object('website_id',p_site));
 return cid;
end$$;
create function public.claim_booking_calendar(p_connection uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare c vigil.booking_calendar_connections; q vigil.booking_calendar_queue; token uuid; secret text; calendar text; payload jsonb;begin
 perform vigil.booking_calendar_service();
 select bc.* into c from vigil.booking_calendar_connections bc where bc.enabled and (p_connection is null or bc.id=p_connection) and (bc.lease_until is null or bc.lease_until<now())
 and vigil.booking_calendar_member(bc.user_id,bc.website_id) and vigil.booking_entitled(bc.website_id)
 and exists(select 1 from vigil.booking_calendar_queue j where j.connection_id=bc.id and j.next_attempt_at<=now()) order by bc.last_attempted_at nulls first,bc.id for update skip locked limit 1;
 if not found then return null;end if;
 select * into q from vigil.booking_calendar_queue where connection_id=c.id and next_attempt_at<=now() order by next_attempt_at,kind,entity_id limit 1;
 token:=gen_random_uuid();update vigil.booking_calendar_connections set last_attempted_at=now(),lease_token=token,lease_until=now()+interval '90 seconds',leased_kind=q.kind,leased_entity=q.entity_id,leased_version=q.version where id=c.id;
 select decrypted_secret into secret from vault.decrypted_secrets where id=c.vault_secret_id;
 select external_id into calendar from public.provider_links where provider='other' and resource_kind='booking_google_calendar' and entity_type='booking_calendar_connection' and entity_id=c.id;
 if q.kind='appointment' then
  select jsonb_build_object('start',starts_at,'end',ends_at,'timeZone',time_zone,'title',service_name,'name',contact->>'name','status',case when status='requested' and request_expires_at<=now() then 'expired' else status end) into payload from public.appointments where id=q.entity_id and website_id=c.website_id;
 else
  select jsonb_build_object('start',b.starts_at,'end',b.ends_at,'timeZone',s.time_zone,'title','Unavailable · '||r.name,'status','confirmed') into payload from public.booking_blocks b join public.booking_settings s on s.website_id=b.website_id join public.booking_resources r on r.id=b.resource_id where b.id=q.entity_id and b.website_id=c.website_id;
 end if;
 return jsonb_build_object('connectionId',c.id,'websiteId',c.website_id,'kind',q.kind,'entityId',q.entity_id,'version',q.version,'lease',token,'refreshToken',secret,'calendarId',calendar,'eventId',(select external_id from public.provider_links where provider='other' and resource_kind='booking_google_event' and entity_type=q.kind and entity_id=q.entity_id and metadata->>'connection_id'=c.id::text order by updated_at desc limit 1),'payload',payload);
end$$;
create function public.finish_booking_calendar(p_connection uuid,p_lease uuid,p_kind text,p_entity uuid,p_version bigint,p_event text default null,p_error text default null,p_retry_after integer default null) returns boolean language plpgsql security definer set search_path='' as $$
declare c vigil.booking_calendar_connections;begin
 perform vigil.booking_calendar_service();
 select * into c from vigil.booking_calendar_connections where id=p_connection and lease_token=p_lease and lease_until>now() and leased_kind=p_kind and leased_entity=p_entity and leased_version=p_version for update;
 if not found then return false;end if;
 if p_error is null then
  if p_event is not null then
   delete from public.provider_links where provider='other' and resource_kind='booking_google_event' and entity_type=p_kind and entity_id=p_entity and metadata->>'connection_id'=c.id::text and external_id<>p_event;
   insert into public.provider_links(provider,resource_kind,external_id,entity_type,entity_id,metadata) values('other','booking_google_event',p_event,p_kind,p_entity,jsonb_build_object('connection_id',c.id))
   on conflict(provider,resource_kind,external_id) do update set metadata=excluded.metadata;
  else delete from public.provider_links where provider='other' and resource_kind='booking_google_event' and entity_type=p_kind and entity_id=p_entity and metadata->>'connection_id'=c.id::text;end if;
  delete from vigil.booking_calendar_queue where connection_id=c.id and kind=p_kind and entity_id=p_entity and version=p_version;
  update vigil.booking_calendar_connections set last_synced_at=now(),status='connected',error_code=null,lease_token=null,lease_until=null,leased_kind=null,leased_entity=null,leased_version=null where id=c.id;
 else
  update vigil.booking_calendar_queue set attempts=attempts+1,next_attempt_at=now()+make_interval(secs=>greatest(least(86400,coalesce(p_retry_after,0)),least(3600,30*power(2,least(attempts,7)))::integer)) where connection_id=c.id and kind=p_kind and entity_id=p_entity;
  update vigil.booking_calendar_connections set enabled=(p_error<>'reconnect_required'),status=case when p_error='reconnect_required' then 'attention' else 'retrying' end,error_code=case when p_error='reconnect_required' then p_error else 'sync_retry' end,lease_token=null,lease_until=null,leased_kind=null,leased_entity=null,leased_version=null where id=c.id;
 end if;
 return true;
end$$;
create function vigil.cleanup_booking_calendar() returns trigger language plpgsql security definer set search_path='' as $$begin
 delete from public.provider_links where provider='other' and ((resource_kind='booking_google_calendar' and entity_type='booking_calendar_connection' and entity_id=old.id) or (resource_kind='booking_google_event' and metadata->>'connection_id'=old.id::text));
 delete from vault.secrets where id=old.vault_secret_id;return old;
end$$;
create trigger booking_calendar_cleanup after delete on vigil.booking_calendar_connections for each row execute function vigil.cleanup_booking_calendar();
create function public.remove_booking_calendar(p_user uuid,p_site uuid) returns boolean language plpgsql security definer set search_path='' as $$
declare c vigil.booking_calendar_connections;begin
 perform vigil.booking_calendar_service();
 perform pg_advisory_xact_lock(hashtextextended(p_user::text||p_site::text,63));
 select * into c from vigil.booking_calendar_connections where user_id=p_user and website_id=p_site for update;
 if not found then return true;end if;
 if c.lease_until>now() then return false;end if;
 update vigil.booking_calendar_connections set enabled=false,status='disconnected',vault_secret_id=null,error_code=null,lease_token=null,lease_until=null,leased_kind=null,leased_entity=null,leased_version=null where id=c.id;
 delete from vault.secrets where id=c.vault_secret_id;
 delete from vigil.booking_calendar_queue where connection_id=c.id;
 insert into public.audit_events(organization_id,actor_kind,actor_user_id,action,entity_type,entity_id,metadata) values(c.organization_id,'user',p_user,'booking.calendar_disconnected','booking_calendar_connection',c.id,jsonb_build_object('website_id',p_site));
 return true;
end$$;
create function public.booking_calendar_target(p_user uuid,p_site uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$begin
 perform vigil.booking_calendar_service();
 if not vigil.booking_calendar_member(p_user,p_site) then return null;end if;
 return (select jsonb_build_object('email',c.account_email,'calendarId',p.external_id) from vigil.booking_calendar_connections c join public.provider_links p on p.entity_id=c.id and p.provider='other' and p.resource_kind='booking_google_calendar' where c.user_id=p_user and c.website_id=p_site);
end$$;
create function public.booking_calendar_lease_valid(p_connection uuid,p_lease uuid,p_kind text,p_entity uuid,p_version bigint) returns boolean language plpgsql stable security definer set search_path='' as $$begin
 perform vigil.booking_calendar_service();
 return exists(select 1 from vigil.booking_calendar_connections c join vigil.booking_calendar_queue q on q.connection_id=c.id where c.id=p_connection and c.lease_token=p_lease and c.lease_until>now() and c.leased_kind=p_kind and c.leased_entity=p_entity and c.leased_version=p_version and c.enabled and vigil.booking_calendar_member(c.user_id,c.website_id) and vigil.booking_entitled(c.website_id) and q.kind=p_kind and q.entity_id=p_entity and q.version=p_version);
end$$;
-- No credentials, queue records or internal helpers are directly browser-readable.
do $$declare f record;begin
 for f in select p.oid::regprocedure signature,n.nspname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','vigil') and p.proname in ('booking_calendar_service','booking_calendar_member','enqueue_booking_calendar','booking_calendar_status','save_booking_calendar','claim_booking_calendar','finish_booking_calendar','cleanup_booking_calendar','remove_booking_calendar','booking_calendar_target','booking_calendar_lease_valid') loop
 execute format('revoke all on function %s from public,anon,authenticated,service_role',f.signature);
 if f.nspname='public' then execute format('grant execute on function %s to service_role',f.signature);end if;
 end loop;
end$$;

-- Membership revocation removes saved access and cancels queued work.
create function vigil.revoke_booking_calendar_member() returns trigger language plpgsql security definer set search_path='' as $$begin
 if tg_op='DELETE' then delete from vigil.booking_calendar_connections where user_id=old.user_id and organization_id=old.organization_id;
 elsif new.status<>'active' or new.role not in ('owner','manager') then delete from vigil.booking_calendar_connections where user_id=new.user_id and organization_id=new.organization_id;end if;
 return null;
end$$;
revoke all on function vigil.revoke_booking_calendar_member() from public,anon,authenticated,service_role;
create trigger booking_calendar_member_revoked after update or delete on public.organization_members for each row execute function vigil.revoke_booking_calendar_member();

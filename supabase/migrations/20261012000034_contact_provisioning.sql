-- Contact setup follows website lifecycle and verified domain records. Widget secrets stay in Vault.
do $$begin
 if to_regclass('vault.secrets') is null then raise exception 'Supabase Vault is required for contact automation'; end if;
end$$;
create table public.website_contact_automation (
 website_id uuid primary key references public.websites(id) on delete cascade,
 organization_id uuid not null references public.organizations(id) on delete cascade,
 automatic boolean not null default true,
 generation integer not null default 0,
 status text not null default 'waiting_launch' check(status in ('waiting_launch','waiting_connection','needs_recipient','queued','configuring','ready','paused','failed','review_required')),
 last_error text,
 updated_at timestamptz not null default now()
);
alter table public.website_contact_automation enable row level security;
revoke all on public.website_contact_automation from public,anon,authenticated;
grant select on public.website_contact_automation to authenticated;
grant all on public.website_contact_automation to service_role;
create policy contact_automation_read on public.website_contact_automation for select to authenticated
using(vigil.is_staff() or vigil.is_org_member(organization_id));
create trigger contact_automation_identity before insert or update on public.website_contact_automation
for each row execute function vigil.enforce_same_org_references();

create table vigil.contact_secret_refs (
 website_id uuid primary key references public.websites(id) on delete cascade,
 vault_secret_id uuid,
 lease_token uuid,
 lease_until timestamptz,
 creation_started_at timestamptz
);
alter table vigil.contact_secret_refs enable row level security;
revoke all on vigil.contact_secret_refs from public,anon,authenticated,service_role;
create unique index contact_widget_one_per_site on public.provider_links(entity_id)
where provider='cloudflare' and resource_kind='turnstile_widget' and entity_type='website';

create function vigil.contact_service_only() returns void language plpgsql set search_path='' as $$begin
 if auth.role() is distinct from 'service_role' then raise exception 'Service role only' using errcode='42501'; end if;
end$$;
revoke all on function vigil.contact_service_only() from public,anon,authenticated;
grant execute on function vigil.contact_service_only() to service_role;

create function vigil.contact_verified_origins(p_website uuid) returns text[] language sql stable security definer set search_path='' as $$
 select coalesce(array_agg(distinct origin order by origin),'{}'::text[]) from (
  select split_part(w.live_url,'/',1)||'//'||split_part(w.live_url,'/',3) as origin
  from public.websites w join public.organizations o on o.id=w.organization_id
  where w.id=p_website and w.status='live' and o.archived_at is null
  and (
   exists(select 1 from public.domains d where d.website_id=w.id and d.status='connected' and d.dns_ok and d.ssl_ok
    and split_part(w.live_url,'/',3) in (d.hostname,case when d.kind='apex' then 'www.'||d.hostname else d.hostname end))
   or exists(select 1 from public.deployments d where d.website_id=w.id and d.environment='production' and d.status='ready'
    and (split_part(d.url,'/',3)=split_part(w.live_url,'/',3)
     or (split_part(w.live_url,'/',3)='vigil-'||left(w.id::text,8)||'.vercel.app'
      and exists(select 1 from public.provider_links l where l.entity_id=w.id and l.entity_type='website' and l.provider='vercel' and l.resource_kind='site'))))
  )
  union
  select 'https://'||d.hostname from public.domains d join public.websites w on w.id=d.website_id
  join public.organizations o on o.id=w.organization_id
  where w.id=p_website and w.status='live' and o.archived_at is null and d.status='connected' and d.dns_ok and d.ssl_ok
  union
  select 'https://www.'||d.hostname from public.domains d join public.websites w on w.id=d.website_id
  join public.organizations o on o.id=w.organization_id
  where w.id=p_website and w.status='live' and o.archived_at is null and d.kind='apex' and d.status='connected' and d.dns_ok and d.ssl_ok
 ) origins where origin ~ '^https://([a-z0-9][a-z0-9-]*\.)+[a-z]{2,63}$'
 and origin !~ '\.(local|internal|test|invalid)$';
$$;
revoke all on function vigil.contact_verified_origins(uuid) from public,anon,authenticated;
grant execute on function vigil.contact_verified_origins(uuid) to service_role;

-- An approved configured client recipient wins; otherwise use a verified active owner's address.
create function vigil.ensure_contact_recipient(p_website uuid) returns boolean language plpgsql security definer set search_path='' as $$
declare destination text; org uuid;
begin
 if exists(select 1 from public.website_contact_settings where website_id=p_website) then return true; end if;
 select w.organization_id,u.email into org,destination from public.websites w
 join public.organization_members m on m.organization_id=w.organization_id and m.role='owner' and m.status='active'
 join auth.users u on u.id=m.user_id and u.email_confirmed_at is not null
 where w.id=p_website order by m.created_at,m.user_id limit 1;
 if destination is null then return false; end if;
 insert into public.website_contact_settings(website_id,organization_id,notification_email) values(p_website,org,destination) on conflict(website_id) do nothing;
 return true;
end$$;
revoke all on function vigil.ensure_contact_recipient(uuid) from public,anon,authenticated;

create function vigil.queue_contact_setup(p_website uuid) returns void language plpgsql security definer set search_path='' as $$
declare w public.websites; a public.website_contact_automation; next_state text;
begin
 select * into w from public.websites where id=p_website;
 if w.id is null then return; end if;
 insert into public.website_contact_automation(website_id,organization_id) values(w.id,w.organization_id) on conflict(website_id) do nothing;
 select * into a from public.website_contact_automation where website_id=w.id for update;
 if not a.automatic then return; end if;
 -- Origin changes disable capture before asynchronous provider calls finish.
 update public.website_contact_settings set enabled=false where website_id=w.id;
 if w.status<>'live' or not exists(select 1 from public.organizations where id=w.organization_id and archived_at is null) then next_state:='waiting_launch';
 elsif not vigil.ensure_contact_recipient(w.id) then next_state:='needs_recipient';
 elsif cardinality(vigil.contact_verified_origins(w.id))=0 then next_state:='waiting_launch';
 else next_state:='queued'; end if;
 update public.website_contact_automation set generation=generation+1,status=next_state,last_error=null,updated_at=now() where website_id=w.id returning * into a;
 if next_state='queued' then
  insert into public.provisioning_jobs(kind,idempotency_key,organization_id,website_id,payload,max_attempts)
  values('website.contact.configure','website.contact.configure:'||w.id::text||':'||a.generation::text,w.organization_id,w.id,jsonb_build_object('generation',a.generation),8)
  on conflict(idempotency_key) do nothing;
 end if;
end$$;
revoke all on function vigil.queue_contact_setup(uuid) from public,anon,authenticated;

create function public.set_website_contact_automation(p_website uuid,p_automatic boolean) returns void
language plpgsql security definer set search_path='' as $$
declare org uuid;
begin
 if not vigil.is_staff() then raise exception 'Staff access required' using errcode='42501'; end if;
 select organization_id into org from public.websites where id=p_website;
 if org is null or p_automatic is null then raise exception 'Invalid website' using errcode='22023'; end if;
 insert into public.website_contact_automation(website_id,organization_id,automatic) values(p_website,org,p_automatic)
 on conflict(website_id) do update set automatic=excluded.automatic,status=case when excluded.automatic then 'waiting_launch' else 'paused' end,last_error=null,updated_at=now();
 if p_automatic then perform vigil.queue_contact_setup(p_website);
 else update public.website_contact_settings set enabled=false where website_id=p_website; end if;
end$$;
revoke all on function public.set_website_contact_automation(uuid,boolean) from public,anon;
grant execute on function public.set_website_contact_automation(uuid,boolean) to authenticated;

create function vigil.contact_website_changed() returns trigger language plpgsql security definer set search_path='' as $$begin
 if tg_op='INSERT' then
  if new.status='live' then perform vigil.queue_contact_setup(new.id); end if;
 elsif new.status is distinct from old.status or new.live_url is distinct from old.live_url then perform vigil.queue_contact_setup(new.id);
 end if;return new;
end$$;
create trigger contact_website_lifecycle after insert or update of status,live_url on public.websites
for each row execute function vigil.contact_website_changed();
create function vigil.contact_domain_changed() returns trigger language plpgsql security definer set search_path='' as $$begin
 if tg_op='DELETE' then perform vigil.queue_contact_setup(old.website_id);return old;
 elsif tg_op='INSERT' then if new.status='connected' then perform vigil.queue_contact_setup(new.website_id);end if;
 elsif new.status is distinct from old.status or new.dns_ok is distinct from old.dns_ok or new.ssl_ok is distinct from old.ssl_ok
  or new.hostname is distinct from old.hostname or new.website_id is distinct from old.website_id then
  perform vigil.queue_contact_setup(new.website_id);if new.website_id is distinct from old.website_id then perform vigil.queue_contact_setup(old.website_id);end if;
 end if;return new;
end$$;
create trigger contact_domain_lifecycle after insert or update of status,dns_ok,ssl_ok,hostname,website_id or delete on public.domains
for each row execute function vigil.contact_domain_changed();

create function public.claim_contact_setup(p_website uuid,p_generation integer,p_token uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare a public.website_contact_automation; w public.websites; s vigil.contact_secret_refs; origins text[];
begin
 perform vigil.contact_service_only();
 select * into a from public.website_contact_automation where website_id=p_website for update;
 select * into w from public.websites where id=p_website;
 if p_generation is null or a.website_id is null or a.generation<>p_generation or not a.automatic then return jsonb_build_object('claimed',false,'status','superseded');end if;
 origins:=vigil.contact_verified_origins(p_website);
 if w.status<>'live' or cardinality(origins)=0 then return jsonb_build_object('claimed',false,'status','waiting_launch'); end if;
 if p_token is null then raise exception 'Invalid lease' using errcode='22023'; end if;
 insert into vigil.contact_secret_refs(website_id) values(p_website) on conflict(website_id) do nothing;
 select * into s from vigil.contact_secret_refs where website_id=p_website for update;
 if s.lease_until>now() and s.lease_token is distinct from p_token then return jsonb_build_object('claimed',false,'status','busy');end if;
 update vigil.contact_secret_refs set lease_token=p_token,lease_until=now()+interval '5 minutes' where website_id=p_website;
 update public.website_contact_automation set status='configuring',last_error=null,updated_at=now() where website_id=p_website;
 return jsonb_build_object('claimed',true,'organization_id',w.organization_id,'origins',origins,'creation_started',s.creation_started_at is not null);
end$$;
revoke all on function public.claim_contact_setup(uuid,integer,uuid) from public,anon,authenticated;
grant execute on function public.claim_contact_setup(uuid,integer,uuid) to service_role;

create function public.mark_contact_widget_creation(p_website uuid,p_token uuid) returns void
language plpgsql security definer set search_path='' as $$begin
 perform vigil.contact_service_only();
 update vigil.contact_secret_refs set creation_started_at=now() where website_id=p_website and lease_token=p_token and lease_until>now() and creation_started_at is null;
 if not found then raise exception 'Widget creation already started or lease lost' using errcode='40001';end if;
end$$;
revoke all on function public.mark_contact_widget_creation(uuid,uuid) from public,anon,authenticated;
grant execute on function public.mark_contact_widget_creation(uuid,uuid) to service_role;

create function public.finish_contact_setup(p_website uuid,p_generation integer,p_token uuid,p_sitekey text,p_secret text,p_account text,p_origins text[]) returns boolean
language plpgsql security definer set search_path='' as $$
declare a public.website_contact_automation; s vigil.contact_secret_refs; vid uuid; current_origins text[]; activate boolean;
begin
 perform vigil.contact_service_only();
 select * into a from public.website_contact_automation where website_id=p_website for update;
 select * into s from vigil.contact_secret_refs where website_id=p_website for update;
 if p_token is null or s.lease_token is null or s.lease_until is null or s.lease_token is distinct from p_token or s.lease_until<=now() or a.website_id is null then raise exception 'Contact setup lease lost' using errcode='40001'; end if;
 if p_account is null or p_origins is null or p_sitekey is null or p_sitekey !~ '^[a-zA-Z0-9_-]{1,64}$' or p_secret is null or char_length(p_secret) not between 10 and 256 or p_account !~ '^[a-f0-9]{32}$'
 or cardinality(p_origins) not between 1 and 10 then raise exception 'Invalid provider configuration' using errcode='22023'; end if;
 -- Vault write and provider association are one transaction. Raw secret never enters public tables.
 vid:=s.vault_secret_id;
 if vid is null then select vault.create_secret(p_secret,'vigil.turnstile.'||p_website::text,'Managed website contact verification') into vid;
 else perform vault.update_secret(vid,p_secret); end if;
 insert into public.provider_links(provider,resource_kind,external_id,entity_type,entity_id,metadata)
 values('cloudflare','turnstile_widget',p_sitekey,'website',p_website,jsonb_build_object('account_id',p_account))
 on conflict(provider,resource_kind,external_id) do update set metadata=excluded.metadata
 where provider_links.entity_type='website' and provider_links.entity_id=p_website;
 if not found then raise exception 'Widget belongs to another website' using errcode='23514';end if;
 update vigil.contact_secret_refs set vault_secret_id=vid,lease_token=null,lease_until=null,creation_started_at=null where website_id=p_website;
 current_origins:=vigil.contact_verified_origins(p_website);
 activate:=a.automatic and a.generation=p_generation and current_origins=p_origins and cardinality(current_origins)>0;
 if activate then
  update public.website_contact_settings set allowed_origins=current_origins,enabled=true where website_id=p_website;
  if not found then raise exception 'Client destination is missing' using errcode='22023';end if;
  update public.website_contact_automation set status='ready',last_error=null,updated_at=now() where website_id=p_website;
 else
  update public.website_contact_settings set enabled=false where website_id=p_website;
  update public.website_contact_automation set status=case when automatic then 'waiting_launch' else 'paused' end,updated_at=now() where website_id=p_website and generation=p_generation;
 end if;
 return activate;
end$$;
revoke all on function public.finish_contact_setup(uuid,integer,uuid,text,text,text,text[]) from public,anon,authenticated;
grant execute on function public.finish_contact_setup(uuid,integer,uuid,text,text,text,text[]) to service_role;

create function public.contact_widget_credentials(p_website uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare key text; secret_value text;
begin
 perform vigil.contact_service_only();
 select l.external_id,v.decrypted_secret into key,secret_value from public.website_contact_automation a
 join vigil.contact_secret_refs s on s.website_id=a.website_id
 join vault.decrypted_secrets v on v.id=s.vault_secret_id
 join public.provider_links l on l.entity_id=a.website_id and l.entity_type='website' and l.provider='cloudflare' and l.resource_kind='turnstile_widget'
 where a.website_id=p_website and a.automatic and a.status='ready'
 and exists(select 1 from public.website_contact_settings c where c.website_id=a.website_id and c.enabled and c.allowed_origins=vigil.contact_verified_origins(a.website_id));
 if key is null or secret_value is null then return null;end if;
 return jsonb_build_object('siteKey',key,'secret',secret_value);
end$$;
revoke all on function public.contact_widget_credentials(uuid) from public,anon,authenticated;
grant execute on function public.contact_widget_credentials(uuid) to service_role;

create function public.contact_setup_failed(p_website uuid,p_generation integer,p_token uuid,p_status text,p_error text) returns void
language plpgsql security definer set search_path='' as $$
declare a public.website_contact_automation; r vigil.contact_secret_refs;
begin
 perform vigil.contact_service_only();
 if p_status not in ('waiting_connection','queued','failed','review_required') then raise exception 'Invalid setup state' using errcode='22023';end if;
 select * into a from public.website_contact_automation where website_id=p_website for update;
 select * into r from vigil.contact_secret_refs where website_id=p_website for update;
 if r.lease_token is not null and r.lease_token is distinct from p_token then return;end if;
 update vigil.contact_secret_refs set lease_token=null,lease_until=null where website_id=p_website and lease_token=p_token;
 update public.website_contact_automation set status=p_status,last_error=left(p_error,300),updated_at=now() where website_id=p_website and generation=p_generation and automatic;
end$$;
revoke all on function public.contact_setup_failed(uuid,integer,uuid,text,text) from public,anon,authenticated;
grant execute on function public.contact_setup_failed(uuid,integer,uuid,text,text) to service_role;

-- Existing minute cron calls this only once the Cloudflare account is connected.
create function public.reconcile_contact_setup(p_limit integer default 20) returns integer
language plpgsql security definer set search_path='' as $$
declare row record; n integer:=0;
begin
 perform vigil.contact_service_only();
 for row in select w.id from public.websites w join public.organizations o on o.id=w.organization_id
 left join public.website_contact_automation a on a.website_id=w.id
 where w.status='live' and o.archived_at is null and coalesce(a.automatic,true)
 and (a.website_id is null or a.status in ('waiting_launch','waiting_connection','needs_recipient'))
 and cardinality(vigil.contact_verified_origins(w.id))>0
 order by w.id limit greatest(1,least(p_limit,50)) loop
  if vigil.ensure_contact_recipient(row.id) then perform vigil.queue_contact_setup(row.id);n:=n+1;end if;
 end loop;
 return n;
end$$;
revoke all on function public.reconcile_contact_setup(integer) from public,anon,authenticated;
grant execute on function public.reconcile_contact_setup(integer) to service_role;

create function vigil.contact_organization_changed() returns trigger language plpgsql security definer set search_path='' as $$
declare row record;
begin
 if new.archived_at is distinct from old.archived_at then
  for row in select id from public.websites where organization_id=new.id loop perform vigil.queue_contact_setup(row.id);end loop;
 end if;return new;
end$$;
create trigger contact_organization_lifecycle after update of archived_at on public.organizations
for each row execute function vigil.contact_organization_changed();

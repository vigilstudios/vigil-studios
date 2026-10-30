-- Explicit, exact-hostname production DNS release + customer-owned scoped API token.
-- No release row/token is installed and no DNS operation is performed by this migration.
create table vigil.domain_dns_releases (
 domain_id uuid primary key references public.domains(id) on delete restrict,
 organization_id uuid not null references public.organizations(id) on delete restrict,
 website_id uuid not null references public.websites(id) on delete restrict,
 hostname text not null,
 approval_reference text not null check(length(approval_reference) between 5 and 1000),
 approved_by uuid not null references auth.users(id) on delete restrict,
 valid_until timestamptz not null,
 revoked_at timestamptz,
 created_at timestamptz not null default now(),
 check(valid_until>created_at)
);
alter table vigil.domain_dns_releases enable row level security;
revoke all on vigil.domain_dns_releases from public,anon,authenticated;
grant select,insert,update on vigil.domain_dns_releases to service_role;
create trigger domain_dns_releases_immutable before update on vigil.domain_dns_releases for each row execute function vigil.domain_live_policy_immutable();
create table vigil.domain_external_dns_plans (
 id uuid primary key,
 domain_id uuid not null references public.domains(id) on delete restrict,
 organization_id uuid not null references public.organizations(id) on delete restrict,
 website_id uuid not null references public.websites(id) on delete restrict,
 requested_by uuid not null references auth.users(id) on delete restrict,
 encrypted_token text check(encrypted_token is null or octet_length(encrypted_token) between 64 and 90000),
 plan jsonb not null,
 status text not null default 'planned' check(status in ('planned','claimed','review','applied','expired','canceled')),
 claim_token uuid,
 consented_at timestamptz,
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '5 minutes'
);
create unique index domain_external_dns_active on vigil.domain_external_dns_plans(domain_id) where status in ('planned','claimed','review');
alter table vigil.domain_external_dns_plans enable row level security;
revoke all on vigil.domain_external_dns_plans from public,anon,authenticated;
grant select,insert,update on vigil.domain_external_dns_plans to service_role;

create function public.external_dns_release(p_domain_id uuid,p_actor_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare d public.domains%rowtype;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
 select * into d from public.domains where id=p_domain_id;
 if d.id is null or d.source<>'customer_owned' or d.status='released' or d.website_id is null or d.managed_registration_id is not null
 or not exists(select 1 from public.organization_members where organization_id=d.organization_id and user_id=p_actor_id and role='owner' and status='active')
 or not exists(select 1 from vigil.domain_dns_releases r where r.domain_id=d.id and r.organization_id=d.organization_id and r.website_id=d.website_id and r.hostname=d.hostname and r.revoked_at is null and r.valid_until>now()) then raise exception 'Exact DNS release and customer owner required' using errcode='42501'; end if;
 return to_jsonb(d);
end; $$;
create function vigil.safe_external_dns_plan(p jsonb) returns jsonb language sql immutable set search_path='' as $$
 select jsonb_build_object('fqdn',p->'fqdn','snapshotDigest',p->'snapshotDigest','expected',p->'expected','changes',coalesce((select jsonb_agg(jsonb_build_object('operation',c->'operation','before',case when jsonb_typeof(c->'before')='object' then (c->'before')-'id' else 'null'::jsonb end,'after',c->'after')) from jsonb_array_elements(p->'changes') c),'[]'::jsonb));
$$;
revoke all on function vigil.safe_external_dns_plan(jsonb) from public,anon,authenticated;
create function public.create_external_dns_plan(p_id uuid,p_domain_id uuid,p_actor_id uuid,p_token text,p_plan jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare d public.domains%rowtype;
begin
 select * into d from jsonb_populate_record(null::public.domains,public.external_dns_release(p_domain_id,p_actor_id));
 if p_plan->>'fqdn' is distinct from d.hostname or jsonb_typeof(p_plan->'expected') is distinct from 'array' or coalesce(p_plan->>'snapshotDigest','') !~ '^[a-f0-9]{64}$' or coalesce(p_plan->>'zoneId','') !~ '^[a-f0-9]{32}$' then raise exception 'Invalid provider DNS plan'; end if;
 perform pg_advisory_xact_lock(hashtextextended(d.id::text,0));
 update vigil.domain_external_dns_plans set status='expired',encrypted_token=null where domain_id=d.id and status='planned' and expires_at<=now();
 if exists(select 1 from vigil.domain_external_dns_plans where domain_id=d.id and status in ('planned','claimed','review')) then raise exception 'Resume the existing DNS plan before preparing another'; end if;
 insert into vigil.domain_external_dns_plans(id,domain_id,organization_id,website_id,requested_by,encrypted_token,plan) values(p_id,d.id,d.organization_id,d.website_id,p_actor_id,p_token,vigil.safe_external_dns_plan(p_plan));
 insert into public.provider_links(provider,resource_kind,external_id,entity_type,entity_id,metadata) values('other','dns_plan','cloudflare:'||(p_plan->>'zoneId')||':plan:'||p_id::text,'dns_authorization',p_id,jsonb_build_object('environment','live','account_scope','cloudflare:zone:'||(p_plan->>'zoneId'),'plan',p_plan));
 return p_id;
end; $$;
create function public.external_dns_plan(p_domain_id uuid,p_actor_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare d public.domains%rowtype; p vigil.domain_external_dns_plans%rowtype;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
 select * into d from public.domains where id=p_domain_id;
 if not exists(select 1 from public.organization_members where organization_id=d.organization_id and user_id=p_actor_id and role='owner' and status='active') then raise exception 'Customer owner required'; end if;
 select * into p from vigil.domain_external_dns_plans where domain_id=d.id and requested_by=p_actor_id order by created_at desc limit 1;
 if p.id is null then return null; end if;
 return jsonb_build_object('id',p.id,'status',p.status,'expiresAt',p.expires_at,'changes',p.plan->'changes','records',p.plan->'expected','dnsVerified',d.dns_ok,'sslVerified',d.ssl_ok,'reason',d.status_reason);
end; $$;
create function public.claim_external_dns_plan(p_id uuid,p_actor_id uuid,p_organization_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare p vigil.domain_external_dns_plans%rowtype; claimed boolean:=false;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
 select * into p from vigil.domain_external_dns_plans where id=p_id and organization_id=p_organization_id and requested_by=p_actor_id for update;
 if p.id is null then raise exception 'DNS plan unavailable'; end if;
 perform public.external_dns_release(p.domain_id,p_actor_id);
 if p.status='planned' then
  if p.expires_at<=now() then raise exception 'Review a fresh plan'; end if;
  update vigil.domain_external_dns_plans set status='claimed',claim_token=gen_random_uuid(),consented_at=now() where id=p.id returning * into p;claimed:=true;
 end if;
 return jsonb_build_object('claimed',claimed,'record',to_jsonb(p)||jsonb_build_object('plan',(select metadata->'plan' from public.provider_links where provider='other' and resource_kind='dns_plan' and entity_type='dns_authorization' and entity_id=p.id)));
end; $$;
create function public.authorize_external_dns_write(p_id uuid,p_claim uuid,p_organization_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare p vigil.domain_external_dns_plans%rowtype;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
 select * into p from vigil.domain_external_dns_plans where id=p_id and claim_token=p_claim and organization_id=p_organization_id and status='claimed' and consented_at is not null and expires_at>now();
 if p.id is null then raise exception 'Exact customer-approved DNS claim required'; end if;
 perform public.external_dns_release(p.domain_id,p.requested_by);
end; $$;
create function public.finish_external_dns_plan(p_id uuid,p_claim uuid,p_applied boolean) returns void language plpgsql security definer set search_path='' as $$
declare p vigil.domain_external_dns_plans%rowtype;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
 select * into p from vigil.domain_external_dns_plans where id=p_id and claim_token=p_claim and status in ('claimed','review','applied') for update;
 if p.id is null then raise exception 'DNS claim mismatch'; end if;
 if p.status='applied' then return; end if;
 update vigil.domain_external_dns_plans set status=case when p_applied then 'applied' else 'review' end,encrypted_token=case when p_applied then null else encrypted_token end where id=p.id;
 if p_applied then insert into public.provisioning_jobs(kind,idempotency_key,organization_id,website_id,domain_id,payload,max_attempts) values('domain.verify','domain.verify:cloudflare:'||p.id::text,p.organization_id,p.website_id,p.domain_id,'{}',200) on conflict(idempotency_key) do nothing; end if;
 if p_applied then update public.domains set verification=verification||jsonb_build_object('source','platform','required_records',p.plan->'expected','launch_ready',false,'connection_reachable',false),dns_ok=false,ssl_ok=false,status_reason='Approved website records saved. Vigil is checking DNS and HTTPS.' where id=p.domain_id and organization_id=p.organization_id and website_id=p.website_id; end if;
end; $$;
revoke all on function public.external_dns_release(uuid,uuid),public.create_external_dns_plan(uuid,uuid,uuid,text,jsonb),public.external_dns_plan(uuid,uuid),public.claim_external_dns_plan(uuid,uuid,uuid),public.authorize_external_dns_write(uuid,uuid,uuid),public.finish_external_dns_plan(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.external_dns_release(uuid,uuid),public.create_external_dns_plan(uuid,uuid,uuid,text,jsonb),public.external_dns_plan(uuid,uuid),public.claim_external_dns_plan(uuid,uuid,uuid),public.authorize_external_dns_write(uuid,uuid,uuid),public.finish_external_dns_plan(uuid,uuid,boolean) to service_role;

create function public.expire_external_dns_tokens() returns integer language plpgsql security definer set search_path='' as $$
declare changed integer;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
 update vigil.domain_external_dns_plans set encrypted_token=null,status=case when status='planned' then 'expired' else status end
 where encrypted_token is not null and ((status='planned' and expires_at<=now()) or created_at<now()-interval '24 hours');
 get diagnostics changed = row_count; return changed;
end; $$;
revoke all on function public.expire_external_dns_tokens() from public,anon,authenticated;
grant execute on function public.expire_external_dns_tokens() to service_role;

-- Stop before provider cleanup if DNS claims or immutable release evidence remain.
create or replace function public.assert_domain_retirement_allowed(p_organization_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
 if exists(select 1 from public.domain_registrations where organization_id=p_organization_id and registration_status<>'released') or exists(select 1 from public.domain_orders where organization_id=p_organization_id and (registration_state not in ('registered','failed') or payment_state in ('authorized','capture_failed','refund_pending'))) or exists(select 1 from vigil.domain_external_dns_plans where organization_id=p_organization_id and status in ('planned','claimed','review')) then raise exception 'Resolve managed domains and DNS claims before retirement' using errcode='23503'; end if;
end; $$;
create or replace function public.assert_domain_purge_allowed(p_organization_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
 perform public.assert_domain_retirement_allowed(p_organization_id);
 if exists(select 1 from public.domain_quotes where organization_id=p_organization_id) or exists(select 1 from public.domain_registrations where organization_id=p_organization_id) or exists(select 1 from public.dns_authorizations where organization_id=p_organization_id) or exists(select 1 from public.domain_events where organization_id=p_organization_id) or exists(select 1 from public.domain_support_requests where organization_id=p_organization_id) or exists(select 1 from vigil.domain_dns_releases where organization_id=p_organization_id) or exists(select 1 from vigil.domain_live_policies where organization_id=p_organization_id) or exists(select 1 from vigil.domain_external_dns_plans where organization_id=p_organization_id) then raise exception 'Domain evidence requires retention review before permanent deletion' using errcode='23503'; end if;
end; $$;

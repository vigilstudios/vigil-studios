-- Local/test rollout only. No provider call, purchase or production DNS is performed.
alter table public.domains add column managed_registration_id uuid unique references public.domain_registrations(id) on delete restrict;

create function vigil.validate_managed_domain_binding() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if coalesce(auth.role(),'') <> 'service_role' and
     (new.managed_registration_id is not null or (tg_op='UPDATE' and old.managed_registration_id is not null)) then
    raise exception 'Managed domain changes require service access' using errcode='42501';
  end if;
  if new.managed_registration_id is not null and not exists(
    select 1 from public.domain_registrations r where r.id=new.managed_registration_id
    and r.organization_id=new.organization_id and r.fqdn=new.hostname
    and r.website_id=new.website_id and new.source='purchased_via_vigil') then
    raise exception 'Managed domain binding does not match its registration' using errcode='23514';
  end if;
  return new;
end;
$$;
create trigger domains_managed_binding before insert or update on public.domains for each row execute function vigil.validate_managed_domain_binding();
revoke all on function vigil.validate_managed_domain_binding() from public,anon,authenticated;

create function public.bind_managed_domain(p_registration_id uuid,p_website_id uuid,p_actor_id uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare r public.domain_registrations%rowtype; d public.domains%rowtype; result uuid;
begin
  if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
  select * into r from public.domain_registrations where id=p_registration_id for update;
  if r.id is null or r.environment<>'test' or r.registrar<>'namecom' or r.registration_status not in ('registered','contact_hold') then raise exception 'An approved test registration is required' using errcode='42501'; end if;
  if not exists(select 1 from public.organization_members where organization_id=r.organization_id and user_id=p_actor_id and role='owner' and status='active')
     or not exists(select 1 from public.websites where id=p_website_id and organization_id=r.organization_id)
     or not exists(select 1 from public.domain_orders where registration_id=r.id and organization_id=r.organization_id and operation='register' and registration_state='registered' and payment_state='paid') then
    raise exception 'A paid registration, customer owner and matching website are required' using errcode='42501';
  end if;
  if r.website_id is not null and r.website_id<>p_website_id then raise exception 'The registration belongs to another website'; end if;
  if exists(select 1 from public.domains where hostname=r.fqdn and organization_id<>r.organization_id and dns_ok=true and status<>'released') then raise exception 'This name is already verified in another account'; end if;
  select * into d from public.domains where organization_id=r.organization_id and hostname=r.fqdn for update;
  if d.id is not null and (d.status='released' or (d.website_id is not null and d.website_id<>p_website_id) or (d.managed_registration_id is not null and d.managed_registration_id<>r.id)) then raise exception 'Review the existing domain connection before changing its website'; end if;
  if d.managed_registration_id=r.id and d.website_id=p_website_id then return d.id; end if;
  update public.domain_registrations set website_id=p_website_id where id=r.id;
  if d.id is null then
    insert into public.domains(organization_id,website_id,hostname,kind,source,managed_registration_id,status,registrar,expires_at,auto_renew)
    values(r.organization_id,p_website_id,r.fqdn,'apex','purchased_via_vigil',r.id,'pending',r.registrar,r.expires_at,r.renewal_mode='auto') returning id into result;
  else
    update public.domains set website_id=p_website_id,managed_registration_id=r.id,source='purchased_via_vigil',registrar=r.registrar,expires_at=r.expires_at where id=d.id returning id into result;
  end if;
  insert into public.domain_events(organization_id,event_type,actor_id,correlation_id) values(r.organization_id,'connection_updated',p_actor_id,result);
  return result;
end;
$$;

create table vigil.managed_domain_dns_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  registration_id uuid not null references public.domain_registrations(id) on delete restrict,
  domain_id uuid not null references public.domains(id) on delete restrict,
  website_id uuid not null references public.websites(id) on delete restrict,
  requested_by uuid not null references auth.users(id) on delete restrict,
  plan jsonb not null check (jsonb_typeof(plan)='object'),
  status text not null default 'planned' check(status in ('planned','claimed','applied','review','expired','superseded')),
  expires_at timestamptz not null default now()+interval '5 minutes',
  claim_token uuid,
  consented_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index managed_dns_single_flight on vigil.managed_domain_dns_plans(registration_id) where status in ('planned','claimed','review');
alter table vigil.managed_domain_dns_plans enable row level security;
revoke all on vigil.managed_domain_dns_plans from public,anon,authenticated;
grant select,insert,update on vigil.managed_domain_dns_plans to service_role;

create function public.create_managed_dns_plan(p_registration_id uuid,p_actor_id uuid,p_plan jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.domain_registrations%rowtype; d public.domains%rowtype; plan_id uuid; deadline timestamptz;
begin
  if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
  select * into r from public.domain_registrations where id=p_registration_id for update;
  select * into d from public.domains where managed_registration_id=r.id;
  if r.id is null or r.environment<>'test' or r.registrar<>'namecom' or d.id is null or d.website_id is distinct from r.website_id or r.registration_status<>'registered'
     or not exists(select 1 from public.organization_members where organization_id=r.organization_id and user_id=p_actor_id and role='owner' and status='active') then raise exception 'A matching test registration and customer owner are required' using errcode='42501'; end if;
  if p_plan->>'fqdn' is distinct from r.fqdn or coalesce(p_plan->>'snapshotDigest','') !~ '^[a-f0-9]{64}$'
     or jsonb_typeof(p_plan->'expected') is distinct from 'array' or jsonb_array_length(p_plan->'expected') not between 1 and 10
     or not exists(select 1 from public.provider_links where entity_type='domain_registration' and entity_id=r.id and resource_kind='registration' and metadata->>'account_scope'=p_plan->>'accountScope' and metadata->>'environment'='test' and metadata->>'registrar'='namecom') then raise exception 'DNS plan does not match the registered account'; end if;
  if exists(select 1 from vigil.managed_domain_dns_plans where registration_id=r.id and status in ('claimed','review')) then raise exception 'Reconcile the existing DNS submission before preparing another plan'; end if;
  update vigil.managed_domain_dns_plans set status=case when expires_at<=now() then 'expired' else 'superseded' end where registration_id=r.id and status='planned';
  insert into vigil.managed_domain_dns_plans(organization_id,registration_id,domain_id,website_id,requested_by,plan)
  values(r.organization_id,r.id,d.id,d.website_id,p_actor_id,p_plan) returning id,expires_at into plan_id,deadline;
  return jsonb_build_object('id',plan_id,'expiresAt',deadline);
end;
$$;

create function public.claim_managed_dns_plan(p_plan_id uuid,p_organization_id uuid,p_actor_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare p vigil.managed_domain_dns_plans%rowtype; claimed boolean:=false;
begin
  if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
  select * into p from vigil.managed_domain_dns_plans where id=p_plan_id and organization_id=p_organization_id for update;
  if p.id is null or p.requested_by<>p_actor_id or not exists(select 1 from public.organization_members where organization_id=p_organization_id and user_id=p_actor_id and role='owner' and status='active') then raise exception 'DNS approval must come from the requesting customer owner' using errcode='42501'; end if;
  if p.status='planned' and p.expires_at<=now() then update vigil.managed_domain_dns_plans set status='expired' where id=p.id; p.status:='expired'; end if;
  if p.status='planned' then
    update vigil.managed_domain_dns_plans set status='claimed',claim_token=gen_random_uuid(),consented_at=now() where id=p.id returning * into p;
    claimed:=true;
  end if;
  return jsonb_build_object('claimed',claimed,'record',to_jsonb(p));
end;
$$;

create function public.finish_managed_dns_plan(p_plan_id uuid,p_claim_token uuid,p_applied boolean) returns void language plpgsql security definer set search_path='' as $$
declare p vigil.managed_domain_dns_plans%rowtype;
begin
  if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
  select * into p from vigil.managed_domain_dns_plans where id=p_plan_id for update;
  if p.id is null or p.claim_token is distinct from p_claim_token or p.status not in ('claimed','review','applied') then raise exception 'DNS claim does not match'; end if;
  if p.status='applied' then return; end if;
  if not exists(select 1 from public.domains d join public.domain_registrations r on r.id=d.managed_registration_id where d.id=p.domain_id and r.id=p.registration_id and d.organization_id=p.organization_id and r.organization_id=p.organization_id and d.website_id=p.website_id and r.website_id=p.website_id and r.registration_status<>'released') then raise exception 'DNS binding changed during submission'; end if;
  update vigil.managed_domain_dns_plans set status=case when p_applied then 'applied' else 'review' end,finished_at=now() where id=p.id;
  if p_applied then
    update public.domains set verification=jsonb_build_object('source','platform','managed_dns',true,'required_records',p.plan->'expected','launch_ready',false,'connection_reachable',false),dns_ok=false,ssl_ok=false,status_reason='Sandbox DNS saved. Public DNS and the approved launch are still pending.' where id=p.domain_id and managed_registration_id=p.registration_id and website_id=p.website_id;
  end if;
  update public.domain_orders set connection_state=case when p_applied then 'dns_pending' else 'assisted' end,reason_code=case when p_applied then null else 'dns_unsupported' end where registration_id=p.registration_id;
  insert into public.domain_events(organization_id,event_type,reason_code,actor_id,correlation_id) values(p.organization_id,'connection_updated',case when p_applied then null else 'dns_unsupported' end,p.requested_by,p.id);
end;
$$;

-- Refresh can recover the same approval/submission without exposing private snapshots or scope.
create function public.managed_dns_plan_status(p_registration_id uuid,p_organization_id uuid,p_actor_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare p vigil.managed_domain_dns_plans%rowtype;
begin
  if coalesce(auth.role(),'')<>'service_role' or not exists(select 1 from public.domain_registrations where id=p_registration_id and organization_id=p_organization_id and environment='test' and registrar='namecom')
     or not exists(select 1 from public.organization_members where organization_id=p_organization_id and user_id=p_actor_id and role='owner' and status='active') then raise exception 'Managed registration owner access required' using errcode='42501'; end if;
  select * into p from vigil.managed_domain_dns_plans where registration_id=p_registration_id and organization_id=p_organization_id order by created_at desc,id desc limit 1;
  if p.id is null then return null; end if;
  return jsonb_build_object('id',p.id,'status',p.status,'expiresAt',p.expires_at,'records',p.plan->'expected','changes',jsonb_array_length(p.plan->'creates'),'approvable',p.requested_by=p_actor_id);
end;
$$;

revoke all on function public.bind_managed_domain(uuid,uuid,uuid),public.create_managed_dns_plan(uuid,uuid,jsonb),public.claim_managed_dns_plan(uuid,uuid,uuid),public.finish_managed_dns_plan(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.bind_managed_domain(uuid,uuid,uuid),public.create_managed_dns_plan(uuid,uuid,jsonb),public.claim_managed_dns_plan(uuid,uuid,uuid),public.finish_managed_dns_plan(uuid,uuid,boolean) to service_role;
revoke all on function public.managed_dns_plan_status(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.managed_dns_plan_status(uuid,uuid,uuid) to service_role;

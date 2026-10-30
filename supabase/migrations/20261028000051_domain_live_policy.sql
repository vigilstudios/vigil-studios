-- Prepared live runtime. No policy, credential, external operation or rollout is enabled here.
create table vigil.domain_live_policies (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete restrict,
 website_id uuid not null references public.websites(id) on delete restrict,
 fqdn text check(fqdn is null or fqdn ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.com$'),
 registrar_tax_confirmation text not null check(length(registrar_tax_confirmation) between 5 and 1000),
 registrar_scope text not null check(registrar_scope ~ '^namecom:live:[a-f0-9]{64}$'),
 stripe_account text not null check(stripe_account ~ '^acct_[A-Za-z0-9]+$'),
 max_registrar_minor bigint not null check(max_registrar_minor between 1 and 100000),
 max_client_minor bigint not null check(max_client_minor between 1 and 100000000),
 service_fee_minor bigint not null check(service_fee_minor between 0 and 100000000),
 tax_rate_bps integer not null check(tax_rate_bps between 0 and 10000),
 registrant_country text not null check(registrant_country ~ '^[A-Z]{2}$'),
 registrant_region text not null check(length(registrant_region) between 1 and 100),
 registrant_postal_code text not null check(length(registrant_postal_code) between 1 and 30),
 tax_description text not null check(length(tax_description) between 1 and 200),
 terms_version text not null check(length(terms_version) between 1 and 100),
 terms_url text not null check(terms_url ~ '^https://'),
 registration_agreement_url text not null check(registration_agreement_url ~ '^https://'),
 renewal_policy_version text not null check(length(renewal_policy_version) between 1 and 100),
 renewal_model text not null check(renewal_model='manual'),
 retention_days integer not null check(retention_days between 1 and 36500),
 dns_approved boolean not null default false,
 approval_reference text not null check(length(approval_reference) between 5 and 1000),
 approved_by uuid not null references auth.users(id) on delete restrict,
 created_at timestamptz not null default now(),
 valid_until timestamptz not null check(valid_until>created_at),
 revoked_at timestamptz,
 unique(id,organization_id,website_id)
);
alter table vigil.domain_live_policies enable row level security;
revoke all on vigil.domain_live_policies from public,anon,authenticated;
grant select,insert,update on vigil.domain_live_policies to service_role;
create function vigil.domain_live_policy_immutable() returns trigger language plpgsql set search_path='' as $$
begin
 if (to_jsonb(new)-'revoked_at') is distinct from (to_jsonb(old)-'revoked_at') or old.revoked_at is not null then raise exception 'Replace policy evidence; only revocation is permitted' using errcode='42501'; end if;
 return new;
end; $$;
create trigger domain_live_policy_immutable before update on vigil.domain_live_policies for each row execute function vigil.domain_live_policy_immutable();
revoke all on function vigil.domain_live_policy_immutable() from public,anon,authenticated;
alter table public.domain_quotes add column live_policy_id uuid references vigil.domain_live_policies(id) on delete restrict;
alter table public.domain_quotes drop constraint domain_quotes_namecom_test_only;
alter table public.domain_orders drop constraint domain_orders_namecom_test_only;
alter table public.domain_registrations drop constraint domain_registrations_namecom_test_only;
alter table public.domain_quotes add constraint domain_quotes_live_policy check(environment<>'live' or (registrar='namecom' and live_policy_id is not null));
create table vigil.domain_live_reservations (
 policy_id uuid primary key references vigil.domain_live_policies(id) on delete restrict,
 order_id uuid not null unique references public.domain_orders(id) on delete restrict,
 created_at timestamptz not null default now()
);
alter table vigil.domain_live_reservations enable row level security;
revoke all on vigil.domain_live_reservations from public,anon,authenticated;
grant select,insert on vigil.domain_live_reservations to service_role;

create function public.domain_live_policy(p_organization_id uuid,p_website_id uuid default null,p_fqdn text default null,p_policy_id uuid default null,p_active boolean default true) returns jsonb language plpgsql security definer set search_path='' as $$
declare p vigil.domain_live_policies%rowtype;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
 select * into p from vigil.domain_live_policies where organization_id=p_organization_id
 and (p_website_id is null or website_id=p_website_id) and (p_policy_id is null or id=p_policy_id)
 and (p_fqdn is null or fqdn is null or fqdn=p_fqdn)
 and (not p_active or (revoked_at is null and valid_until>now())) order by created_at desc limit 1;
 if p.id is null then raise exception 'Approved domain service policy required' using errcode='42501'; end if;
 if not exists(select 1 from public.websites where id=p.website_id and organization_id=p.organization_id) then raise exception 'Policy website scope changed'; end if;
 return to_jsonb(p);
end; $$;

create function public.create_live_domain_quote(p_organization_id uuid,p_website_id uuid,p_fqdn text,p_cost_minor bigint,p_renewal_minor bigint,p_expires_at timestamptz) returns uuid language plpgsql security definer set search_path='' as $$
declare p vigil.domain_live_policies%rowtype; result uuid; subtotal bigint; tax bigint;
begin
 select * into p from jsonb_populate_record(null::vigil.domain_live_policies,public.domain_live_policy(p_organization_id,p_website_id,p_fqdn));
 if p_fqdn !~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.com$' or p_cost_minor not between 1 and p.max_registrar_minor or p_renewal_minor<=0 or p_expires_at<=now() or p_expires_at>now()+interval '10 minutes' then raise exception 'Current supported registrar quote required'; end if;
 subtotal:=p_cost_minor+p.service_fee_minor; tax:=(subtotal*p.tax_rate_bps+9999)/10000;
 if subtotal+tax>p.max_client_minor then raise exception 'Client spending ceiling exceeded'; end if;
 insert into public.domain_quotes(organization_id,website_id,fqdn,registrar,environment,years,currency,subtotal_minor,tax_minor,total_minor,renewal_estimate_minor,premium,expires_at,live_policy_id)
 values(p_organization_id,p_website_id,p_fqdn,'namecom','live',1,'usd',subtotal,tax,subtotal+tax,p_renewal_minor,false,least(p_expires_at,p.valid_until),p.id) returning id into result;
 insert into vigil.domain_quote_costs(quote_id,registrar_amount_minor) values(result,p_cost_minor);
 insert into public.domain_events(organization_id,event_type,correlation_id) values(p_organization_id,'quoted',result);
 return result;
end; $$;

-- Revalidate consent inside SQL, including terms and renewal mode. Legacy test evidence is unchanged.
create function vigil.validate_live_domain_acceptance() returns trigger language plpgsql security definer set search_path='' as $$
declare q public.domain_quotes%rowtype; p vigil.domain_live_policies%rowtype;
begin
 if new.environment<>'live' then return new; end if;
 select * into q from public.domain_quotes where id=new.quote_id;
 select * into p from jsonb_populate_record(null::vigil.domain_live_policies,public.domain_live_policy(new.organization_id,q.website_id,new.fqdn,q.live_policy_id));
 if new.auto_renew_consent or new.terms_version<>p.terms_version or new.renewal_policy_version<>p.renewal_policy_version then raise exception 'Approve current terms and manual renewal' using errcode='42501'; end if;
 return new;
end; $$;
create trigger domain_acceptances_live before insert on public.domain_acceptances for each row execute function vigil.validate_live_domain_acceptance();
revoke all on function vigil.validate_live_domain_acceptance() from public,anon,authenticated;

create function public.authorize_live_domain_action(p_order_id uuid,p_action text,p_registrar_scope text,p_stripe_account text) returns jsonb language plpgsql security definer set search_path='' as $$
declare o public.domain_orders%rowtype; q public.domain_quotes%rowtype; p vigil.domain_live_policies%rowtype; cost bigint;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
 if coalesce(p_action,'') not in ('checkout','registration','capture','cancel','refund','expire_checkout') then raise exception 'Unsupported domain operation'; end if;
 select * into o from public.domain_orders where id=p_order_id for update;
 select * into q from public.domain_quotes where id=o.quote_id;
 if o.id is null or o.environment<>'live' or o.registrar<>'namecom' or o.operation<>'register' then raise exception 'Approved live registration order required'; end if;
 select * into p from jsonb_populate_record(null::vigil.domain_live_policies,public.domain_live_policy(o.organization_id,q.website_id,o.fqdn,q.live_policy_id,p_action in ('checkout','registration')));
 select registrar_amount_minor into cost from vigil.domain_quote_costs where quote_id=q.id;
 if p.registrar_scope is distinct from p_registrar_scope or p.stripe_account is distinct from p_stripe_account or cost>p.max_registrar_minor or q.total_minor>p.max_client_minor or q.currency<>'usd' or q.years<>1 or q.premium or (select auto_renew_consent from public.domain_acceptances where id=o.acceptance_id) then raise exception 'Domain account or spending scope mismatch' using errcode='42501'; end if;
 if p_action in ('checkout','registration') and q.expires_at<=now() then raise exception 'Review a current client quote'; end if;
 if p_action='checkout' then
  if o.registration_state not in ('awaiting_payment','ready') or o.payment_state<>'awaiting_payment' then raise exception 'Checkout is not eligible'; end if;
  insert into vigil.domain_live_reservations(policy_id,order_id) values(p.id,o.id) on conflict(policy_id) do update set order_id=excluded.order_id,created_at=now()
  where exists(select 1 from public.domain_orders prior where prior.id=domain_live_reservations.order_id and prior.registration_state='failed' and prior.payment_state in ('canceled','refunded') and not exists(select 1 from public.provider_links where entity_type='domain_order' and entity_id=prior.id and resource_kind='registrar_order'));
  if not exists(select 1 from vigil.domain_live_reservations where policy_id=p.id and order_id=o.id) then raise exception 'This policy is reserved for an existing order' using errcode='42501'; end if;
 end if;
 if p_action in ('registration','capture','cancel','refund','expire_checkout') and not exists(select 1 from public.provider_links where provider='stripe' and entity_type='domain_order' and entity_id=o.id and resource_kind='domain_checkout' and metadata->>'environment'='live' and metadata->>'account_scope'=p.stripe_account) then raise exception 'Original Stripe account mapping required'; end if;
 if p_action='registration' and (o.registration_state<>'submitting' or o.payment_state<>'authorized' or o.payment_capture_before is null or o.payment_capture_before<=now()+interval '1 minute' or not exists(select 1 from vigil.domain_live_reservations where policy_id=p.id and order_id=o.id) or exists(select 1 from public.provider_links where entity_type='domain_order' and entity_id=o.id and resource_kind='registrar_order')) then raise exception 'Authorized single-flight registration claim required'; end if;
 if p_action='capture' and p.revoked_at is not null then raise exception 'Billing approval revoked'; end if;
 if p_action='capture' and (o.registration_state<>'registered' or o.registration_id is null or o.payment_state not in ('authorized','capture_failed','paid')) then raise exception 'Confirmed registration required before capture'; end if;
 if p_action in ('cancel','refund') and o.registration_state<>'failed' then raise exception 'Definitive registration failure required for automatic payment recovery'; end if;
 if p_action='expire_checkout' and (o.registration_state<>'awaiting_payment' or o.payment_state<>'awaiting_payment' or q.expires_at>now()) then raise exception 'Unpaid expired checkout required'; end if;
 return to_jsonb(p);
end; $$;

-- Ensure clients cannot manufacture a live asset/order outside an approved policy.
create function vigil.validate_live_domain_evidence() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.environment='live' then
  if tg_table_name='domain_orders' and not exists(select 1 from public.domain_quotes q join vigil.domain_live_policies p on p.id=q.live_policy_id where q.id=new.quote_id and p.organization_id=new.organization_id and q.fqdn=new.fqdn) then raise exception 'Live order policy missing'; end if;
  if tg_table_name='domain_registrations' and not exists(select 1 from public.domain_orders o join public.domain_quotes q on q.id=o.quote_id join vigil.domain_live_policies p on p.id=q.live_policy_id where o.organization_id=new.organization_id and o.fqdn=new.fqdn and o.environment='live' and p.registrar_scope ~ '^namecom:live:' and new.registrar='namecom') then raise exception 'Live asset policy missing'; end if;
 end if;
 return new;
end; $$;
create trigger domain_orders_live before insert on public.domain_orders for each row execute function vigil.validate_live_domain_evidence();
create trigger domain_registrations_live before insert on public.domain_registrations for each row execute function vigil.validate_live_domain_evidence();
revoke all on function vigil.validate_live_domain_evidence() from public,anon,authenticated;

revoke all on function public.domain_live_policy(uuid,uuid,text,uuid,boolean),public.create_live_domain_quote(uuid,uuid,text,bigint,bigint,timestamptz),public.authorize_live_domain_action(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.domain_live_policy(uuid,uuid,text,uuid,boolean),public.create_live_domain_quote(uuid,uuid,text,bigint,bigint,timestamptz),public.authorize_live_domain_action(uuid,text,text,text) to service_role;

create function public.record_live_domain_registration(p_order_id uuid,p_domain jsonb,p_external_id text,p_account_scope text) returns uuid language plpgsql security definer set search_path='' as $$
declare o public.domain_orders%rowtype; q public.domain_quotes%rowtype; result uuid; prior_org uuid;
begin
  if coalesce(auth.role(),'') <> 'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
  select * into o from public.domain_orders where id=p_order_id for update;
  if o.id is null or o.registration_state not in ('submitting','pending','unknown','registered') or p_domain->>'fqdn'<>o.fqdn then raise exception 'Registration does not match its order'; end if;
  if o.environment<>'live' or o.registrar<>'namecom' or not exists(select 1 from public.domain_quotes q join vigil.domain_live_policies p on p.id=q.live_policy_id where q.id=o.quote_id and p.registrar_scope=p_account_scope and p.organization_id=o.organization_id) or p_external_id is distinct from p_account_scope||':domain:'||o.fqdn then raise exception 'Live registrar account mismatch' using errcode='42501'; end if;
  select * into q from public.domain_quotes where id=o.quote_id;
  select id,organization_id into result,prior_org from public.domain_registrations where environment=o.environment and fqdn=o.fqdn and registration_status<>'released' for update;
  if result is not null and (prior_org<>o.organization_id or not exists(select 1 from public.domain_registrations where id=result and registrar=o.registrar)) then raise exception 'Registration belongs to a different organization'; end if;
  if result is null then
    insert into public.domain_registrations(organization_id,website_id,fqdn,registrar,environment,registration_status,contact_verification,expires_at,renewal_mode)
    values(o.organization_id,q.website_id,o.fqdn,o.registrar,o.environment,case when p_domain->>'status'='contact_hold' then 'contact_hold' else 'registered' end,p_domain->>'contactVerification',(p_domain->>'expiresAt')::timestamptz,case when (p_domain->>'autoRenew')::boolean then 'auto' else 'manual' end) returning id into result;
  end if;
  insert into public.provider_links(provider,resource_kind,external_id,entity_type,entity_id,metadata)
  values(case when o.registrar='vercel' then 'vercel'::public.provider else 'other'::public.provider end,'registration',p_external_id,'domain_registration',result,jsonb_build_object('environment',o.environment,'account_scope',p_account_scope,'registrar',o.registrar))
  on conflict(provider,resource_kind,external_id) do nothing;
  if not exists(select 1 from public.provider_links where provider=case when o.registrar='vercel' then 'vercel'::public.provider else 'other'::public.provider end and resource_kind='registration' and external_id=p_external_id and entity_type='domain_registration' and entity_id=result and metadata->>'environment'=o.environment and metadata->>'account_scope'=p_account_scope and metadata->>'registrar'=o.registrar) then
    raise exception 'Registrar reference is already associated with another asset or account' using errcode='23505';
  end if;
  update public.domain_orders set registration_id=result,registration_state='registered',connection_state='ready_for_launch' where id=o.id;
  insert into public.domain_events(organization_id,order_id,event_type,correlation_id) values(o.organization_id,o.id,'registration_updated',o.id);
  return result;
end;
$$;

revoke all on function public.record_live_domain_registration(uuid,jsonb,text,text) from public,anon,authenticated;
grant execute on function public.record_live_domain_registration(uuid,jsonb,text,text) to service_role;
create function public.bind_live_managed_domain(p_registration_id uuid,p_website_id uuid,p_actor_id uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare r public.domain_registrations%rowtype; d public.domains%rowtype; result uuid;
begin
  if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
  select * into r from public.domain_registrations where id=p_registration_id for update;
  if r.id is null or r.environment<>'live' or r.registrar<>'namecom' or r.registration_status not in ('registered','contact_hold') then raise exception 'An approved test registration is required' using errcode='42501'; end if;
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

create function public.create_live_managed_dns_plan(p_registration_id uuid,p_actor_id uuid,p_plan jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.domain_registrations%rowtype; d public.domains%rowtype; plan_id uuid; deadline timestamptz;
begin
  if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
  select * into r from public.domain_registrations where id=p_registration_id for update;
  select * into d from public.domains where managed_registration_id=r.id;
  if r.id is null or r.environment<>'live' or r.registrar<>'namecom' or d.id is null or d.website_id is distinct from r.website_id or r.registration_status<>'registered'
     or not exists(select 1 from public.organization_members where organization_id=r.organization_id and user_id=p_actor_id and role='owner' and status='active') then raise exception 'A matching test registration and customer owner are required' using errcode='42501'; end if;
  if p_plan->>'fqdn' is distinct from r.fqdn or coalesce(p_plan->>'snapshotDigest','') !~ '^[a-f0-9]{64}$'
     or jsonb_typeof(p_plan->'expected') is distinct from 'array' or jsonb_array_length(p_plan->'expected') not between 1 and 10
     or not exists(select 1 from public.provider_links where entity_type='domain_registration' and entity_id=r.id and resource_kind='registration' and metadata->>'account_scope'=p_plan->>'accountScope' and metadata->>'environment'='live' and metadata->>'registrar'='namecom') then raise exception 'DNS plan does not match the registered account'; end if;
  if not exists(select 1 from public.domain_orders o join public.domain_quotes q on q.id=o.quote_id join vigil.domain_live_policies lp on lp.id=q.live_policy_id where o.registration_id=r.id and lp.dns_approved and lp.revoked_at is null and lp.valid_until>now() and lp.registrar_scope=p_plan->>'accountScope') then raise exception 'Approved live DNS scope required' using errcode='42501'; end if;
  if exists(select 1 from vigil.managed_domain_dns_plans where registration_id=r.id and status in ('claimed','review')) then raise exception 'Reconcile the existing DNS submission before preparing another plan'; end if;
  update vigil.managed_domain_dns_plans set status=case when expires_at<=now() then 'expired' else 'superseded' end where registration_id=r.id and status='planned';
  insert into vigil.managed_domain_dns_plans(organization_id,registration_id,domain_id,website_id,requested_by,plan)
  values(r.organization_id,r.id,d.id,d.website_id,p_actor_id,p_plan) returning id,expires_at into plan_id,deadline;
  return jsonb_build_object('id',plan_id,'expiresAt',deadline);
end;
$$;


create function public.authorize_live_domain_dns(p_registration_id uuid,p_plan jsonb,p_account_scope text) returns void language plpgsql security definer set search_path='' as $$
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
 if not exists(select 1 from vigil.managed_domain_dns_plans d join public.domain_registrations r on r.id=d.registration_id join public.domain_orders o on o.registration_id=r.id join public.domain_quotes q on q.id=o.quote_id join vigil.domain_live_policies lp on lp.id=q.live_policy_id join public.organization_members m on m.user_id=d.requested_by and m.organization_id=d.organization_id
 where r.id=p_registration_id and r.environment='live' and r.registration_status='registered' and r.contact_verification='verified' and d.plan=p_plan and d.status='claimed' and d.consented_at is not null and d.expires_at>now() and m.role='owner' and m.status='active' and lp.registrar_scope=p_account_scope and lp.dns_approved and lp.revoked_at is null and lp.valid_until>now()) then raise exception 'Exact active customer-approved DNS plan required' using errcode='42501'; end if;
end; $$;
revoke all on function public.bind_live_managed_domain(uuid,uuid,uuid),public.create_live_managed_dns_plan(uuid,uuid,jsonb),public.authorize_live_domain_dns(uuid,jsonb,text) from public,anon,authenticated;
grant execute on function public.bind_live_managed_domain(uuid,uuid,uuid),public.create_live_managed_dns_plan(uuid,uuid,jsonb),public.authorize_live_domain_dns(uuid,jsonb,text) to service_role;

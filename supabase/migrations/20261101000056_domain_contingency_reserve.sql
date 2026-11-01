-- Interim merchant release: explicit jurisdiction scope, bounded supplier tax and
-- a private accounting reserve. This migration does not enable purchases or move cash.
alter table vigil.domain_launch_profiles add column allowed_regions text[];
alter table vigil.domain_launch_profiles add column reserve_service_fee boolean not null default false;
alter table vigil.domain_launch_profiles add column supplier_tax_allowance_minor bigint not null default 0;
alter table vigil.domain_live_policies add column allowed_regions text[];
alter table vigil.domain_live_policies add column reserve_service_fee boolean not null default false;
alter table vigil.domain_live_policies add column supplier_tax_allowance_minor bigint not null default 0;
alter table vigil.domain_launch_profiles add constraint domain_launch_regions check(allowed_regions is null or (cardinality(allowed_regions) between 1 and 51 and array_position(allowed_regions,null) is null and array_to_string(allowed_regions,',') ~ '^[A-Z]{2}(,[A-Z]{2})*$'));
alter table vigil.domain_live_policies add constraint domain_policy_regions check(allowed_regions is null or (cardinality(allowed_regions) between 1 and 51 and array_position(allowed_regions,null) is null and array_to_string(allowed_regions,',') ~ '^[A-Z]{2}(,[A-Z]{2})*$'));
alter table vigil.domain_launch_profiles add constraint domain_launch_supplier_allowance check(supplier_tax_allowance_minor between 0 and service_fee_minor);
alter table vigil.domain_live_policies add constraint domain_policy_supplier_allowance check(supplier_tax_allowance_minor between 0 and service_fee_minor);
alter table vigil.domain_tax_quotes add column tax_region text check(tax_region ~ '^[A-Z]{2}$');

create or replace function public.ensure_domain_website_policy(p_organization_id uuid,p_website_id uuid,p_actor_id uuid,p_profile_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare g vigil.domain_launch_profiles%rowtype; p vigil.domain_live_policies%rowtype;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
 perform 1 from public.websites where id=p_website_id and organization_id=p_organization_id for update;
 if not found or not exists(select 1 from public.organization_members where organization_id=p_organization_id and user_id=p_actor_id and role='owner' and status='active') then raise exception 'Matching customer owner and website required' using errcode='42501'; end if;
 select * into g from vigil.domain_launch_profiles where id=p_profile_id and purchasing_enabled and revoked_at is null and valid_until>now();
 if g.id is null then raise exception 'Purchasing release is not available' using errcode='42501'; end if;
 select * into p from vigil.domain_live_policies where organization_id=p_organization_id and website_id=p_website_id and launch_profile_id=g.id and revoked_at is null and valid_until>now() order by created_at desc limit 1;
 if p.id is not null then return to_jsonb(p); end if;
 if exists(select 1 from public.domain_registrations where website_id=p_website_id and registration_status<>'released') or exists(select 1 from public.domain_orders o join public.domain_quotes q on q.id=o.quote_id where q.website_id=p_website_id and o.environment='live' and not(o.registration_state='failed' and o.payment_state in ('refunded','canceled'))) then raise exception 'An existing managed registration needs review before replacement'; end if;
 insert into vigil.domain_live_policies(organization_id,website_id,registrar_tax_confirmation,registrar_scope,stripe_account,max_registrar_minor,max_client_minor,service_fee_minor,tax_rate_bps,tax_description,registrant_country,registrant_region,registrant_postal_code,terms_version,terms_url,registration_agreement_url,renewal_policy_version,renewal_model,retention_days,dns_approved,approval_reference,approved_by,valid_until,launch_profile_id,tax_mode,tax_code,fee_tax_code,allowed_regions,reserve_service_fee,supplier_tax_allowance_minor)
 values(p_organization_id,p_website_id,g.supplier_tax_reference,g.registrar_scope,g.stripe_account,g.max_registrar_minor,g.max_client_minor,g.service_fee_minor,null,'Tax calculated from your confirmed US address.','US',null,null,g.terms_version,g.terms_url,g.registration_agreement_url,g.renewal_policy_version,'manual',g.retention_days,false,g.approval_reference,g.approved_by,g.valid_until,g.id,'stripe',g.tax_code,g.fee_tax_code,g.allowed_regions,g.reserve_service_fee,g.supplier_tax_allowance_minor) returning * into p;
 return to_jsonb(p);
end; $$;

drop function public.create_taxed_domain_quote(uuid,uuid,uuid,text,text,bigint,bigint,timestamptz,text,jsonb);
create function public.create_taxed_domain_quote(p_quote_id uuid,p_organization_id uuid,p_actor_id uuid,p_calculation_id text,p_address_digest text,p_tax_minor bigint,p_total_minor bigint,p_provider_expires_at timestamptz,p_stripe_account text,p_breakdown jsonb,p_region text default null) returns uuid language plpgsql security definer set search_path='' as $$
declare q public.domain_quotes%rowtype; p vigil.domain_live_policies%rowtype; cost bigint; result uuid; calc_link uuid;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
 select * into q from public.domain_quotes where id=p_quote_id and organization_id=p_organization_id and environment='live';
 if q.id is null or q.expires_at<=now() or not exists(select 1 from public.organization_members where organization_id=p_organization_id and user_id=p_actor_id and role='owner' and status='active') then raise exception 'Current owner quote required' using errcode='42501'; end if;
 select * into p from jsonb_populate_record(null::vigil.domain_live_policies,public.domain_live_policy(q.organization_id,q.website_id,q.fqdn,q.live_policy_id));
 if p.allowed_regions is not null and (p_region is null or not p_region=any(p.allowed_regions)) then raise exception 'Automatic purchasing is not available in this state' using errcode='42501'; end if;
 if p_tax_minor is null or p_total_minor is null or p_provider_expires_at is null or p_stripe_account is null or p.tax_mode<>'stripe' or p.stripe_account<>p_stripe_account or p_tax_minor<0 or p_total_minor<>q.subtotal_minor+p_tax_minor or p_total_minor>p.max_client_minor or p_provider_expires_at<=now() then raise exception 'Exact supported tax calculation required'; end if;
 if p_address_digest is null or p_address_digest !~ '^[a-f0-9]{64}$' or p_breakdown is null or jsonb_typeof(p_breakdown)<>'array' or octet_length(p_breakdown::text)>20000 then raise exception 'Tax address digest and breakdown required'; end if;
 if p_calculation_id is null or p_calculation_id !~ '^taxcalc_[A-Za-z0-9_]+$' then raise exception 'Valid calculation reference required'; end if;
 select t.quote_id into result from vigil.domain_tax_quotes t join public.provider_links l on l.id=t.calculation_link_id join public.domain_quotes prior on prior.id=t.quote_id where l.external_id=p_calculation_id and l.provider='stripe' and l.resource_kind='domain_tax_calculation' and t.tax_region is not distinct from p_region and t.address_digest=p_address_digest and t.total_minor=p_total_minor and prior.organization_id=q.organization_id and prior.website_id=q.website_id and prior.fqdn=q.fqdn and prior.live_policy_id=q.live_policy_id and prior.expires_at>now();
 if result is not null then return result; end if;
 select registrar_amount_minor into cost from vigil.domain_quote_costs where quote_id=q.id;
 insert into public.domain_quotes(organization_id,website_id,fqdn,registrar,environment,years,currency,subtotal_minor,tax_minor,total_minor,renewal_estimate_minor,premium,expires_at,live_policy_id,tax_status)
 values(q.organization_id,q.website_id,q.fqdn,q.registrar,q.environment,q.years,q.currency,q.subtotal_minor,p_tax_minor,p_total_minor,q.renewal_estimate_minor,q.premium,least(q.expires_at,p_provider_expires_at),q.live_policy_id,'calculated') returning id into result;
 insert into vigil.domain_quote_costs(quote_id,registrar_amount_minor) values(result,cost);
 insert into public.provider_links(provider,resource_kind,external_id,entity_type,entity_id,metadata) values('stripe','domain_tax_calculation',p_calculation_id,'domain_quote',result,jsonb_build_object('environment','live','account_scope',p_stripe_account)) returning id into calc_link;
 insert into vigil.domain_tax_quotes(quote_id,stripe_account,calculation_link_id,address_digest,tax_minor,total_minor,provider_expires_at,breakdown,tax_region) values(result,p_stripe_account,calc_link,p_address_digest,p_tax_minor,p_total_minor,p_provider_expires_at,p_breakdown,p_region);
 return result;
end; $$;
revoke all on function public.create_taxed_domain_quote(uuid,uuid,uuid,text,text,bigint,bigint,timestamptz,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.create_taxed_domain_quote(uuid,uuid,uuid,text,text,bigint,bigint,timestamptz,text,jsonb,text) to service_role;

create function vigil.require_domain_tax_region() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.environment='live' and exists(select 1 from public.domain_quotes q join vigil.domain_live_policies p on p.id=q.live_policy_id where q.id=new.quote_id and p.allowed_regions is not null and not exists(select 1 from vigil.domain_tax_quotes t where t.quote_id=q.id and t.tax_region=any(p.allowed_regions))) then raise exception 'A final address quote in an admitted jurisdiction is required' using errcode='42501'; end if;
 return new;
end; $$;
create trigger domain_acceptances_tax_region before insert on public.domain_acceptances for each row execute function vigil.require_domain_tax_region();
revoke all on function vigil.require_domain_tax_region() from public,anon,authenticated,service_role;

create or replace function public.domain_engine_order_context(p_order_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
 select jsonb_build_object('order',to_jsonb(o),'quote',to_jsonb(q),'acceptance',to_jsonb(a),'contact',to_jsonb(c),'registrar_cost_minor',cost.registrar_amount_minor,
 'maximum_registrar_total_minor',case when p.id is null then cost.registrar_amount_minor else least(p.max_registrar_minor,cost.registrar_amount_minor+p.supplier_tax_allowance_minor) end)
 into result from public.domain_orders o join public.domain_quotes q on q.id=o.quote_id join public.domain_acceptances a on a.id=o.acceptance_id
 join vigil.domain_contacts c on c.id=a.contact_id join vigil.domain_quote_costs cost on cost.quote_id=q.id left join vigil.domain_live_policies p on p.id=q.live_policy_id where o.id=p_order_id;
 return result;
end; $$;

-- No customer/provider IDs or contact data are duplicated in this ledger.
create table vigil.domain_order_financials (
 order_id uuid primary key references public.domain_orders(id) on delete restrict,
 organization_id uuid not null references public.organizations(id) on delete restrict,
 quoted_registrar_minor bigint not null check(quoted_registrar_minor>0),
 supplier_tax_minor bigint not null check(supplier_tax_minor>=0),
 supplier_total_minor bigint not null check(supplier_total_minor=quoted_registrar_minor+supplier_tax_minor),
 service_fee_minor bigint not null check(service_fee_minor>=0),
 reserve_minor bigint not null check(reserve_minor between 0 and service_fee_minor),
 reserve_state text not null check(reserve_state in ('pending','held','refunded')),
 currency text not null check(currency='usd'),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table vigil.domain_order_financials enable row level security;
revoke all on vigil.domain_order_financials from public,anon,authenticated,service_role;
grant select on vigil.domain_order_financials to service_role;

-- Preserve the original registration/ownership/account checks, inside one transaction.
alter function public.record_live_domain_registration(uuid,jsonb,text,text) set schema vigil;
alter function vigil.record_live_domain_registration(uuid,jsonb,text,text) rename to record_live_domain_registration_base;
create or replace function vigil.record_live_domain_registration_base(p_order_id uuid,p_domain jsonb,p_external_id text,p_account_scope text) returns uuid language plpgsql security definer set search_path='' as $$
declare o public.domain_orders%rowtype; q public.domain_quotes%rowtype; result uuid; prior_org uuid;
begin
  if coalesce(auth.role(),'') <> 'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
  select * into o from public.domain_orders where id=p_order_id for update;
  if o.id is null or o.registration_state not in ('submitting','pending','unknown','registered') or p_domain->>'fqdn'<>o.fqdn then raise exception 'Registration does not match its order'; end if;
  if o.environment<>'live' or o.registrar<>'namecom' or not exists(select 1 from public.domain_quotes policy_quote join vigil.domain_live_policies p on p.id=policy_quote.live_policy_id where policy_quote.id=o.quote_id and p.registrar_scope=p_account_scope and p.organization_id=o.organization_id) or p_external_id is distinct from p_account_scope||':domain:'||o.fqdn then raise exception 'Live registrar account mismatch' using errcode='42501'; end if;
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
revoke all on function vigil.record_live_domain_registration_base(uuid,jsonb,text,text) from public,anon,authenticated,service_role;
create function public.record_live_domain_registration(p_order_id uuid,p_domain jsonb,p_external_id text,p_account_scope text) returns uuid language plpgsql security definer set search_path='' as $$
declare o public.domain_orders%rowtype; p vigil.domain_live_policies%rowtype; cost bigint; base bigint; tax bigint; total bigint; result uuid;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
 select * into o from public.domain_orders where id=p_order_id for update;
 select policy.* into p from public.domain_quotes q join vigil.domain_live_policies policy on policy.id=q.live_policy_id where q.id=o.quote_id;
 select registrar_amount_minor into cost from vigil.domain_quote_costs where quote_id=o.quote_id;
 if p.reserve_service_fee and not exists(select 1 from public.provider_links l where l.entity_type='domain_order' and l.entity_id=o.id and l.resource_kind='registrar_order' and l.metadata->>'environment'='live' and l.metadata->>'account_scope'=p_account_scope and l.external_id ~ ('^'||p_account_scope||':order:[1-9][0-9]*$')) then raise exception 'Original supplier order reference required' using errcode='42501'; end if;
 if p.reserve_service_fee or p_domain ? 'supplierReceipt' then
  base:=(p_domain->'supplierReceipt'->>'baseMinor')::bigint;
  tax:=(p_domain->'supplierReceipt'->>'taxMinor')::bigint;
  total:=(p_domain->'supplierReceipt'->>'totalMinor')::bigint;
  if base is null or tax is null or total is null or base<>cost or tax<0 or tax>p.supplier_tax_allowance_minor or total<>base+tax or total>p.max_registrar_minor then raise exception 'Exact supplier receipt within approved total required' using errcode='42501'; end if;
  if exists(select 1 from vigil.domain_order_financials f where f.order_id=o.id and (f.organization_id<>o.organization_id or f.quoted_registrar_minor<>base or f.supplier_tax_minor<>tax or f.supplier_total_minor<>total or f.service_fee_minor<>p.service_fee_minor)) then raise exception 'Supplier evidence cannot be replaced' using errcode='42501'; end if;
  insert into vigil.domain_order_financials(order_id,organization_id,quoted_registrar_minor,supplier_tax_minor,supplier_total_minor,service_fee_minor,reserve_minor,reserve_state,currency)
  values(o.id,o.organization_id,base,tax,total,p.service_fee_minor,case when p.reserve_service_fee then p.service_fee_minor else 0 end,case when o.payment_state='paid' then 'held' when o.payment_state='refunded' then 'refunded' else 'pending' end,'usd') on conflict(order_id) do nothing;
 end if;
 result:=vigil.record_live_domain_registration_base(p_order_id,p_domain,p_external_id,p_account_scope);
 return result;
end; $$;
revoke all on function public.record_live_domain_registration(uuid,jsonb,text,text) from public,anon,authenticated;
grant execute on function public.record_live_domain_registration(uuid,jsonb,text,text) to service_role;

create function vigil.update_domain_fee_reserve() returns trigger language plpgsql security definer set search_path='' as $$
begin
 update vigil.domain_order_financials set reserve_state=case when new.payment_state='refunded' then 'refunded' when new.payment_state='paid' then 'held' else reserve_state end,updated_at=now() where order_id=new.id;
 return new;
end; $$;
create trigger domain_orders_fee_reserve after update of payment_state on public.domain_orders for each row when(old.payment_state is distinct from new.payment_state) execute function vigil.update_domain_fee_reserve();
revoke all on function vigil.update_domain_fee_reserve() from public,anon,authenticated,service_role;

create function public.domain_financial_summary() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
 return jsonb_build_object('currency','usd','heldMinor',coalesce((select sum(reserve_minor) from vigil.domain_order_financials where reserve_state='held'),0),'heldOrders',(select count(*) from vigil.domain_order_financials where reserve_state='held'),'supplierTaxMinor',coalesce((select sum(supplier_tax_minor) from vigil.domain_order_financials),0),
 'orders',coalesce((select jsonb_agg(x) from (select f.order_id,o.fqdn,f.supplier_total_minor,f.supplier_tax_minor,f.reserve_minor,f.reserve_state from vigil.domain_order_financials f join public.domain_orders o on o.id=f.order_id order by f.created_at desc limit 100) x),'[]'::jsonb));
end; $$;
revoke all on function public.domain_financial_summary() from public,anon,authenticated;
grant execute on function public.domain_financial_summary() to service_role;

-- Table-specific branches must not prepare fields absent from the other trigger row.
create or replace function vigil.validate_live_domain_evidence() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.environment='live' then
  if tg_table_name='domain_orders' then
   if not exists(select 1 from public.domain_quotes q join vigil.domain_live_policies p on p.id=q.live_policy_id where q.id=new.quote_id and p.organization_id=new.organization_id and q.fqdn=new.fqdn) then raise exception 'Live order policy missing'; end if;
  elsif tg_table_name='domain_registrations' then
   if not exists(select 1 from public.domain_orders o join public.domain_quotes q on q.id=o.quote_id join vigil.domain_live_policies p on p.id=q.live_policy_id where o.organization_id=new.organization_id and o.fqdn=new.fqdn and o.environment='live' and p.registrar_scope ~ '^namecom:live:' and new.registrar='namecom') then raise exception 'Live asset policy missing'; end if;
  end if;
 end if;
 return new;
end; $$;

-- Business approval is distinct from customer consent and provider tax calculation.
-- No live release, classification, government registration or spending is enabled here.
create table vigil.domain_launch_profiles (
 id uuid primary key default gen_random_uuid(),
 registrar_scope text not null check(registrar_scope ~ '^namecom:live:[a-f0-9]{64}$'),
 stripe_account text not null check(stripe_account ~ '^acct_[A-Za-z0-9]+$'),
 max_registrar_minor bigint not null check(max_registrar_minor between 1 and 100000),
 max_client_minor bigint not null check(max_client_minor between 1 and 100000000),
 service_fee_minor bigint not null check(service_fee_minor between 0 and 100000000),
 allowed_country text not null check(allowed_country='US'),
 terms_version text not null check(length(terms_version) between 1 and 100),
 terms_url text not null check(terms_url ~ '^https://'),
 registration_agreement_url text not null check(registration_agreement_url ~ '^https://'),
 renewal_policy_version text not null check(length(renewal_policy_version) between 1 and 100),
 retention_days integer not null check(retention_days between 2557 and 36500),
 purchasing_enabled boolean not null default false,
 tax_code text check(tax_code ~ '^txcd_[0-9]{8}$'),
 fee_tax_code text check(fee_tax_code ~ '^txcd_[0-9]{8}$'),
 tax_review_reference text,
 supplier_tax_reference text,
 approval_reference text not null check(length(approval_reference) between 5 and 1000),
 approved_by uuid not null references auth.users(id) on delete restrict,
 created_at timestamptz not null default now(),
 valid_until timestamptz not null check(valid_until>created_at),
 revoked_at timestamptz,
 check(not purchasing_enabled or (tax_code is not null and fee_tax_code is not null and tax_review_reference is not null and supplier_tax_reference is not null and length(tax_review_reference)>=5 and length(supplier_tax_reference)>=5))
);
alter table vigil.domain_launch_profiles enable row level security;
revoke all on vigil.domain_launch_profiles from public,anon,authenticated;
grant select,insert,update on vigil.domain_launch_profiles to service_role;
create trigger domain_launch_profiles_immutable before update on vigil.domain_launch_profiles for each row execute function vigil.domain_live_policy_immutable();

alter table vigil.domain_live_policies add column launch_profile_id uuid references vigil.domain_launch_profiles(id) on delete restrict;
alter table vigil.domain_live_policies add column tax_mode text not null default 'reviewed_rate' check(tax_mode in ('reviewed_rate','stripe'));
alter table vigil.domain_live_policies add column tax_code text check(tax_code ~ '^txcd_[0-9]{8}$');
alter table vigil.domain_live_policies add column fee_tax_code text check(fee_tax_code ~ '^txcd_[0-9]{8}$');
alter table vigil.domain_live_policies alter column tax_rate_bps drop not null;
alter table vigil.domain_live_policies alter column registrant_region drop not null;
alter table vigil.domain_live_policies alter column registrant_postal_code drop not null;
alter table vigil.domain_live_policies add constraint domain_policy_tax_mode check(
 (tax_mode='reviewed_rate' and tax_rate_bps is not null and registrant_region is not null and registrant_postal_code is not null)
 or (tax_mode='stripe' and tax_rate_bps is null and registrant_country='US' and tax_code is not null and fee_tax_code is not null and launch_profile_id is not null)
);
alter table public.domain_quotes add column tax_status text not null default 'reviewed' check(tax_status in ('reviewed','pending','calculated'));

create table vigil.domain_tax_quotes (
 quote_id uuid primary key references public.domain_quotes(id) on delete restrict,
 stripe_account text not null,
 calculation_link_id uuid not null unique references public.provider_links(id) on delete restrict,
 address_digest text not null check(address_digest ~ '^[a-f0-9]{64}$'),
 tax_minor bigint not null check(tax_minor>=0),
 breakdown jsonb not null check(jsonb_typeof(breakdown)='array' and octet_length(breakdown::text)<=20000),
 total_minor bigint not null check(total_minor>0),
 provider_expires_at timestamptz not null,
 transaction_link_id uuid unique references public.provider_links(id) on delete restrict,
 reversal_link_id uuid unique references public.provider_links(id) on delete restrict,
 first_submission_at timestamptz,
 reversal_submission_at timestamptz,
 state text not null default 'uncommitted' check(state in ('uncommitted','committed','reversed','review')),
 failure_code text,
 next_check_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 check(reversal_link_id is null or transaction_link_id is not null)
);
alter table vigil.domain_tax_quotes enable row level security;
revoke all on vigil.domain_tax_quotes from public,anon,authenticated;
grant select,insert,update on vigil.domain_tax_quotes to service_role;

create function public.domain_launch_profile() returns jsonb language plpgsql security definer set search_path='' as $$
declare p vigil.domain_launch_profiles%rowtype;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
 select * into p from vigil.domain_launch_profiles where revoked_at is null and valid_until>now() order by created_at desc limit 1;
 if p.id is null then return null; end if;
 return to_jsonb(p);
end; $$;

create function public.ensure_domain_website_policy(p_organization_id uuid,p_website_id uuid,p_actor_id uuid,p_profile_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
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
 insert into vigil.domain_live_policies(organization_id,website_id,registrar_tax_confirmation,registrar_scope,stripe_account,max_registrar_minor,max_client_minor,service_fee_minor,tax_rate_bps,tax_description,registrant_country,registrant_region,registrant_postal_code,terms_version,terms_url,registration_agreement_url,renewal_policy_version,renewal_model,retention_days,dns_approved,approval_reference,approved_by,valid_until,launch_profile_id,tax_mode,tax_code,fee_tax_code)
 values(p_organization_id,p_website_id,g.supplier_tax_reference,g.registrar_scope,g.stripe_account,g.max_registrar_minor,g.max_client_minor,g.service_fee_minor,null,'Tax calculated from your confirmed US address.','US',null,null,g.terms_version,g.terms_url,g.registration_agreement_url,g.renewal_policy_version,'manual',g.retention_days,false,g.approval_reference,g.approved_by,g.valid_until,g.id,'stripe',g.tax_code,g.fee_tax_code) returning * into p;
 return to_jsonb(p);
end; $$;

create or replace function public.create_live_domain_quote(p_organization_id uuid,p_website_id uuid,p_fqdn text,p_cost_minor bigint,p_renewal_minor bigint,p_expires_at timestamptz) returns uuid language plpgsql security definer set search_path='' as $$
declare p vigil.domain_live_policies%rowtype; result uuid; subtotal bigint; tax bigint;
begin
 select * into p from jsonb_populate_record(null::vigil.domain_live_policies,public.domain_live_policy(p_organization_id,p_website_id,p_fqdn));
 if p.registrant_country<>'US' or p_fqdn !~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.com$' or p_cost_minor not between 1 and p.max_registrar_minor or p_renewal_minor<=0 or p_expires_at<=now() or p_expires_at>now()+interval '10 minutes' then raise exception 'Current supported registrar quote required'; end if;
 subtotal:=p_cost_minor+p.service_fee_minor;
 tax:=case when p.tax_mode='stripe' then 0 else (subtotal*p.tax_rate_bps+9999)/10000 end;
 if subtotal+tax>p.max_client_minor then raise exception 'Client spending ceiling exceeded'; end if;
 insert into public.domain_quotes(organization_id,website_id,fqdn,registrar,environment,years,currency,subtotal_minor,tax_minor,total_minor,renewal_estimate_minor,premium,expires_at,live_policy_id,tax_status)
 values(p_organization_id,p_website_id,p_fqdn,'namecom','live',1,'usd',subtotal,tax,subtotal+tax,p_renewal_minor,false,least(p_expires_at,p.valid_until),p.id,case when p.tax_mode='stripe' then 'pending' else 'reviewed' end) returning id into result;
 insert into vigil.domain_quote_costs(quote_id,registrar_amount_minor) values(result,p_cost_minor);
 insert into public.domain_events(organization_id,event_type,correlation_id) values(p_organization_id,'quoted',result);
 return result;
end; $$;

create function public.create_taxed_domain_quote(p_quote_id uuid,p_organization_id uuid,p_actor_id uuid,p_calculation_id text,p_address_digest text,p_tax_minor bigint,p_total_minor bigint,p_provider_expires_at timestamptz,p_stripe_account text,p_breakdown jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare q public.domain_quotes%rowtype; p vigil.domain_live_policies%rowtype; cost bigint; result uuid; calc_link uuid;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
 select * into q from public.domain_quotes where id=p_quote_id and organization_id=p_organization_id and environment='live';
 if q.id is null or q.expires_at<=now() or not exists(select 1 from public.organization_members where organization_id=p_organization_id and user_id=p_actor_id and role='owner' and status='active') then raise exception 'Current owner quote required' using errcode='42501'; end if;
 select * into p from jsonb_populate_record(null::vigil.domain_live_policies,public.domain_live_policy(q.organization_id,q.website_id,q.fqdn,q.live_policy_id));
 if p_tax_minor is null or p_total_minor is null or p_provider_expires_at is null or p_stripe_account is null or p.tax_mode<>'stripe' or p.stripe_account<>p_stripe_account or p_tax_minor<0 or p_total_minor<>q.subtotal_minor+p_tax_minor or p_total_minor>p.max_client_minor or p_provider_expires_at<=now() then raise exception 'Exact supported tax calculation required'; end if;
 if p_address_digest is null or p_address_digest !~ '^[a-f0-9]{64}$' or p_breakdown is null or jsonb_typeof(p_breakdown)<>'array' or octet_length(p_breakdown::text)>20000 then raise exception 'Tax address digest and breakdown required'; end if;
 if p_calculation_id is null or p_calculation_id !~ '^taxcalc_[A-Za-z0-9_]+$' then raise exception 'Valid calculation reference required'; end if;
 select t.quote_id into result from vigil.domain_tax_quotes t join public.provider_links l on l.id=t.calculation_link_id join public.domain_quotes prior on prior.id=t.quote_id where l.external_id=p_calculation_id and l.provider='stripe' and l.resource_kind='domain_tax_calculation' and t.address_digest=p_address_digest and t.total_minor=p_total_minor and prior.organization_id=q.organization_id and prior.website_id=q.website_id and prior.fqdn=q.fqdn and prior.live_policy_id=q.live_policy_id and prior.expires_at>now();
 if result is not null then return result; end if;
 select registrar_amount_minor into cost from vigil.domain_quote_costs where quote_id=q.id;
 insert into public.domain_quotes(organization_id,website_id,fqdn,registrar,environment,years,currency,subtotal_minor,tax_minor,total_minor,renewal_estimate_minor,premium,expires_at,live_policy_id,tax_status)
 values(q.organization_id,q.website_id,q.fqdn,q.registrar,q.environment,q.years,q.currency,q.subtotal_minor,p_tax_minor,p_total_minor,q.renewal_estimate_minor,q.premium,least(q.expires_at,p_provider_expires_at),q.live_policy_id,'calculated') returning id into result;
 insert into vigil.domain_quote_costs(quote_id,registrar_amount_minor) values(result,cost);
 insert into public.provider_links(provider,resource_kind,external_id,entity_type,entity_id,metadata) values('stripe','domain_tax_calculation',p_calculation_id,'domain_quote',result,jsonb_build_object('environment','live','account_scope',p_stripe_account)) returning id into calc_link;
 insert into vigil.domain_tax_quotes(quote_id,stripe_account,calculation_link_id,address_digest,tax_minor,total_minor,provider_expires_at,breakdown) values(result,p_stripe_account,calc_link,p_address_digest,p_tax_minor,p_total_minor,p_provider_expires_at,p_breakdown);
 return result;
end; $$;

create function public.domain_tax_quote(p_quote_id uuid,p_organization_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
 return (select to_jsonb(t)||jsonb_build_object('calculation_id',l.external_id) from vigil.domain_tax_quotes t join public.provider_links l on l.id=t.calculation_link_id join public.domain_quotes q on q.id=t.quote_id where q.id=p_quote_id and q.organization_id=p_organization_id);
end; $$;

create function vigil.require_calculated_domain_tax() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.environment='live' and exists(select 1 from public.domain_quotes q join vigil.domain_live_policies p on p.id=q.live_policy_id where q.id=new.quote_id and p.tax_mode='stripe' and (q.tax_status<>'calculated' or not exists(select 1 from vigil.domain_tax_quotes t where t.quote_id=q.id and t.total_minor=q.total_minor and t.tax_minor=q.tax_minor and t.stripe_account=p.stripe_account))) then raise exception 'Approve a final calculated tax quote' using errcode='42501'; end if;
 return new;
end; $$;
create trigger domain_acceptances_calculated_tax before insert on public.domain_acceptances for each row execute function vigil.require_calculated_domain_tax();
revoke all on function vigil.require_calculated_domain_tax() from public,anon,authenticated;

create function public.domain_tax_reconciliation(p_limit integer default 10) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
 return coalesce((select jsonb_agg(x) from (select o.id order_id,o.organization_id,o.fqdn,o.payment_state,q.id quote_id,q.total_minor,q.tax_minor,q.currency,cl.external_id calculation_id,t.stripe_account,t.provider_expires_at,tl.external_id transaction_id,rl.external_id reversal_id,t.state,pl.external_id checkout_id from vigil.domain_tax_quotes t join public.provider_links cl on cl.id=t.calculation_link_id left join public.provider_links tl on tl.id=t.transaction_link_id left join public.provider_links rl on rl.id=t.reversal_link_id join public.domain_quotes q on q.id=t.quote_id join public.domain_orders o on o.quote_id=q.id join public.provider_links pl on pl.entity_type='domain_order' and pl.entity_id=o.id and pl.provider='stripe' and pl.resource_kind='domain_checkout' and pl.metadata->>'account_scope'=t.stripe_account and pl.metadata->>'environment'='live' where o.environment='live' and t.next_check_at<=now() and ((o.payment_state='paid' and t.state='uncommitted') or (o.payment_state='refunded' and t.state in ('uncommitted','committed'))) order by t.next_check_at limit least(20,greatest(1,p_limit))) x),'[]'::jsonb);
end; $$;

create function public.record_domain_tax_result(p_quote_id uuid,p_stripe_account text,p_transaction_id text default null,p_reversal_id text default null,p_failure_code text default null) returns void language plpgsql security definer set search_path='' as $$
declare t vigil.domain_tax_quotes%rowtype; o public.domain_orders%rowtype; tx uuid; rev uuid; previous_tx text; previous_rev text;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
 select * into t from vigil.domain_tax_quotes where quote_id=p_quote_id and stripe_account=p_stripe_account for update;
 select * into o from public.domain_orders where quote_id=p_quote_id and environment='live';
 if t.quote_id is null or o.payment_state not in ('paid','refunded') then raise exception 'Confirmed live payment evidence required'; end if;
 select external_id into previous_tx from public.provider_links where id=t.transaction_link_id;
 select external_id into previous_rev from public.provider_links where id=t.reversal_link_id;
 if (previous_tx is not null and p_transaction_id is distinct from previous_tx) or (previous_rev is not null and p_reversal_id is distinct from previous_rev) or (p_reversal_id is not null and (o.payment_state<>'refunded' or p_transaction_id is null)) then raise exception 'Tax reconciliation reference mismatch'; end if;
 if p_transaction_id is not null then
  if p_transaction_id !~ '^tax_[A-Za-z0-9_]+$' then raise exception 'Valid tax transaction required'; end if;
  insert into public.provider_links(provider,resource_kind,external_id,entity_type,entity_id,metadata) values('stripe','domain_tax_transaction',p_transaction_id,'domain_quote',p_quote_id,jsonb_build_object('environment','live','account_scope',p_stripe_account)) on conflict(provider,resource_kind,external_id) do nothing;
  select id into tx from public.provider_links where provider='stripe' and resource_kind='domain_tax_transaction' and external_id=p_transaction_id and entity_type='domain_quote' and entity_id=p_quote_id and metadata->>'account_scope'=p_stripe_account;
  if tx is null then raise exception 'Tax transaction belongs to another quote'; end if;
 end if;
 if p_reversal_id is not null then
  if p_reversal_id !~ '^tax_[A-Za-z0-9_]+$' then raise exception 'Valid tax reversal required'; end if;
  insert into public.provider_links(provider,resource_kind,external_id,entity_type,entity_id,metadata) values('stripe','domain_tax_reversal',p_reversal_id,'domain_quote',p_quote_id,jsonb_build_object('environment','live','account_scope',p_stripe_account)) on conflict(provider,resource_kind,external_id) do nothing;
  select id into rev from public.provider_links where provider='stripe' and resource_kind='domain_tax_reversal' and external_id=p_reversal_id and entity_type='domain_quote' and entity_id=p_quote_id and metadata->>'account_scope'=p_stripe_account;
  if rev is null then raise exception 'Tax reversal belongs to another quote'; end if;
 end if;
 update vigil.domain_tax_quotes set transaction_link_id=coalesce(transaction_link_id,tx),reversal_link_id=coalesce(reversal_link_id,rev),state=case when state='review' then 'review' when rev is not null then 'reversed' when tx is not null then 'committed' else state end,failure_code=p_failure_code,next_check_at=now()+interval '30 minutes' where quote_id=p_quote_id;
end; $$;

revoke all on function public.domain_launch_profile(),public.ensure_domain_website_policy(uuid,uuid,uuid,uuid),public.create_taxed_domain_quote(uuid,uuid,uuid,text,text,bigint,bigint,timestamptz,text,jsonb),public.domain_tax_quote(uuid,uuid),public.domain_tax_reconciliation(integer),public.record_domain_tax_result(uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function public.domain_launch_profile(),public.ensure_domain_website_policy(uuid,uuid,uuid,uuid),public.create_taxed_domain_quote(uuid,uuid,uuid,text,text,bigint,bigint,timestamptz,text,jsonb),public.domain_tax_quote(uuid,uuid),public.domain_tax_reconciliation(integer),public.record_domain_tax_result(uuid,text,text,text,text) to service_role;

create function public.claim_domain_tax_submission(p_quote_id uuid,p_stripe_account text,p_reversal boolean default false) returns boolean language plpgsql security definer set search_path='' as $$
declare t vigil.domain_tax_quotes%rowtype;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
 select * into t from vigil.domain_tax_quotes where quote_id=p_quote_id and stripe_account=p_stripe_account for update;
 if t.quote_id is null or t.state='review' or not exists(select 1 from public.domain_orders o where o.quote_id=t.quote_id and o.environment='live' and (o.payment_state='refunded' or (not p_reversal and o.payment_state='paid'))) or (p_reversal and t.transaction_link_id is null) then return false; end if;
 if (case when p_reversal then t.reversal_submission_at else t.first_submission_at end)<now()-interval '23 hours' then
  update vigil.domain_tax_quotes set state='review',failure_code='tax_submission_needs_review' where quote_id=p_quote_id;
  return false;
 end if;
 update vigil.domain_tax_quotes set first_submission_at=case when not p_reversal then coalesce(first_submission_at,now()) else first_submission_at end,reversal_submission_at=case when p_reversal then coalesce(reversal_submission_at,now()) else reversal_submission_at end where quote_id=p_quote_id;
 return true;
end; $$;
revoke all on function public.claim_domain_tax_submission(uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.claim_domain_tax_submission(uuid,text,boolean) to service_role;

create or replace function public.domain_live_policy(p_organization_id uuid,p_website_id uuid default null,p_fqdn text default null,p_policy_id uuid default null,p_active boolean default true) returns jsonb language plpgsql security definer set search_path='' as $$
declare p vigil.domain_live_policies%rowtype;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
 select * into p from vigil.domain_live_policies where organization_id=p_organization_id
 and (p_website_id is null or website_id=p_website_id) and (p_policy_id is null or id=p_policy_id)
 and (p_fqdn is null or fqdn is null or fqdn=p_fqdn)
 and (not p_active or (revoked_at is null and valid_until>now())) order by created_at desc limit 1;
 if p_active and p.launch_profile_id is not null and not exists(select 1 from vigil.domain_launch_profiles g where g.id=p.launch_profile_id and g.purchasing_enabled and g.revoked_at is null and g.valid_until>now()) then raise exception 'Merchant purchasing release is unavailable' using errcode='42501'; end if;
 if p.id is null then raise exception 'Approved domain service policy required' using errcode='42501'; end if;
 if not exists(select 1 from public.websites where id=p.website_id and organization_id=p.organization_id) then raise exception 'Policy website scope changed'; end if;
 return to_jsonb(p);
end; $$;


create function vigil.domain_tax_evidence_immutable() returns trigger language plpgsql set search_path='' as $$
begin
 if (to_jsonb(new)-array['transaction_link_id','reversal_link_id','first_submission_at','reversal_submission_at','state','failure_code','next_check_at']) is distinct from (to_jsonb(old)-array['transaction_link_id','reversal_link_id','first_submission_at','reversal_submission_at','state','failure_code','next_check_at'])
 or (old.transaction_link_id is not null and new.transaction_link_id is distinct from old.transaction_link_id)
 or (old.reversal_link_id is not null and new.reversal_link_id is distinct from old.reversal_link_id)
 or (old.first_submission_at is not null and new.first_submission_at is distinct from old.first_submission_at)
 or (old.reversal_submission_at is not null and new.reversal_submission_at is distinct from old.reversal_submission_at)
 then raise exception 'Tax quote evidence and submitted references are immutable' using errcode='42501'; end if;
 return new;
end; $$;
create trigger domain_tax_evidence_immutable before update on vigil.domain_tax_quotes for each row execute function vigil.domain_tax_evidence_immutable();
revoke all on function vigil.domain_tax_evidence_immutable() from public,anon,authenticated;

-- Quote references have the same environment/account requirements as orders and assets.
create or replace function vigil.domain_provider_link_scope() returns trigger language plpgsql set search_path='' as $$
begin
 if new.entity_type in ('domain_order','domain_registration','domain_contact','dns_authorization','domain_quote') and (coalesce(new.metadata->>'environment','') not in ('test','live') or coalesce(new.metadata->>'account_scope','')='') then raise exception 'Domain provider links require an account and environment scope' using errcode='22023'; end if;
 return new;
end; $$;

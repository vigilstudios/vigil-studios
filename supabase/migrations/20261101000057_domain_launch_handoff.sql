-- A customer's domain setup is complete after registrar verification. Only the
-- existing staff deployment pipeline may publish the approved website.
-- New consent is explicit and scoped; legacy purchases are never opted in.
-- Automation stays off unless a new, immutable staff-reviewed release includes
-- DNS permission. Existing profiles and website policies remain unchanged.
alter table vigil.domain_launch_profiles add column dns_approved boolean not null default false;

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
 values(p_organization_id,p_website_id,g.supplier_tax_reference,g.registrar_scope,g.stripe_account,g.max_registrar_minor,g.max_client_minor,g.service_fee_minor,null,'Tax calculated from your confirmed US address.','US',null,null,g.terms_version,g.terms_url,g.registration_agreement_url,g.renewal_policy_version,'manual',g.retention_days,g.dns_approved,g.approval_reference,g.approved_by,g.valid_until,g.id,'stripe',g.tax_code,g.fee_tax_code,g.allowed_regions,g.reserve_service_fee,g.supplier_tax_allowance_minor) returning * into p;
 return to_jsonb(p);
end; $$;


create table vigil.managed_domain_launch_authorizations (
  order_id uuid primary key references public.domain_orders(id) on delete restrict,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  website_id uuid not null references public.websites(id) on delete restrict,
  fqdn text not null,
  registrar_scope text not null check(registrar_scope ~ '^namecom:live:[a-f0-9]{64}$'),
  authorized_by uuid not null references auth.users(id) on delete restrict,
  consent_version text not null default 'website-launch-v1' check(consent_version='website-launch-v1'),
  consented_at timestamptz not null default now(),
  revoked_at timestamptz
);
create trigger managed_launch_authorization_immutable before update on vigil.managed_domain_launch_authorizations for each row execute function vigil.domain_live_policy_immutable();
alter table vigil.managed_domain_launch_authorizations enable row level security;
revoke all on vigil.managed_domain_launch_authorizations from public,anon,authenticated;
grant select,insert,update on vigil.managed_domain_launch_authorizations to service_role;

create function public.authorize_managed_domain_launch(p_order_id uuid,p_organization_id uuid,p_actor_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare o public.domain_orders; q public.domain_quotes; scope text;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501';end if;
 select * into o from public.domain_orders where id=p_order_id and organization_id=p_organization_id;
 select * into q from public.domain_quotes where id=o.quote_id and organization_id=p_organization_id;
 select registrar_scope into scope from vigil.domain_live_policies where id=q.live_policy_id and organization_id=p_organization_id and website_id=q.website_id and revoked_at is null and valid_until>now();
 if o.id is null or o.environment<>'live' or o.registrar<>'namecom' or q.website_id is null or scope is null
  or not exists(select 1 from public.websites where id=q.website_id and organization_id=p_organization_id and status not in ('archived','suspended'))
  or not exists(select 1 from public.domain_acceptances where id=o.acceptance_id and accepted_by=p_actor_id and organization_id=p_organization_id)
  or not exists(select 1 from public.organization_members where organization_id=p_organization_id and user_id=p_actor_id and role='owner' and status='active') then
  raise exception 'The purchasing customer owner must authorize this website connection' using errcode='42501';
 end if;
 insert into vigil.managed_domain_launch_authorizations(order_id,organization_id,website_id,fqdn,registrar_scope,authorized_by)
 values(o.id,p_organization_id,q.website_id,o.fqdn,scope,p_actor_id) on conflict(order_id) do nothing;
 if not exists(select 1 from vigil.managed_domain_launch_authorizations where order_id=o.id and organization_id=p_organization_id and website_id=q.website_id and fqdn=o.fqdn and registrar_scope=scope and authorized_by=p_actor_id and revoked_at is null) then
  raise exception 'Review the original connection authorization before changing it';
 end if;
end;$$;

-- No production build is authorized here. This is only eligibility to prepare
-- website-only DNS at the existing approved admin deployment boundary.
create function public.managed_domain_launch_context(p_registration_id uuid,p_organization_id uuid,p_website_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501';end if;
 select jsonb_build_object('ownerId',a.authorized_by,'orderId',o.id,'registrationId',r.id,'organizationId',r.organization_id,'websiteId',r.website_id)
 into result from vigil.managed_domain_launch_authorizations a
 join public.domain_orders o on o.id=a.order_id and o.organization_id=a.organization_id and o.fqdn=a.fqdn
 join public.domain_registrations r on r.id=o.registration_id and r.organization_id=a.organization_id and r.website_id=a.website_id and r.fqdn=a.fqdn
 join public.domain_quotes q on q.id=o.quote_id and q.website_id=a.website_id
 join vigil.domain_live_policies lp on lp.id=q.live_policy_id and lp.registrar_scope=a.registrar_scope
 join public.websites w on w.id=r.website_id and w.organization_id=r.organization_id
 where r.id=p_registration_id and r.organization_id=p_organization_id and r.website_id=p_website_id
 and r.environment='live' and r.registrar='namecom' and r.registration_status='registered' and r.contact_verification='verified' and r.expires_at>now()
 and o.environment='live' and o.operation='register' and o.registration_state='registered' and o.payment_state='paid'
 and a.revoked_at is null and lp.dns_approved and lp.revoked_at is null and lp.valid_until>now()
 and (lp.launch_profile_id is null or exists(select 1 from vigil.domain_launch_profiles g where g.id=lp.launch_profile_id and g.dns_approved and g.revoked_at is null and g.valid_until>now()))
 and w.status not in ('archived','suspended','paused')
 and exists(select 1 from public.organization_members where organization_id=r.organization_id and user_id=a.authorized_by and role='owner' and status='active')
 and exists(select 1 from public.provider_links where entity_type='domain_registration' and entity_id=r.id and resource_kind='registration' and metadata->>'environment'='live' and metadata->>'registrar'='namecom' and metadata->>'account_scope'=a.registrar_scope);
 return result;
end;$$;

-- Include incomplete opted-in purchases so preflight cannot silently publish a
-- provider URL while the customer's chosen address is waiting for verification.
create function public.managed_website_launch_requests(p_website_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501';end if;
 return (select coalesce(jsonb_agg(jsonb_build_object('registrationId',o.registration_id,'organizationId',a.organization_id)), '[]'::jsonb)
 from vigil.managed_domain_launch_authorizations a join public.domain_orders o on o.id=a.order_id and o.organization_id=a.organization_id and o.fqdn=a.fqdn
 where a.website_id=p_website_id and a.revoked_at is null and not(o.registration_state='failed' and o.payment_state in ('canceled','refunded')));
end;$$;
revoke all on function public.managed_website_launch_requests(uuid) from public,anon,authenticated;
grant execute on function public.managed_website_launch_requests(uuid) to service_role;

-- Atomic inbox + email outbox: both payment and registrar verification may
-- arrive first. Neither order of events can lose or duplicate the handoff.
create function vigil.queue_registered_domain_ready(p_registration_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare r public.domain_registrations; w public.websites; org_name text; job_id uuid; v_href text;
begin
 select * into r from public.domain_registrations where id=p_registration_id;
 if r.id is null or r.environment<>'live' or r.registrar<>'namecom' or r.registration_status<>'registered' or r.contact_verification<>'verified' or r.expires_at is null or r.expires_at<=now() then return;end if;
 select * into w from public.websites where id=r.website_id and organization_id=r.organization_id and status not in ('live','archived','suspended');
 if w.id is null or not exists(select 1 from public.domain_orders where registration_id=r.id and organization_id=r.organization_id and environment='live' and operation='register' and registration_state='registered' and payment_state='paid') then return;end if;
 select name into org_name from public.organizations where id=r.organization_id;
 insert into public.provisioning_jobs(organization_id,website_id,kind,idempotency_key,max_attempts,payload)
 values(r.organization_id,w.id,'domain.registration.ready.notify','domain.registration.ready:'||r.id::text,12,jsonb_build_object('registration_id',r.id))
 on conflict(idempotency_key) do nothing returning id into job_id;
 if job_id is null then return;end if;
 v_href:='/admin/organizations/'||r.organization_id::text||'?registration='||r.id::text;
 insert into public.notifications(user_id,organization_id,kind,title,body,href)
 select user_id,r.organization_id,'domain.ready_for_launch',org_name||': domain setup complete',r.fqdn||' is registered and the owner’s email is verified. Ready for connection when Vigil deploys the finished, approved website. This does not approve or publish the site.',v_href
 from public.staff_members
 on conflict(user_id,kind,href) where kind='domain.ready_for_launch' do nothing;
end;$$;
create function vigil.notify_registered_domain_ready() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_table_name='domain_registrations' then perform vigil.queue_registered_domain_ready(new.id);
 else perform vigil.queue_registered_domain_ready(new.registration_id);end if;
 return new;
end;$$;
create trigger registrations_notify_ready after insert or update of registration_status,contact_verification,website_id on public.domain_registrations for each row execute function vigil.notify_registered_domain_ready();
create trigger orders_notify_domain_ready after insert or update of registration_id,registration_state,payment_state on public.domain_orders for each row execute function vigil.notify_registered_domain_ready();

create function public.managed_domain_handoff_status(p_order_id uuid,p_organization_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare o public.domain_orders;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501';end if;
 select * into o from public.domain_orders where id=p_order_id and organization_id=p_organization_id and environment='live';
 if o.id is null then return null;end if;
 return jsonb_build_object('automaticConnection',exists(select 1 from vigil.managed_domain_launch_authorizations where order_id=o.id and revoked_at is null),
 'staffNotified',exists(select 1 from public.provisioning_jobs where idempotency_key='domain.registration.ready:'||o.registration_id::text and organization_id=p_organization_id));
end;$$;
revoke all on function public.authorize_managed_domain_launch(uuid,uuid,uuid),public.managed_domain_launch_context(uuid,uuid,uuid),public.managed_domain_handoff_status(uuid,uuid) from public,anon,authenticated;
grant execute on function public.authorize_managed_domain_launch(uuid,uuid,uuid),public.managed_domain_launch_context(uuid,uuid,uuid),public.managed_domain_handoff_status(uuid,uuid) to service_role;
revoke all on function vigil.queue_registered_domain_ready(uuid),vigil.notify_registered_domain_ready() from public,anon,authenticated;

-- Keep the durable permission attached to the exact DNS plan so revocation is
-- checked again at the registrar write boundary, not only during preflight.
alter table vigil.managed_domain_dns_plans add column launch_authorization_order_id uuid references vigil.managed_domain_launch_authorizations(order_id) on delete restrict;
create function public.create_managed_launch_dns_plan(p_registration_id uuid,p_actor_id uuid,p_plan jsonb,p_order_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.domain_registrations; ctx jsonb; result jsonb;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501';end if;
 select * into r from public.domain_registrations where id=p_registration_id;
 ctx:=public.managed_domain_launch_context(r.id,r.organization_id,r.website_id);
 if ctx is null or ctx->>'orderId' is distinct from p_order_id::text or ctx->>'ownerId' is distinct from p_actor_id::text then raise exception 'Active saved launch connection permission required' using errcode='42501';end if;
 result:=public.create_live_managed_dns_plan(p_registration_id,p_actor_id,p_plan);
 update vigil.managed_domain_dns_plans set launch_authorization_order_id=p_order_id where id=(result->>'id')::uuid;
 return result;
end;$$;
revoke all on function public.create_managed_launch_dns_plan(uuid,uuid,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.create_managed_launch_dns_plan(uuid,uuid,jsonb,uuid) to service_role;

create or replace function public.authorize_live_domain_dns(p_registration_id uuid,p_plan jsonb,p_account_scope text) returns void language plpgsql security definer set search_path='' as $$
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
 if not exists(select 1 from vigil.managed_domain_dns_plans d join public.domain_registrations r on r.id=d.registration_id join public.domain_orders o on o.registration_id=r.id join public.domain_quotes q on q.id=o.quote_id join vigil.domain_live_policies lp on lp.id=q.live_policy_id join public.organization_members m on m.user_id=d.requested_by and m.organization_id=d.organization_id
 where r.id=p_registration_id and r.environment='live' and r.registration_status='registered' and r.contact_verification='verified' and d.plan=p_plan and d.status='claimed' and d.consented_at is not null and d.expires_at>now() and m.role='owner' and m.status='active' and lp.registrar_scope=p_account_scope and lp.dns_approved and lp.revoked_at is null and lp.valid_until>now()
 and (d.launch_authorization_order_id is null or public.managed_domain_launch_context(r.id,r.organization_id,r.website_id)->>'orderId'=d.launch_authorization_order_id::text)) then raise exception 'Exact active customer-approved DNS plan required' using errcode='42501'; end if;
end; $$;

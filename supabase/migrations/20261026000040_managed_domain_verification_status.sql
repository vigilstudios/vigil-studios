-- Keep contact verification independent of successful DNS writes and refresh it from provider truth.
create or replace function public.finish_managed_dns_plan(p_plan_id uuid,p_claim_token uuid,p_applied boolean) returns void language plpgsql security definer set search_path='' as $$
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
  update public.domain_orders set connection_state=case when p_applied then 'dns_pending' else 'assisted' end,reason_code=case when not p_applied then 'dns_unsupported' when exists(select 1 from public.domain_registrations r where r.id=p.registration_id and r.contact_verification<>'verified') then 'contact_required' else null end where registration_id=p.registration_id;
  insert into public.domain_events(organization_id,event_type,reason_code,actor_id,correlation_id) values(p.organization_id,'connection_updated',case when p_applied then null else 'dns_unsupported' end,p.requested_by,p.id);
end;
$$;

create or replace function public.sync_managed_domain_state(p_registration_id uuid,p_snapshot jsonb,p_external_id text,p_account_scope text,p_observed_at timestamptz) returns boolean language plpgsql security definer set search_path='' as $$
declare r public.domain_registrations%rowtype; changed boolean; next_status text;
begin
  if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
  select * into r from public.domain_registrations where id=p_registration_id for update;
  if r.id is null or r.environment<>'test' or r.registrar<>'namecom' or r.registration_status='released' or p_snapshot->>'fqdn' is distinct from r.fqdn
     or not exists(select 1 from public.provider_links where entity_type='domain_registration' and entity_id=r.id and resource_kind='registration' and external_id=p_external_id and metadata->>'account_scope'=p_account_scope and metadata->>'environment'='test' and metadata->>'registrar'='namecom') then raise exception 'Registrar snapshot does not match its saved asset' using errcode='42501'; end if;
  if p_observed_at is null or p_observed_at>now()+interval '1 minute' then raise exception 'Invalid registrar observation time'; end if;
  if r.provider_checked_at is not null and r.provider_checked_at>=p_observed_at then return false; end if;
  if coalesce(p_snapshot->>'status','') not in ('registered','contact_hold','expired','transferred') or coalesce(p_snapshot->>'contactVerification','') not in ('pending','verified','failed') or p_snapshot->>'expiresAt' is null or jsonb_typeof(p_snapshot->'autoRenew') is distinct from 'boolean' then raise exception 'Incomplete registrar snapshot'; end if;
  next_status:=case when p_snapshot->>'status'='transferred' then 'transfer_pending' else p_snapshot->>'status' end;
  changed:=r.registration_status is distinct from next_status or r.contact_verification is distinct from p_snapshot->>'contactVerification' or r.expires_at is distinct from (p_snapshot->>'expiresAt')::timestamptz;
  update public.domain_registrations set registration_status=next_status,contact_verification=p_snapshot->>'contactVerification',expires_at=(p_snapshot->>'expiresAt')::timestamptz,
    provider_checked_at=p_observed_at,next_check_at=now()+interval '6 hours' where id=r.id;
  update public.domain_orders set
    reason_code=case when p_snapshot->>'contactVerification'<>'verified' then 'contact_required' else null end
    where registration_id=r.id and (reason_code is null or reason_code='contact_required');
  update public.domain_orders set connection_state='failed',reason_code=case when next_status='contact_hold' then 'contact_required' when next_status='transfer_pending' then 'transfer_required' else 'provider_failed' end where registration_id=r.id and next_status<>'registered';
  update public.domains set expires_at=(p_snapshot->>'expiresAt')::timestamptz,
    status=case when next_status='expired' then 'expired'::public.domain_status when next_status in ('contact_hold','transfer_pending') then 'error'::public.domain_status else status end,
    dns_ok=case when next_status<>'registered' then false else dns_ok end,
    ssl_ok=case when next_status<>'registered' then false else ssl_ok end,
    verification=case when next_status<>'registered' then verification||'{"launch_ready":false,"connection_reachable":false}'::jsonb else verification end,
    status_reason=case when next_status='expired' then 'The domain has expired. Review renewal with Vigil.' when next_status='contact_hold' then 'The registrar has placed a hold on this domain. Verify the registrant email or contact Vigil.' when next_status='transfer_pending' then 'Vigil is confirming the domain transfer. No further registrar changes will be submitted.' else status_reason end
    where managed_registration_id=r.id;
  if changed then
    insert into public.domain_events(organization_id,event_type,correlation_id) values(r.organization_id,'registration_updated',r.id);
  end if;
  return changed;
end;
$$;

update public.domain_orders o set reason_code='contact_required'
from public.domain_registrations r where r.id=o.registration_id and r.registrar='namecom' and r.environment='test'
and r.contact_verification<>'verified' and o.reason_code is null;

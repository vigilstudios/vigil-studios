-- Reconciliation must never silently accept a provider ID belonging to another asset/account.
create or replace function public.record_domain_registration(p_order_id uuid,p_domain jsonb,p_external_id text,p_account_scope text) returns uuid language plpgsql security definer set search_path='' as $$
declare o public.domain_orders%rowtype; q public.domain_quotes%rowtype; result uuid; prior_org uuid;
begin
  if coalesce(auth.role(),'') <> 'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
  select * into o from public.domain_orders where id=p_order_id for update;
  if o.id is null or o.registration_state not in ('submitting','pending','unknown','registered') or p_domain->>'fqdn'<>o.fqdn then raise exception 'Registration does not match its order'; end if;
  if not ((o.registrar='mock' and o.environment='test' and p_account_scope='mock:test') or (o.registrar='openprovider' and o.environment='test' and p_account_scope ~ '^openprovider:test:[0-9]+$')) then
    raise exception 'Registrar account scope is unapproved' using errcode='42501';
  end if;
  select * into q from public.domain_quotes where id=o.quote_id;
  select id,organization_id into result,prior_org from public.domain_registrations where environment=o.environment and fqdn=o.fqdn and registration_status<>'released' for update;
  if result is not null and prior_org<>o.organization_id then raise exception 'Registration belongs to a different organization'; end if;
  if result is null then
    insert into public.domain_registrations(organization_id,website_id,fqdn,registrar,environment,registration_status,contact_verification,expires_at,renewal_mode)
    values(o.organization_id,q.website_id,o.fqdn,o.registrar,o.environment,'registered',p_domain->>'contactVerification',(p_domain->>'expiresAt')::timestamptz,case when (p_domain->>'autoRenew')::boolean then 'auto' else 'manual' end) returning id into result;
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

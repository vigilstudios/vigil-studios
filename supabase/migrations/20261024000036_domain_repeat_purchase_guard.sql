-- Refuse a second registration checkout for an already managed asset, including after a mock restart.
create or replace function public.create_domain_purchase(p_quote_id uuid,p_organization_id uuid,p_actor_id uuid,p_intent_key uuid,p_contact_id uuid,p_contact_encrypted text,p_contact_digest text,p_total_minor bigint,p_currency text,p_auto_renew boolean,p_terms_version text,p_renewal_policy_version text) returns uuid
language plpgsql security definer set search_path='' as $$
declare q public.domain_quotes%rowtype; existing public.domain_orders%rowtype; acceptance uuid; result uuid;
begin
  if coalesce(auth.role(),'') <> 'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_intent_key::text,0));
  select * into existing from public.domain_orders where intent_key=p_intent_key;
  if existing.id is not null then
    if existing.organization_id<>p_organization_id or existing.quote_id<>p_quote_id or not exists(
      select 1 from public.domain_acceptances a join vigil.domain_contacts c on c.id=a.contact_id
      join public.domain_quotes dq on dq.id=a.quote_id
      where a.id=existing.acceptance_id and a.accepted_by=p_actor_id and a.auto_renew_consent=p_auto_renew
      and a.terms_version=p_terms_version and a.renewal_policy_version=p_renewal_policy_version
      and c.contact_digest=p_contact_digest and dq.total_minor=p_total_minor and dq.currency=p_currency
    ) then raise exception 'Purchase intent does not match its original approval' using errcode='22023'; end if;
    return existing.id;
  end if;
  select * into q from public.domain_quotes where id=p_quote_id and organization_id=p_organization_id for update;
  if q.id is null or q.expires_at<=now() or q.total_minor<>p_total_minor or q.currency<>p_currency then raise exception 'Review a current domain quote' using errcode='22023'; end if;
  if exists(select 1 from public.domain_registrations where environment=q.environment and fqdn=q.fqdn and registration_status<>'released') then raise exception 'This domain is already registered; manage its existing registration' using errcode='23505'; end if;
  insert into vigil.domain_contacts(id,organization_id,encrypted_payload,contact_digest) values(p_contact_id,p_organization_id,p_contact_encrypted,p_contact_digest);
  insert into public.domain_acceptances(organization_id,quote_id,fqdn,environment,contact_id,accepted_by,terms_version,renewal_policy_version,auto_renew_consent)
  values(p_organization_id,q.id,q.fqdn,q.environment,p_contact_id,p_actor_id,p_terms_version,p_renewal_policy_version,p_auto_renew) returning id into acceptance;
  insert into public.domain_orders(organization_id,quote_id,acceptance_id,fqdn,environment,registrar,intent_key)
  values(p_organization_id,q.id,acceptance,q.fqdn,q.environment,q.registrar,p_intent_key) returning id into result;
  if exists(select 1 from public.domain_registrations where environment=q.environment and fqdn=q.fqdn and registration_status<>'released') then raise exception 'This domain is already registered; manage its existing registration' using errcode='23505'; end if;
  insert into public.domain_events(organization_id,order_id,event_type,actor_id,correlation_id) values(p_organization_id,result,'consent_recorded',p_actor_id,p_intent_key);
  return result;
end;
$$;

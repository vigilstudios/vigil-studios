-- Transaction boundaries for quotes, consent and purchase single-flight.
create function public.create_domain_quote(p_organization_id uuid,p_website_id uuid default null,p_quote jsonb default null,p_registrar_cost bigint default null) returns uuid
language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
  if coalesce(auth.role(),'') <> 'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
  insert into public.domain_quotes(organization_id,website_id,fqdn,registrar,environment,years,currency,subtotal_minor,tax_minor,total_minor,renewal_estimate_minor,premium,expires_at)
  values(p_organization_id,p_website_id,p_quote->>'fqdn',p_quote->>'registrar',p_quote->>'environment',(p_quote->>'years')::integer,p_quote->>'currency',(p_quote->>'subtotal_minor')::bigint,(p_quote->>'tax_minor')::bigint,(p_quote->>'total_minor')::bigint,(p_quote->>'renewal_estimate_minor')::bigint,coalesce((p_quote->>'premium')::boolean,false),(p_quote->>'expires_at')::timestamptz) returning id into result;
  insert into vigil.domain_quote_costs(quote_id,registrar_amount_minor) values(result,p_registrar_cost);
  insert into public.domain_events(organization_id,event_type,correlation_id) values(p_organization_id,'quoted',result);
  return result;
end;
$$;

create function public.create_domain_purchase(p_quote_id uuid,p_organization_id uuid,p_actor_id uuid,p_intent_key uuid,p_contact_id uuid,p_contact_encrypted text,p_contact_digest text,p_total_minor bigint,p_currency text,p_auto_renew boolean,p_terms_version text,p_renewal_policy_version text) returns uuid
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
  insert into vigil.domain_contacts(id,organization_id,encrypted_payload,contact_digest) values(p_contact_id,p_organization_id,p_contact_encrypted,p_contact_digest);
  insert into public.domain_acceptances(organization_id,quote_id,fqdn,environment,contact_id,accepted_by,terms_version,renewal_policy_version,auto_renew_consent)
  values(p_organization_id,q.id,q.fqdn,q.environment,p_contact_id,p_actor_id,p_terms_version,p_renewal_policy_version,p_auto_renew) returning id into acceptance;
  insert into public.domain_orders(organization_id,quote_id,acceptance_id,fqdn,environment,registrar,intent_key)
  values(p_organization_id,q.id,acceptance,q.fqdn,q.environment,q.registrar,p_intent_key) returning id into result;
  insert into public.domain_events(organization_id,order_id,event_type,actor_id,correlation_id) values(p_organization_id,result,'consent_recorded',p_actor_id,p_intent_key);
  return result;
end;
$$;

create function public.claim_domain_registration(p_order_id uuid) returns boolean language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
  if coalesce(auth.role(),'') <> 'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
  update public.domain_orders o set registration_state='submitting'
  where o.id=p_order_id and o.registration_state in ('awaiting_payment','ready') and o.payment_state in ('authorized','paid')
  returning id into result;
  return result is not null;
end;
$$;

-- Releasing a domain does not erase its quote/payment/ownership evidence.
create function public.domain_engine_order_context(p_order_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
  if coalesce(auth.role(),'') <> 'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
  select jsonb_build_object('order',to_jsonb(o),'quote',to_jsonb(q),'acceptance',to_jsonb(a),'contact',to_jsonb(c),'registrar_cost_minor',cost.registrar_amount_minor)
  into result from public.domain_orders o join public.domain_quotes q on q.id=o.quote_id join public.domain_acceptances a on a.id=o.acceptance_id
  join vigil.domain_contacts c on c.id=a.contact_id join vigil.domain_quote_costs cost on cost.quote_id=q.id where o.id=p_order_id;
  return result;
end;
$$;

revoke all on function public.create_domain_quote(uuid,uuid,jsonb,bigint),public.create_domain_purchase(uuid,uuid,uuid,uuid,uuid,text,text,bigint,text,boolean,text,text),public.claim_domain_registration(uuid),public.domain_engine_order_context(uuid) from public,anon,authenticated;
grant execute on function public.create_domain_quote(uuid,uuid,jsonb,bigint),public.create_domain_purchase(uuid,uuid,uuid,uuid,uuid,text,text,bigint,text,boolean,text,text),public.claim_domain_registration(uuid),public.domain_engine_order_context(uuid) to service_role;

create function public.transition_domain_order(p_order_id uuid,p_patch jsonb) returns void language plpgsql security definer set search_path='' as $$
declare current_order public.domain_orders%rowtype;
begin
  if coalesce(auth.role(),'') <> 'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
  select * into current_order from public.domain_orders where id=p_order_id for update;
  if current_order.id is null then raise exception 'Domain order not found'; end if;
  if current_order.registration_state='registered' and p_patch ? 'registration_state' and p_patch->>'registration_state'<>'registered' then raise exception 'A registered domain requires reconciliation, never a failed purchase transition'; end if;
  if current_order.payment_state in ('paid','refunded','canceled') and p_patch->>'payment_state' in ('authorized','awaiting_payment') then return; end if;
  update public.domain_orders set
    registration_state=coalesce(p_patch->>'registration_state',registration_state),
    payment_state=coalesce(p_patch->>'payment_state',payment_state),
    connection_state=coalesce(p_patch->>'connection_state',connection_state),
    reason_code=case when p_patch ? 'reason_code' then p_patch->>'reason_code' else reason_code end
  where id=p_order_id;
  insert into public.domain_events(organization_id,order_id,event_type,reason_code,correlation_id)
  values(current_order.organization_id,p_order_id,case when p_patch ? 'payment_state' then 'payment_updated' when p_patch ? 'connection_state' then 'connection_updated' else 'registration_updated' end,p_patch->>'reason_code',p_order_id);
end;
$$;

create function public.record_domain_registration(p_order_id uuid,p_domain jsonb,p_external_id text,p_account_scope text) returns uuid language plpgsql security definer set search_path='' as $$
declare o public.domain_orders%rowtype; q public.domain_quotes%rowtype; result uuid; prior_org uuid;
begin
  if coalesce(auth.role(),'') <> 'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
  select * into o from public.domain_orders where id=p_order_id for update;
  if o.id is null or o.registration_state not in ('submitting','pending','unknown','registered') or p_domain->>'fqdn'<>o.fqdn then raise exception 'Registration does not match its order'; end if;
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
  update public.domain_orders set registration_id=result,registration_state='registered',connection_state='ready_for_launch' where id=o.id;
  insert into public.domain_events(organization_id,order_id,event_type,correlation_id) values(o.organization_id,o.id,'registration_updated',o.id);
  return result;
end;
$$;
revoke all on function public.transition_domain_order(uuid,jsonb),public.record_domain_registration(uuid,jsonb,text,text) from public,anon,authenticated;
grant execute on function public.transition_domain_order(uuid,jsonb),public.record_domain_registration(uuid,jsonb,text,text) to service_role;

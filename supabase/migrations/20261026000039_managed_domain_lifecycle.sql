-- Read-only registrar reconciliation. Does not purchase, renew, transfer or mutate DNS.
alter table public.domain_registrations add column provider_checked_at timestamptz;
alter table public.domain_registrations alter column next_check_at set default now();
update public.domain_registrations set next_check_at=now() where registrar='namecom' and next_check_at is null;

create function public.sync_managed_domain_state(p_registration_id uuid,p_snapshot jsonb,p_external_id text,p_account_scope text,p_observed_at timestamptz) returns boolean language plpgsql security definer set search_path='' as $$
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

create table vigil.managed_domain_signals (
  account_scope text not null check(account_scope ~ '^namecom:test:[a-f0-9]{64}$'),
  payload_digest text not null check(payload_digest ~ '^[a-f0-9]{64}$'),
  received_at timestamptz not null default now(),
  primary key(account_scope,payload_digest)
);
alter table vigil.managed_domain_signals enable row level security;
revoke all on vigil.managed_domain_signals from public,anon,authenticated;
grant select,insert on vigil.managed_domain_signals to service_role;

-- Receipt + durable job are atomic. Store no webhook contacts, tokens or raw payloads.
create function public.record_managed_domain_signal(p_account_scope text,p_payload_digest text) returns boolean language plpgsql security definer set search_path='' as $$
declare inserted integer;
begin
  if coalesce(auth.role(),'')<>'service_role' or p_account_scope !~ '^namecom:test:[a-f0-9]{64}$' or p_payload_digest !~ '^[a-f0-9]{64}$' then raise exception 'Approved test registrar signal required' using errcode='42501'; end if;
  insert into vigil.managed_domain_signals(account_scope,payload_digest) values(p_account_scope,p_payload_digest) on conflict do nothing;
  get diagnostics inserted = row_count;
  if inserted=0 then return false; end if;
  insert into public.provisioning_jobs(kind,idempotency_key,payload,max_attempts)
    values('domain.lifecycle.sync','domain.lifecycle:'||p_account_scope||':'||p_payload_digest,jsonb_build_object('account_scope',p_account_scope,'signal',p_payload_digest),10)
    on conflict(idempotency_key) do nothing;
  return true;
end;
$$;
revoke all on function public.sync_managed_domain_state(uuid,jsonb,text,text,timestamptz),public.record_managed_domain_signal(text,text) from public,anon,authenticated;
grant execute on function public.sync_managed_domain_state(uuid,jsonb,text,text,timestamptz),public.record_managed_domain_signal(text,text) to service_role;

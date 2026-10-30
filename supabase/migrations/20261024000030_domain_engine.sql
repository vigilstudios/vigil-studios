-- Domain Engine v2. Additive, disabled application rollout; no external operations.
-- Existing domains remain connection claims, including concurrent unverified claims.

create table public.domain_registrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  website_id uuid references public.websites(id) on delete set null,
  fqdn text not null check (fqdn = lower(fqdn) and length(fqdn) <= 253 and fqdn ~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9-]{2,63}$'),
  registrar text not null check (registrar in ('vercel','openprovider','mock')),
  environment text not null check (environment in ('test','live')),
  registration_status text not null default 'pending' check (registration_status in ('pending','registered','contact_hold','expired','transfer_pending','released')),
  contact_verification text not null default 'pending' check (contact_verification in ('pending','verified','failed')),
  renewal_mode text not null default 'undecided' check (renewal_mode in ('undecided','manual','auto')),
  expires_at timestamptz,
  next_check_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(id, organization_id, fqdn, environment),
  check (registrar <> 'mock' or environment = 'test')
);
create unique index domain_registrations_active_name on public.domain_registrations(environment,fqdn) where registration_status <> 'released';
create index domain_registrations_org on public.domain_registrations(organization_id);
create index domain_registrations_expiry on public.domain_registrations(expires_at) where registration_status <> 'released';
create trigger domain_registrations_same_org before insert or update on public.domain_registrations for each row execute function vigil.enforce_same_org_references();
create trigger domain_registrations_updated before update on public.domain_registrations for each row execute function vigil.set_updated_at();

create table public.domain_quotes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  website_id uuid references public.websites(id) on delete set null,
  fqdn text not null check (fqdn = lower(fqdn) and length(fqdn) <= 253 and fqdn ~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9-]{2,63}$'),
  registrar text not null check (registrar in ('vercel','openprovider','mock')),
  environment text not null check (environment in ('test','live')),
  years integer not null check (years between 1 and 10),
  currency text not null check (currency ~ '^[a-z]{3}$'),
  subtotal_minor bigint not null check (subtotal_minor >= 0 and subtotal_minor <= 100000000),
  tax_minor bigint not null check (tax_minor >= 0 and tax_minor <= 100000000),
  total_minor bigint not null check (total_minor = subtotal_minor + tax_minor and total_minor > 0),
  renewal_estimate_minor bigint check (renewal_estimate_minor >= 0 and renewal_estimate_minor <= 100000000),
  premium boolean not null default false,
  version integer not null default 1 check (version > 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique(id,organization_id,fqdn,environment),
  unique(id,organization_id,fqdn,environment,registrar),
  check (expires_at > created_at),
  check (registrar <> 'mock' or environment = 'test')
);
create index domain_quotes_org on public.domain_quotes(organization_id,created_at desc);
create trigger domain_quotes_same_org before insert on public.domain_quotes for each row execute function vigil.enforce_same_org_references();

-- No plaintext PII or provider token enters a public tenant table.
create table vigil.domain_contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  encrypted_payload text not null check (octet_length(encrypted_payload) between 64 and 90000),
  contact_digest text not null check (contact_digest ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  unique(id,organization_id)
);
create table vigil.domain_quote_costs (
  quote_id uuid primary key references public.domain_quotes(id) on delete restrict,
  registrar_amount_minor bigint not null check (registrar_amount_minor > 0 and registrar_amount_minor <= 100000000),
  created_at timestamptz not null default now()
);

create table public.domain_acceptances (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  quote_id uuid not null,
  fqdn text not null,
  environment text not null check (environment in ('test','live')),
  contact_id uuid not null,
  accepted_by uuid not null,
  terms_version text not null check (length(terms_version) between 1 and 100),
  renewal_policy_version text not null check (length(renewal_policy_version) between 1 and 100),
  auto_renew_consent boolean not null,
  accepted_at timestamptz not null default now(),
  foreign key(quote_id,organization_id,fqdn,environment) references public.domain_quotes(id,organization_id,fqdn,environment) on delete restrict,
  foreign key(contact_id,organization_id) references vigil.domain_contacts(id,organization_id) on delete restrict,
  unique(id,quote_id,organization_id,fqdn,environment)
);
create index domain_acceptances_org on public.domain_acceptances(organization_id);

create table public.domain_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  quote_id uuid not null,
  acceptance_id uuid not null,
  fqdn text not null,
  environment text not null check (environment in ('test','live')),
  registrar text not null check (registrar in ('vercel','openprovider','mock')),
  operation text not null default 'register' check (operation in ('register','renew')),
  intent_key uuid not null unique,
  registration_id uuid,
  registration_state text not null default 'awaiting_payment' check (registration_state in ('awaiting_payment','ready','submitting','pending','registered','failed','unknown','manual_review')),
  payment_capture_before timestamptz,
  payment_state text not null default 'awaiting_payment' check (payment_state in ('awaiting_payment','authorized','paid','capture_failed','failed','refund_pending','refunded','canceled')),
  connection_state text not null default 'not_started' check (connection_state in ('not_started','ready_for_launch','attaching','dns_pending','ssl_pending','live','assisted','failed')),
  reason_code text check (reason_code in ('quote_expired','price_changed','unavailable','payment_failed','capture_failed','refund_pending','provider_unknown','provider_failed','contact_required','attachment_failed','dns_authorization_required','dns_unsupported','ssl_pending','transfer_required')),
  next_check_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key(acceptance_id,quote_id,organization_id,fqdn,environment) references public.domain_acceptances(id,quote_id,organization_id,fqdn,environment) on delete restrict,
  foreign key(quote_id,organization_id,fqdn,environment,registrar) references public.domain_quotes(id,organization_id,fqdn,environment,registrar) on delete restrict,
  foreign key(registration_id,organization_id,fqdn,environment) references public.domain_registrations(id,organization_id,fqdn,environment) on delete restrict,
  unique(quote_id),
  unique(acceptance_id),
  unique(id,organization_id),
  check (registrar <> 'mock' or environment = 'test'),
  check (operation <> 'renew' or registration_id is not null)
);
-- Unknown outcomes retain the single-flight claim until external truth is reconciled.
create unique index domain_orders_single_flight on public.domain_orders(environment,fqdn) where registration_state not in ('registered','failed');
create index domain_orders_org on public.domain_orders(organization_id,created_at desc);
create index domain_orders_due on public.domain_orders(next_check_at) where next_check_at is not null;
create trigger domain_orders_updated before update on public.domain_orders for each row execute function vigil.set_updated_at();

create table public.dns_authorizations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  domain_id uuid not null references public.domains(id) on delete restrict,
  dns_provider text not null check (dns_provider in ('cloudflare','vercel','mock','assisted')),
  environment text not null check (environment in ('test','live')),
  template_version integer not null check (template_version > 0),
  status text not null default 'pending' check (status in ('pending','approved','verified','denied','expired','revoked','assisted')),
  requested_records jsonb not null check (jsonb_typeof(requested_records) = 'array' and jsonb_array_length(requested_records) between 1 and 10),
  requested_by uuid not null,
  consented_at timestamptz,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  unique(id,organization_id),
  check (expires_at > created_at),
  check (dns_provider <> 'mock' or environment = 'test'),
  check (status not in ('approved','verified') or consented_at is not null),
  check (status <> 'revoked' or revoked_at is not null)
);
create index dns_authorizations_org on public.dns_authorizations(organization_id);
create trigger dns_authorizations_same_org before insert or update on public.dns_authorizations for each row execute function vigil.enforce_same_org_references();
create table vigil.domain_authorization_secrets (
  authorization_id uuid primary key references public.dns_authorizations(id) on delete restrict,
  organization_id uuid not null,
  callback_nonce_digest text not null unique check (callback_nonce_digest ~ '^[a-f0-9]{64}$'),
  encrypted_token text check (octet_length(encrypted_token) between 64 and 90000),
  consumed_at timestamptz,
  foreign key(authorization_id,organization_id) references public.dns_authorizations(id,organization_id) on delete restrict
);

create table public.domain_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  order_id uuid,
  event_type text not null check (event_type in ('quoted','consent_recorded','payment_updated','registration_updated','connection_updated','manual_review','renewal_updated','transfer_requested')),
  reason_code text check (reason_code in ('quote_expired','price_changed','unavailable','payment_failed','capture_failed','refund_pending','provider_unknown','provider_failed','contact_required','attachment_failed','dns_authorization_required','dns_unsupported','ssl_pending','transfer_required')),
  actor_id uuid,
  correlation_id uuid not null,
  created_at timestamptz not null default now(),
  foreign key(order_id,organization_id) references public.domain_orders(id,organization_id) on delete restrict
);
create index domain_events_org on public.domain_events(organization_id,created_at desc);

create function vigil.domain_record_immutable() returns trigger language plpgsql set search_path = '' as $$
begin raise exception 'Domain evidence is immutable' using errcode = '42501'; end;
$$;
create trigger domain_quotes_immutable before update or delete on public.domain_quotes for each row execute function vigil.domain_record_immutable();
create trigger domain_acceptances_immutable before update or delete on public.domain_acceptances for each row execute function vigil.domain_record_immutable();
create trigger domain_contacts_immutable before update or delete on vigil.domain_contacts for each row execute function vigil.domain_record_immutable();
create trigger domain_quote_costs_immutable before update or delete on vigil.domain_quote_costs for each row execute function vigil.domain_record_immutable();
create trigger domain_events_immutable before update or delete on public.domain_events for each row execute function vigil.domain_record_immutable();

create function vigil.domain_validate_acceptance() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists(select 1 from public.organization_members m where m.organization_id=new.organization_id and m.user_id=new.accepted_by and m.role='owner' and m.status='active') then
    raise exception 'An active customer owner must approve the purchase' using errcode='42501';
  end if;
  if not exists(select 1 from public.domain_quotes q where q.id=new.quote_id and q.expires_at > new.accepted_at and new.accepted_at <= now() + interval '1 minute' and new.accepted_at >= q.created_at) then
    raise exception 'The domain quote has expired' using errcode='22023';
  end if;
  return new;
end;
$$;
create trigger domain_acceptances_validate before insert on public.domain_acceptances for each row execute function vigil.domain_validate_acceptance();

create function vigil.domain_order_identity_immutable() returns trigger language plpgsql set search_path = '' as $$
begin
  if (new.id,new.organization_id,new.quote_id,new.acceptance_id,new.fqdn,new.environment,new.registrar,new.operation,new.intent_key,new.created_at)
     is distinct from (old.id,old.organization_id,old.quote_id,old.acceptance_id,old.fqdn,old.environment,old.registrar,old.operation,old.intent_key,old.created_at) then
    raise exception 'Domain order identity is immutable' using errcode='42501';
  end if;
  return new;
end;
$$;
create trigger domain_orders_identity before update on public.domain_orders for each row execute function vigil.domain_order_identity_immutable();

-- Supabase grants are explicit: no browser-role writes, including staff sessions.
do $$ declare t text; begin
  foreach t in array array['domain_registrations','domain_quotes','domain_acceptances','domain_orders','dns_authorizations','domain_events'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from public, anon, authenticated',t);
    execute format('grant select on public.%I to authenticated',t);
    execute format('grant select, insert, update, delete on public.%I to service_role',t);
    execute format('create policy domain_engine_read on public.%I for select to authenticated using (vigil.is_staff() or vigil.has_org_role(organization_id,array[''owner'',''manager'']::public.org_role[]))',t);
  end loop;
  foreach t in array array['domain_contacts','domain_quote_costs','domain_authorization_secrets'] loop
    execute format('alter table vigil.%I enable row level security',t);
    execute format('revoke all on vigil.%I from public, anon, authenticated',t);
    execute format('grant select, insert, update, delete on vigil.%I to service_role',t);
  end loop;
end $$;
revoke all on sequence public.domain_events_id_seq from public, anon, authenticated;
grant usage, select on sequence public.domain_events_id_seq to service_role;
revoke all on function vigil.domain_record_immutable(), vigil.domain_validate_acceptance(), vigil.domain_order_identity_immutable() from public,anon,authenticated;

-- Provider references stay in provider_links, with account/environment metadata.
create function vigil.domain_provider_link_scope() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.entity_type in ('domain_order','domain_registration','domain_contact','dns_authorization') then
    if coalesce(new.metadata->>'environment','') not in ('test','live') or coalesce(new.metadata->>'account_scope','') = '' then
      raise exception 'Domain provider links require an account and environment scope' using errcode='22023';
    end if;
  end if;
  return new;
end;
$$;
create trigger domain_provider_links_scope before insert or update on public.provider_links for each row execute function vigil.domain_provider_link_scope();
revoke all on function vigil.domain_provider_link_scope() from public,anon,authenticated;

-- Fail before external cleanup: callers must use this preflight before archive/delete.
create function public.assert_domain_retirement_allowed(p_organization_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
  if coalesce(auth.role(),'') <> 'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
  if exists(select 1 from public.domain_registrations where organization_id=p_organization_id and registration_status <> 'released')
     or exists(select 1 from public.domain_orders where organization_id=p_organization_id and (registration_state not in ('registered','failed') or payment_state in ('authorized','capture_failed','refund_pending'))) then
    raise exception 'Resolve or release managed domains before retiring this customer' using errcode='23503';
  end if;
end;
$$;
revoke all on function public.assert_domain_retirement_allowed(uuid) from public,anon,authenticated;
grant execute on function public.assert_domain_retirement_allowed(uuid) to service_role;

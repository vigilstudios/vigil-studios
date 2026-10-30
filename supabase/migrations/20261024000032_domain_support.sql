-- Domain support is independent of the customer's website-change allowance.
create table public.domain_support_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  domain_id uuid references public.domains(id) on delete restrict,
  registration_id uuid references public.domain_registrations(id) on delete restrict,
  kind text not null check (kind in ('dns_assistance','release','contact_verification','renewal','payment_reconciliation')),
  status text not null default 'open' check (status in ('open','assigned','resolved')),
  requested_by uuid not null,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  check (num_nonnulls(domain_id,registration_id)=1),
  check (status <> 'resolved' or resolved_at is not null)
);
create index domain_support_org on public.domain_support_requests(organization_id);
create unique index domain_support_domain_active on public.domain_support_requests(domain_id,kind) where status <> 'resolved' and domain_id is not null;
create unique index domain_support_registration_active on public.domain_support_requests(registration_id,kind) where status <> 'resolved' and registration_id is not null;
alter table public.domain_support_requests enable row level security;
revoke all on public.domain_support_requests from public,anon,authenticated;
grant select on public.domain_support_requests to authenticated;
grant select,insert,update,delete on public.domain_support_requests to service_role;
create policy domain_support_read on public.domain_support_requests for select to authenticated using (vigil.is_staff() or vigil.has_org_role(organization_id,array['owner','manager']::public.org_role[]));
create trigger domain_support_same_org before insert or update on public.domain_support_requests for each row execute function vigil.enforce_same_org_references();

create function public.request_domain_assistance(p_domain_id uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare d public.domains%rowtype; result uuid;
begin
  select * into d from public.domains where id=p_domain_id;
  if d.id is null or not vigil.has_org_role(d.organization_id,array['owner','manager']::public.org_role[]) then raise exception 'Domain access required' using errcode='42501'; end if;
  insert into public.domain_support_requests(organization_id,domain_id,kind,requested_by) values(d.organization_id,d.id,'dns_assistance',auth.uid())
  on conflict(domain_id,kind) where status<>'resolved' and domain_id is not null do update set kind=excluded.kind returning id into result;
  return result;
end;
$$;
revoke all on function public.request_domain_assistance(uuid) from public,anon;
grant execute on function public.request_domain_assistance(uuid) to authenticated;

-- A request does not transfer the domain, expose a code or change renewal settings.
create function public.request_domain_release(p_registration_id uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare r public.domain_registrations%rowtype; result uuid;
begin
  select * into r from public.domain_registrations where id=p_registration_id;
  if r.id is null or not vigil.has_org_role(r.organization_id,array['owner']::public.org_role[]) then raise exception 'Domain owner access required' using errcode='42501'; end if;
  insert into public.domain_support_requests(organization_id,registration_id,kind,requested_by) values(r.organization_id,r.id,'release',auth.uid())
  on conflict(registration_id,kind) where status<>'resolved' and registration_id is not null do update set kind=excluded.kind returning id into result;
  insert into public.domain_events(organization_id,event_type,actor_id,correlation_id) values(r.organization_id,'transfer_requested',auth.uid(),result);
  return result;
end;
$$;
revoke all on function public.request_domain_release(uuid) from public,anon;
grant execute on function public.request_domain_release(uuid) to authenticated;

alter table public.domain_registrations add column contact_verification_deadline timestamptz;

create table public.domain_lifecycle_notices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  registration_id uuid not null references public.domain_registrations(id) on delete restrict,
  kind text not null check(kind in ('renewal_60','renewal_30','renewal_14','renewal_7','expired','contact_verification','contact_hold')),
  period_key text not null,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  unique(registration_id,kind,period_key)
);
alter table public.domain_lifecycle_notices enable row level security;
revoke all on public.domain_lifecycle_notices from public,anon,authenticated;
grant select on public.domain_lifecycle_notices to authenticated;
grant select,insert,update on public.domain_lifecycle_notices to service_role;
create policy domain_lifecycle_notice_read on public.domain_lifecycle_notices for select to authenticated using(vigil.is_staff() or vigil.has_org_role(organization_id,array['owner','manager']::public.org_role[]));

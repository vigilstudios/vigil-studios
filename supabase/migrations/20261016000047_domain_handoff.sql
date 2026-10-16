-- Advisory external-purchase intent. Deliberately cannot assert ownership or queue DNS.
create table public.domain_purchase_intents (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 website_id uuid not null unique references public.websites(id) on delete cascade,
 provider text not null default 'vercel' check(provider='vercel'),
 hostname text not null check(length(hostname)<=253 and hostname=lower(hostname) and hostname ~ '^[a-z0-9][a-z0-9.-]+\.[a-z0-9-]+$'),
 quote jsonb not null check(jsonb_typeof(quote)='object'),
 quoted_at timestamptz not null,
 handoff_at timestamptz not null default now(),
 phase text not null default 'handoff_started' check(phase in ('handoff_started','action_required','cancelled')),
 version integer not null default 1 check(version>0),
 domain_id uuid references public.domains(id),
 safe_error text check(safe_error is null or safe_error='customer_dns_authorization_unavailable'),
 created_by uuid references public.profiles(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create trigger domain_intent_org before insert or update on public.domain_purchase_intents for each row execute function vigil.enforce_same_org_references();
alter table public.domain_purchase_intents enable row level security;
revoke all on public.domain_purchase_intents from public,anon,authenticated;
grant select on public.domain_purchase_intents to authenticated;
grant all on public.domain_purchase_intents to service_role;
create policy domain_intent_read on public.domain_purchase_intents for select to authenticated using(vigil.is_staff() or vigil.is_org_member(organization_id));

-- Service-only CAS. Revalidate the real customer actor and website even for workers.
-- Lock the website first so simultaneous first selections cannot race the unique key.
create function public.save_domain_handoff(p_organization uuid,p_website uuid,p_actor uuid,p_expected_version integer,p_hostname text,p_quote jsonb,p_quoted_at timestamptz,p_action text)
returns public.domain_purchase_intents language plpgsql security definer set search_path='' as $$
declare current_intent public.domain_purchase_intents; result public.domain_purchase_intents;
begin
 if auth.role()<>'service_role' then raise exception 'Service access required' using errcode='42501';end if;
 if not exists(select 1 from public.organization_members m join public.organizations o on o.id=m.organization_id where m.organization_id=p_organization and m.user_id=p_actor and m.status='active' and m.role in ('owner','manager') and o.archived_at is null)
 then raise exception 'Customer owner or manager required' using errcode='42501';end if;
 perform 1 from public.websites w where w.id=p_website and w.organization_id=p_organization and w.status not in ('archived','suspended') for update;
 if not found then raise exception 'Website not found' using errcode='42501';end if;
 select * into current_intent from public.domain_purchase_intents where website_id=p_website for update;
 if coalesce(current_intent.version,0)<>p_expected_version then
  -- Lost response/repeated Continue is idempotent, but cannot overwrite a newer name.
  if p_action='handoff' and current_intent.hostname=p_hostname and current_intent.phase='handoff_started' then return current_intent;end if;
  raise exception 'Selection changed. Refresh and try again.' using errcode='40001';
 end if;
 if p_action='handoff' then
  if p_hostname is null or p_quote->>'hostname' is distinct from p_hostname or p_quote->>'available' is distinct from 'true' or p_quote->>'currency' is distinct from 'USD'
   or p_quoted_at is null or p_quoted_at < now()-interval '10 minutes' or p_quoted_at>now()+interval '1 minute' then raise exception 'Fresh available quote required' using errcode='22023';end if;
  if exists(select 1 from public.domains d where d.hostname=p_hostname and d.status='connected') then raise exception 'Domain already connected' using errcode='23505';end if;
  insert into public.domain_purchase_intents(organization_id,website_id,hostname,quote,quoted_at,created_by)
  values(p_organization,p_website,p_hostname,p_quote,p_quoted_at,p_actor)
  on conflict(website_id) do update set hostname=excluded.hostname,quote=excluded.quote,quoted_at=excluded.quoted_at,handoff_at=now(),phase='handoff_started',version=domain_purchase_intents.version+1,domain_id=null,safe_error=null,updated_at=now()
  returning * into result;
 elsif p_action in ('help','cancel') and current_intent.id is not null then
  update public.domain_purchase_intents set phase=case when p_action='help' then 'action_required' else 'cancelled' end,
   safe_error=case when p_action='help' then 'customer_dns_authorization_unavailable' else null end,
   version=version+1,updated_at=now() where id=current_intent.id returning * into result;
 else raise exception 'Invalid handoff action' using errcode='22023';end if;
 return result;
end$$;
revoke all on function public.save_domain_handoff(uuid,uuid,uuid,integer,text,jsonb,timestamptz,text) from public,anon,authenticated;
grant execute on function public.save_domain_handoff(uuid,uuid,uuid,integer,text,jsonb,timestamptz,text) to service_role;

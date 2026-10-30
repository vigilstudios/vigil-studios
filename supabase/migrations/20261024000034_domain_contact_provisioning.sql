-- A lost customer-create response must not create another registrant on retry.
create table vigil.domain_contact_submissions (
  contact_id uuid primary key references vigil.domain_contacts(id) on delete restrict,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  account_scope text not null check (length(account_scope) between 1 and 100),
  state text not null default 'submitting' check (state in ('submitting','linked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table vigil.domain_contact_submissions enable row level security;
revoke all on vigil.domain_contact_submissions from public,anon,authenticated;
grant all on vigil.domain_contact_submissions to service_role;

create function public.claim_domain_sandbox_contact(p_acceptance_id uuid,p_account_scope text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare a public.domain_acceptances; o public.domain_orders; claimed uuid; existing public.provider_links;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
 if p_account_scope !~ '^openprovider:test:[0-9]+$' then raise exception 'Sandbox account required' using errcode='22023'; end if;
 select * into a from public.domain_acceptances where id=p_acceptance_id;
 select * into o from public.domain_orders where acceptance_id=a.id;
 if a.id is null or o.id is null or o.environment<>'test' or o.registrar<>'openprovider' or o.registration_state not in ('submitting','pending','unknown','registered') then raise exception 'Approved sandbox order required' using errcode='42501'; end if;
 -- Serialize read/claim and completion for this approved contact, not the whole tenant.
 perform pg_advisory_xact_lock(hashtextextended(a.contact_id::text, 0));
 select * into existing from public.provider_links where provider='other' and resource_kind='contact' and entity_type='domain_contact' and entity_id=a.contact_id and metadata->>'environment'='test' and metadata->>'account_scope'=p_account_scope;
 if existing.id is not null then return jsonb_build_object('claimed',false,'contactId',a.contact_id,'handle',existing.external_id); end if;
 if o.registration_state<>'submitting' or o.payment_state not in ('authorized','paid') then return jsonb_build_object('claimed',false,'contactId',a.contact_id); end if;
 insert into vigil.domain_contact_submissions(contact_id,organization_id,account_scope) values(a.contact_id,a.organization_id,p_account_scope) on conflict do nothing returning contact_id into claimed;
 return jsonb_build_object('claimed',claimed is not null,'contactId',a.contact_id);
end;
$$;

create function public.finish_domain_sandbox_contact(p_acceptance_id uuid,p_account_scope text,p_handle text) returns void
language plpgsql security definer set search_path='' as $$
declare a public.domain_acceptances; s vigil.domain_contact_submissions;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
 if p_handle !~ '^[A-Z0-9-]{5,40}$' then raise exception 'Invalid handle' using errcode='22023'; end if;
 select * into a from public.domain_acceptances where id=p_acceptance_id;
 if a.id is null then raise exception 'Consent required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(a.contact_id::text, 0));
 select * into s from vigil.domain_contact_submissions where contact_id=a.contact_id for update;
 if s.contact_id is null or s.organization_id<>a.organization_id or s.account_scope<>p_account_scope then raise exception 'Contact claim required' using errcode='42501'; end if;
 if s.state='linked' then
   if exists(select 1 from public.provider_links where provider='other' and resource_kind='contact' and external_id=p_handle and entity_type='domain_contact' and entity_id=a.contact_id and metadata->>'account_scope'=p_account_scope and metadata->>'environment'='test') then return; end if;
   raise exception 'Contact already linked' using errcode='23505';
 end if;
 insert into public.provider_links(provider,resource_kind,external_id,entity_type,entity_id,metadata) values('other','contact',p_handle,'domain_contact',a.contact_id,jsonb_build_object('environment','test','account_scope',p_account_scope));
 update vigil.domain_contact_submissions set state='linked',updated_at=now() where contact_id=a.contact_id;
end;
$$;
revoke all on function public.claim_domain_sandbox_contact(uuid,text),public.finish_domain_sandbox_contact(uuid,text,text) from public,anon,authenticated;
grant execute on function public.claim_domain_sandbox_contact(uuid,text),public.finish_domain_sandbox_contact(uuid,text,text) to service_role;

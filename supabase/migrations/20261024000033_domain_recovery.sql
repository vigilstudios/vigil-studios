-- Keep support/reminder references tenant-bound even for service-role writes.
alter table public.domain_registrations add constraint domain_registration_tenant_unique unique(id,organization_id);
alter table public.domain_support_requests add constraint domain_support_registration_tenant_fk foreign key(registration_id,organization_id) references public.domain_registrations(id,organization_id) on delete restrict;
alter table public.domain_lifecycle_notices add constraint domain_notice_registration_tenant_fk foreign key(registration_id,organization_id) references public.domain_registrations(id,organization_id) on delete restrict;

-- A signed provider redirect is evidence of consent, never evidence that DNS/SSL is live.
create function public.consume_domain_dns_callback(p_authorization_id uuid,p_organization_id uuid,p_nonce_digest text,p_approved boolean) returns uuid
language plpgsql security definer set search_path='' as $$
declare a public.dns_authorizations%rowtype; secret vigil.domain_authorization_secrets%rowtype;
begin
  if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
  select * into a from public.dns_authorizations where id=p_authorization_id and organization_id=p_organization_id for update;
  if a.id is null or a.status<>'pending' or a.expires_at<=now() then raise exception 'DNS authorization expired or already handled' using errcode='22023'; end if;
  select * into secret from vigil.domain_authorization_secrets where authorization_id=a.id and organization_id=a.organization_id for update;
  if secret.authorization_id is null or secret.consumed_at is not null or secret.callback_nonce_digest<>p_nonce_digest then raise exception 'Invalid DNS callback' using errcode='22023'; end if;
  update vigil.domain_authorization_secrets set consumed_at=now() where authorization_id=a.id;
  update public.dns_authorizations set status=case when p_approved then 'approved' else 'denied' end,consented_at=case when p_approved then now() else null end where id=a.id;
  insert into public.domain_events(organization_id,event_type,reason_code,correlation_id) values(a.organization_id,'connection_updated',case when p_approved then null else 'dns_authorization_required' end,a.id);
  return a.domain_id;
end;
$$;
revoke all on function public.consume_domain_dns_callback(uuid,uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.consume_domain_dns_callback(uuid,uuid,text,boolean) to service_role;

-- Atomic reminder + in-dashboard notifications: concurrent runners cannot notify twice.
-- No external email or automatic payment is sent by this function.
create function public.record_domain_lifecycle_notice(p_registration_id uuid,p_kind text,p_period_key text) returns boolean
language plpgsql security definer set search_path='' as $$
declare r public.domain_registrations%rowtype; notice_id uuid;
begin
  if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
  select * into r from public.domain_registrations where id=p_registration_id and registration_status<>'released' for update;
  if r.id is null then return false; end if;
  insert into public.domain_lifecycle_notices(organization_id,registration_id,kind,period_key,delivered_at) values(r.organization_id,r.id,p_kind,p_period_key,now())
  on conflict(registration_id,kind,period_key) do nothing returning id into notice_id;
  if notice_id is null then return false; end if;
  insert into public.notifications(user_id,organization_id,kind,title,body,href)
  select m.user_id,r.organization_id,'domain_attention','Your domain needs attention',r.fqdn||': '||replace(p_kind,'_',' ')||'. Open Domain & Hosting to review the next step.','/dashboard/domain'
  from public.organization_members m where m.organization_id=r.organization_id and m.role in ('owner','manager') and m.status='active';
  insert into public.domain_support_requests(organization_id,registration_id,kind,requested_by)
  select r.organization_id,r.id,case when p_kind in ('contact_verification','contact_hold') then 'contact_verification' else 'renewal' end,m.user_id
  from public.organization_members m where m.organization_id=r.organization_id and m.role='owner' and m.status='active' order by m.user_id limit 1
  on conflict(registration_id,kind) where status<>'resolved' and registration_id is not null do nothing;
  return true;
end;
$$;
revoke all on function public.record_domain_lifecycle_notice(uuid,text,text) from public,anon,authenticated;
grant execute on function public.record_domain_lifecycle_notice(uuid,text,text) to service_role;

-- Evidence FKs intentionally retain financial/legal history. Check BEFORE deleting providers.
create function public.assert_domain_purge_allowed(p_organization_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
  perform public.assert_domain_retirement_allowed(p_organization_id);
  if exists(select 1 from public.domain_quotes where organization_id=p_organization_id)
    or exists(select 1 from public.domain_registrations where organization_id=p_organization_id)
    or exists(select 1 from public.dns_authorizations where organization_id=p_organization_id)
    or exists(select 1 from public.domain_events where organization_id=p_organization_id)
    or exists(select 1 from public.domain_support_requests where organization_id=p_organization_id) then
    raise exception 'Domain evidence requires an approved retention/redaction process before permanent deletion' using errcode='23503';
  end if;
end;
$$;
revoke all on function public.assert_domain_purge_allowed(uuid) from public,anon,authenticated;
grant execute on function public.assert_domain_purge_allowed(uuid) to service_role;

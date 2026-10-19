-- Administrator management of advisory selections and unpublished manual setup.
-- Registrar access, ownership proof and production activation are unchanged.
create or replace function public.save_domain_handoff(p_organization uuid,p_website uuid,p_actor uuid,p_expected_version integer,p_hostname text,p_quote jsonb,p_quoted_at timestamptz,p_action text)
returns public.domain_purchase_intents language plpgsql security definer set search_path='' as $$
declare current_intent public.domain_purchase_intents; result public.domain_purchase_intents; v_admin boolean;
begin
 if auth.role()<>'service_role' then raise exception 'Service access required' using errcode='42501';end if;
 v_admin := exists(select 1 from public.staff_members where user_id=p_actor and role='admin');
 if not v_admin and not exists(select 1 from public.organization_members m join public.organizations o on o.id=m.organization_id where m.organization_id=p_organization and m.user_id=p_actor and m.status='active' and m.role in ('owner','manager') and o.archived_at is null)
 then raise exception 'Customer manager or Vigil administrator required' using errcode='42501';end if;
 if not exists(select 1 from public.organizations where id=p_organization and archived_at is null) then raise exception 'Organization not available' using errcode='42501';end if;
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
 if v_admin then
  perform public.log_audit_event('domain.choice_managed','website',p_website,p_organization,
   jsonb_build_object('hostname',current_intent.hostname,'version',current_intent.version),
   jsonb_build_object('hostname',result.hostname,'version',result.version,'phase',result.phase),
   jsonb_build_object('operation',p_action,'provider_authorization',false),p_actor);
 end if;
 return result;
end$$;
revoke all on function public.save_domain_handoff(uuid,uuid,uuid,integer,text,jsonb,timestamptz,text) from public,anon,authenticated;
grant execute on function public.save_domain_handoff(uuid,uuid,uuid,integer,text,jsonb,timestamptz,text) to service_role;

-- Released drafts remain in history; choosing the same name starts a new proof
-- and new job/notification identities instead of reviving an old verification.
alter table public.domains drop constraint domains_org_hostname_key;
create unique index domains_org_hostname_active_idx on public.domains(organization_id,hostname) where status <> 'released';

create function public.reset_domain_setup(p_organization uuid,p_website uuid,p_actor uuid,p_expected_version integer,p_domains jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare v_site public.websites; v_intent public.domain_purchase_intents; v_ids uuid[]; v_names text[]; v_count integer;
begin
 if auth.role()<>'service_role' or not exists(select 1 from public.staff_members where user_id=p_actor and role='admin')
 then raise exception 'Administrator required' using errcode='42501';end if;
 if not exists(select 1 from public.organizations where id=p_organization and archived_at is null)
 then raise exception 'Organization unavailable' using errcode='42501';end if;
 select * into v_site from public.websites where id=p_website and organization_id=p_organization for update;
 if not found then raise exception 'Website not found' using errcode='42501';end if;
 if v_site.status not in ('provisioning','building','error') or v_site.live_url is not null or v_site.primary_domain_id is not null
  or exists(select 1 from public.projects where id=v_site.project_id and status in ('launched','closed','cancelled'))
  or exists(select 1 from public.deployments where website_id=p_website and environment='production')
 then raise exception 'Production setup must be managed separately' using errcode='22023';end if;
 select * into v_intent from public.domain_purchase_intents where website_id=p_website and organization_id=p_organization for update;
 if coalesce(v_intent.version,0) is distinct from p_expected_version
 then raise exception 'Selection changed; refresh before resetting' using errcode='40001';end if;
 if jsonb_typeof(p_domains) is distinct from 'array' then raise exception 'Setup snapshot required' using errcode='22023';end if;
 perform 1 from public.domains where website_id=p_website and organization_id=p_organization and status<>'released' for update;
 select array_agg(id),array_agg(hostname),count(*) into v_ids,v_names,v_count from public.domains
  where website_id=p_website and organization_id=p_organization and status<>'released';
 if v_count <> jsonb_array_length(p_domains) or v_count <> (
  select count(distinct d.id) from jsonb_to_recordset(p_domains) as expected(id uuid,updated_at timestamptz)
  join public.domains d on d.id=expected.id and d.updated_at=expected.updated_at
   where d.website_id=p_website and d.organization_id=p_organization and d.status<>'released')
 then raise exception 'Setup changed; refresh before resetting' using errcode='40001';end if;
 if exists(select 1 from public.domains where id=any(v_ids) and (source<>'customer_owned' or status='connected' or verification->>'source'='provider'))
  or exists(select 1 from public.provider_links where entity_type='domain' and entity_id=any(v_ids))
 then raise exception 'Connected or provider-managed domains cannot be reset here' using errcode='22023';end if;
 -- Workers hold leases; do not race an operation already being processed.
 perform 1 from public.provisioning_jobs where website_id=p_website and (domain_id=any(v_ids) or kind in ('website.deploy','website.deployment.sync','website.deployment.notify')) for update;
 if exists(select 1 from public.provisioning_jobs where website_id=p_website and
   ((status='running' and domain_id=any(v_ids)) or (status in ('queued','running') and kind='website.deploy' and coalesce(payload->>'environment','production')='production')))
 then raise exception 'Setup is being checked; wait and refresh before resetting' using errcode='40001';end if;
 update public.provisioning_jobs set status='canceled',locked_by=null,locked_at=null
  where organization_id=p_organization and domain_id=any(v_ids) and status in ('queued','failed')
   and kind in ('domain.connect','domain.verify','domain.readiness.notify');
 update public.domains set status='released',dns_ok=false,ssl_ok=false,verification='{}',
  verification_token=md5(gen_random_uuid()::text || clock_timestamp()::text),verified_at=null,connected_at=null,last_checked_at=null,
  status_reason='Setup cleared by a Vigil administrator.' where id=any(v_ids);
 update public.notifications set read_at=coalesce(read_at,now()) where organization_id=p_organization and kind='domain.ready_for_launch'
  and exists(select 1 from unnest(v_ids) d where href='/admin/organizations/'||p_organization::text||'?domain='||d::text);
 if v_intent.id is not null then
  update public.domain_purchase_intents set phase='cancelled',safe_error=null,domain_id=null,version=version+1,updated_at=now() where id=v_intent.id;
 end if;
 -- Only the domain answer is reset. Content, review approvals and intake state
 -- are preserved, including an already-submitted project brief.
 update public.projects set brief=brief-'domain' where id=v_site.project_id and organization_id=p_organization
  and (brief->'domain'->>'domainId'=any(v_ids::text[]) or brief->'domain'->>'hostname'=any(v_names));
 perform public.log_audit_event('domain.setup_reset','website',p_website,p_organization,
  jsonb_build_object('domain_ids',v_ids,'hostnames',v_names,'intent_version',v_intent.version),
  jsonb_build_object('active_domains',0,'choice_cleared',true),jsonb_build_object('dns_changed',false,'purchase_cancelled',false),p_actor);
end$$;
revoke all on function public.reset_domain_setup(uuid,uuid,uuid,integer,jsonb) from public,anon,authenticated;
grant execute on function public.reset_domain_setup(uuid,uuid,uuid,integer,jsonb) to service_role;

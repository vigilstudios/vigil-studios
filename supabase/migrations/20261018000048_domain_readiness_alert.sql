-- A verified ownership record is ready for staff launch review, not a live site.
-- Repeated DNS checks must not create duplicate inbox alerts or email work.
create unique index notifications_domain_ready_once_idx
  on public.notifications (user_id, kind, href)
  where kind = 'domain.ready_for_launch';

create function vigil.queue_domain_readiness_alert(p_domain uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  d public.domains;
  v_name text;
  v_href text;
  v_job uuid;
begin
  select * into d from public.domains where id = p_domain;
  if not found then return; end if;

  if d.source <> 'customer_owned' or d.website_id is null
    or d.status <> 'verifying' or d.dns_ok is not true
    or d.verification ->> 'source' is distinct from 'platform'
    or d.verification -> 'launch_ready' is distinct from 'true'::jsonb then
    return;
  end if;
  select o.name into v_name
  from public.websites w join public.organizations o on o.id = w.organization_id
  where w.id = d.website_id and w.organization_id = d.organization_id
    and w.status not in ('live', 'archived', 'suspended');
  if not found then return; end if;

  -- The queue row is also the durable once-per-domain event. Deleting or
  -- reading an inbox alert must not make a later DNS poll recreate it.
  insert into public.provisioning_jobs (organization_id, website_id, domain_id, kind, idempotency_key, max_attempts, payload)
  values (d.organization_id, d.website_id, d.id, 'domain.readiness.notify', 'domain.readiness.notify:' || d.id::text, 12, '{}'::jsonb)
  on conflict (idempotency_key) do nothing returning id into v_job;
  if v_job is null then return; end if;

  v_href := '/admin/organizations/' || d.organization_id::text || '?domain=' || d.id::text;
  insert into public.notifications (user_id, organization_id, kind, title, body, href)
  select s.user_id, d.organization_id, 'domain.ready_for_launch',
    v_name || ': domain setup ready for launch review',
    d.hostname || ' ownership is verified. Review the approved website and launch requirements. The site has not been published.', v_href
  from public.staff_members s
  on conflict (user_id, kind, href) where kind = 'domain.ready_for_launch' do nothing;

  return;
end;
$$;
revoke all on function vigil.queue_domain_readiness_alert(uuid) from public, anon, authenticated;
create function vigil.notify_domain_ready_for_launch()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform vigil.queue_domain_readiness_alert(new.id);
  return new;
end;
$$;
revoke all on function vigil.notify_domain_ready_for_launch() from public, anon, authenticated;
create trigger domains_notify_ready_for_launch
  after insert or update of status, dns_ok, verification on public.domains
  for each row execute function vigil.notify_domain_ready_for_launch();

-- Cover a real verification completed during code-first rollout. This only
-- creates notifications/outbox work for recent trusted successes; it never
-- edits a domain, DNS record, approval or website. Email rechecks public proof.
do $$ declare v_id uuid; begin
  for v_id in select id from public.domains where last_checked_at >= now() - interval '1 hour'
    and status = 'verifying' and dns_ok is true and verification ->> 'source' = 'platform'
    and verification -> 'launch_ready' = 'true'::jsonb
  loop perform vigil.queue_domain_readiness_alert(v_id); end loop;
end $$;

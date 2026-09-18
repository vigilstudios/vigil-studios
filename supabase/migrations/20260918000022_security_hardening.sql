-- 0022 Security hardening from the production-readiness audit (18 Sep 2026).
--
-- 1. Managers could mint owners. organization.ts refuses it, but the RLS
--    policies on organization_invites / organization_members accepted role =
--    'owner' from a manager through PostgREST directly. Only owners (and
--    staff) may create or upgrade an owner.
-- 2. notify_review_staff accepted any title, body and href from any member
--    and fanned it out to every staff account, so a customer could push
--    unlimited notifications with an off-site link into the admin attention
--    centre. Non-staff callers now get a derived title/body/href, and an
--    identical unread notification is not inserted twice.
-- 3. log_audit_event let a customer write rows with organization_id NULL,
--    which land in the global staff audit feed. Customers must name an
--    organization they belong to.
-- 4. domains_member_insert let a customer pre-set dns_ok / ssl_ok /
--    verification.launch_ready, which assertDomainsReadyForLaunch trusts.
--    A customer-created row now starts pristine.

-- --------------------------------------------------------------------------
-- 1. Owner role is granted by owners only
-- --------------------------------------------------------------------------
drop policy organization_members_insert on public.organization_members;
create policy organization_members_insert on public.organization_members
  for insert to authenticated
  with check (
    vigil.is_staff()
    or (
      vigil.has_org_role(organization_id, array['owner','manager']::public.org_role[])
      and (role <> 'owner' or vigil.has_org_role(organization_id, array['owner']::public.org_role[]))
    )
  );

drop policy organization_invites_insert on public.organization_invites;
create policy organization_invites_insert on public.organization_invites
  for insert to authenticated
  with check (
    vigil.is_staff()
    or (
      vigil.has_org_role(organization_id, array['owner','manager']::public.org_role[])
      and (role <> 'owner' or vigil.has_org_role(organization_id, array['owner']::public.org_role[]))
      and (invited_by is null or invited_by = (select auth.uid()))
    )
  );

drop policy organization_invites_update on public.organization_invites;
create policy organization_invites_update on public.organization_invites
  for update to authenticated
  using (
    vigil.is_staff()
    or vigil.has_org_role(organization_id, array['owner','manager']::public.org_role[])
  )
  with check (
    vigil.is_staff()
    or (
      vigil.has_org_role(organization_id, array['owner','manager']::public.org_role[])
      and (role <> 'owner' or vigil.has_org_role(organization_id, array['owner']::public.org_role[]))
    )
  );

-- --------------------------------------------------------------------------
-- 2. Staff review notifications: customer input never reaches the link
-- --------------------------------------------------------------------------
create or replace function vigil.notify_review_staff(p_round uuid, p_title text, p_body text, p_href text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_round public.project_review_rounds%rowtype;
  v_kind public.project_kind;
  v_website uuid;
  v_response public.review_response_kind;
  v_trusted boolean := (select auth.uid()) is null or vigil.is_staff();
  v_title text;
  v_body text;
  v_href text;
begin
  select * into v_round from public.project_review_rounds where id = p_round;
  if v_round.id is null or not (v_trusted or vigil.is_org_member(v_round.organization_id)) then
    raise exception 'not allowed to notify this review team' using errcode = '42501';
  end if;

  select kind into v_kind from public.projects where id = v_round.project_id;
  select id into v_website from public.websites where project_id = v_round.project_id limit 1;

  if v_trusted then
    v_title := left(p_title, 200);
    v_body := nullif(left(p_body, 2000), '');
    v_href := nullif(left(p_href, 500), '');
  else
    -- A customer may only announce the response they just recorded.
    select r.kind into v_response
    from public.project_review_responses r
    where r.round_id = v_round.id and r.submission_id = v_round.current_submission_id
    order by r.created_at desc
    limit 1;
    if v_response is null then
      raise exception 'no review response to notify about' using errcode = '23514';
    end if;
    v_title := case
      when v_kind = 'express' then 'Express preview'
      when v_round.phase = 'design_direction' then 'Design direction'
      else 'Full-site review'
    end || case when v_response = 'approved' then ': approved' else ': changes requested' end;
    v_body := case when v_response = 'approved' then 'The customer approved the current version.' else 'The customer submitted consolidated changes.' end;
    v_href := case
      when v_kind = 'express' and v_website is not null then '/admin/websites/' || v_website::text
      else '/admin/reviews/' || v_round.project_id::text
    end;
  end if;

  insert into public.notifications (user_id, organization_id, kind, title, body, href)
  select s.user_id, v_round.organization_id, 'project_review.response', v_title, v_body, v_href
  from public.staff_members s
  where not exists (
    select 1 from public.notifications n
    where n.user_id = s.user_id
      and n.kind = 'project_review.response'
      and n.read_at is null
      and n.title = v_title
      and n.href is not distinct from v_href
  );
end;
$$;

-- --------------------------------------------------------------------------
-- 3. Customers cannot write organization-less audit rows
-- --------------------------------------------------------------------------
create or replace function vigil.log_audit_event(
  p_action       text,
  p_entity_type  text,
  p_entity_id    uuid,
  p_org          uuid default null,
  p_before       jsonb default null,
  p_after        jsonb default null,
  p_metadata     jsonb default '{}'::jsonb,
  p_actor_kind   public.actor_kind default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_kind  public.actor_kind;
  v_id    bigint;
begin
  -- A caller may only write audit rows about organizations it can see, and a
  -- customer must always name one: organization-less rows belong to staff and
  -- the service role.
  if v_actor is not null and not vigil.is_staff() then
    if p_org is null then
      raise exception 'audit events from customers must name an organization' using errcode = '42501';
    end if;
    if not vigil.is_org_member(p_org) then
      raise exception 'not a member of organization %', p_org using errcode = '42501';
    end if;
    -- Customers describe what they did, never who they are.
    v_kind := 'user'::public.actor_kind;
  else
    v_kind := coalesce(
      p_actor_kind,
      case
        when v_actor is null then 'system'::public.actor_kind
        when vigil.is_staff() then 'staff'::public.actor_kind
        else 'user'::public.actor_kind
      end
    );
  end if;

  insert into public.audit_events
    (organization_id, actor_kind, actor_user_id, action, entity_type, entity_id, before, after, metadata)
  values
    (p_org, v_kind, v_actor, p_action, p_entity_type, p_entity_id, p_before, p_after, coalesce(p_metadata, '{}'::jsonb))
  returning id into v_id;

  return v_id;
end;
$$;

-- --------------------------------------------------------------------------
-- 4. Customer-created domains start pristine
-- --------------------------------------------------------------------------
drop policy domains_member_insert on public.domains;
create policy domains_member_insert on public.domains
  for insert to authenticated
  with check (
    vigil.is_staff()
    or (
      vigil.has_org_role(organization_id, array['owner','manager']::public.org_role[])
      and source = 'customer_owned'
      and status = 'pending'
      and dns_ok is null
      and ssl_ok is null
      and verification = '{}'::jsonb
      and metadata = '{}'::jsonb
      and registrant = '{}'::jsonb
      and verified_at is null
      and connected_at is null
      and expires_at is null
    )
  );

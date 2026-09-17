-- Express preview approval. Reuse the immutable project review ledger with
-- one full-site round and one included request for changes.

alter table public.project_review_rounds
  drop constraint project_review_rounds_phase;
alter table public.project_review_rounds
  add constraint project_review_rounds_phase check (
    (round_number = 1 and phase in ('design_direction', 'full_site'))
    or (round_number = 2 and phase = 'full_site')
  );

create or replace function vigil.seed_project_review_rounds()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.kind = 'professional' then
    insert into public.project_review_rounds (organization_id, project_id, round_number, phase)
    values
      (new.organization_id, new.id, 1, 'design_direction'),
      (new.organization_id, new.id, 2, 'full_site')
    on conflict (project_id, round_number) do nothing;
  elsif new.kind = 'express' then
    insert into public.project_review_rounds (organization_id, project_id, round_number, phase)
    values (new.organization_id, new.id, 1, 'full_site')
    on conflict (project_id, round_number) do nothing;
  end if;
  return new;
end;
$$;

create or replace function vigil.guard_project_review_round()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare v_org uuid; v_kind public.project_kind;
begin
  select organization_id, kind into v_org, v_kind from public.projects where id = new.project_id;
  if v_org is null or v_org <> new.organization_id or v_kind not in ('professional', 'express') then
    raise exception 'review rounds require a Professional or Express project in the same organization' using errcode = '23503';
  end if;
  if v_kind = 'professional' and not (
    (new.round_number = 1 and new.phase = 'design_direction')
    or (new.round_number = 2 and new.phase = 'full_site')
  ) then
    raise exception 'Professional projects require Design direction then Full-site review' using errcode = '23514';
  end if;
  if v_kind = 'express' and not (new.round_number = 1 and new.phase = 'full_site') then
    raise exception 'Express projects include exactly one Full-site review round' using errcode = '23514';
  end if;
  return new;
end;
$$;

insert into public.project_review_rounds (organization_id, project_id, round_number, phase)
select p.organization_id, p.id, 1, 'full_site'::public.review_phase
from public.projects p
where p.kind = 'express'
on conflict (project_id, round_number) do nothing;

-- Existing Express previews become reviewable immediately after rollout.
insert into public.project_review_submissions (
  organization_id, project_id, round_id, version, preview_url, notes
)
select p.organization_id, p.id, r.id, 1, w.preview_url, 'Existing Express website preview'
from public.projects p
join public.websites w on w.project_id = p.id
join public.project_review_rounds r on r.project_id = p.id and r.round_number = 1
where p.kind = 'express'
  and w.preview_url ~ '^https?://'
  and not exists (select 1 from public.project_review_submissions s where s.round_id = r.id);

create or replace function vigil.guard_project_review_response()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_round public.project_review_rounds%rowtype;
  v_submission public.project_review_submissions%rowtype;
  v_kind public.project_kind;
  v_change_requests integer;
begin
  select * into v_round from public.project_review_rounds where id = new.round_id for update;
  select * into v_submission from public.project_review_submissions where id = new.submission_id;
  if v_round.id is null or v_submission.id is null
     or v_round.organization_id <> new.organization_id or v_submission.organization_id <> new.organization_id
     or v_round.project_id <> new.project_id or v_submission.project_id <> new.project_id
     or v_submission.round_id <> new.round_id then
    raise exception 'response does not match its submission and review round' using errcode = '23503';
  end if;
  if v_round.current_submission_id is distinct from new.submission_id or v_round.status <> 'awaiting_feedback' then
    raise exception 'only the current review submission can receive a customer response' using errcode = '23514';
  end if;
  select kind into v_kind from public.projects where id = new.project_id;
  if v_kind = 'express' and new.kind = 'changes_requested' then
    select count(*) into v_change_requests
    from public.project_review_responses
    where project_id = new.project_id and kind = 'changes_requested';
    if v_change_requests >= 1 then
      raise exception 'Express projects include one request for changes' using errcode = '23514';
    end if;
  end if;
  if (select auth.uid()) is not null and not vigil.is_staff() and new.responded_by is not null and new.responded_by <> (select auth.uid()) then
    raise exception 'customers may only record their own review response' using errcode = '42501';
  end if;
  new.responded_by := coalesce(new.responded_by, (select auth.uid()));
  return new;
end;
$$;

create or replace function vigil.guard_professional_project_kind()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.kind in ('professional', 'express') and new.kind <> old.kind then
    raise exception 'a project cannot lose its included review history' using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function vigil.sync_project_from_review_round()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare v_kind public.project_kind;
begin
  select kind into v_kind from public.projects where id = new.project_id;
  if new.status = 'awaiting_feedback' then
    update public.projects set status = 'review'
     where id = new.project_id and status in ('draft', 'intake', 'in_progress', 'approved');
  elsif new.status in ('changes_requested', 'revision_in_progress') then
    update public.projects set status = 'in_progress'
     where id = new.project_id and status in ('review', 'approved');
  elsif new.status = 'approved' and v_kind = 'express' and new.round_number = 1 then
    update public.projects set status = 'approved'
     where id = new.project_id and status in ('draft', 'intake', 'in_progress', 'review');
  elsif new.status = 'approved' and v_kind = 'professional' and new.round_number = 1 then
    update public.projects set status = 'in_progress'
     where id = new.project_id and status = 'review';
  elsif new.status = 'approved' and v_kind = 'professional' and new.round_number = 2
        and exists (
          select 1 from public.project_review_rounds
           where project_id = new.project_id and round_number = 1 and status = 'approved'
        ) then
    update public.projects set status = 'approved'
     where id = new.project_id and status in ('draft', 'intake', 'in_progress', 'review');
  end if;
  return new;
end;
$$;

update public.projects p
   set status = 'approved'
 where p.kind = 'express' and p.status not in ('launched', 'closed', 'cancelled')
   and exists (
     select 1 from public.project_review_rounds r
      where r.project_id = p.id and r.round_number = 1 and r.status = 'approved'
   );

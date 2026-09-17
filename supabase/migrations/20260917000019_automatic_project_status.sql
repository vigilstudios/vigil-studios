-- 0019 Project progress follows delivery events instead of relying on staff
-- to keep a second lifecycle field in sync by hand.

-- Managed columns remain immutable to customer requests. A trusted database
-- trigger may update them as a consequence of an allowed customer action,
-- such as sending onboarding or approving a review.
create or replace function vigil.protect_columns_from_customers()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_col text;
  v_old jsonb := to_jsonb(old);
  v_new jsonb := to_jsonb(new);
begin
  if (select auth.uid()) is null or vigil.is_staff() or pg_trigger_depth() > 1 then
    return new;
  end if;
  foreach v_col in array tg_argv loop
    if (v_old -> v_col) is distinct from (v_new -> v_col) then
      raise exception 'column "%" on % is managed by Vigil', v_col, tg_table_name
        using errcode = '42501';
    end if;
  end loop;
  return new;
end;
$$;

create or replace function vigil.sync_project_from_intake()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.intake_completed_at is not null and old.intake_completed_at is null then
    update public.projects
       set status = 'in_progress'
     where id = new.id and status in ('draft', 'intake');
  end if;
  return new;
end;
$$;
create trigger projects_sync_completed_intake
  after update of intake_completed_at on public.projects
  for each row execute function vigil.sync_project_from_intake();

create or replace function vigil.sync_project_from_deployment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.environment = 'preview' and new.status = 'ready' then
    update public.projects p
       set status = 'review'
      from public.websites w
     where w.id = new.website_id and p.id = w.project_id
       and p.status in ('draft', 'intake', 'in_progress');
  end if;
  return new;
end;
$$;
create trigger deployments_sync_project_status
  after insert or update of status on public.deployments
  for each row execute function vigil.sync_project_from_deployment();

create or replace function vigil.sync_project_from_website()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'live' and new.project_id is not null then
    update public.projects
       set status = 'launched', launched_at = coalesce(launched_at, new.last_deployed_at, now())
     where id = new.project_id and status not in ('closed', 'cancelled');
  end if;
  return new;
end;
$$;
create trigger websites_sync_project_status
  after update of status on public.websites
  for each row execute function vigil.sync_project_from_website();

create or replace function vigil.sync_project_from_review_round()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'awaiting_feedback' then
    update public.projects set status = 'review'
     where id = new.project_id and status in ('draft', 'intake', 'in_progress');
  elsif new.status in ('changes_requested', 'revision_in_progress') then
    update public.projects set status = 'in_progress'
     where id = new.project_id and status = 'review';
  elsif new.status = 'approved' and new.round_number = 1 then
    update public.projects set status = 'in_progress'
     where id = new.project_id and status = 'review';
  elsif new.status = 'approved' and new.round_number = 2
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
create trigger project_review_rounds_sync_project_status
  after update of status on public.project_review_rounds
  for each row execute function vigil.sync_project_from_review_round();

-- Repair rows created before automatic synchronization existed. Apply the
-- least advanced milestones first and let stronger evidence win afterward.
update public.projects
   set status = 'in_progress'
 where intake_completed_at is not null and status in ('draft', 'intake');

update public.projects p
   set status = 'review'
  from public.websites w
 where p.id = w.project_id and p.status in ('draft', 'intake', 'in_progress')
   and exists (
     select 1 from public.deployments d
      where d.website_id = w.id and d.environment = 'preview' and d.status = 'ready'
   );

update public.projects p
   set status = 'approved'
 where p.kind = 'professional' and p.status not in ('launched', 'closed', 'cancelled')
   and exists (select 1 from public.project_review_rounds r where r.project_id = p.id and r.round_number = 1 and r.status = 'approved')
   and exists (select 1 from public.project_review_rounds r where r.project_id = p.id and r.round_number = 2 and r.status = 'approved');

update public.projects p
   set status = 'launched', launched_at = coalesce(p.launched_at, w.last_deployed_at, now())
  from public.websites w
 where p.id = w.project_id and w.status = 'live' and p.status not in ('closed', 'cancelled');

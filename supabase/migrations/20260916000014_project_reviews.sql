-- 0014 Professional review workflow. Professional projects always include
-- exactly two review rounds: design direction, then the complete site.

create type public.review_phase as enum ('design_direction', 'full_site');
create type public.review_round_status as enum (
  'pending', 'awaiting_feedback', 'changes_requested', 'revision_in_progress', 'approved'
);
create type public.review_response_kind as enum ('changes_requested', 'approved');

create table public.project_review_rounds (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations (id) on delete cascade,
  project_id            uuid not null references public.projects (id) on delete cascade,
  round_number          smallint not null,
  phase                 public.review_phase not null,
  status                public.review_round_status not null default 'pending',
  current_submission_id uuid,
  approved_submission_id uuid,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint project_review_rounds_number check (round_number in (1, 2)),
  constraint project_review_rounds_phase check (
    (round_number = 1 and phase = 'design_direction')
    or (round_number = 2 and phase = 'full_site')
  ),
  unique (project_id, round_number)
);

create index project_review_rounds_project_idx on public.project_review_rounds (project_id, round_number);
create index project_review_rounds_org_status_idx on public.project_review_rounds (organization_id, status);
create trigger project_review_rounds_set_updated_at
  before update on public.project_review_rounds
  for each row execute function vigil.set_updated_at();
create trigger project_review_rounds_audit_status
  after update of status on public.project_review_rounds
  for each row execute function vigil.audit_status_change();

create table public.project_review_submissions (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  project_id      uuid not null references public.projects (id) on delete cascade,
  round_id        uuid not null references public.project_review_rounds (id) on delete cascade,
  version         integer not null,
  preview_url     text not null,
  notes           text,
  published_by    uuid references public.profiles (id) on delete set null,
  published_at    timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  constraint project_review_submissions_version check (version >= 1),
  constraint project_review_submissions_preview_url check (preview_url ~ '^https?://'),
  unique (round_id, version)
);

create index project_review_submissions_round_idx on public.project_review_submissions (round_id, version desc);
create index project_review_submissions_project_idx on public.project_review_submissions (project_id, created_at desc);

alter table public.project_review_rounds
  add constraint project_review_rounds_current_submission_fk
  foreign key (current_submission_id) references public.project_review_submissions (id) on delete restrict,
  add constraint project_review_rounds_approved_submission_fk
  foreign key (approved_submission_id) references public.project_review_submissions (id) on delete restrict;

create table public.project_review_responses (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  project_id      uuid not null references public.projects (id) on delete cascade,
  round_id        uuid not null references public.project_review_rounds (id) on delete cascade,
  submission_id   uuid not null references public.project_review_submissions (id) on delete cascade,
  kind            public.review_response_kind not null,
  feedback        text,
  responded_by    uuid references public.profiles (id) on delete set null,
  responded_at    timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  constraint project_review_responses_one_per_submission unique (submission_id),
  constraint project_review_responses_feedback check (
    kind = 'approved' or char_length(btrim(coalesce(feedback, ''))) > 0
  )
);

create index project_review_responses_round_idx on public.project_review_responses (round_id, responded_at desc);
create index project_review_responses_project_idx on public.project_review_responses (project_id, created_at desc);

-- Private objects are stored beneath <organization_id>/<response_id>/... .
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'review-attachments', 'review-attachments', false, 10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf']
)
on conflict (id) do nothing;

create policy "review attachments: read own organization"
  on storage.objects for select to authenticated
  using (bucket_id = 'review-attachments' and (vigil.is_staff() or vigil.is_org_member(vigil.path_organization(name))));
create policy "review attachments: upload into own organization"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'review-attachments' and (vigil.is_staff() or vigil.is_org_member(vigil.path_organization(name))));
create policy "review attachments: delete own or staff"
  on storage.objects for delete to authenticated
  using (bucket_id = 'review-attachments' and (vigil.is_staff() or owner = (select auth.uid())));

create table public.project_review_attachments (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  response_id     uuid not null references public.project_review_responses (id) on delete cascade,
  bucket_id       text not null default 'review-attachments',
  object_path     text not null unique,
  file_name       text not null,
  content_type    text not null,
  size_bytes      integer not null,
  uploaded_by     uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  constraint project_review_attachments_size check (size_bytes between 0 and 10485760),
  constraint project_review_attachments_path_org check (vigil.path_organization(object_path) = organization_id)
);
create index project_review_attachments_response_idx on public.project_review_attachments (response_id);

-- Seed both fixed included rounds when a Professional project is created.
-- The function is definer-owned so the trigger remains valid even though no
-- caller has direct INSERT rights on rounds.
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
  end if;
  return new;
end;
$$;
create trigger projects_seed_review_rounds
  after insert or update of kind on public.projects
  for each row execute function vigil.seed_project_review_rounds();

-- Backfill Professional projects created before this migration.
insert into public.project_review_rounds (organization_id, project_id, round_number, phase)
select p.organization_id, p.id, v.round_number,
       case when v.round_number = 1 then 'design_direction'::public.review_phase else 'full_site'::public.review_phase end
from public.projects p
cross join (values (1), (2)) as v(round_number)
where p.kind = 'professional'
on conflict (project_id, round_number) do nothing;

-- Every review row names the same organization/project and only exists for a
-- Professional project. This is the database-level included-round boundary.
create or replace function vigil.guard_project_review_round()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare v_org uuid; v_kind public.project_kind;
begin
  select organization_id, kind into v_org, v_kind from public.projects where id = new.project_id;
  if v_org is null or v_org <> new.organization_id or v_kind <> 'professional' then
    raise exception 'review rounds require a Professional project in the same organization' using errcode = '23503';
  end if;
  return new;
end;
$$;
create trigger project_review_rounds_guard_reference
  before insert or update of organization_id, project_id, round_number, phase on public.project_review_rounds
  for each row execute function vigil.guard_project_review_round();

-- Version publication is append-only, ordered, staff-only (through RLS), and
-- cannot skip the first approved round. Revision work must be explicitly
-- started before a replacement preview may be published.
create or replace function vigil.guard_project_review_submission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare v_round public.project_review_rounds%rowtype; v_max integer; v_first_status public.review_round_status;
begin
  select * into v_round from public.project_review_rounds where id = new.round_id for update;
  if v_round.id is null or v_round.organization_id <> new.organization_id or v_round.project_id <> new.project_id then
    raise exception 'submission does not match its review round' using errcode = '23503';
  end if;
  if v_round.round_number = 2 then
    select status into v_first_status from public.project_review_rounds where project_id = new.project_id and round_number = 1;
    if v_first_status <> 'approved' then
      raise exception 'full-site review cannot start until design direction is approved' using errcode = '23514';
    end if;
  end if;
  if v_round.status not in ('pending', 'revision_in_progress') then
    raise exception 'this review round is not ready for a new submission' using errcode = '23514';
  end if;
  select coalesce(max(version), 0) into v_max from public.project_review_submissions where round_id = new.round_id;
  if new.version <> v_max + 1 then
    raise exception 'review submission version must be %', v_max + 1 using errcode = '23514';
  end if;
  if (select auth.uid()) is not null and not vigil.is_staff() then
    raise exception 'only staff can publish review submissions' using errcode = '42501';
  end if;
  new.published_by := coalesce(new.published_by, (select auth.uid()));
  return new;
end;
$$;
create trigger project_review_submissions_guard
  before insert on public.project_review_submissions
  for each row execute function vigil.guard_project_review_submission();

create or replace function vigil.activate_project_review_submission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.project_review_rounds
     set current_submission_id = new.id, approved_submission_id = null, status = 'awaiting_feedback'
   where id = new.round_id;
  perform vigil.log_audit_event(
    'review_submission.published', 'project_review_submission', new.id, new.organization_id,
    null, jsonb_build_object('round', (select round_number from public.project_review_rounds where id = new.round_id), 'version', new.version, 'preview_url', new.preview_url)
  );
  return new;
end;
$$;
create trigger project_review_submissions_activate
  after insert on public.project_review_submissions
  for each row execute function vigil.activate_project_review_submission();

-- A customer can answer only the live version, and exactly once. Past
-- submissions stay immutable as the complete review history.
create or replace function vigil.guard_project_review_response()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare v_round public.project_review_rounds%rowtype; v_submission public.project_review_submissions%rowtype;
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
  if (select auth.uid()) is not null and not vigil.is_staff() and new.responded_by is not null and new.responded_by <> (select auth.uid()) then
    raise exception 'customers may only record their own review response' using errcode = '42501';
  end if;
  new.responded_by := coalesce(new.responded_by, (select auth.uid()));
  return new;
end;
$$;
create trigger project_review_responses_guard
  before insert on public.project_review_responses
  for each row execute function vigil.guard_project_review_response();

create or replace function vigil.apply_project_review_response()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.project_review_rounds
     set status = case
           when new.kind = 'approved' then 'approved'::public.review_round_status
           else 'changes_requested'::public.review_round_status
         end,
         approved_submission_id = case when new.kind = 'approved' then new.submission_id else null end
   where id = new.round_id;
  perform vigil.log_audit_event(
    'review_response.submitted', 'project_review_response', new.id, new.organization_id,
    null, jsonb_build_object('round', (select round_number from public.project_review_rounds where id = new.round_id), 'submission_id', new.submission_id, 'kind', new.kind)
  );
  return new;
end;
$$;
create trigger project_review_responses_apply
  after insert on public.project_review_responses
  for each row execute function vigil.apply_project_review_response();

create or replace function vigil.guard_project_review_attachment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare v_response public.project_review_responses%rowtype;
begin
  select * into v_response from public.project_review_responses where id = new.response_id;
  if v_response.id is null or v_response.organization_id <> new.organization_id then
    raise exception 'attachment does not match its review response' using errcode = '23503';
  end if;
  if v_response.kind <> 'changes_requested' then
    raise exception 'only changes-requested feedback accepts attachments' using errcode = '23514';
  end if;
  if (select auth.uid()) is not null and not vigil.is_staff()
     and v_response.responded_by is distinct from (select auth.uid()) then
    raise exception 'customers may only attach files to their own response' using errcode = '42501';
  end if;
  new.uploaded_by := coalesce(new.uploaded_by, (select auth.uid()));
  return new;
end;
$$;
create trigger project_review_attachments_guard
  before insert or update of organization_id, response_id, object_path on public.project_review_attachments
  for each row execute function vigil.guard_project_review_attachment();

create or replace function vigil.audit_project_review_attachment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform vigil.log_audit_event('review_response.attachment_added', 'project_review_attachment', new.id, new.organization_id,
    null, jsonb_build_object('response_id', new.response_id, 'file_name', new.file_name));
  return new;
end;
$$;
create trigger project_review_attachments_audit
  after insert on public.project_review_attachments
  for each row execute function vigil.audit_project_review_attachment();

-- A customer response needs to notify staff, but customers never gain direct
-- INSERT access to notifications. This narrow RPC is the notification bridge.
create or replace function vigil.notify_review_staff(p_round uuid, p_title text, p_body text, p_href text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_org uuid;
begin
  select organization_id into v_org from public.project_review_rounds where id = p_round;
  if v_org is null or ((select auth.uid()) is not null and not (vigil.is_staff() or vigil.is_org_member(v_org))) then
    raise exception 'not allowed to notify this review team' using errcode = '42501';
  end if;
  insert into public.notifications (user_id, organization_id, kind, title, body, href)
  select user_id, v_org, 'project_review.response', left(p_title, 200), nullif(left(p_body, 2000), ''), nullif(left(p_href, 500), '')
  from public.staff_members;
end;
$$;
create or replace function public.notify_review_staff(p_round uuid, p_title text, p_body text default '', p_href text default '')
returns void language sql security invoker set search_path = ''
as $$ select vigil.notify_review_staff(p_round, p_title, p_body, p_href); $$;
grant execute on function public.notify_review_staff(uuid, text, text, text) to authenticated, service_role;

-- RLS: customers can read their own organization and insert one response to
-- the current version. Staff can publish and manage workflow state. All
-- history rows are deliberately immutable after creation.
alter table public.project_review_rounds enable row level security;
alter table public.project_review_submissions enable row level security;
alter table public.project_review_responses enable row level security;
alter table public.project_review_attachments enable row level security;

create policy project_review_rounds_select on public.project_review_rounds for select to authenticated
  using (vigil.is_staff() or vigil.is_org_member(organization_id));
create policy project_review_rounds_staff_update on public.project_review_rounds for update to authenticated
  using (vigil.is_staff()) with check (vigil.is_staff());

create policy project_review_submissions_select on public.project_review_submissions for select to authenticated
  using (vigil.is_staff() or vigil.is_org_member(organization_id));
create policy project_review_submissions_staff_insert on public.project_review_submissions for insert to authenticated
  with check (vigil.is_staff());

create policy project_review_responses_select on public.project_review_responses for select to authenticated
  using (vigil.is_staff() or vigil.is_org_member(organization_id));
create policy project_review_responses_member_insert on public.project_review_responses for insert to authenticated
  with check (vigil.is_staff() or vigil.is_org_member(organization_id));

create policy project_review_attachments_select on public.project_review_attachments for select to authenticated
  using (vigil.is_staff() or vigil.is_org_member(organization_id));
create policy project_review_attachments_insert on public.project_review_attachments for insert to authenticated
  with check (vigil.is_staff() or vigil.is_org_member(organization_id));

-- Keep project kind immutable once its review entitlement has been seeded.
create or replace function vigil.guard_professional_project_kind()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.kind = 'professional' and new.kind <> old.kind then
    raise exception 'a Professional project cannot lose its included review rounds' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger projects_guard_professional_kind
  before update of kind on public.projects
  for each row execute function vigil.guard_professional_project_kind();

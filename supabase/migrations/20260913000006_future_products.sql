-- 0006 Future-facing structures: Requests, Leads, Virtue.
--
-- Tables only. No workflow, no allowance accounting, no ingestion. They exist
-- so entitlements, RLS and the dashboard route map have something real to
-- gate, and so later phases extend rather than restructure.

-- --------------------------------------------------------------------------
-- change_requests (Requests): website updates for Care and above.
-- --------------------------------------------------------------------------
create table public.change_requests (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  website_id       uuid references public.websites (id) on delete set null,
  title            text not null,
  description      text,
  status           public.change_request_status not null default 'draft',
  priority         public.change_request_priority not null default 'normal',
  requested_by     uuid references public.profiles (id) on delete set null,
  assigned_to      uuid references public.profiles (id) on delete set null,
  submitted_at     timestamptz,
  delivered_at     timestamptz,
  closed_at        timestamptz,
  counts_toward_allowance boolean not null default true,
  metadata         jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint change_requests_title_len check (char_length(title) between 1 and 200)
);

create index change_requests_org_idx on public.change_requests (organization_id, created_at desc);
create index change_requests_status_idx on public.change_requests (status);

create trigger change_requests_set_updated_at
  before update on public.change_requests
  for each row execute function vigil.set_updated_at();

create trigger change_requests_audit_status
  after update of status on public.change_requests
  for each row execute function vigil.audit_status_change();

create trigger change_requests_enforce_same_org
  before insert or update of website_id, organization_id on public.change_requests
  for each row execute function vigil.enforce_same_org_references();

-- --------------------------------------------------------------------------
-- leads: captured interactions from a website (Growth and above).
-- --------------------------------------------------------------------------
create table public.leads (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  website_id       uuid references public.websites (id) on delete set null,
  source           text,                            -- 'form' | 'call' | 'sms' | 'manual' ...
  status           public.lead_status not null default 'new',
  contact          jsonb not null default '{}'::jsonb,   -- name, email, phone
  message          text,
  metadata         jsonb not null default '{}'::jsonb,
  received_at      timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index leads_org_idx on public.leads (organization_id, received_at desc);
create index leads_status_idx on public.leads (status);

create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function vigil.set_updated_at();

create trigger leads_enforce_same_org
  before insert or update of website_id, organization_id on public.leads
  for each row execute function vigil.enforce_same_org_references();

-- --------------------------------------------------------------------------
-- virtue_settings: one row per organization; workflows come later.
-- --------------------------------------------------------------------------
create table public.virtue_settings (
  organization_id  uuid primary key references public.organizations (id) on delete cascade,
  enabled          boolean not null default false,
  settings         jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger virtue_settings_set_updated_at
  before update on public.virtue_settings
  for each row execute function vigil.set_updated_at();

-- --------------------------------------------------------------------------
-- RLS
-- --------------------------------------------------------------------------
alter table public.change_requests enable row level security;
alter table public.leads enable row level security;
alter table public.virtue_settings enable row level security;

create policy change_requests_select on public.change_requests for select to authenticated
  using (vigil.is_staff() or vigil.is_org_member(organization_id));
create policy change_requests_member_insert on public.change_requests for insert to authenticated
  with check (
    vigil.is_staff()
    or (vigil.is_org_member(organization_id) and status in ('draft', 'submitted'))
  );
create policy change_requests_update on public.change_requests for update to authenticated
  using (vigil.is_staff() or vigil.has_org_role(organization_id, array['owner','manager']::public.org_role[]))
  with check (vigil.is_staff() or vigil.has_org_role(organization_id, array['owner','manager']::public.org_role[]));
create policy change_requests_staff_delete on public.change_requests for delete to authenticated
  using (vigil.is_staff());

-- Customers may edit their own request text and withdraw it; staff own the
-- operational columns (assignment, status beyond submitted, allowance flag).
create trigger change_requests_protect_columns
  before update on public.change_requests
  for each row execute function vigil.protect_columns_from_customers(
    'id', 'organization_id', 'website_id', 'requested_by', 'assigned_to',
    'delivered_at', 'counts_toward_allowance', 'created_at'
  );

-- Customers move a request between draft, submitted and closed only; the
-- operational states belong to Vigil.
create or replace function vigil.guard_change_request_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or vigil.is_staff() then
    return new;
  end if;
  if new.status is distinct from old.status
     and new.status not in ('draft', 'submitted', 'closed') then
    raise exception 'customers cannot set request status to %', new.status
      using errcode = '42501';
  end if;
  if new.status = 'submitted' and old.status is distinct from 'submitted' then
    new.submitted_at := coalesce(new.submitted_at, now());
  end if;
  return new;
end;
$$;

create trigger change_requests_guard_status
  before update of status on public.change_requests
  for each row execute function vigil.guard_change_request_status();

create policy leads_select on public.leads for select to authenticated
  using (vigil.is_staff() or vigil.is_org_member(organization_id));
create policy leads_member_update on public.leads for update to authenticated
  using (vigil.is_staff() or vigil.is_org_member(organization_id))
  with check (vigil.is_staff() or vigil.is_org_member(organization_id));
create policy leads_staff_insert on public.leads for insert to authenticated
  with check (vigil.is_staff());
create policy leads_staff_delete on public.leads for delete to authenticated
  using (vigil.is_staff());

create trigger leads_protect_columns
  before update on public.leads
  for each row execute function vigil.protect_columns_from_customers(
    'id', 'organization_id', 'website_id', 'source', 'contact', 'message', 'received_at', 'created_at'
  );

create policy virtue_settings_select on public.virtue_settings for select to authenticated
  using (vigil.is_staff() or vigil.is_org_member(organization_id));
create policy virtue_settings_staff_write on public.virtue_settings for all to authenticated
  using (vigil.is_staff()) with check (vigil.is_staff());

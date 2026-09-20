-- 0025 Creative Workspace generation: one durable record per website.
--
-- After Create Repo, Vigil turns the customer's brief and files into a
-- `.vigil/creative/` workspace inside the repository (Terra intelligence,
-- source snapshots, asset manifest, Astra instructions). The job runner does
-- the work; this row is what staff see: status, warnings, the failure, the
-- versions used, and the validated model output kept so a retry after a Git
-- failure does not call the model again for the same source.
--
-- Staff only. Customers never see generation state; the repository is
-- Vigil's working copy, not the customer's dashboard.

create table public.creative_workspaces (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations (id) on delete cascade,
  website_id            uuid not null unique references public.websites (id) on delete cascade,
  project_id            uuid references public.projects (id) on delete set null,
  status                text not null default 'not_started',
  workflow_version      integer not null default 1,
  template_version      integer,
  prompt_version        integer,
  schema_version        integer,
  model_id              text,
  source_checksum       text,
  idempotency_key       text,
  -- Validated Terra output for the idempotency key above; reused on retry.
  intelligence          jsonb,
  intelligence_at       timestamptz,
  intelligence_usage    jsonb,
  -- Git blob sha of every generated file from the last successful publish,
  -- so regeneration can tell a human-edited file from an untouched one.
  generated_files       jsonb not null default '{}'::jsonb,
  warnings              jsonb not null default '[]'::jsonb,
  error                 jsonb,
  asset_counts          jsonb not null default '{}'::jsonb,
  commit_sha            text,
  generated_at          timestamptz,
  started_at            timestamptz,
  finished_at           timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint creative_workspaces_status check (status in (
    'not_started', 'queued', 'collecting_source', 'generating_intelligence',
    'packaging_assets', 'writing_repository', 'ready', 'ready_with_warnings', 'failed'
  ))
);

create index creative_workspaces_org_idx on public.creative_workspaces (organization_id);

create trigger creative_workspaces_set_updated_at
  before update on public.creative_workspaces
  for each row execute function vigil.set_updated_at();

create trigger creative_workspaces_enforce_same_org
  before insert or update of website_id, project_id, organization_id on public.creative_workspaces
  for each row execute function vigil.enforce_same_org_references();

alter table public.creative_workspaces enable row level security;

create policy creative_workspaces_staff_all on public.creative_workspaces for all to authenticated
  using (vigil.is_staff()) with check (vigil.is_staff());

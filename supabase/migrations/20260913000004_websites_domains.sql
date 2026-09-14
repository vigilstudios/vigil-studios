-- 0004 Projects, websites, domains, deployments, provider links.

-- --------------------------------------------------------------------------
-- projects: the build engagement that produces a website.
-- --------------------------------------------------------------------------
create table public.projects (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  name             text not null,
  kind             public.project_kind not null,
  status           public.project_status not null default 'draft',
  template_slug    text,                            -- Express template, when kind = express
  source_ref       text,                            -- e.g. Express order reference from the leadgen worker
  brief            jsonb not null default '{}'::jsonb,
  launch_target    date,
  launched_at      timestamptz,
  closed_at        timestamptz,
  created_by       uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index projects_org_idx on public.projects (organization_id);
create index projects_status_idx on public.projects (status);
create unique index projects_source_ref_idx on public.projects (source_ref) where source_ref is not null;

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function vigil.set_updated_at();

-- --------------------------------------------------------------------------
-- websites: the operated asset. Provider project/deployment ids are in
-- provider_links; hosting_mode is free text until topology is decided.
-- --------------------------------------------------------------------------
create table public.websites (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organizations (id) on delete cascade,
  project_id         uuid references public.projects (id) on delete set null,
  name               text not null,
  status             public.website_status not null default 'provisioning',
  template_slug      text,
  hosting_mode       text,                          -- 'dedicated' | 'shared' | ... undecided
  live_url           text,
  preview_url        text,
  primary_domain_id  uuid,                          -- fk added after domains
  code_ownership     public.code_ownership not null default 'customer_owned',
  export_eligible    boolean not null default true,
  repository_ref     text,
  status_reason      text,                          -- human-readable, shown to the customer
  last_deployed_at   timestamptz,
  last_health_at     timestamptz,
  health_ok          boolean,
  metadata           jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index websites_org_idx on public.websites (organization_id);
create index websites_status_idx on public.websites (status);
create unique index websites_project_idx on public.websites (project_id) where project_id is not null;

create trigger websites_set_updated_at
  before update on public.websites
  for each row execute function vigil.set_updated_at();

alter table public.subscriptions
  add constraint subscriptions_website_fk
  foreign key (website_id) references public.websites (id) on delete set null;

alter table public.usage_records
  add constraint usage_records_website_fk
  foreign key (website_id) references public.websites (id) on delete set null;

-- --------------------------------------------------------------------------
-- domains
-- --------------------------------------------------------------------------
create table public.domains (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organizations (id) on delete cascade,
  website_id         uuid references public.websites (id) on delete set null,
  hostname           text not null unique,
  kind               public.domain_kind not null default 'apex',
  source             public.domain_source not null default 'customer_owned',
  status             public.domain_status not null default 'pending',
  registrar          text,
  registrant         jsonb not null default '{}'::jsonb,   -- customer-owned registrant record
  verification       jsonb not null default '{}'::jsonb,   -- records the customer must set
  dns_ok             boolean,
  ssl_ok             boolean,
  status_reason      text,
  auto_renew         boolean,
  expires_at         timestamptz,
  verified_at        timestamptz,
  connected_at       timestamptz,
  last_checked_at    timestamptz,
  metadata           jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint domains_hostname_lower check (hostname = lower(hostname)),
  constraint domains_hostname_format check (hostname ~ '^([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$')
);

create index domains_org_idx on public.domains (organization_id);
create index domains_website_idx on public.domains (website_id);
create index domains_status_idx on public.domains (status);
create index domains_expiry_idx on public.domains (expires_at) where expires_at is not null;

create trigger domains_set_updated_at
  before update on public.domains
  for each row execute function vigil.set_updated_at();

alter table public.websites
  add constraint websites_primary_domain_fk
  foreign key (primary_domain_id) references public.domains (id) on delete set null;

-- --------------------------------------------------------------------------
-- deployments
-- --------------------------------------------------------------------------
create table public.deployments (
  id             uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  website_id     uuid not null references public.websites (id) on delete cascade,
  environment    public.deployment_environment not null default 'production',
  status         public.deployment_status not null default 'queued',
  commit_ref     text,
  url            text,
  triggered_by   uuid references public.profiles (id) on delete set null,
  started_at     timestamptz,
  finished_at    timestamptz,
  error          jsonb,
  metadata       jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index deployments_website_idx on public.deployments (website_id, created_at desc);
create index deployments_org_idx on public.deployments (organization_id);

create trigger deployments_set_updated_at
  before update on public.deployments
  for each row execute function vigil.set_updated_at();

-- Deployments inherit the website's organization; never trust the caller.
create or replace function vigil.deployments_inherit_org()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select w.organization_id into new.organization_id
  from public.websites w where w.id = new.website_id;
  if new.organization_id is null then
    raise exception 'deployment references unknown website %', new.website_id;
  end if;
  return new;
end;
$$;

create trigger deployments_inherit_org
  before insert on public.deployments
  for each row execute function vigil.deployments_inherit_org();

-- --------------------------------------------------------------------------
-- provider_links: the only place provider identifiers are stored.
-- --------------------------------------------------------------------------
create table public.provider_links (
  id             uuid primary key default gen_random_uuid(),
  provider       public.provider not null,
  resource_kind  text not null,        -- 'customer' | 'subscription' | 'price' | 'project' | 'deployment' | 'zone' | 'registration' ...
  external_id    text not null,
  entity_type    text not null,        -- 'organization' | 'subscription' | 'plan_price' | 'website' | 'deployment' | 'domain'
  entity_id      uuid not null,
  metadata       jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (provider, resource_kind, external_id),
  constraint provider_links_kind_format check (resource_kind ~ '^[a-z][a-z0-9_]*$'),
  constraint provider_links_entity_format check (entity_type ~ '^[a-z][a-z0-9_]*$')
);

create index provider_links_entity_idx on public.provider_links (entity_type, entity_id);

create trigger provider_links_set_updated_at
  before update on public.provider_links
  for each row execute function vigil.set_updated_at();

-- --------------------------------------------------------------------------
-- RLS
-- --------------------------------------------------------------------------
alter table public.projects enable row level security;
alter table public.websites enable row level security;
alter table public.domains enable row level security;
alter table public.deployments enable row level security;
alter table public.provider_links enable row level security;

create policy projects_select on public.projects for select to authenticated
  using (vigil.is_staff() or vigil.is_org_member(organization_id));
create policy projects_staff_write on public.projects for all to authenticated
  using (vigil.is_staff()) with check (vigil.is_staff());

create policy websites_select on public.websites for select to authenticated
  using (vigil.is_staff() or vigil.is_org_member(organization_id));
create policy websites_staff_write on public.websites for all to authenticated
  using (vigil.is_staff()) with check (vigil.is_staff());

create policy domains_select on public.domains for select to authenticated
  using (vigil.is_staff() or vigil.is_org_member(organization_id));
-- Customers start the guided "I already own a domain" flow themselves.
create policy domains_member_insert on public.domains for insert to authenticated
  with check (
    vigil.is_staff()
    or (
      vigil.has_org_role(organization_id, array['owner','manager']::public.org_role[])
      and source = 'customer_owned'
      and status = 'pending'
    )
  );
create policy domains_staff_update on public.domains for update to authenticated
  using (vigil.is_staff()) with check (vigil.is_staff());
create policy domains_staff_delete on public.domains for delete to authenticated
  using (vigil.is_staff());

create policy deployments_select on public.deployments for select to authenticated
  using (vigil.is_staff() or vigil.is_org_member(organization_id));
create policy deployments_staff_write on public.deployments for all to authenticated
  using (vigil.is_staff()) with check (vigil.is_staff());

-- Provider identifiers are never customer-visible.
create policy provider_links_staff_all on public.provider_links for all to authenticated
  using (vigil.is_staff()) with check (vigil.is_staff());

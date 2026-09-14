-- 0008 Commerce: orders, one-time build prices, project assets, intake completion.

create type public.order_status as enum ('pending', 'paid', 'provisioned', 'failed', 'refunded', 'expired');
create type public.project_asset_kind as enum ('logo', 'photo', 'document', 'other');

-- --------------------------------------------------------------------------
-- build_prices: the one-time website build fee per project kind. Amounts are
-- rows so they can change without a deploy; provider price ids live in
-- provider_links (entity_type = 'build_price').
-- --------------------------------------------------------------------------
create table public.build_prices (
  id            uuid primary key default gen_random_uuid(),
  kind          public.project_kind not null unique,
  name          text not null,
  description   text,
  currency      text not null default 'usd',
  amount_cents  integer,                                  -- NULL = quoted separately
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint build_prices_amount_nonneg check (amount_cents is null or amount_cents >= 0)
);

create trigger build_prices_set_updated_at
  before update on public.build_prices
  for each row execute function vigil.set_updated_at();

insert into public.build_prices (kind, name, description, amount_cents) values
  ('express',      'Express Site',      'Pick a template, launch in days.',           59900),
  ('professional', 'Professional Site', 'Multi-page, custom design.',                 149900),
  ('custom',       'Custom Build',      'Quoted separately according to scope.',      null);

-- --------------------------------------------------------------------------
-- orders: one purchase intent. Created before checkout, paid by webhook,
-- provisioned by the job runner into an organization + project + website +
-- subscription. Anonymous buyers reach it only through the checkout token.
-- --------------------------------------------------------------------------
create table public.orders (
  id                uuid primary key default gen_random_uuid(),
  -- 64 hex chars from core functions only (pgcrypto is not guaranteed on the search path).
  checkout_token    text not null unique default encode(sha256(convert_to(gen_random_uuid()::text || clock_timestamp()::text || random()::text, 'UTF8')), 'hex'),
  status            public.order_status not null default 'pending',
  email             text not null,
  contact_name      text,
  business_name     text not null,
  project_kind      public.project_kind not null default 'express',
  template_slug     text,
  plan_id           uuid references public.plans (id) on delete restrict,
  build_price_id    uuid references public.build_prices (id) on delete set null,
  build_amount_cents integer,                              -- snapshot at checkout
  plan_amount_cents  integer,                              -- snapshot at checkout
  currency          text not null default 'usd',
  organization_id   uuid references public.organizations (id) on delete set null,
  project_id        uuid references public.projects (id) on delete set null,
  subscription_id   uuid references public.subscriptions (id) on delete set null,
  notes             text,                                  -- staff-only context for a sent link
  error             jsonb,
  metadata          jsonb not null default '{}'::jsonb,
  created_by        uuid references public.profiles (id) on delete set null,
  paid_at           timestamptz,
  provisioned_at    timestamptz,
  expires_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint orders_email_lower check (email = lower(email))
);

create index orders_status_idx on public.orders (status, created_at desc);
create index orders_email_idx on public.orders (email);
create index orders_org_idx on public.orders (organization_id);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function vigil.set_updated_at();

create trigger orders_audit_status
  after update of status on public.orders
  for each row execute function vigil.audit_status_change();

-- --------------------------------------------------------------------------
-- projects: when the customer finished the guided intake.
-- --------------------------------------------------------------------------
alter table public.projects add column intake_completed_at timestamptz;

-- --------------------------------------------------------------------------
-- project_assets: logos, photos and documents the customer supplies during
-- onboarding. Objects live in the project-assets bucket at
-- <organization_id>/<project_id>/<file>, same policy shape as attachments.
-- --------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-assets',
  'project-assets',
  false,
  20971520,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml', 'application/pdf']
)
on conflict (id) do nothing;

create policy "project assets: read own organization"
  on storage.objects for select to authenticated
  using (bucket_id = 'project-assets' and (vigil.is_staff() or vigil.is_org_member(vigil.path_organization(name))));

create policy "project assets: upload into own organization"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'project-assets' and (vigil.is_staff() or vigil.is_org_member(vigil.path_organization(name))));

create policy "project assets: delete own or staff"
  on storage.objects for delete to authenticated
  using (bucket_id = 'project-assets' and (vigil.is_staff() or owner = (select auth.uid())));

create table public.project_assets (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  project_id       uuid not null references public.projects (id) on delete cascade,
  kind             public.project_asset_kind not null default 'photo',
  bucket_id        text not null default 'project-assets',
  object_path      text not null unique,
  file_name        text not null,
  content_type     text not null,
  size_bytes       integer not null,
  caption          text,
  uploaded_by      uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  constraint project_assets_size check (size_bytes >= 0 and size_bytes <= 20971520),
  constraint project_assets_path_org check (vigil.path_organization(object_path) = organization_id)
);

create index project_assets_project_idx on public.project_assets (project_id);

create trigger project_assets_enforce_same_org
  before insert or update of project_id, organization_id on public.project_assets
  for each row execute function vigil.enforce_same_org_references();

-- --------------------------------------------------------------------------
-- RLS
-- --------------------------------------------------------------------------
alter table public.build_prices enable row level security;
alter table public.orders enable row level security;
alter table public.project_assets enable row level security;

-- Build prices are public catalog: the checkout page is anonymous.
create policy build_prices_select on public.build_prices for select to anon, authenticated using (is_active);
create policy build_prices_admin_write on public.build_prices for all to authenticated
  using (vigil.is_admin()) with check (vigil.is_admin());

-- Plans and plan prices are needed by the anonymous checkout page too.
create policy plans_select_anon on public.plans for select to anon using (is_active);
create policy plan_prices_select_anon on public.plan_prices for select to anon using (is_active);
create policy plan_features_select_anon on public.plan_features for select to anon using (true);
create policy features_select_anon on public.features for select to anon using (true);

-- Orders: staff read and write; the organization's members can see their own
-- once provisioned; anonymous access is only through server-side code.
create policy orders_select on public.orders for select to authenticated
  using (vigil.is_staff() or (organization_id is not null and vigil.is_org_member(organization_id)));
create policy orders_staff_write on public.orders for all to authenticated
  using (vigil.is_staff()) with check (vigil.is_staff());

-- Project assets: members of the organization read and add; owners/managers
-- and staff remove.
create policy project_assets_select on public.project_assets for select to authenticated
  using (vigil.is_staff() or vigil.is_org_member(organization_id));
create policy project_assets_insert on public.project_assets for insert to authenticated
  with check (vigil.is_staff() or vigil.is_org_member(organization_id));
create policy project_assets_delete on public.project_assets for delete to authenticated
  using (vigil.is_staff() or uploaded_by = (select auth.uid()) or vigil.has_org_role(organization_id, array['owner','manager']::public.org_role[]));

-- Customers fill in the brief and mark intake complete on their own project;
-- everything else on projects stays staff-only.
create policy projects_member_update on public.projects for update to authenticated
  using (vigil.is_org_member(organization_id))
  with check (vigil.is_org_member(organization_id));

create trigger projects_protect_columns
  before update on public.projects
  for each row execute function vigil.protect_columns_from_customers(
    'id', 'organization_id', 'name', 'kind', 'status', 'template_slug', 'source_ref',
    'launch_target', 'launched_at', 'closed_at', 'created_by', 'created_at'
  );

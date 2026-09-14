-- 0003 Product catalog and entitlements: plans, prices, features, subscriptions.
--
-- Nothing commercial is hard-coded. Plan rows exist so the rest of the schema
-- has something to reference; prices are absent until approved; feature values
-- are structural defaults an admin edits in /admin/plans.

-- --------------------------------------------------------------------------
-- plans
-- --------------------------------------------------------------------------
create table public.plans (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique,                 -- basic | care | growth | priority
  name         text not null,
  tagline      text,
  description  text,
  tier_rank    integer not null,                     -- ordering for "highest plan wins"
  is_active    boolean not null default true,
  is_public    boolean not null default false,       -- shown on the public site
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint plans_code_format check (code ~ '^[a-z][a-z0-9_]*$')
);

create trigger plans_set_updated_at
  before update on public.plans
  for each row execute function vigil.set_updated_at();

-- --------------------------------------------------------------------------
-- plan_prices: one row per (plan, currency, interval). amount_cents is NULL
-- until pricing is approved. Provider price ids live in provider_links.
-- --------------------------------------------------------------------------
create table public.plan_prices (
  id            uuid primary key default gen_random_uuid(),
  plan_id       uuid not null references public.plans (id) on delete cascade,
  currency      text not null default 'usd',
  interval      public.billing_interval not null default 'month',
  amount_cents  integer,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (plan_id, currency, interval),
  constraint plan_prices_currency_lower check (currency = lower(currency)),
  constraint plan_prices_amount_nonneg check (amount_cents is null or amount_cents >= 0)
);

create trigger plan_prices_set_updated_at
  before update on public.plan_prices
  for each row execute function vigil.set_updated_at();

-- --------------------------------------------------------------------------
-- features: the registry of everything a plan can grant.
-- --------------------------------------------------------------------------
create table public.features (
  code           text primary key,
  name           text not null,
  description    text,
  value_kind     public.feature_value_kind not null,
  default_value  jsonb not null,                    -- what an org with no plan gets
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint features_code_format check (code ~ '^[a-z][a-z0-9_.]*$')
);

create trigger features_set_updated_at
  before update on public.features
  for each row execute function vigil.set_updated_at();

-- --------------------------------------------------------------------------
-- plan_features: per-plan value for a feature.
-- --------------------------------------------------------------------------
create table public.plan_features (
  plan_id       uuid not null references public.plans (id) on delete cascade,
  feature_code  text not null references public.features (code) on delete cascade,
  value         jsonb not null,
  updated_at    timestamptz not null default now(),
  primary key (plan_id, feature_code)
);

create trigger plan_features_set_updated_at
  before update on public.plan_features
  for each row execute function vigil.set_updated_at();

-- --------------------------------------------------------------------------
-- subscriptions: the Vigil subscription for an organization (optionally a
-- specific website). Provider subscription ids live in provider_links.
-- --------------------------------------------------------------------------
create table public.subscriptions (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations (id) on delete cascade,
  website_id            uuid,                       -- fk added in 0004 once websites exist
  plan_id               uuid not null references public.plans (id) on delete restrict,
  plan_price_id         uuid references public.plan_prices (id) on delete set null,
  status                public.subscription_status not null default 'incomplete',
  current_period_start  timestamptz,
  current_period_end    timestamptz,
  trial_end             timestamptz,
  cancel_at_period_end  boolean not null default false,
  canceled_at           timestamptz,
  ended_at              timestamptz,
  metadata              jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index subscriptions_org_idx on public.subscriptions (organization_id);
create index subscriptions_status_idx on public.subscriptions (status);
create index subscriptions_website_idx on public.subscriptions (website_id) where website_id is not null;

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function vigil.set_updated_at();

-- --------------------------------------------------------------------------
-- entitlement_overrides: staff-granted exceptions per organization.
-- --------------------------------------------------------------------------
create table public.entitlement_overrides (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  feature_code     text not null references public.features (code) on delete cascade,
  value            jsonb not null,
  reason           text,
  granted_by       uuid references public.profiles (id) on delete set null,
  expires_at       timestamptz,
  created_at       timestamptz not null default now(),
  unique (organization_id, feature_code)
);

create index entitlement_overrides_org_idx on public.entitlement_overrides (organization_id);

-- --------------------------------------------------------------------------
-- usage_records: metered consumption against a limit feature.
-- --------------------------------------------------------------------------
create table public.usage_records (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  website_id       uuid,                            -- fk added in 0004
  feature_code     text not null references public.features (code) on delete cascade,
  quantity         numeric not null default 1,
  period_start     timestamptz not null,
  period_end       timestamptz not null,
  source           text,                            -- e.g. 'change_request', 'virtue'
  reference_type   text,
  reference_id     uuid,
  created_at       timestamptz not null default now(),
  constraint usage_records_period check (period_end > period_start)
);

create index usage_records_org_period_idx
  on public.usage_records (organization_id, feature_code, period_start, period_end);

-- --------------------------------------------------------------------------
-- Effective entitlements for an organization: feature default, overridden by
-- the highest-ranked active subscription's plan, overridden by a live override.
-- Returned as (feature_code, value, source). Callers that only need a single
-- feature filter on feature_code.
-- --------------------------------------------------------------------------
create or replace function vigil.resolve_entitlements(p_org uuid)
returns table (feature_code text, value jsonb, source text, plan_code text)
language sql
stable
security definer
set search_path = ''
as $$
  with active_plan as (
    select p.id, p.code, p.tier_rank
    from public.subscriptions s
    join public.plans p on p.id = s.plan_id
    where s.organization_id = p_org
      and s.status in ('active', 'trialing', 'past_due')
    order by p.tier_rank desc, s.created_at desc
    limit 1
  )
  select
    f.code as feature_code,
    coalesce(o.value, pf.value, f.default_value) as value,
    case
      when o.value is not null then 'override'
      when pf.value is not null then 'plan'
      else 'default'
    end as source,
    (select code from active_plan) as plan_code
  from public.features f
  left join active_plan ap on true
  left join public.plan_features pf
    on pf.plan_id = ap.id and pf.feature_code = f.code
  left join public.entitlement_overrides o
    on o.organization_id = p_org
   and o.feature_code = f.code
   and (o.expires_at is null or o.expires_at > now())
  where vigil.is_staff() or vigil.is_org_member(p_org);
$$;

grant execute on function vigil.resolve_entitlements(uuid) to authenticated, service_role;

-- --------------------------------------------------------------------------
-- RLS
-- --------------------------------------------------------------------------
alter table public.plans enable row level security;
alter table public.plan_prices enable row level security;
alter table public.features enable row level security;
alter table public.plan_features enable row level security;
alter table public.subscriptions enable row level security;
alter table public.entitlement_overrides enable row level security;
alter table public.usage_records enable row level security;

-- Catalog: everyone signed in can read; admins write.
create policy plans_select on public.plans for select to authenticated using (true);
create policy plans_admin_write on public.plans for all to authenticated
  using (vigil.is_admin()) with check (vigil.is_admin());

create policy plan_prices_select on public.plan_prices for select to authenticated using (true);
create policy plan_prices_admin_write on public.plan_prices for all to authenticated
  using (vigil.is_admin()) with check (vigil.is_admin());

create policy features_select on public.features for select to authenticated using (true);
create policy features_admin_write on public.features for all to authenticated
  using (vigil.is_admin()) with check (vigil.is_admin());

create policy plan_features_select on public.plan_features for select to authenticated using (true);
create policy plan_features_admin_write on public.plan_features for all to authenticated
  using (vigil.is_admin()) with check (vigil.is_admin());

-- Subscriptions: members read their own; staff write.
create policy subscriptions_select on public.subscriptions for select to authenticated
  using (vigil.is_staff() or vigil.is_org_member(organization_id));
create policy subscriptions_staff_write on public.subscriptions for all to authenticated
  using (vigil.is_staff()) with check (vigil.is_staff());

-- Overrides: members may see what they were granted; admins write.
create policy entitlement_overrides_select on public.entitlement_overrides for select to authenticated
  using (vigil.is_staff() or vigil.is_org_member(organization_id));
create policy entitlement_overrides_admin_write on public.entitlement_overrides for all to authenticated
  using (vigil.is_admin()) with check (vigil.is_admin());

-- Usage: members read their own; only staff/service role write.
create policy usage_records_select on public.usage_records for select to authenticated
  using (vigil.is_staff() or vigil.is_org_member(organization_id));
create policy usage_records_staff_write on public.usage_records for all to authenticated
  using (vigil.is_staff()) with check (vigil.is_staff());

-- --------------------------------------------------------------------------
-- Seed: plan codes and the feature registry. No prices. Values are structural
-- (which surfaces exist at which tier per the master architecture), not
-- allowances — every limit is NULL, meaning "not yet decided".
-- --------------------------------------------------------------------------
insert into public.plans (code, name, tagline, tier_rank, is_active, is_public) values
  ('basic',    'Vigil Basic',    'Keep me online',                        10, true, false),
  ('care',     'Vigil Care',     'Take care of my website',               20, true, false),
  ('growth',   'Vigil Growth',   'Help me grow my business',              30, true, false),
  ('priority', 'Vigil Priority', 'Operate and grow at a higher level',    40, true, false);

insert into public.features (code, name, description, value_kind, default_value) values
  ('dashboard.enabled',        'Vigil Dashboard access',        'Can sign in to the client dashboard.',                       'boolean', 'true'),
  ('hosting.managed',          'Managed hosting',               'Website is hosted and deployed by Vigil.',                    'boolean', 'false'),
  ('domain.managed',           'Managed domain',                'Domain status and connection are managed by Vigil.',          'boolean', 'false'),
  ('requests.enabled',         'Website change requests',       'Can submit website update requests.',                         'boolean', 'false'),
  ('requests.monthly_allowance','Monthly request allowance',    'Included change requests per month. NULL = not yet decided.', 'limit',   'null'),
  ('leads.enabled',            'Lead Hub',                      'Leads surface in the dashboard.',                             'boolean', 'false'),
  ('insights.enabled',         'Vigil Insights',                'Reporting and insights.',                                     'boolean', 'false'),
  ('insights.level',           'Insights depth',                'basic | advanced | deep. NULL = not yet decided.',            'text',    'null'),
  ('virtue.enabled',           'Virtue',                        'The AI employee is available.',                               'boolean', 'false'),
  ('virtue.level',             'Virtue capability level',       'standard | priority. NULL = not yet decided.',                'text',    'null'),
  ('support.level',            'Support level',                 'automated | standard | priority. NULL = not yet decided.',    'text',    'null');

-- Structural entitlements per tier. Only booleans that the master
-- architecture states outright; everything else stays at the feature default.
insert into public.plan_features (plan_id, feature_code, value)
select p.id, f.code, f.value::jsonb
from public.plans p
join (values
  ('basic',    'hosting.managed',   'true'),
  ('basic',    'domain.managed',    'true'),
  ('care',     'hosting.managed',   'true'),
  ('care',     'domain.managed',    'true'),
  ('care',     'requests.enabled',  'true'),
  ('growth',   'hosting.managed',   'true'),
  ('growth',   'domain.managed',    'true'),
  ('growth',   'requests.enabled',  'true'),
  ('growth',   'leads.enabled',     'true'),
  ('growth',   'insights.enabled',  'true'),
  ('growth',   'virtue.enabled',    'true'),
  ('priority', 'hosting.managed',   'true'),
  ('priority', 'domain.managed',    'true'),
  ('priority', 'requests.enabled',  'true'),
  ('priority', 'leads.enabled',     'true'),
  ('priority', 'insights.enabled',  'true'),
  ('priority', 'virtue.enabled',    'true')
) as f (plan_code, code, value) on f.plan_code = p.code;

-- Price rows exist so the admin screen has something to fill in; amounts are
-- deliberately NULL (master architecture §4: prices are not approved).
insert into public.plan_prices (plan_id, currency, interval, amount_cents)
select id, 'usd', 'month', null from public.plans;

-- API wrapper (see 0002 for the reasoning).
create or replace function public.resolve_entitlements(p_org uuid)
returns table (feature_code text, value jsonb, source text, plan_code text)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from vigil.resolve_entitlements(p_org);
$$;
grant execute on function public.resolve_entitlements(uuid) to authenticated, service_role;

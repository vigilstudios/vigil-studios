-- Saved template drafts are staff-only; the public projection exposes published snapshots only.
create table public.express_variants (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
 draft jsonb not null check (jsonb_typeof(draft) = 'object'),
 published jsonb check (published is null or jsonb_typeof(published) = 'object'),
 revision integer not null default 1 check (revision > 0),
 published_revision integer,
 sort_order integer not null default 100,
 archived_at timestamptz,
 updated_by uuid references public.profiles(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (published_revision is null or published_revision <= revision)
);
create trigger express_variants_updated before update on public.express_variants
 for each row execute function vigil.set_updated_at();
alter table public.express_variants enable row level security;
create policy express_variants_staff on public.express_variants for all to authenticated
 using (vigil.is_staff()) with check (vigil.is_staff());
revoke all on public.express_variants from anon;
grant select,insert,update,delete on public.express_variants to authenticated,service_role;
-- Owner-executed view is intentional: no drafts, authors, or archived variants are exposed.
create view public.published_express_variants with (security_barrier = true) as
 select slug,published,sort_order from public.express_variants
 where archived_at is null and published is not null;
grant select on public.published_express_variants to anon,authenticated,service_role;

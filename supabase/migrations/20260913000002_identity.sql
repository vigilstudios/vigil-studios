-- 0002 Identity and tenancy: profiles, staff, organizations, memberships, invites.

-- --------------------------------------------------------------------------
-- profiles: one row per auth user, created by trigger.
-- --------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function vigil.set_updated_at();

create or replace function vigil.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function vigil.handle_new_auth_user();

-- Keep profiles.email in step with auth.users.email.
create or replace function vigil.handle_auth_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = coalesce(new.email, '') where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function vigil.handle_auth_user_email_change();

-- --------------------------------------------------------------------------
-- staff_members: Vigil's own people. Written only by admins or service role.
-- --------------------------------------------------------------------------
create table public.staff_members (
  user_id     uuid primary key references public.profiles (id) on delete cascade,
  role        public.staff_role not null default 'staff',
  granted_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- organizations: the tenant.
-- --------------------------------------------------------------------------
create table public.organizations (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  name           text not null,
  legal_name     text,
  status         public.organization_status not null default 'active',
  billing_email  text,
  phone          text,
  website_url    text,
  address        jsonb not null default '{}'::jsonb,
  timezone       text not null default 'America/New_York',
  notes          text,                  -- staff-only, see column privileges below
  created_by     uuid references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint organizations_slug_format check (slug ~ '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$')
);

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function vigil.set_updated_at();

-- --------------------------------------------------------------------------
-- organization_members
-- --------------------------------------------------------------------------
create table public.organization_members (
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  user_id          uuid not null references public.profiles (id) on delete cascade,
  role             public.org_role not null default 'member',
  status           public.membership_status not null default 'active',
  invited_by       uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index organization_members_user_idx on public.organization_members (user_id);

create trigger organization_members_set_updated_at
  before update on public.organization_members
  for each row execute function vigil.set_updated_at();

-- --------------------------------------------------------------------------
-- organization_invites: email invitations, accepted on sign-in.
-- --------------------------------------------------------------------------
create table public.organization_invites (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  email            text not null,
  role             public.org_role not null default 'member',
  invited_by       uuid references public.profiles (id) on delete set null,
  expires_at       timestamptz not null default (now() + interval '14 days'),
  accepted_at      timestamptz,
  accepted_by      uuid references public.profiles (id) on delete set null,
  revoked_at       timestamptz,
  created_at       timestamptz not null default now(),
  constraint organization_invites_email_lower check (email = lower(email))
);

create index organization_invites_email_idx on public.organization_invites (email)
  where accepted_at is null and revoked_at is null;
create index organization_invites_org_idx on public.organization_invites (organization_id);

-- --------------------------------------------------------------------------
-- Authorization helpers. STABLE + SECURITY DEFINER so policies can consult
-- membership tables without recursing into their own policies.
-- --------------------------------------------------------------------------
create or replace function vigil.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff_members s
    where s.user_id = (select auth.uid())
  );
$$;

create or replace function vigil.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff_members s
    where s.user_id = (select auth.uid()) and s.role = 'admin'
  );
$$;

create or replace function vigil.org_role(p_org uuid)
returns public.org_role
language sql
stable
security definer
set search_path = ''
as $$
  select m.role from public.organization_members m
  where m.organization_id = p_org
    and m.user_id = (select auth.uid())
    and m.status = 'active';
$$;

create or replace function vigil.is_org_member(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = p_org
      and m.user_id = (select auth.uid())
      and m.status = 'active'
  );
$$;

create or replace function vigil.has_org_role(p_org uuid, p_roles public.org_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = p_org
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and m.role = any (p_roles)
  );
$$;

-- Organizations the caller belongs to; used by policies on profiles so members
-- of the same organization can see each other's names.
create or replace function vigil.shares_org_with(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members mine
    join public.organization_members theirs
      on theirs.organization_id = mine.organization_id
    where mine.user_id = (select auth.uid())
      and mine.status = 'active'
      and theirs.user_id = p_user
  );
$$;

-- Called from the auth callback after sign-in: turns pending invites for the
-- signed-in email into memberships. Idempotent.
create or replace function vigil.accept_invites_for_current_user()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user  uuid := (select auth.uid());
  v_email text;
  v_count integer := 0;
  r record;
begin
  if v_user is null then
    return 0;
  end if;

  select lower(email) into v_email from public.profiles where id = v_user;
  if v_email is null then
    return 0;
  end if;

  for r in
    select * from public.organization_invites i
    where i.email = v_email
      and i.accepted_at is null
      and i.revoked_at is null
      and i.expires_at > now()
  loop
    insert into public.organization_members (organization_id, user_id, role, invited_by)
    values (r.organization_id, v_user, r.role, r.invited_by)
    on conflict (organization_id, user_id) do nothing;

    update public.organization_invites
      set accepted_at = now(), accepted_by = v_user
      where id = r.id;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

grant execute on function vigil.is_staff() to authenticated, service_role;
grant execute on function vigil.is_admin() to authenticated, service_role;
grant execute on function vigil.org_role(uuid) to authenticated, service_role;
grant execute on function vigil.is_org_member(uuid) to authenticated, service_role;
grant execute on function vigil.has_org_role(uuid, public.org_role[]) to authenticated, service_role;
grant execute on function vigil.shares_org_with(uuid) to authenticated, service_role;
grant execute on function vigil.accept_invites_for_current_user() to authenticated, service_role;

-- --------------------------------------------------------------------------
-- Row-level security
-- --------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.staff_members enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_invites enable row level security;

-- profiles
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or vigil.is_staff()
    or vigil.shares_org_with(id)
  );

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Customers must not rewrite their own email through the API; auth owns it.
create trigger profiles_protect_columns
  before update on public.profiles
  for each row execute function vigil.protect_columns_from_customers('id', 'email', 'created_at');

-- staff_members: readable by staff (and by the row's own user so the DAL can
-- resolve "am I staff" without a definer call); written only by admins.
create policy staff_members_select on public.staff_members
  for select to authenticated
  using (user_id = (select auth.uid()) or vigil.is_staff());

create policy staff_members_admin_write on public.staff_members
  for all to authenticated
  using (vigil.is_admin())
  with check (vigil.is_admin());

-- organizations
create policy organizations_select on public.organizations
  for select to authenticated
  using (vigil.is_staff() or vigil.is_org_member(id));

create policy organizations_insert_staff on public.organizations
  for insert to authenticated
  with check (vigil.is_staff());

create policy organizations_update on public.organizations
  for update to authenticated
  using (vigil.is_staff() or vigil.has_org_role(id, array['owner','manager']::public.org_role[]))
  with check (vigil.is_staff() or vigil.has_org_role(id, array['owner','manager']::public.org_role[]));

create policy organizations_delete_admin on public.organizations
  for delete to authenticated
  using (vigil.is_admin());

-- Owners edit the business profile; only staff touch status, slug and notes.
create trigger organizations_protect_columns
  before update on public.organizations
  for each row execute function vigil.protect_columns_from_customers(
    'id', 'slug', 'status', 'notes', 'created_by', 'created_at'
  );

-- organization_members
create policy organization_members_select on public.organization_members
  for select to authenticated
  using (vigil.is_staff() or vigil.is_org_member(organization_id));

create policy organization_members_insert on public.organization_members
  for insert to authenticated
  with check (
    vigil.is_staff()
    or vigil.has_org_role(organization_id, array['owner','manager']::public.org_role[])
  );

create policy organization_members_update on public.organization_members
  for update to authenticated
  using (
    vigil.is_staff()
    or vigil.has_org_role(organization_id, array['owner']::public.org_role[])
  )
  with check (
    vigil.is_staff()
    or vigil.has_org_role(organization_id, array['owner']::public.org_role[])
  );

create policy organization_members_delete on public.organization_members
  for delete to authenticated
  using (
    vigil.is_staff()
    or vigil.has_org_role(organization_id, array['owner']::public.org_role[])
    or user_id = (select auth.uid())            -- leave an organization
  );

-- The last owner cannot be removed or demoted.
create or replace function vigil.protect_last_owner()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_org uuid := coalesce(old.organization_id, new.organization_id);
  v_owners integer;
begin
  if tg_op = 'DELETE' or (tg_op = 'UPDATE' and (new.role <> 'owner' or new.status <> 'active')) then
    if old.role = 'owner' and old.status = 'active' then
      select count(*) into v_owners
      from public.organization_members m
      where m.organization_id = v_org
        and m.role = 'owner'
        and m.status = 'active'
        and m.user_id <> old.user_id;
      if v_owners = 0 then
        raise exception 'an organization must keep at least one active owner'
          using errcode = '23514';
      end if;
    end if;
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger organization_members_protect_last_owner
  before update or delete on public.organization_members
  for each row execute function vigil.protect_last_owner();

-- organization_invites
create policy organization_invites_select on public.organization_invites
  for select to authenticated
  using (
    vigil.is_staff()
    or vigil.has_org_role(organization_id, array['owner','manager']::public.org_role[])
  );

create policy organization_invites_insert on public.organization_invites
  for insert to authenticated
  with check (
    vigil.is_staff()
    or vigil.has_org_role(organization_id, array['owner','manager']::public.org_role[])
  );

create policy organization_invites_update on public.organization_invites
  for update to authenticated
  using (
    vigil.is_staff()
    or vigil.has_org_role(organization_id, array['owner','manager']::public.org_role[])
  )
  with check (
    vigil.is_staff()
    or vigil.has_org_role(organization_id, array['owner','manager']::public.org_role[])
  );

create policy organization_invites_delete on public.organization_invites
  for delete to authenticated
  using (
    vigil.is_staff()
    or vigil.has_org_role(organization_id, array['owner','manager']::public.org_role[])
  );

-- Minimal stand-in for the parts of a Supabase project the migrations touch,
-- so they can be validated against a plain PostgreSQL. Never run this against
-- a real Supabase database.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end
$$;

create schema if not exists auth;
create schema if not exists extensions;

create table if not exists auth.users (
  id                 uuid primary key,
  email              text,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now()
);

-- Supabase reads the JWT claims from request.jwt.claims.
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(
    coalesce(
      current_setting('request.jwt.claim.sub', true),
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    ),
    ''
  )::uuid
$$;

create or replace function auth.role()
returns text
language sql
stable
as $$
  select nullif(
    coalesce(
      current_setting('request.jwt.claim.role', true),
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
    ),
    ''
  )::text
$$;

create or replace function auth.jwt()
returns jsonb
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')
  )::jsonb
$$;

grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
grant execute on function auth.role() to anon, authenticated, service_role;
grant execute on function auth.jwt() to anon, authenticated, service_role;

-- Supabase's default privileges for the API roles.
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

-- --------------------------------------------------------------------------
-- Legacy prototype fixtures, mirroring what the real project held on
-- 13 Sep 2026, so 0000_retire_legacy_portal is exercised by the validation.
-- --------------------------------------------------------------------------
create table public.profiles (id uuid primary key, email text, created_at timestamptz default now());
create table public.clients (id uuid primary key default gen_random_uuid(), profile_id uuid, company_name text, contact_name text, contact_email text, created_at timestamptz default now());
create table public.projects (id uuid primary key default gen_random_uuid(), client_id uuid references public.clients (id), project_name text, package_name text, current_phase text, created_at timestamptz default now());
create table public.project_phase_progress (id uuid primary key default gen_random_uuid(), project_id uuid references public.projects (id), phase text, progress int);
create table public.onboarding_steps (id uuid primary key default gen_random_uuid(), project_id uuid references public.projects (id), title text);
create table public.project_files (id uuid primary key default gen_random_uuid(), project_id uuid references public.projects (id), file_name text);
insert into public.clients (id, company_name) values ('04bde33c-a596-49a3-ba46-769ca74b9455', 'Vigil Studios Demo Client');
insert into public.projects (client_id, project_name) values ('04bde33c-a596-49a3-ba46-769ca74b9455', 'Demo Website Build');

create function public.handle_new_user() returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

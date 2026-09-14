-- 0001 Foundation: helper schema, utility functions, enums.
--
-- Every table lives in `public` so PostgREST exposes it under the usual
-- Supabase rules. Helper functions live in `vigil` so they cannot be confused
-- with tenant data and so the API schema stays clean.
--
-- All security-definer helpers set an empty search_path and use fully
-- qualified names: a caller cannot smuggle in a same-named object.

create schema if not exists vigil;

grant usage on schema vigil to anon, authenticated, service_role;

-- --------------------------------------------------------------------------
-- updated_at maintenance
-- --------------------------------------------------------------------------
create or replace function vigil.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- --------------------------------------------------------------------------
-- Enumerations. Adding a value later is `alter type ... add value`; removing
-- one is a migration that rewrites rows first. Keep them small.
-- --------------------------------------------------------------------------
create type public.org_role as enum ('owner', 'manager', 'member');
create type public.staff_role as enum ('staff', 'admin');
create type public.membership_status as enum ('active', 'suspended');
create type public.organization_status as enum ('active', 'suspended', 'offboarding', 'closed');

create type public.project_kind as enum ('express', 'professional', 'custom');
create type public.project_status as enum (
  'draft', 'intake', 'in_progress', 'review', 'approved', 'launched', 'closed', 'cancelled'
);

create type public.website_status as enum (
  'provisioning', 'building', 'live', 'paused', 'suspended', 'archived', 'error'
);
create type public.code_ownership as enum ('customer_owned', 'vigil_owned');

create type public.domain_kind as enum ('apex', 'subdomain');
create type public.domain_source as enum ('purchased_via_vigil', 'customer_owned', 'vigil_managed');
create type public.domain_status as enum (
  'pending', 'verifying', 'connected', 'error', 'expired', 'released'
);

create type public.deployment_environment as enum ('production', 'preview');
create type public.deployment_status as enum ('queued', 'building', 'ready', 'error', 'canceled');

create type public.billing_interval as enum ('month', 'year');
create type public.subscription_status as enum (
  'incomplete', 'trialing', 'active', 'past_due', 'unpaid', 'paused', 'canceled'
);

create type public.feature_value_kind as enum ('boolean', 'limit', 'text');

create type public.provider as enum ('stripe', 'vercel', 'cloudflare', 'resend', 'other');

create type public.job_status as enum ('queued', 'running', 'succeeded', 'failed', 'canceled');

create type public.actor_kind as enum ('user', 'staff', 'system', 'provider');

create type public.webhook_status as enum ('received', 'processed', 'failed', 'ignored');

create type public.change_request_status as enum (
  'draft', 'submitted', 'triaged', 'in_progress', 'delivered', 'closed', 'declined'
);
create type public.change_request_priority as enum ('low', 'normal', 'high');

create type public.lead_status as enum ('new', 'contacted', 'qualified', 'won', 'lost', 'spam');

-- --------------------------------------------------------------------------
-- Column protection. Staff and the service role share the `authenticated`
-- database role with customers, so column-level GRANTs cannot tell them apart.
-- This trigger refuses customer changes to the named columns while leaving
-- staff (and server-side service-role calls, where auth.uid() is null) free.
-- Usage: execute function vigil.protect_columns_from_customers('col_a', 'col_b')
-- --------------------------------------------------------------------------
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
  if (select auth.uid()) is null or vigil.is_staff() then
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

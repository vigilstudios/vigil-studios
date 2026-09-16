-- Dashboard attention markers and status cards are server-rendered. Publish
-- their source tables so connected layouts can refresh immediately.

do $$
declare
  v_table text;
  v_tables text[] := array[
    'audit_events',
    'change_requests',
    'deployments',
    'domains',
    'entitlement_overrides',
    'notifications',
    'organization_invites',
    'organization_members',
    'organizations',
    'orders',
    'project_review_responses',
    'project_review_rounds',
    'project_review_submissions',
    'projects',
    'provisioning_jobs',
    'subscriptions',
    'websites'
  ];
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach v_table in array v_tables loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = v_table
      ) then
        execute format('alter publication supabase_realtime add table public.%I', v_table);
      end if;
    end loop;
  end if;
end $$;

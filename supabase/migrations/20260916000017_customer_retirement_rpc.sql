-- PostgREST exposes `public`, not the private `vigil` schema. These narrow
-- wrappers preserve the authorization and transaction boundaries enforced by
-- the underlying functions while making the admin server actions callable.

create or replace function public.archive_customer(p_organization_id uuid, p_actor_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$ select vigil.archive_organization(p_organization_id, p_actor_id); $$;

create or replace function public.restore_customer(p_organization_id uuid, p_actor_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$ select vigil.restore_organization(p_organization_id, p_actor_id); $$;

create or replace function public.purge_customer(
  p_organization_id uuid,
  p_snapshot jsonb,
  p_cleanup jsonb,
  p_deleted_by uuid
) returns void
language sql
security invoker
set search_path = ''
as $$ select vigil.purge_organization(p_organization_id, p_snapshot, p_cleanup, p_deleted_by); $$;

revoke all on function public.archive_customer(uuid, uuid) from public;
revoke all on function public.restore_customer(uuid, uuid) from public;
revoke all on function public.purge_customer(uuid, jsonb, jsonb, uuid) from public;
grant execute on function public.archive_customer(uuid, uuid) to authenticated, service_role;
grant execute on function public.restore_customer(uuid, uuid) to authenticated, service_role;
grant execute on function public.purge_customer(uuid, jsonb, jsonb, uuid) to authenticated, service_role;

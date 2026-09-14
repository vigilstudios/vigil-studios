-- 0000 Retire the pre-Dashboard portal prototype.
--
-- The Supabase project already held hand-made tables from the June 2026
-- client-portal prototype (profiles, clients, projects, project_phase_progress,
-- onboarding_steps, project_files) with one demo client, and no row-level
-- security. Two of the names collide with Dashboard V1. Rename rather than
-- drop: nothing is lost, the old rows stay inspectable as legacy_*, and the
-- rename is reversible. RLS is enabled on them with no policies so the anon
-- key can no longer read them through the API.
--
-- Safe to run on a fresh project: every statement is conditional.

do $$
declare
  t text;
begin
  foreach t in array array['profiles', 'clients', 'projects', 'project_phase_progress', 'onboarding_steps', 'project_files']
  loop
    if to_regclass(format('public.%I', t)) is not null
       and to_regclass(format('public.legacy_%s', t)) is null then
      execute format('alter table public.%I rename to %I', t, 'legacy_' || t);
      execute format('alter table public.%I enable row level security', 'legacy_' || t);
    end if;
  end loop;
end
$$;

-- The prototype's sign-up trigger wrote into the old profiles table. Any
-- user-defined trigger on auth.users whose function lives in `public` is the
-- prototype's; Supabase's own triggers use functions in auth/extensions.
do $$
declare
  r record;
begin
  for r in
    select t.tgname, p.proname, p.oid as fnoid
    from pg_trigger t
    join pg_proc p on p.oid = t.tgfoid
    join pg_namespace n on n.oid = p.pronamespace
    where t.tgrelid = 'auth.users'::regclass
      and not t.tgisinternal
      and n.nspname = 'public'
  loop
    execute format('drop trigger if exists %I on auth.users', r.tgname);
    execute format('drop function if exists %s cascade', r.fnoid::regprocedure);
  end loop;
end
$$;

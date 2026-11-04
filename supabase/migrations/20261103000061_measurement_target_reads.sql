-- The reporting worker resolves targets through PostgREST with service_role.
-- Hosted preview branches do not necessarily inherit production's default grants.
-- Make these read dependencies explicit without granting target mutation rights.
grant select on public.websites, public.organizations, public.provider_links to service_role;

-- RLS and integrity assertions. Runs after the migrations on a database that
-- has the auth shim loaded (scripts/db-validate.sh). Every block raises on
-- the first failed expectation.

create schema if not exists test;
grant usage on schema test to anon, authenticated, service_role;
alter default privileges in schema test grant execute on functions to anon, authenticated, service_role;

create or replace function test.login(p_sub uuid, p_role text default 'authenticated')
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_sub, 'role', p_role)::text, true);
  execute format('set local role %I', p_role);
end $$;

create or replace function test.login_service()
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('role', 'service_role')::text, true);
  execute 'set local role service_role';
end $$;

create or replace function test.login_anon()
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  execute 'set local role anon';
end $$;

create or replace function test.logout()
returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);
end $$;

create or replace function test.count(p_sql text)
returns bigint language plpgsql as $$
declare n bigint;
begin
  execute 'select count(*) from (' || p_sql || ') q' into n;
  return n;
end $$;

create or replace function test.ok(p_cond boolean, p_msg text)
returns void language plpgsql as $$
begin
  if not coalesce(p_cond, false) then
    raise exception 'ASSERTION FAILED: %', p_msg;
  end if;
  raise notice 'ok - %', p_msg;
end $$;

-- Runs p_sql and asserts it raised. Uses a nested block so the failure is
-- contained in a subtransaction.
create or replace function test.fails(p_sql text, p_msg text)
returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    raise notice 'ok - % (refused: %)', p_msg, sqlerrm;
    return;
  end;
  raise exception 'ASSERTION FAILED: expected failure but succeeded - %', p_msg;
end $$;

-- --------------------------------------------------------------------------
-- Fixtures
-- --------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'alice@example.com', '{"full_name":"Alice Owner"}'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@example.com',   '{"full_name":"Bob Member"}'),
  ('00000000-0000-0000-0000-00000000000c', 'carol@vigil.test',  '{"full_name":"Carol Staff"}'),
  ('00000000-0000-0000-0000-00000000000d', 'dave@vigil.test',   '{"full_name":"Dave Admin"}'),
  ('00000000-0000-0000-0000-00000000000e', 'eve@example.com',   '{"full_name":"Eve Nobody"}');

insert into public.staff_members (user_id, role) values
  ('00000000-0000-0000-0000-00000000000c', 'staff'),
  ('00000000-0000-0000-0000-00000000000d', 'admin');

insert into public.organizations (id, slug, name) values
  ('10000000-0000-0000-0000-00000000000a', 'org-a', 'Org A'),
  ('10000000-0000-0000-0000-00000000000b', 'org-b', 'Org B');

insert into public.organization_members (organization_id, user_id, role) values
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', 'owner'),
  ('10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000b', 'member'),
  ('10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000e', 'owner');

insert into public.websites (id, organization_id, name, status) values
  ('20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', 'Site A', 'live'),
  ('20000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-00000000000b', 'Site B', 'provisioning');

insert into public.provider_links (provider, resource_kind, external_id, entity_type, entity_id) values
  ('vercel', 'project', 'prj_a', 'website', '20000000-0000-0000-0000-00000000000a');

insert into public.subscriptions (organization_id, plan_id, status)
select '10000000-0000-0000-0000-00000000000a', id, 'active' from public.plans where code = 'growth';

-- --------------------------------------------------------------------------
-- Legacy prototype was retired, not destroyed
-- --------------------------------------------------------------------------
do $$
begin
  perform test.ok(to_regclass('public.legacy_projects') is not null, 'legacy: projects renamed to legacy_projects');
  perform test.ok(to_regclass('public.legacy_profiles') is not null, 'legacy: prototype profiles preserved as legacy_profiles');
  perform test.ok(test.count('select 1 from public.legacy_clients') = 1, 'legacy: demo client row kept');
  perform test.ok(not exists (select 1 from pg_proc where proname = 'handle_new_user'), 'legacy: prototype sign-up trigger function removed');
  perform test.login_anon();
  perform test.ok(test.count('select 1 from public.legacy_projects') = 0, 'legacy: anon can no longer read the old tables');
  perform test.logout();
end $$;

-- --------------------------------------------------------------------------
-- Profiles were created by trigger
-- --------------------------------------------------------------------------
do $$
begin
  perform test.ok(test.count('select 1 from public.profiles') = 5, 'profile per auth user');
  perform test.ok(
    (select full_name from public.profiles where id = '00000000-0000-0000-0000-00000000000a') = 'Alice Owner',
    'profile picks up full_name from metadata');
end $$;

-- --------------------------------------------------------------------------
-- Anonymous sees nothing
-- --------------------------------------------------------------------------
do $$
begin
  perform test.login_anon();
  perform test.ok(test.count('select 1 from public.organizations') = 0, 'anon: no organizations');
  perform test.ok(test.count('select 1 from public.subscriptions') = 0, 'anon: no subscriptions');
  perform test.ok(test.count('select 1 from public.profiles') = 0, 'anon: no profiles');
  perform test.logout();
end $$;

-- --------------------------------------------------------------------------
-- Alice (owner of A) tenant isolation
-- --------------------------------------------------------------------------
do $$
declare v_id uuid; v_org_b uuid := '10000000-0000-0000-0000-00000000000b';
begin
  perform test.login('00000000-0000-0000-0000-00000000000a');

  perform test.ok(test.count('select 1 from public.organizations') = 1, 'alice: sees exactly one organization');
  perform test.ok(test.count('select 1 from public.organizations where slug = ''org-b''') = 0, 'alice: cannot see org B');
  perform test.ok(test.count('select 1 from public.websites') = 1, 'alice: sees only her website');
  perform test.ok(test.count('select 1 from public.provider_links') = 0, 'alice: provider links hidden');
  perform test.ok(test.count('select 1 from public.provisioning_jobs') = 0, 'alice: jobs hidden');
  perform test.ok(test.count('select 1 from public.webhook_events') = 0, 'alice: webhook inbox hidden');
  perform test.ok(test.count('select 1 from public.staff_members') = 0, 'alice: staff table hidden');
  perform test.ok(test.count('select 1 from public.plans') = 4, 'alice: catalog is readable');
  perform test.ok(test.count('select 1 from public.profiles') = 1, 'alice: sees only herself (no co-members yet)');

  perform test.fails(
    'insert into public.websites (organization_id, name) values (''10000000-0000-0000-0000-00000000000a'', ''x'')',
    'alice: cannot create websites');
  perform test.fails(
    'insert into public.organizations (slug, name) values (''org-c'', ''C'')',
    'alice: cannot create organizations');
  perform test.fails(
    'insert into public.staff_members (user_id) values (''00000000-0000-0000-0000-00000000000a'')',
    'alice: cannot make herself staff');
  perform test.fails(
    'update public.organizations set status = ''suspended'' where slug = ''org-a''',
    'alice: cannot change org status');
  perform test.fails(
    'update public.organizations set slug = ''hijack'' where slug = ''org-a''',
    'alice: cannot change org slug');

  update public.organizations set name = 'Org A Renamed' where slug = 'org-a';
  perform test.ok(
    (select name from public.organizations where slug = 'org-a') = 'Org A Renamed',
    'alice: can rename her organization');

  -- update on org B is silently a no-op under RLS
  update public.organizations set name = 'pwned' where id = v_org_b;
  perform test.logout();
  perform test.ok((select name from public.organizations where id = v_org_b) = 'Org B',
    'alice: update on org B did not apply');
  perform test.login('00000000-0000-0000-0000-00000000000a');

  -- domains: customer-owned pending only, own org only
  insert into public.domains (organization_id, hostname, source, status)
    values ('10000000-0000-0000-0000-00000000000a', 'orga.example.com', 'customer_owned', 'pending')
    returning id into v_id;
  perform test.ok(v_id is not null, 'alice: can start connecting her own domain');
  perform test.fails(
    'insert into public.domains (organization_id, hostname, source, status) values (''' || v_org_b || ''', ''orgb.example.com'', ''customer_owned'', ''pending'')',
    'alice: cannot add a domain to org B');
  perform test.fails(
    'insert into public.domains (organization_id, hostname, source, status) values (''10000000-0000-0000-0000-00000000000a'', ''bought.example.com'', ''purchased_via_vigil'', ''pending'')',
    'alice: cannot claim a purchased domain');
  perform test.fails(
    'insert into public.domains (organization_id, website_id, hostname) values (''10000000-0000-0000-0000-00000000000a'', ''20000000-0000-0000-0000-00000000000b'', ''cross.example.com'')',
    'alice: cannot attach her domain to org B''s website');
  perform test.fails(
    'insert into public.change_requests (organization_id, website_id, title) values (''10000000-0000-0000-0000-00000000000a'', ''20000000-0000-0000-0000-00000000000b'', ''x'')',
    'alice: cannot file a request against org B''s website');
  update public.domains set status = 'connected' where id = v_id;
  perform test.ok((select status from public.domains where id = v_id) = 'pending',
    'alice: cannot mark a domain connected (update filtered by RLS)');

  -- audit: no direct insert, function only, own org only
  perform test.fails(
    'insert into public.audit_events (actor_kind, action, entity_type) values (''user'', ''x.y'', ''z'')',
    'alice: cannot insert audit rows directly');
  perform vigil.log_audit_event('domain.connect_started', 'domain', v_id, '10000000-0000-0000-0000-00000000000a');
  perform test.ok(test.count('select 1 from public.audit_events where action = ''domain.connect_started''') = 1,
    'alice: can log an audit event for her org and read it back');
  perform test.fails(
    'select vigil.log_audit_event(''x.y'', ''z'', null, ''' || v_org_b || ''')',
    'alice: cannot log audit events against org B');

  -- entitlements
  perform test.ok(
    (select value from vigil.resolve_entitlements('10000000-0000-0000-0000-00000000000a') where feature_code = 'virtue.enabled') = 'true'::jsonb,
    'alice: growth plan grants virtue');
  perform test.ok(
    (select plan_code from vigil.resolve_entitlements('10000000-0000-0000-0000-00000000000a') limit 1) = 'growth',
    'alice: resolved plan is growth');
  perform test.ok(test.count('select 1 from vigil.resolve_entitlements(''' || v_org_b || ''')') = 0,
    'alice: cannot resolve entitlements for org B');

  -- change requests: structure works, status guarded
  insert into public.change_requests (organization_id, website_id, title, status)
    values ('10000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-00000000000a', 'Update hours', 'submitted')
    returning id into v_id;
  perform test.ok((select submitted_at from public.change_requests where id = v_id) is null,
    'alice: insert does not stamp submitted_at (only the transition does)');
  perform test.fails(
    'update public.change_requests set status = ''delivered'' where id = ''' || v_id || '''',
    'alice: cannot mark her request delivered');
  perform test.fails(
    'update public.change_requests set assigned_to = ''00000000-0000-0000-0000-00000000000c'' where id = ''' || v_id || '''',
    'alice: cannot assign her request');
  update public.change_requests set status = 'closed' where id = v_id;
  perform test.ok((select status from public.change_requests where id = v_id) = 'closed',
    'alice: can close her own request');

  perform test.logout();
end $$;

-- --------------------------------------------------------------------------
-- Attachments: path must encode the organization; objects follow RLS
-- --------------------------------------------------------------------------
do $$
declare v_req uuid; v_att uuid;
begin
  perform test.login('00000000-0000-0000-0000-00000000000a');
  select id into v_req from public.change_requests where organization_id = '10000000-0000-0000-0000-00000000000a' limit 1;

  insert into storage.objects (bucket_id, name, owner)
    values ('request-attachments', '10000000-0000-0000-0000-00000000000a/' || v_req || '/photo.png', '00000000-0000-0000-0000-00000000000a');
  perform test.ok(test.count('select 1 from storage.objects') = 1, 'alice: can upload into her organization folder');
  perform test.fails(
    'insert into storage.objects (bucket_id, name) values (''request-attachments'', ''10000000-0000-0000-0000-00000000000b/x/photo.png'')',
    'alice: cannot upload into org B''s folder');
  perform test.fails(
    'insert into storage.objects (bucket_id, name) values (''request-attachments'', ''not-a-uuid/photo.png'')',
    'alice: cannot upload outside an organization folder');

  insert into public.change_request_attachments (organization_id, change_request_id, object_path, file_name, content_type, size_bytes, uploaded_by)
    values ('10000000-0000-0000-0000-00000000000a', v_req, '10000000-0000-0000-0000-00000000000a/' || v_req || '/photo.png', 'photo.png', 'image/png', 1234, '00000000-0000-0000-0000-00000000000a')
    returning id into v_att;
  perform test.ok(v_att is not null, 'alice: attachment row recorded');
  perform test.fails(
    'insert into public.change_request_attachments (organization_id, change_request_id, object_path, file_name, content_type, size_bytes) values (''10000000-0000-0000-0000-00000000000a'', ''' || v_req || ''', ''10000000-0000-0000-0000-00000000000b/' || v_req || '/x.png'', ''x.png'', ''image/png'', 1)',
    'alice: attachment path must encode her own organization');
  perform test.fails(
    'insert into public.change_request_attachments (organization_id, change_request_id, object_path, file_name, content_type, size_bytes) values (''10000000-0000-0000-0000-00000000000a'', ''' || v_req || ''', ''10000000-0000-0000-0000-00000000000a/' || v_req || '/big.png'', ''big.png'', ''image/png'', 99999999)',
    'alice: attachment over 10 MB refused');
  perform test.logout();

  perform test.login('00000000-0000-0000-0000-00000000000b');
  perform test.ok(test.count('select 1 from storage.objects') = 0, 'bob: cannot see org A''s objects');
  perform test.ok(test.count('select 1 from public.change_request_attachments') = 0, 'bob: cannot see org A''s attachment rows');
  perform test.logout();

  perform test.login('00000000-0000-0000-0000-00000000000c');
  perform test.ok(test.count('select 1 from storage.objects') = 1, 'carol: staff sees the object');
  perform test.logout();
end $$;

-- --------------------------------------------------------------------------
-- Commerce: anonymous catalog reads, orders staff-only, member brief edits
-- --------------------------------------------------------------------------
do $$
declare v_proj uuid; v_order uuid;
begin
  perform test.login_anon();
  perform test.ok(test.count('select 1 from public.plans') = 4, 'anon: can read the plan catalog for checkout');
  perform test.ok(test.count('select 1 from public.build_prices') = 3, 'anon: can read build prices');
  perform test.ok(test.count('select 1 from public.orders') = 0, 'anon: cannot read orders');
  perform test.logout();

  insert into public.orders (email, business_name, template_slug, plan_id)
    select 'buyer@example.com', 'Buyer Co', 'restaurant', id from public.plans where code = 'care'
    returning id into v_order;
  perform test.ok((select length(checkout_token) from public.orders where id = v_order) = 64, 'order: checkout token generated');

  perform test.login('00000000-0000-0000-0000-00000000000a');
  perform test.ok(test.count('select 1 from public.orders') = 0, 'alice: cannot see unprovisioned orders');
  perform test.logout();

  perform test.login('00000000-0000-0000-0000-00000000000c');
  perform test.ok(test.count('select 1 from public.orders') = 1, 'carol: staff sees orders');
  insert into public.projects (organization_id, name, kind, status)
    values ('10000000-0000-0000-0000-00000000000a', 'Intake test', 'express', 'intake') returning id into v_proj;
  perform test.logout();

  perform test.login('00000000-0000-0000-0000-00000000000a');
  update public.projects set brief = '{"business":{"tagline":"x"}}'::jsonb, intake_completed_at = now() where id = v_proj;
  perform test.ok((select brief ->> 'business' from public.projects where id = v_proj) is not null, 'alice: can fill in her project brief');
  perform test.fails(
    'update public.projects set status = ''launched'' where id = ''' || v_proj || '''',
    'alice: cannot change project status');
  insert into public.project_assets (organization_id, project_id, object_path, file_name, content_type, size_bytes)
    values ('10000000-0000-0000-0000-00000000000a', v_proj, '10000000-0000-0000-0000-00000000000a/' || v_proj || '/logo.png', 'logo.png', 'image/png', 100);
  perform test.ok(test.count('select 1 from public.project_assets') = 1, 'alice: can record a project asset');
  update public.project_assets set caption = 'Front room' where file_name = 'logo.png';
  perform test.ok((select caption from public.project_assets where file_name = 'logo.png') = 'Front room', 'alice: can caption her upload');
  perform test.fails(
    'update public.project_assets set object_path = ''10000000-0000-0000-0000-00000000000a/other.png'' where file_name = ''logo.png''',
    'alice: cannot move an uploaded object');
  perform test.logout();

  perform test.login('00000000-0000-0000-0000-00000000000b');
  perform test.ok(test.count('select 1 from public.project_assets') = 0, 'bob: cannot see org A''s assets');
  perform test.logout();

  -- Removing a whole organization (service role) cascades through its owner.
  perform test.login_service();
  insert into public.organizations (id, name, slug) values ('10000000-0000-0000-0000-00000000000d', 'Doomed', 'doomed');
  insert into public.organization_members (organization_id, user_id, role, status)
    values ('10000000-0000-0000-0000-00000000000d', '00000000-0000-0000-0000-00000000000a', 'owner', 'active');
  delete from public.organizations where id = '10000000-0000-0000-0000-00000000000d';
  perform test.ok(test.count('select 1 from public.organization_members where organization_id = ''10000000-0000-0000-0000-00000000000d''') = 0, 'service: deleting an organization removes its last owner too');
  perform test.logout();
end $$;

-- --------------------------------------------------------------------------
-- Bob (member of B) has read access but no management rights
-- --------------------------------------------------------------------------
do $$
begin
  perform test.login('00000000-0000-0000-0000-00000000000b');
  perform test.ok(test.count('select 1 from public.organizations where slug = ''org-b''') = 1, 'bob: sees org B');
  perform test.ok(test.count('select 1 from public.profiles') = 2, 'bob: sees himself and his co-member');
  update public.organizations set name = 'Bob was here' where slug = 'org-b';
  perform test.logout();
  perform test.ok((select name from public.organizations where slug = 'org-b') = 'Org B',
    'bob: member cannot rename the organization');
  perform test.login('00000000-0000-0000-0000-00000000000b');
  perform test.fails(
    'insert into public.organization_invites (organization_id, email) values (''10000000-0000-0000-0000-00000000000b'', ''x@example.com'')',
    'bob: member cannot invite');
  perform test.fails(
    'insert into public.domains (organization_id, hostname) values (''10000000-0000-0000-0000-00000000000b'', ''bob.example.com'')',
    'bob: member cannot start a domain connection');
  perform test.ok(
    (select value from vigil.resolve_entitlements('10000000-0000-0000-0000-00000000000b') where feature_code = 'virtue.enabled') = 'false'::jsonb,
    'bob: no subscription means no virtue');
  perform test.logout();
end $$;

-- --------------------------------------------------------------------------
-- Staff (Carol) and admin (Dave)
-- --------------------------------------------------------------------------
do $$
declare v_job uuid; v_org_b uuid := '10000000-0000-0000-0000-00000000000b';
begin
  perform test.login('00000000-0000-0000-0000-00000000000c');
  perform test.ok(test.count('select 1 from public.organizations') = 2, 'carol: staff sees every organization');
  perform test.ok(test.count('select 1 from public.provider_links') = 1, 'carol: staff sees provider links');
  perform test.ok(test.count('select 1 from public.profiles') = 5, 'carol: staff sees every profile');

  update public.websites set status = 'live', status_reason = 'Launched'
    where id = '20000000-0000-0000-0000-00000000000b';
  perform test.ok(
    test.count('select 1 from public.audit_events where action = ''websites.status_changed'' and entity_id = ''20000000-0000-0000-0000-00000000000b''') = 1,
    'carol: status change wrote an audit row');
  perform test.ok(
    (select actor_kind from public.audit_events where action = 'websites.status_changed' and entity_id = '20000000-0000-0000-0000-00000000000b') = 'staff',
    'carol: audit row attributes the change to staff');

  update public.organizations set status = 'suspended' where id = v_org_b;
  perform test.ok((select status from public.organizations where id = v_org_b) = 'suspended',
    'carol: staff can change org status');
  update public.organizations set status = 'active' where id = v_org_b;

  insert into public.provisioning_jobs (organization_id, kind, idempotency_key)
    values (v_org_b, 'website.provision', 'website.provision:' || v_org_b) returning id into v_job;
  perform test.fails(
    'insert into public.provisioning_jobs (organization_id, website_id, kind, idempotency_key) values (''' || v_org_b || ''', ''20000000-0000-0000-0000-00000000000a'', ''website.deploy'', ''x-org'')',
    'carol: even staff cannot queue a job that crosses organizations');
  perform test.fails(
    'insert into public.provisioning_jobs (organization_id, kind, idempotency_key) values (''' || v_org_b || ''', ''website.provision'', ''website.provision:' || v_org_b || ''')',
    'carol: duplicate idempotency key refused');

  update public.plans set name = 'x' where code = 'basic';
  perform test.ok((select name from public.plans where code = 'basic') = 'Vigil Basic',
    'carol: staff cannot edit the catalog (update filtered by RLS)');
  perform test.fails(
    'insert into public.entitlement_overrides (organization_id, feature_code, value) values (''' || v_org_b || ''', ''virtue.enabled'', ''true'')',
    'carol: staff cannot grant overrides');
  perform test.logout();

  perform test.login('00000000-0000-0000-0000-00000000000d');
  update public.plan_prices set amount_cents = 1 where plan_id = (select id from public.plans where code = 'basic') and interval = 'month' and interval_count = 1;
  perform test.ok((select amount_cents from public.plan_prices p join public.plans pl on pl.id = p.plan_id where pl.code = 'basic' and p.interval = 'month' and p.interval_count = 1) = 1,
    'dave: admin can set a price');
  update public.plan_prices set amount_cents = null;
  insert into public.entitlement_overrides (organization_id, feature_code, value, reason)
    values (v_org_b, 'virtue.enabled', 'true', 'pilot');
  perform test.ok(
    (select source from vigil.resolve_entitlements(v_org_b) where feature_code = 'virtue.enabled') = 'override',
    'dave: override wins over plan default');
  perform test.logout();

  perform test.login('00000000-0000-0000-0000-00000000000b');
  perform test.ok(
    (select value from vigil.resolve_entitlements(v_org_b) where feature_code = 'virtue.enabled') = 'true'::jsonb,
    'bob: sees the override applied to his org');
  perform test.logout();
end $$;

-- --------------------------------------------------------------------------
-- Job claiming: service role only (or staff), leases and attempts
-- --------------------------------------------------------------------------
do $$
declare n integer;
begin
  perform test.login('00000000-0000-0000-0000-00000000000a');
  perform test.fails('select * from vigil.claim_jobs(''w1'')', 'alice: cannot claim jobs');
  perform test.logout();

  perform test.login_service();
  select count(*) into n from vigil.claim_jobs('worker-1', 10, 300);
  perform test.ok(n = 1, 'service: claims the one queued job');
  select count(*) into n from vigil.claim_jobs('worker-2', 10, 300);
  perform test.ok(n = 0, 'service: a running job is not reclaimed inside its lease');
  perform test.ok((select attempts from public.provisioning_jobs limit 1) = 1, 'service: attempts incremented');
  perform test.logout();
end $$;

-- --------------------------------------------------------------------------
-- Invites: created by an owner, accepted on sign-in, last-owner protection
-- --------------------------------------------------------------------------
do $$
declare n integer;
begin
  perform test.login('00000000-0000-0000-0000-00000000000a');
  insert into public.organization_invites (organization_id, email, role)
    values ('10000000-0000-0000-0000-00000000000a', 'bob@example.com', 'manager');
  perform test.logout();

  perform test.login('00000000-0000-0000-0000-00000000000b');
  select vigil.accept_invites_for_current_user() into n;
  perform test.ok(n = 1, 'bob: accepted one invite');
  perform test.ok(test.count('select 1 from public.organizations') = 2, 'bob: now sees both organizations');
  perform test.ok(vigil.org_role('10000000-0000-0000-0000-00000000000a') = 'manager', 'bob: joined A as manager');
  select vigil.accept_invites_for_current_user() into n;
  perform test.ok(n = 0, 'bob: acceptance is idempotent');
  perform test.logout();

  perform test.login('00000000-0000-0000-0000-00000000000a');
  perform test.fails(
    'delete from public.organization_members where organization_id = ''10000000-0000-0000-0000-00000000000a'' and user_id = ''00000000-0000-0000-0000-00000000000a''',
    'alice: the last owner cannot leave');
  perform test.fails(
    'update public.organization_members set role = ''member'' where organization_id = ''10000000-0000-0000-0000-00000000000a'' and user_id = ''00000000-0000-0000-0000-00000000000a''',
    'alice: the last owner cannot be demoted');
  perform test.logout();
end $$;

-- --------------------------------------------------------------------------
-- Profiles: own row editable, email frozen, others' rows read-only
-- --------------------------------------------------------------------------
do $$
begin
  perform test.login('00000000-0000-0000-0000-00000000000a');
  update public.profiles set full_name = 'Alice O.' where id = '00000000-0000-0000-0000-00000000000a';
  perform test.ok((select full_name from public.profiles where id = '00000000-0000-0000-0000-00000000000a') = 'Alice O.',
    'alice: can edit her own name');
  perform test.fails(
    'update public.profiles set email = ''evil@example.com'' where id = ''00000000-0000-0000-0000-00000000000a''',
    'alice: cannot change her email through the API');
  update public.profiles set full_name = 'Mallory' where id = '00000000-0000-0000-0000-00000000000b';
  perform test.logout();
  perform test.ok((select full_name from public.profiles where id = '00000000-0000-0000-0000-00000000000b') = 'Bob Member',
    'alice: cannot edit another profile');
end $$;

-- --------------------------------------------------------------------------
-- Professional reviews: fixed included rounds, strict sequence, current-only
-- customer response and tenant-scoped private feedback attachments.
-- --------------------------------------------------------------------------
do $$
declare v_project uuid; v_round_1 uuid; v_round_2 uuid; v_submission uuid; v_response uuid;
begin
  perform test.login_service();
  insert into public.projects (organization_id, name, kind, status)
    values ('10000000-0000-0000-0000-00000000000a', 'Professional review test', 'professional', 'in_progress')
    returning id into v_project;
  perform test.ok(
    test.count('select 1 from public.project_review_rounds where project_id = ''' || v_project || '''') = 2,
    'professional: exactly two included review rounds are seeded');
  select id into v_round_1 from public.project_review_rounds where project_id = v_project and round_number = 1;
  select id into v_round_2 from public.project_review_rounds where project_id = v_project and round_number = 2;
  perform test.logout();

  perform test.login('00000000-0000-0000-0000-00000000000a');
  perform test.ok(test.count('select 1 from public.project_review_rounds where project_id = ''' || v_project || '''') = 2,
    'alice: reads her Professional review rounds');
  perform test.fails(
    'insert into public.project_review_submissions (organization_id, project_id, round_id, version, preview_url) values (''10000000-0000-0000-0000-00000000000a'', ''' || v_project || ''', ''' || v_round_1 || ''', 1, ''https://preview.example.com'')',
    'alice: cannot publish a review submission');
  perform test.fails(
    'insert into public.project_review_responses (organization_id, project_id, round_id, submission_id, kind) values (''10000000-0000-0000-0000-00000000000a'', ''' || v_project || ''', ''' || v_round_1 || ''', gen_random_uuid(), ''approved'')',
    'alice: cannot answer a non-current submission');
  perform test.logout();

  perform test.login('00000000-0000-0000-0000-00000000000c');
  perform test.fails(
    'insert into public.project_review_submissions (organization_id, project_id, round_id, version, preview_url) values (''10000000-0000-0000-0000-00000000000a'', ''' || v_project || ''', ''' || v_round_2 || ''', 1, ''https://full.example.com'')',
    'staff: round two cannot be published before round one approval');
  insert into public.project_review_submissions (organization_id, project_id, round_id, version, preview_url)
    values ('10000000-0000-0000-0000-00000000000a', v_project, v_round_1, 1, 'https://design.example.com') returning id into v_submission;
  perform test.ok((select status from public.project_review_rounds where id = v_round_1) = 'awaiting_feedback',
    'staff: publishing makes round one await customer feedback');
  perform test.logout();

  perform test.login('00000000-0000-0000-0000-00000000000a');
  insert into public.project_review_responses (organization_id, project_id, round_id, submission_id, kind, feedback)
    values ('10000000-0000-0000-0000-00000000000a', v_project, v_round_1, v_submission, 'changes_requested', 'Please revise the headline.')
    returning id into v_response;
  perform test.ok((select status from public.project_review_rounds where id = v_round_1) = 'changes_requested',
    'alice: a consolidated response updates the round state');
  perform test.fails(
    'insert into public.project_review_responses (organization_id, project_id, round_id, submission_id, kind) values (''10000000-0000-0000-0000-00000000000a'', ''' || v_project || ''', ''' || v_round_1 || ''', ''' || v_submission || ''', ''approved'')',
    'alice: cannot add a second response to the same version');
  insert into storage.objects (bucket_id, name, owner)
    values ('review-attachments', '10000000-0000-0000-0000-00000000000a/' || v_response || '/feedback.png', '00000000-0000-0000-0000-00000000000a');
  insert into public.project_review_attachments (organization_id, response_id, object_path, file_name, content_type, size_bytes)
    values ('10000000-0000-0000-0000-00000000000a', v_response, '10000000-0000-0000-0000-00000000000a/' || v_response || '/feedback.png', 'feedback.png', 'image/png', 42);
  perform test.ok(test.count('select 1 from public.project_review_attachments where response_id = ''' || v_response || '''') = 1,
    'alice: can record an attachment on her consolidated changes');
  perform test.logout();

  perform test.login('00000000-0000-0000-0000-00000000000e');
  perform test.ok(test.count('select 1 from public.project_review_rounds where project_id = ''' || v_project || '''') = 0,
    'eve: cannot see another organization review workflow');
  perform test.ok(test.count('select 1 from public.project_review_attachments where response_id = ''' || v_response || '''') = 0,
    'eve: cannot see another organization review attachments');
  perform test.logout();
end $$;

-- --------------------------------------------------------------------------
-- Express projects: one full-site round and one included revision request
-- --------------------------------------------------------------------------
do $$
declare v_project uuid; v_round uuid; v_one uuid; v_two uuid;
begin
  perform test.login_service();
  insert into public.projects (organization_id, name, kind, status)
    values ('10000000-0000-0000-0000-00000000000a', 'Express review test', 'express', 'in_progress')
    returning id into v_project;
  select id into v_round from public.project_review_rounds where project_id = v_project;
  perform test.ok(
    test.count('select 1 from public.project_review_rounds where project_id = ''' || v_project || ''' and round_number = 1 and phase = ''full_site''') = 1,
    'express: exactly one Full-site review round is seeded');
  insert into public.project_review_submissions (organization_id, project_id, round_id, version, preview_url)
    values ('10000000-0000-0000-0000-00000000000a', v_project, v_round, 1, 'https://express-v1.example.com') returning id into v_one;
  perform test.logout();

  perform test.login('00000000-0000-0000-0000-00000000000a');
  insert into public.project_review_responses (organization_id, project_id, round_id, submission_id, kind, feedback)
    values ('10000000-0000-0000-0000-00000000000a', v_project, v_round, v_one, 'changes_requested', 'Please adjust the heading.');
  perform test.logout();

  perform test.login_service();
  update public.project_review_rounds set status = 'revision_in_progress' where id = v_round;
  insert into public.project_review_submissions (organization_id, project_id, round_id, version, preview_url)
    values ('10000000-0000-0000-0000-00000000000a', v_project, v_round, 2, 'https://express-v2.example.com') returning id into v_two;
  perform test.logout();

  perform test.login('00000000-0000-0000-0000-00000000000a');
  perform test.fails(
    'insert into public.project_review_responses (organization_id, project_id, round_id, submission_id, kind, feedback) values (''10000000-0000-0000-0000-00000000000a'', ''' || v_project || ''', ''' || v_round || ''', ''' || v_two || ''', ''changes_requested'', ''Another change'')',
    'express: a second request for changes is refused');
  insert into public.project_review_responses (organization_id, project_id, round_id, submission_id, kind)
    values ('10000000-0000-0000-0000-00000000000a', v_project, v_round, v_two, 'approved');
  perform test.ok((select status from public.project_review_rounds where id = v_round) = 'approved',
    'express: the revised preview can be approved');
  perform test.logout();
end $$;

-- --------------------------------------------------------------------------
-- Deployments inherit organization from the website
-- --------------------------------------------------------------------------
do $$
begin
  perform test.login('00000000-0000-0000-0000-00000000000c');
  insert into public.deployments (organization_id, website_id)
    values ('10000000-0000-0000-0000-00000000000b', '20000000-0000-0000-0000-00000000000a');
  perform test.ok(
    (select organization_id from public.deployments limit 1) = '10000000-0000-0000-0000-00000000000a',
    'deployment organization is taken from the website, not the caller');
  perform test.logout();
end $$;

-- --------------------------------------------------------------------------
-- Customer retirement: admin-only, atomic restoration and complete purge.
-- --------------------------------------------------------------------------
do $$
declare
  v_org constant uuid := '10000000-0000-0000-0000-00000000000f';
  v_project uuid;
  v_website uuid;
  v_subscription uuid;
  v_order uuid;
  v_round uuid;
begin
  perform test.login_service();
  insert into public.organizations (id, slug, name, status) values (v_org, 'purge-test', 'Purge Test', 'active');
  insert into public.projects (organization_id, name, kind, status)
    values (v_org, 'Professional purge test', 'professional', 'review') returning id into v_project;
  insert into public.websites (organization_id, project_id, name, status, repository_ref)
    values (v_org, v_project, 'Purge website', 'live', 'github:vigil/purge-test') returning id into v_website;
  insert into public.subscriptions (organization_id, website_id, plan_id, status)
    values (v_org, v_website, (select id from public.plans limit 1), 'active') returning id into v_subscription;
  insert into public.orders (organization_id, project_id, subscription_id, email, business_name, status)
    values (v_org, v_project, v_subscription, 'purge@example.com', 'Purge Test', 'paid') returning id into v_order;
  insert into public.provider_links (provider, resource_kind, external_id, entity_type, entity_id)
    values
      ('stripe', 'subscription', 'sub_purge', 'subscription', v_subscription),
      ('vercel', 'site', 'prj_purge', 'website', v_website),
      ('other', 'repository', '42', 'website', v_website);
  select id into v_round from public.project_review_rounds where project_id = v_project and round_number = 1;
  insert into public.project_review_submissions (organization_id, project_id, round_id, version, preview_url)
    values (v_org, v_project, v_round, 1, 'https://purge-preview.example.com');
  perform test.logout();

  perform test.login('00000000-0000-0000-0000-00000000000a');
  perform test.fails(
    'select public.archive_customer(''' || v_org || ''', ''00000000-0000-0000-0000-00000000000a'')',
    'member: cannot archive a customer');
  perform test.logout();

  perform test.login_service();
  perform test.fails(
    'select public.purge_customer(''' || v_org || ''', ''{}'', ''{}'', null)',
    'service: an active customer cannot be permanently purged');
  perform public.archive_customer(v_org, '00000000-0000-0000-0000-00000000000d');
  perform test.ok((select archived_at is not null and status = 'closed' from public.organizations where id = v_org),
    'archive: organization is closed and timestamped');
  perform test.ok((select status from public.subscriptions where id = v_subscription) = 'canceled',
    'archive: subscription row is canceled');
  perform test.ok((select status from public.projects where id = v_project) = 'cancelled'
    and (select status from public.websites where id = v_website) = 'archived',
    'archive: project and website are retired');
  perform test.ok((select status from public.orders where id = v_order) = 'expired',
    'archive: paid but unprovisioned orders cannot run later');

  perform public.restore_customer(v_org, '00000000-0000-0000-0000-00000000000d');
  perform test.ok((select archived_at is null and status = 'active' from public.organizations where id = v_org),
    'restore: organization status is restored');
  perform test.ok((select status from public.projects where id = v_project) = 'launched'
    and (select status from public.websites where id = v_website) = 'live',
    'restore: live website restores the project at launched');
  perform test.ok((select status from public.subscriptions where id = v_subscription) = 'canceled',
    'restore: billing remains canceled and requires an explicit new subscription');

  perform public.archive_customer(v_org, '00000000-0000-0000-0000-00000000000d');
  perform public.purge_customer(v_org, '{"reason":"test"}', '{"providers":"clean"}', '00000000-0000-0000-0000-00000000000d');
  perform test.ok(test.count('select 1 from public.organizations where id = ''' || v_org || '''') = 0
    and test.count('select 1 from public.projects where organization_id = ''' || v_org || '''') = 0
    and test.count('select 1 from public.websites where organization_id = ''' || v_org || '''') = 0
    and test.count('select 1 from public.subscriptions where organization_id = ''' || v_org || '''') = 0
    and test.count('select 1 from public.orders where id = ''' || v_order || '''') = 0,
    'purge: customer, projects, websites, subscriptions and orders are removed');
  perform test.ok(test.count('select 1 from public.provider_links where external_id in (''sub_purge'', ''prj_purge'', ''42'')') = 0,
    'purge: provider links are removed');
  perform test.ok(test.count('select 1 from public.customer_deletion_log where former_organization_id = ''' || v_org || '''') = 1,
    'purge: one minimal deletion ledger remains');
  perform test.logout();
end $$;

-- --------------------------------------------------------------------------
-- Project lifecycle follows completed intake, preview, review and launch.
-- --------------------------------------------------------------------------
do $$
declare
  v_org uuid;
  v_project uuid;
  v_website uuid;
  v_round_one uuid;
  v_round_two uuid;
begin
  perform test.login_service();
  insert into public.organizations (slug, name) values ('automatic-status-test', 'Automatic Status Test') returning id into v_org;
  insert into public.projects (organization_id, name, kind, status)
    values (v_org, 'Automatic Express', 'express', 'draft') returning id into v_project;
  insert into public.websites (organization_id, project_id, name)
    values (v_org, v_project, 'Automatic Express') returning id into v_website;

  update public.projects set intake_completed_at = now() where id = v_project;
  perform test.ok((select status from public.projects where id = v_project) = 'in_progress',
    'automatic lifecycle: completed intake starts the build');

  insert into public.deployments (organization_id, website_id, environment, status, url)
    values (v_org, v_website, 'preview', 'ready', 'https://preview.example.com');
  perform test.ok((select status from public.projects where id = v_project) = 'review',
    'automatic lifecycle: ready preview starts review');

  update public.websites set status = 'live', live_url = 'https://example.com' where id = v_website;
  perform test.ok((select status from public.projects where id = v_project) = 'launched'
    and (select launched_at is not null from public.projects where id = v_project),
    'automatic lifecycle: live website launches the project');

  insert into public.projects (organization_id, name, kind, status)
    values (v_org, 'Automatic Professional', 'professional', 'in_progress') returning id into v_project;
  select id into v_round_one from public.project_review_rounds where project_id = v_project and round_number = 1;
  select id into v_round_two from public.project_review_rounds where project_id = v_project and round_number = 2;
  update public.project_review_rounds set status = 'awaiting_feedback' where id = v_round_one;
  perform test.ok((select status from public.projects where id = v_project) = 'review',
    'automatic lifecycle: published review starts customer review');
  update public.project_review_rounds set status = 'approved' where id = v_round_one;
  perform test.ok((select status from public.projects where id = v_project) = 'in_progress',
    'automatic lifecycle: first approval returns to the full build');
  update public.project_review_rounds set status = 'awaiting_feedback' where id = v_round_two;
  update public.project_review_rounds set status = 'approved' where id = v_round_two;
  perform test.ok((select status from public.projects where id = v_project) = 'approved',
    'automatic lifecycle: final approval approves the project');

  delete from public.organizations where id = v_org;
  perform test.logout();
end $$;

drop schema test cascade;

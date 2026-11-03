-- Disposable database only: tenant boundaries, opt-in, leases and evidence provenance.
begin;
create schema measurement_test;
create function measurement_test.ok(value boolean,label text) returns void language plpgsql as $$begin
 if value is distinct from true then raise exception 'FAIL measurement: %',label;end if;
 raise notice 'ok - measurement: %',label;
end$$;
create function measurement_test.fails(command text,label text) returns void language plpgsql as $$begin
 begin execute command;exception when others then raise notice 'ok - measurement: % (refused)',label;return;end;
 raise exception 'FAIL measurement: % was permitted',label;
end$$;
grant usage on schema measurement_test to anon,authenticated,service_role;
grant execute on all functions in schema measurement_test to anon,authenticated,service_role;
insert into auth.users(id,email) values
 ('cf600000-0000-4000-8000-000000000001','measurement-a@example.com'),
 ('cf600000-0000-4000-8000-000000000002','measurement-b@example.com'),
 ('cf600000-0000-4000-8000-000000000003','measurement-staff@example.com');
insert into public.organizations(id,name,slug) values
 ('cf600000-0000-4000-8000-000000000011','Measurement A','measurement-a'),
 ('cf600000-0000-4000-8000-000000000012','Measurement B','measurement-b');
insert into public.organization_members(organization_id,user_id,role,status) values
 ('cf600000-0000-4000-8000-000000000011','cf600000-0000-4000-8000-000000000001','owner','active'),
 ('cf600000-0000-4000-8000-000000000012','cf600000-0000-4000-8000-000000000002','owner','active');
insert into public.staff_members(user_id,role) values('cf600000-0000-4000-8000-000000000003','staff');
insert into public.websites(id,organization_id,name,status,live_url) values
 ('cf600000-0000-4000-8000-000000000021','cf600000-0000-4000-8000-000000000011','Measurement A','live','https://measurement-a.example.com'),
 ('cf600000-0000-4000-8000-000000000022','cf600000-0000-4000-8000-000000000012','Measurement B','live','https://measurement-b.example.com');
select measurement_test.ok((select count(*)=0 from public.website_measurement_connections),'migration enrolls no websites');
insert into public.website_measurement_connections(id,organization_id,website_id,kind) values
 ('cf600000-0000-4000-8000-000000000031','cf600000-0000-4000-8000-000000000011','cf600000-0000-4000-8000-000000000021','site_security'),
 ('cf600000-0000-4000-8000-000000000032','cf600000-0000-4000-8000-000000000012','cf600000-0000-4000-8000-000000000022','site_security');
select measurement_test.fails($q$insert into public.website_measurement_connections(organization_id,website_id,kind) values('cf600000-0000-4000-8000-000000000012','cf600000-0000-4000-8000-000000000021','traffic')$q$,'cross-tenant website reference');
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','cf600000-0000-4000-8000-000000000001',true);
set local role authenticated;
select measurement_test.ok((select count(*)=1 from public.website_measurement_connections where id is not null),'owner only reads its connection columns');
select measurement_test.fails('select lease_token from public.website_measurement_connections','private lease not readable');
select measurement_test.fails($q$select public.configure_website_measurement('cf600000-0000-4000-8000-000000000021','site_security',true)$q$,'subscription/ownership does not activate measurement');
select measurement_test.fails('select public.claim_website_measurement()','owner cannot run service claims');
select measurement_test.fails('update public.website_measurement_connections set enabled=true','owner cannot forge opt-in');
reset role;
select set_config('request.jwt.claim.sub','cf600000-0000-4000-8000-000000000003',true);
set local role authenticated;
select public.configure_website_measurement('cf600000-0000-4000-8000-000000000021','site_security',true);
select measurement_test.fails($q$select public.configure_website_measurement('cf600000-0000-4000-8000-000000000021','search',true,'https://measurement-b.example.com/')$q$,'wrong search property refused');
select public.configure_website_measurement('cf600000-0000-4000-8000-000000000021','search',true,'sc-domain:measurement-a.example.com');
select public.configure_website_measurement('cf600000-0000-4000-8000-000000000021','search',false);
reset role;
select set_config('request.jwt.claim.role','service_role',true);
set local role service_role;
select measurement_test.ok((select count(*)=0 from public.claim_website_measurement('cf600000-0000-4000-8000-000000000032')),'connections default off');
select measurement_test.ok((select count(*)=1 from public.claim_website_measurement('cf600000-0000-4000-8000-000000000031')),'enabled live site can be claimed');
select measurement_test.ok((select count(*)=0 from public.claim_website_measurement('cf600000-0000-4000-8000-000000000031')),'duplicate run cannot acquire lease');
select measurement_test.ok(not public.finish_website_measurement(id,revision,gen_random_uuid(),'https://measurement-a.example.com','{}'),'wrong lease cannot publish') from public.website_measurement_connections where id='cf600000-0000-4000-8000-000000000031';
select measurement_test.ok(not public.finish_website_measurement(id,revision-1,lease_token,'https://measurement-a.example.com','{}'),'stale revision cannot publish') from public.website_measurement_connections where id='cf600000-0000-4000-8000-000000000031';
select measurement_test.ok(not public.finish_website_measurement(id,revision,lease_token,'https://measurement-b.example.com','{}'),'wrong origin cannot publish') from public.website_measurement_connections where id='cf600000-0000-4000-8000-000000000031';
select measurement_test.ok(public.finish_website_measurement(id,revision,lease_token,'https://measurement-a.example.com','{"kind":"site_security","statusCode":200,"checks":[]}', 'partial'),'current source can commit evidence') from public.website_measurement_connections where id='cf600000-0000-4000-8000-000000000031';
select measurement_test.ok((select count(*)=1 from public.website_measurement_snapshots),'one report committed');
select measurement_test.ok(not public.finish_website_measurement(id,revision,null,'https://measurement-a.example.com','{}'),'an absent lease cannot commit a second report') from public.website_measurement_connections where id='cf600000-0000-4000-8000-000000000031';
-- Invalidating provider bindings must work for insert, update and delete.
insert into public.website_measurement_connections(organization_id,website_id,kind,enabled) values('cf600000-0000-4000-8000-000000000011','cf600000-0000-4000-8000-000000000021','traffic',true);
insert into public.provider_links(provider,resource_kind,external_id,entity_type,entity_id) values('vercel','site','prj_measurements','website','cf600000-0000-4000-8000-000000000021');
select measurement_test.ok((select revision=2 from public.website_measurement_connections where kind='traffic'),'new provider mapping invalidates binding');
select count(*) from public.claim_website_measurement((select id from public.website_measurement_connections where kind='traffic'));
update public.provider_links set external_id='prj_measurements_changed' where external_id='prj_measurements';
select measurement_test.ok((select revision=3 and lease_token is null from public.website_measurement_connections where kind='traffic'),'provider change invalidates in-flight run');
delete from public.provider_links where external_id='prj_measurements_changed';
select measurement_test.ok((select revision=4 from public.website_measurement_connections where kind='traffic'),'deleted binding invalidates source');
reset role;
-- Tenant visibility applies to stored evidence, not just the route's site picker.
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','cf600000-0000-4000-8000-000000000002',true);
set local role authenticated;
select measurement_test.ok((select count(*)=0 from public.website_measurement_snapshots),'other tenant cannot read known report');
select measurement_test.ok((select count(*)=0 from public.measurement_runner_health),'health is staff-only');
select measurement_test.fails($q$insert into public.website_measurement_snapshots(organization_id,website_id,connection_id,connection_revision,observed_at,expires_at,target_origin,coverage,payload) values('cf600000-0000-4000-8000-000000000012','cf600000-0000-4000-8000-000000000022','cf600000-0000-4000-8000-000000000032',1,now(),now()+interval '1 day','https://measurement-b.example.com','complete','{}')$q$,'owner cannot fabricate successful report');
reset role;
select set_config('request.jwt.claim.sub','cf600000-0000-4000-8000-000000000003',true);
set local role authenticated;
select public.configure_website_measurement('cf600000-0000-4000-8000-000000000021','site_security',false);
reset role;
select measurement_test.ok((select not enabled and revision=3 from public.website_measurement_connections where id='cf600000-0000-4000-8000-000000000031'),'disconnect hides prior revision without deleting history');
update public.websites set status='paused' where id='cf600000-0000-4000-8000-000000000021';
select set_config('request.jwt.claim.role','service_role',true);
set local role service_role;
select measurement_test.ok((select count(*)=0 from public.claim_website_measurement()),'paused sites cannot be measured');
reset role;
insert into public.leads(id,organization_id,website_id,contact,message,source) values('cf600000-0000-4000-8000-000000000041','cf600000-0000-4000-8000-000000000011','cf600000-0000-4000-8000-000000000021','{"email":"visitor@example.com"}','Inquiry','inquiries');
update public.leads set status='booked' where id='cf600000-0000-4000-8000-000000000041';
select measurement_test.ok((select details->>'from'='new' and details->>'to'='booked' and details->>'evidence'='recorded_stage_change' from public.lead_events where lead_id='cf600000-0000-4000-8000-000000000041' and kind='status_changed'),'manual stages retain structured evidence rather than inventing appointments');
select set_config('request.jwt.claim.role','anon',true);
set local role anon;
select measurement_test.fails('select * from public.website_measurement_snapshots','anonymous cannot read stored reports');
rollback;

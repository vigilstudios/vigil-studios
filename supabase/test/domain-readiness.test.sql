begin;
create schema domain_ready_test;
create function domain_ready_test.ok(value boolean,label text) returns void language plpgsql as $$begin if value is distinct from true then raise exception 'FAIL: %',label;end if;raise notice 'ok - domain readiness: %',label;end$$;
create function domain_ready_test.fails(command text,label text) returns void language plpgsql as $$begin begin execute command;exception when others then raise notice 'ok - domain readiness: % (refused)',label;return;end;raise exception 'FAIL: % was permitted',label;end$$;
grant usage on schema domain_ready_test to authenticated,anon,service_role;
grant execute on all functions in schema domain_ready_test to authenticated,anon,service_role;
insert into auth.users(id,email) values
 ('dd000000-0000-4000-8000-000000000001','domain-ready-owner@example.test'),
 ('dd000000-0000-4000-8000-000000000002','domain-ready-staff@example.test');
insert into public.staff_members(user_id,role) values('dd000000-0000-4000-8000-000000000002','admin');
insert into public.organizations(id,name,slug) values('dd000000-0000-4000-8000-000000000011','Domain Ready Fixture','domain-ready-fixture');
insert into public.organization_members(organization_id,user_id,role,status) values('dd000000-0000-4000-8000-000000000011','dd000000-0000-4000-8000-000000000001','owner','active');
insert into public.websites(id,organization_id,name,status) values('dd000000-0000-4000-8000-000000000021','dd000000-0000-4000-8000-000000000011','Domain ready fixture','building');
insert into public.domains(id,organization_id,website_id,hostname,kind,source,registrar,status) values
 ('dd000000-0000-4000-8000-000000000031','dd000000-0000-4000-8000-000000000011','dd000000-0000-4000-8000-000000000021','ready-fixture.example','apex','customer_owned','vercel','pending'),
 ('dd000000-0000-4000-8000-000000000032','dd000000-0000-4000-8000-000000000011','dd000000-0000-4000-8000-000000000021','other-ready-fixture.example','apex','customer_owned','vercel','pending');
select domain_ready_test.ok((select count(*)=0 from public.provisioning_jobs where domain_id='dd000000-0000-4000-8000-000000000031'),'saving a domain never announces readiness');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"dd000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
with changed as (update public.domains set dns_ok=true, verification='{"source":"platform","launch_ready":true}' where id='dd000000-0000-4000-8000-000000000031' returning id)
select domain_ready_test.ok((select count(*)=0 from changed),'customer RLS cannot forge verified readiness');
reset role;
select set_config('request.jwt.claims','{"role":"service_role"}',true);
update public.domains set status='verifying',dns_ok=true,verification='{"source":"platform","launch_ready":false}' where id='dd000000-0000-4000-8000-000000000031';
select domain_ready_test.ok((select count(*)=0 from public.notifications where kind='domain.ready_for_launch' and organization_id='dd000000-0000-4000-8000-000000000011'),'partial verification never alerts');
update public.domains set verification='{"source":"platform","launch_ready":true}' where id='dd000000-0000-4000-8000-000000000031';
update public.domains set dns_ok=true where id='dd000000-0000-4000-8000-000000000031';
select domain_ready_test.ok((select count(*)=1 from public.notifications where user_id='dd000000-0000-4000-8000-000000000002' and kind='domain.ready_for_launch' and organization_id='dd000000-0000-4000-8000-000000000011'),'one staff inbox alert after repeated verified checks');
select domain_ready_test.ok((select count(*)=1 from public.provisioning_jobs where domain_id='dd000000-0000-4000-8000-000000000031' and kind='domain.readiness.notify'),'one durable email job');
select domain_ready_test.ok((select status='building' and live_url is null and primary_domain_id is null from public.websites where id='dd000000-0000-4000-8000-000000000021'),'notification cannot launch a site or attach a domain');
select domain_ready_test.ok((select body like '%has not been published%' and href='/admin/organizations/dd000000-0000-4000-8000-000000000011?domain=dd000000-0000-4000-8000-000000000031' from public.notifications where user_id='dd000000-0000-4000-8000-000000000002' and kind='domain.ready_for_launch' and organization_id='dd000000-0000-4000-8000-000000000011'),'fixed staff link and honest readiness wording');

-- A crash while inserting email work rolls back the entire readiness update.
alter table public.provisioning_jobs add constraint domain_ready_test_failure check (domain_id <> 'dd000000-0000-4000-8000-000000000032'::uuid) not valid;
select domain_ready_test.fails($q$update public.domains set status='verifying',dns_ok=true,verification='{"source":"platform","launch_ready":true}' where id='dd000000-0000-4000-8000-000000000032'$q$,'outbox failure rolls back readiness and inbox alert');
select domain_ready_test.ok((select dns_ok is not true from public.domains where id='dd000000-0000-4000-8000-000000000032'),'failed transaction does not lose accepted readiness work');
select domain_ready_test.ok((select count(*)=0 from public.notifications where href like '%dd000000-0000-4000-8000-000000000032'),'no partial inbox event after rollback');
alter table public.provisioning_jobs drop constraint domain_ready_test_failure;
update public.domains set status='verifying',dns_ok=true,verification='{"source":"provider","launch_ready":true}' where id='dd000000-0000-4000-8000-000000000032';
select domain_ready_test.ok((select count(*)=0 from public.provisioning_jobs where domain_id='dd000000-0000-4000-8000-000000000032'),'routing and SSL phases do not announce prelaunch readiness');
update public.websites set status='live' where id='dd000000-0000-4000-8000-000000000021';
update public.domains set verification='{"source":"platform","launch_ready":true}' where id='dd000000-0000-4000-8000-000000000032';
select domain_ready_test.ok((select count(*)=0 from public.provisioning_jobs where domain_id='dd000000-0000-4000-8000-000000000032'),'already live site cannot create a deploy-ready alert');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"dd000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select domain_ready_test.ok((select count(*)=0 from public.notifications where kind='domain.ready_for_launch'),'customer cannot read staff alerts');
select domain_ready_test.fails($q$insert into public.notifications(user_id,kind,title) values('dd000000-0000-4000-8000-000000000002','domain.ready_for_launch','forged')$q$,'customer cannot create a staff readiness alert');
select domain_ready_test.ok(not has_function_privilege('authenticated','vigil.notify_domain_ready_for_launch()','EXECUTE'),'trigger is not a customer-callable RPC');
select domain_ready_test.ok(not has_function_privilege('authenticated','vigil.queue_domain_readiness_alert(uuid)','EXECUTE'),'queue helper is not a customer-callable RPC');
reset role;
delete from public.notifications where kind='domain.ready_for_launch' and organization_id='dd000000-0000-4000-8000-000000000011';
update public.websites set status='building' where id='dd000000-0000-4000-8000-000000000021';
update public.domains set dns_ok=true where id='dd000000-0000-4000-8000-000000000031';
select domain_ready_test.ok((select count(*)=0 from public.notifications where kind='domain.ready_for_launch' and organization_id='dd000000-0000-4000-8000-000000000011'),'deleted alerts do not reappear after another poll');
rollback;

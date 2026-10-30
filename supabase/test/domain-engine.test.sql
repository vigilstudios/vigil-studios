-- Isolated Domain Engine assertions. All fixtures and helper objects roll back.
begin;
create schema domain_test;
create function domain_test.ok(condition boolean, message text) returns void language plpgsql as $$
begin if not coalesce(condition,false) then raise exception 'DOMAIN ASSERTION FAILED: %',message; end if; raise notice 'ok - domain: %',message; end $$;
create function domain_test.fails(statement text, message text) returns void language plpgsql as $$
begin begin execute statement; exception when others then raise notice 'ok - domain: % (refused)',message; return; end; raise exception 'DOMAIN ASSERTION FAILED: %',message; end $$;
grant usage on schema domain_test to anon, authenticated, service_role;
grant execute on all functions in schema domain_test to anon, authenticated, service_role;

insert into auth.users(id,email) values ('da000000-0000-0000-0000-000000000001','domain-owner-a@example.test'),('da000000-0000-0000-0000-000000000002','domain-owner-b@example.test');
insert into public.organizations(id,name,slug) values ('db000000-0000-0000-0000-000000000001','Domain A','domain-engine-a'),('db000000-0000-0000-0000-000000000002','Domain B','domain-engine-b');
insert into public.organization_members(organization_id,user_id,role) values ('db000000-0000-0000-0000-000000000001','da000000-0000-0000-0000-000000000001','owner'),('db000000-0000-0000-0000-000000000002','da000000-0000-0000-0000-000000000002','owner');
insert into public.websites(id,organization_id,name) values ('dc000000-0000-0000-0000-000000000002','db000000-0000-0000-0000-000000000002','Domain B site');
insert into public.domain_quotes(id,organization_id,fqdn,registrar,environment,years,currency,subtotal_minor,tax_minor,total_minor,renewal_estimate_minor,expires_at) values
('dd000000-0000-0000-0000-000000000001','db000000-0000-0000-0000-000000000001','vigil-fixture.com','mock','test',1,'usd',1200,0,1200,1400,now()+interval '5 minutes');
insert into vigil.domain_contacts(id,organization_id,encrypted_payload,contact_digest) values ('de000000-0000-0000-0000-000000000001','db000000-0000-0000-0000-000000000001',repeat('x',100),repeat('a',64));
insert into public.domain_acceptances(id,organization_id,quote_id,fqdn,environment,contact_id,accepted_by,terms_version,renewal_policy_version,auto_renew_consent) values
('df000000-0000-0000-0000-000000000001','db000000-0000-0000-0000-000000000001','dd000000-0000-0000-0000-000000000001','vigil-fixture.com','test','de000000-0000-0000-0000-000000000001','da000000-0000-0000-0000-000000000001','test-v1','test-v1',false);
insert into public.domain_orders(id,organization_id,quote_id,acceptance_id,fqdn,environment,registrar,intent_key) values
('d1000000-0000-0000-0000-000000000001','db000000-0000-0000-0000-000000000001','dd000000-0000-0000-0000-000000000001','df000000-0000-0000-0000-000000000001','vigil-fixture.com','test','mock',gen_random_uuid());
insert into public.domain_events(organization_id,order_id,event_type,correlation_id) values ('db000000-0000-0000-0000-000000000001','d1000000-0000-0000-0000-000000000001','consent_recorded',gen_random_uuid());

select set_config('request.jwt.claims','{"sub":"da000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
set local role authenticated;
select domain_test.ok((select count(*) from public.domain_quotes)=1,'owner sees their quote');
select domain_test.ok((select count(*) from public.domain_orders)=1,'owner sees their order');
select domain_test.fails('update public.domain_orders set payment_state=''paid''','customer cannot forge payment');
select domain_test.fails('delete from public.domain_events','customer cannot delete evidence');
select domain_test.fails('select * from vigil.domain_contacts','contact ciphertext is not browser readable');
select domain_test.fails('select public.assert_domain_retirement_allowed(''db000000-0000-0000-0000-000000000001'')','retirement preflight is service only');
reset role;
select set_config('request.jwt.claims','{"sub":"da000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
set local role authenticated;
select domain_test.ok((select count(*) from public.domain_quotes)=0,'another tenant cannot see quotes');
select domain_test.ok((select count(*) from public.domain_orders)=0,'another tenant cannot see orders');
select domain_test.ok((select count(*) from public.domain_events)=0,'another tenant cannot see events');
reset role;
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
select domain_test.fails('select * from public.domain_quotes','anonymous role has no quote grant');
reset role;
select set_config('request.jwt.claims','{"role":"service_role"}',true);
set local role service_role;
select domain_test.fails('update public.domain_quotes set total_minor=1300','quote is immutable even for service');
select domain_test.fails('delete from public.domain_acceptances','acceptance is immutable');
select domain_test.fails('delete from public.domain_events','events are append only');
select domain_test.fails('update public.domain_orders set organization_id=''db000000-0000-0000-0000-000000000002''','order tenant identity is immutable');
select domain_test.fails('insert into public.domain_registrations(organization_id,website_id,fqdn,registrar,environment) values (''db000000-0000-0000-0000-000000000001'',''dc000000-0000-0000-0000-000000000002'',''vigil-fixture.com'',''mock'',''test'')','asset cannot reference another tenant website');
select domain_test.fails('insert into public.domain_registrations(organization_id,fqdn,registrar,environment) values (''db000000-0000-0000-0000-000000000001'',''vigil-fixture.com'',''mock'',''live'')','mock cannot create a live registration');
update public.domain_orders set registration_state='unknown',payment_state='authorized' where id='d1000000-0000-0000-0000-000000000001';
select domain_test.fails('select public.assert_domain_retirement_allowed(''db000000-0000-0000-0000-000000000001'')','unknown purchase blocks retirement');
select domain_test.fails('delete from public.organizations where id=''db000000-0000-0000-0000-000000000001''','organization cascade cannot orphan domain evidence');
select domain_test.fails('insert into public.provider_links(provider,resource_kind,external_id,entity_type,entity_id) values (''other'',''registration'',''mock_ref'',''domain_registration'',gen_random_uuid())','provider mapping requires scope');

-- Transactional RPC idempotency, final-state protection and tenant-bound support.
do $$
declare q uuid; o uuid; again uuid; asset uuid; acceptance_count bigint;
begin
 q:=public.create_domain_quote('db000000-0000-0000-0000-000000000001',null,jsonb_build_object('fqdn','transaction-fixture.com','registrar','mock','environment','test','years',1,'currency','usd','subtotal_minor',1500,'tax_minor',0,'total_minor',1500,'renewal_estimate_minor',1700,'expires_at',now()+interval '5 minutes'),1200);
 o:=public.create_domain_purchase(q,'db000000-0000-0000-0000-000000000001','da000000-0000-0000-0000-000000000001','da100000-0000-0000-0000-000000000001','da200000-0000-0000-0000-000000000001',repeat('x',100),repeat('b',64),1500,'usd',false,'test-v1','test-v1');
 again:=public.create_domain_purchase(q,'db000000-0000-0000-0000-000000000001','da000000-0000-0000-0000-000000000001','da100000-0000-0000-0000-000000000001','da200000-0000-0000-0000-000000000002',repeat('y',100),repeat('b',64),1500,'usd',false,'test-v1','test-v1');
 perform domain_test.ok(o=again,'same approved intent returns its original order');
 perform domain_test.ok((select count(*) from public.domain_acceptances where quote_id=q)=1,'duplicate checkout creates only one acceptance');
 perform domain_test.fails(format('select public.create_domain_purchase(%L,%L,%L,%L,%L,%L,%L,1500,''usd'',true,''test-v1'',''test-v1'')',q,'db000000-0000-0000-0000-000000000001','da000000-0000-0000-0000-000000000001','da100000-0000-0000-0000-000000000001',gen_random_uuid(),repeat('z',100),repeat('b',64)),'changed renewal consent cannot reuse intent');
 perform domain_test.ok(not public.claim_domain_registration(o),'unpaid order cannot be claimed');
 perform public.transition_domain_order(o,'{"payment_state":"authorized"}');
 perform domain_test.ok(public.claim_domain_registration(o),'authorized order is claimed once');
 perform domain_test.ok(not public.claim_domain_registration(o),'second worker cannot claim submitting order');
 asset:=public.record_domain_registration(o,'{"fqdn":"transaction-fixture.com","contactVerification":"pending","expiresAt":"2027-10-24T00:00:00Z","autoRenew":false}','mock-registration-transaction','mock:test');
 perform domain_test.fails(format('select public.transition_domain_order(%L,''{"registration_state":"failed"}'')',o),'late failure cannot replace successful registration');
 perform domain_test.fails(format('insert into public.domain_support_requests(organization_id,registration_id,kind,requested_by) values(%L,%L,''release'',%L)','db000000-0000-0000-0000-000000000002',asset,'da000000-0000-0000-0000-000000000002'),'support cannot reference another tenant asset');
 perform domain_test.ok(public.record_domain_lifecycle_notice(asset,'renewal_30','2027-10-24'),'first lifecycle notice recorded');
 perform domain_test.ok(not public.record_domain_lifecycle_notice(asset,'renewal_30','2027-10-24'),'duplicate lifecycle notice suppressed atomically');
 perform domain_test.ok((select count(*) from public.notifications where organization_id='db000000-0000-0000-0000-000000000001' and kind='domain_attention')=1,'one owner dashboard notification');
 q:=public.create_domain_quote('db000000-0000-0000-0000-000000000001',null,jsonb_build_object('fqdn','transaction-fixture.com','registrar','mock','environment','test','years',1,'currency','usd','subtotal_minor',1500,'tax_minor',0,'total_minor',1500,'expires_at',now()+interval '5 minutes'),1200);
 perform domain_test.fails(format('select public.create_domain_purchase(%L,%L,%L,%L,%L,%L,%L,1500,''usd'',false,''test-v1'',''test-v1'')',q,'db000000-0000-0000-0000-000000000001','da000000-0000-0000-0000-000000000001',gen_random_uuid(),gen_random_uuid(),repeat('x',100),repeat('e',64)),'a managed registration cannot open a second purchase checkout');

end $$;
insert into public.domains(id,organization_id,hostname) values('da300000-0000-0000-0000-000000000001','db000000-0000-0000-0000-000000000001','callback-fixture.com');
insert into public.dns_authorizations(id,organization_id,domain_id,dns_provider,environment,template_version,requested_records,requested_by,expires_at) values('da400000-0000-0000-0000-000000000001','db000000-0000-0000-0000-000000000001','da300000-0000-0000-0000-000000000001','mock','test',1,'[{"type":"A","name":"@","value":"192.0.2.1"}]','da000000-0000-0000-0000-000000000001',now()+interval '5 minutes');
insert into vigil.domain_authorization_secrets(authorization_id,organization_id,callback_nonce_digest) values('da400000-0000-0000-0000-000000000001','db000000-0000-0000-0000-000000000001',repeat('a',64));
select domain_test.fails('select public.consume_domain_dns_callback(''da400000-0000-0000-0000-000000000001'',''db000000-0000-0000-0000-000000000002'',repeat(''a'',64),true)','callback bound to tenant');
select domain_test.fails('select public.consume_domain_dns_callback(''da400000-0000-0000-0000-000000000001'',''db000000-0000-0000-0000-000000000001'',repeat(''b'',64),true)','wrong nonce refused');
select public.consume_domain_dns_callback('da400000-0000-0000-0000-000000000001','db000000-0000-0000-0000-000000000001',repeat('a',64),true);
select domain_test.ok((select status='approved' from public.dns_authorizations where id='da400000-0000-0000-0000-000000000001'),'callback records approval only');
select domain_test.ok((select dns_ok is not true and ssl_ok is not true from public.domains where id='da300000-0000-0000-0000-000000000001'),'callback cannot claim DNS or SSL success');
select domain_test.fails('select public.consume_domain_dns_callback(''da400000-0000-0000-0000-000000000001'',''db000000-0000-0000-0000-000000000001'',repeat(''a'',64),true)','callback replay refused');
-- A provider ID collision must roll back the new asset rather than silently mislink it.
do $$
declare q uuid; o uuid;
begin
 q:=public.create_domain_quote('db000000-0000-0000-0000-000000000001',null,jsonb_build_object('fqdn','provider-collision-fixture.com','registrar','mock','environment','test','years',1,'currency','usd','subtotal_minor',1500,'tax_minor',0,'total_minor',1500,'expires_at',now()+interval '5 minutes'),1200);
 o:=public.create_domain_purchase(q,'db000000-0000-0000-0000-000000000001','da000000-0000-0000-0000-000000000001',gen_random_uuid(),gen_random_uuid(),repeat('x',100),repeat('d',64),1500,'usd',false,'test-v1','test-v1');
 perform public.transition_domain_order(o,'{"payment_state":"authorized"}');
 perform public.claim_domain_registration(o);
 perform domain_test.fails(format('select public.record_domain_registration(%L,''{"fqdn":"provider-collision-fixture.com","contactVerification":"pending","expiresAt":"2027-10-24T00:00:00Z","autoRenew":false}'',''mock-registration-transaction'',''mock:test'')',o),'provider ID already bound to another asset is refused');
 perform domain_test.ok(not exists(select 1 from public.domain_registrations where fqdn='provider-collision-fixture.com'),'collision rolls back the orphan asset');
end $$;
-- Registrar customer provisioning is single-flight and strictly sandbox scoped.
do $$
declare q uuid; o uuid; a uuid; first_claim jsonb; second_claim jsonb;
begin
 q:=public.create_domain_quote('db000000-0000-0000-0000-000000000001',null,jsonb_build_object('fqdn','openprovider-contact-fixture.com','registrar','openprovider','environment','test','years',1,'currency','usd','subtotal_minor',1500,'tax_minor',0,'total_minor',1500,'expires_at',now()+interval '5 minutes'),1200);
 o:=public.create_domain_purchase(q,'db000000-0000-0000-0000-000000000001','da000000-0000-0000-0000-000000000001',gen_random_uuid(),gen_random_uuid(),repeat('x',100),repeat('c',64),1500,'usd',false,'test-v1','test-v1');
 select acceptance_id into a from public.domain_orders where id=o;
 perform domain_test.fails(format('select public.claim_domain_sandbox_contact(%L,''openprovider:test:301026'')',a),'unpaid contact cannot be provisioned');
 perform public.transition_domain_order(o,'{"payment_state":"authorized"}');
 perform domain_test.ok(public.claim_domain_registration(o),'Openprovider order claimed before customer creation');
 first_claim:=public.claim_domain_sandbox_contact(a,'openprovider:test:301026');
 second_claim:=public.claim_domain_sandbox_contact(a,'openprovider:test:301026');
 perform domain_test.ok((first_claim->>'claimed')::boolean,'first approved customer submission claimed');
 perform domain_test.ok(not (second_claim->>'claimed')::boolean and not (second_claim ? 'handle'),'lost customer response cannot authorize a second create');
 perform domain_test.fails(format('select public.finish_domain_sandbox_contact(%L,''openprovider:test:999999'',''AE123456-US'')',a),'contact completion requires matching account');
 perform domain_test.fails(format('select public.claim_domain_sandbox_contact(%L,''openprovider:live:301026'')',a),'contact claim cannot target production');
 perform public.finish_domain_sandbox_contact(a,'openprovider:test:301026','AE123456-US');
 perform public.finish_domain_sandbox_contact(a,'openprovider:test:301026','AE123456-US');
 perform domain_test.ok(public.claim_domain_sandbox_contact(a,'openprovider:test:301026')->>'handle'='AE123456-US','saved contact handle reused after retry');
 perform domain_test.fails(format('select public.finish_domain_sandbox_contact(%L,''openprovider:test:301026'',''ZZ123456-US'')',a),'contact cannot be silently replaced');
 perform public.transition_domain_order(o,'{"registration_state":"pending","payment_state":"refunded"}');
 perform domain_test.ok(public.claim_domain_sandbox_contact(a,'openprovider:test:301026')->>'handle'='AE123456-US','existing owner contact remains available independently of a refunded payment');
end $$;
-- Name.com is additive, test-only and bound to a namespaced account reference.
do $$
declare q uuid; o uuid; asset uuid; scope text := 'namecom:test:'||repeat('a',64);
begin
 q:=public.create_domain_quote('db000000-0000-0000-0000-000000000001',null,jsonb_build_object('fqdn','namecom-client-fixture.com','registrar','namecom','environment','test','years',1,'currency','usd','subtotal_minor',1200,'tax_minor',0,'total_minor',1200,'expires_at',now()+interval '5 minutes'),1200);
 o:=public.create_domain_purchase(q,'db000000-0000-0000-0000-000000000001','da000000-0000-0000-0000-000000000001',gen_random_uuid(),gen_random_uuid(),repeat('x',100),repeat('f',64),1200,'usd',false,'test-v1','test-v1');
 perform public.transition_domain_order(o,'{"payment_state":"authorized"}');
 perform domain_test.ok(public.claim_domain_registration(o),'Name.com purchase uses the existing single-flight claim');
 perform domain_test.fails(format('select public.record_domain_registration(%L,''{"fqdn":"namecom-client-fixture.com","status":"contact_hold","contactVerification":"pending","expiresAt":"2027-10-25T00:00:00Z","autoRenew":false}'',''123'',%L)',o,scope),'Name.com bare provider ID is refused');
 perform domain_test.fails(format('select public.record_domain_registration(%L,''{"fqdn":"namecom-client-fixture.com","status":"contact_hold","contactVerification":"pending","expiresAt":"2027-10-25T00:00:00Z","autoRenew":false}'',%L,''openprovider:test:301026'')',o,scope||':domain:namecom-client-fixture.com'),'Name.com cannot use another provider scope');
 asset:=public.record_domain_registration(o,'{"fqdn":"namecom-client-fixture.com","status":"contact_hold","contactVerification":"pending","expiresAt":"2027-10-25T00:00:00Z","autoRenew":false}',scope||':domain:namecom-client-fixture.com',scope);
 perform domain_test.ok((select registrar='namecom' and environment='test' and registration_status='contact_hold' from public.domain_registrations where id=asset),'Name.com asset retains its registrar and environment');
 perform domain_test.ok(public.record_domain_registration(o,'{"fqdn":"namecom-client-fixture.com","status":"contact_hold","contactVerification":"pending","expiresAt":"2027-10-25T00:00:00Z","autoRenew":false}',scope||':domain:namecom-client-fixture.com',scope)=asset,'Name.com replay reuses its original asset');
 perform domain_test.fails($sql$insert into public.domain_quotes(organization_id,fqdn,registrar,environment,years,currency,subtotal_minor,tax_minor,total_minor,expires_at) values('db000000-0000-0000-0000-000000000001','namecom-live-refused.com','namecom','live',1,'usd',1200,0,1200,now()+interval '5 minutes')$sql$,'Name.com live quotes remain blocked by SQL');
end $$;

insert into public.websites(id,organization_id,name) values ('dc000000-0000-0000-0000-000000000001','db000000-0000-0000-0000-000000000001','Domain A isolated site');
-- Managed website binding and single-flight DNS consent.
do $$
declare asset uuid; order_id uuid; d uuid; p jsonb; claimed jsonb; again jsonb; plan_id uuid; scope text:='namecom:test:'||repeat('a',64);
begin
 select id into asset from public.domain_registrations where fqdn='namecom-client-fixture.com';
 select id into order_id from public.domain_orders where registration_id=asset;
 perform domain_test.fails(format('select public.bind_managed_domain(%L,%L,%L)',asset,'dc000000-0000-0000-0000-000000000001','da000000-0000-0000-0000-000000000001'),'unpaid managed registration cannot bind a website');
 perform public.transition_domain_order(order_id,'{"payment_state":"paid"}');
 perform domain_test.fails(format('select public.bind_managed_domain(%L,%L,%L)',asset,'dc000000-0000-0000-0000-000000000002','da000000-0000-0000-0000-000000000001'),'binding cannot cross tenant website');
 perform domain_test.fails(format('select public.bind_managed_domain(%L,%L,%L)',asset,'dc000000-0000-0000-0000-000000000001','da000000-0000-0000-0000-000000000002'),'binding requires an actual owner in the registration tenant');
 d:=public.bind_managed_domain(asset,'dc000000-0000-0000-0000-000000000001','da000000-0000-0000-0000-000000000001');
 perform domain_test.ok(d=public.bind_managed_domain(asset,'dc000000-0000-0000-0000-000000000001','da000000-0000-0000-0000-000000000001'),'binding is idempotent');
 perform domain_test.ok((select managed_registration_id=asset and source='purchased_via_vigil' and not coalesce(dns_ok,false) from public.domains where id=d),'binding neither verifies DNS nor attaches a live hostname');
 update public.domain_registrations set registration_status='registered' where id=asset;
 p:=jsonb_build_object('fqdn','namecom-client-fixture.com','accountScope',scope,'snapshotDigest',repeat('b',64),'expected',jsonb_build_array(jsonb_build_object('name','@','type','A','value','76.76.21.21','ttl',300)),'creates','[]'::jsonb);
 plan_id:=(public.create_managed_dns_plan(asset,'da000000-0000-0000-0000-000000000001',p)->>'id')::uuid;
 perform domain_test.fails(format('select public.claim_managed_dns_plan(%L,%L,%L)',plan_id,'db000000-0000-0000-0000-000000000002','da000000-0000-0000-0000-000000000002'),'DNS plan cannot cross tenants');
 claimed:=public.claim_managed_dns_plan(plan_id,'db000000-0000-0000-0000-000000000001','da000000-0000-0000-0000-000000000001');
 again:=public.claim_managed_dns_plan(plan_id,'db000000-0000-0000-0000-000000000001','da000000-0000-0000-0000-000000000001');
 perform domain_test.ok((claimed->>'claimed')::boolean and not (again->>'claimed')::boolean,'only one worker receives DNS write authority');
 perform domain_test.fails(format('select public.create_managed_dns_plan(%L,%L,%L)',asset,'da000000-0000-0000-0000-000000000001',p),'an uncertain prior DNS submission blocks new plans');
 perform domain_test.fails(format('select public.finish_managed_dns_plan(%L,%L,true)',plan_id,gen_random_uuid()),'result cannot be saved under another claim');
 perform public.finish_managed_dns_plan(plan_id,(claimed->'record'->>'claim_token')::uuid,true);
 perform public.finish_managed_dns_plan(plan_id,(claimed->'record'->>'claim_token')::uuid,true);
 perform domain_test.ok((select not dns_ok and not ssl_ok and not (verification->>'launch_ready')::boolean from public.domains where id=d),'sandbox DNS save never claims public DNS or HTTPS');
 perform domain_test.ok((select reason_code='contact_required' from public.domain_orders where id=order_id),'DNS approval preserves the independent registrant verification reminder');
end $$;

-- Fresh provider reads update lifecycle without billing, DNS or transfer operations.
do $$
declare asset uuid; scope text:='namecom:test:'||repeat('a',64); external_ref text; snap jsonb; signal_count bigint;
begin
 select id into asset from public.domain_registrations where fqdn='namecom-client-fixture.com';
 external_ref:=scope||':domain:namecom-client-fixture.com';
 snap:='{"fqdn":"namecom-client-fixture.com","status":"registered","contactVerification":"verified","expiresAt":"2027-10-26T00:00:00Z","autoRenew":false}';
 perform domain_test.ok(public.sync_managed_domain_state(asset,snap,external_ref,scope,now()-interval '2 minutes'),'fresh provider read updates contact verification');
 perform domain_test.ok(not public.sync_managed_domain_state(asset,snap||'{"contactVerification":"pending"}',external_ref,scope,now()-interval '3 minutes'),'older read cannot regress a newer verification');
 perform domain_test.ok((select contact_verification='verified' from public.domain_registrations where id=asset),'verified contact is retained after stale read');
 perform domain_test.ok((select reason_code is null from public.domain_orders where registration_id=asset),'fresh verified contact clears its stale action prompt');
 perform domain_test.fails(format('select public.sync_managed_domain_state(%L,%L,%L,%L,now())',asset,snap,external_ref,'namecom:test:'||repeat('c',64)),'lifecycle read cannot use another registrar account');
 perform domain_test.ok(public.sync_managed_domain_state(asset,snap||'{"status":"contact_hold","contactVerification":"failed"}',external_ref,scope,now()-interval '1 minute'),'registrar hold is recorded');
 perform domain_test.ok((select status='error' and not dns_ok and not ssl_ok from public.domains where managed_registration_id=asset),'hold stops a connected/launch-ready claim without deleting DNS');
 perform domain_test.ok(public.record_managed_domain_signal(scope,repeat('d',64)),'first signed-content receipt queues work');
 perform domain_test.ok(not public.record_managed_domain_signal(scope,repeat('d',64)),'changed unsigned nonce cannot queue signed content twice');
 select count(*) into signal_count from public.provisioning_jobs where idempotency_key='domain.lifecycle:'||scope||':'||repeat('d',64);
 perform domain_test.ok(signal_count=1,'one registrar signal creates one durable read-only job');
 perform domain_test.fails(format('select public.record_managed_domain_signal(%L,%L)','namecom:live:'||repeat('a',64),repeat('d',64)),'registrar notifications cannot target live operations');
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"da000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
set local role authenticated;
select domain_test.fails('select * from vigil.managed_domain_dns_plans','DNS snapshots and claim tokens are not browser readable');
select domain_test.fails('select * from vigil.managed_domain_signals','raw receipt storage is not browser readable');
update public.domains set managed_registration_id=null where managed_registration_id is not null;
select domain_test.fails('select public.record_managed_domain_signal(''namecom:test:''||repeat(''a'',64),repeat(''e'',64))','only verified server notifications can enqueue registrar reads');
reset role;
select set_config('request.jwt.claims','{"role":"service_role"}',true);
set local role service_role;
select domain_test.ok((select count(*) from public.domains where managed_registration_id is not null)=1,'customer update cannot detach managed registrations to bypass the deployment gate');

-- Live policy and scoped external DNS are exercised only as local SQL fixtures.
insert into public.websites(id,organization_id,name) values('e2000000-0000-4000-8000-000000000001','db000000-0000-0000-0000-000000000001','Live policy fixture');
select domain_test.fails('select public.create_live_domain_quote(''db000000-0000-0000-0000-000000000001'',''e2000000-0000-4000-8000-000000000001'',''live-policy-fixture.com'',1200,1400,now()+interval ''5 minutes'')','live quotes cannot exist without reviewed policy');
insert into vigil.domain_live_policies(id,organization_id,website_id,fqdn,registrar_tax_confirmation,registrar_scope,stripe_account,max_registrar_minor,max_client_minor,service_fee_minor,tax_rate_bps,registrant_country,registrant_region,registrant_postal_code,tax_description,terms_version,terms_url,registration_agreement_url,renewal_policy_version,renewal_model,retention_days,dns_approved,approval_reference,approved_by,valid_until)
values('e1000000-0000-4000-8000-000000000001','db000000-0000-0000-0000-000000000001','e2000000-0000-4000-8000-000000000001','live-policy-fixture.com','Synthetic zero-VAT confirmation for local tests','namecom:live:'||repeat('f',64),'acct_fixture',2000,2500,500,625,'US','NY','10001','Synthetic approved test tax','live-fixture-v1','https://example.com/terms','https://example.com/registration','manual-fixture-v1','manual',365,true,'Synthetic test release approval','da000000-0000-0000-0000-000000000001',now()+interval '1 day');
select domain_test.fails('update vigil.domain_live_policies set service_fee_minor=999','approved prices cannot change in place');
select domain_test.fails('select public.create_live_domain_quote(''db000000-0000-0000-0000-000000000001'',''e2000000-0000-4000-8000-000000000001'',''another.com'',1200,1400,now()+interval ''5 minutes'')','pilot policy cannot authorize another hostname');
select domain_test.fails('select public.create_live_domain_quote(''db000000-0000-0000-0000-000000000001'',''e2000000-0000-4000-8000-000000000001'',''live-policy-fixture.com'',2001,1400,now()+interval ''5 minutes'')','registrar budget cannot be exceeded');
do $$
declare q uuid; o uuid; p jsonb; scope text:='namecom:live:'||repeat('f',64);
begin
 q:=public.create_live_domain_quote('db000000-0000-0000-0000-000000000001','e2000000-0000-4000-8000-000000000001','live-policy-fixture.com',1200,1400,now()+interval '5 minutes');
 perform domain_test.ok((select subtotal_minor=1700 and tax_minor=107 and total_minor=1807 from public.domain_quotes where id=q),'live price uses approved fee and integer-rounded tax');
 perform domain_test.fails(format('select public.create_domain_purchase(%L,%L,%L,gen_random_uuid(),gen_random_uuid(),%L,%L,1807,%L,true,%L,%L)',q,'db000000-0000-0000-0000-000000000001','da000000-0000-0000-0000-000000000001',repeat('x',100),repeat('f',64),'usd','live-fixture-v1','manual-fixture-v1'),'manual policy cannot enable auto-renew');
 o:=public.create_domain_purchase(q,'db000000-0000-0000-0000-000000000001','da000000-0000-0000-0000-000000000001',gen_random_uuid(),gen_random_uuid(),repeat('x',100),repeat('f',64),1807,'usd',false,'live-fixture-v1','manual-fixture-v1');
 perform domain_test.fails(format('select public.authorize_live_domain_action(%L,%L,%L,%L)',o,'capture',scope,'acct_fixture'),'uncaptured unregistered order cannot be captured');
 perform public.authorize_live_domain_action(o,'checkout',scope,'acct_fixture');
 perform domain_test.fails(format('select public.authorize_live_domain_action(%L,%L,%L,%L)',o,'checkout',scope,'acct_wrong'),'Stripe account scope cannot change');
 update public.domain_orders set payment_state='authorized',payment_capture_before=now()+interval '1 day' where id=o;
 perform domain_test.ok(public.claim_domain_registration(o),'live purchase still requires the single-flight claim');
 perform domain_test.ok(not public.claim_domain_registration(o),'a second worker cannot claim registration');
 perform domain_test.fails(format('select public.authorize_live_domain_action(%L,%L,%L,%L)',o,'registration',scope,'acct_fixture'),'registration requires original billing account mapping');
 insert into public.provider_links(provider,resource_kind,external_id,entity_type,entity_id,metadata) values('stripe','domain_checkout','cs_live_local_sql_fixture','domain_order',o,jsonb_build_object('environment','live','account_scope','acct_fixture'));
 perform public.authorize_live_domain_action(o,'registration',scope,'acct_fixture');
 perform domain_test.ok(public.record_managed_domain_signal(scope,repeat('9',64)),'known live registrar scope may queue read-only lifecycle checks');
 update vigil.domain_live_policies set revoked_at=now() where id='e1000000-0000-4000-8000-000000000001';
 perform domain_test.fails(format('select public.authorize_live_domain_action(%L,%L,%L,%L)',o,'registration',scope,'acct_fixture'),'revocation stops a new registrar submission');
end $$;
insert into public.domains(id,organization_id,website_id,hostname,kind,source,status) values('e3000000-0000-4000-8000-000000000001','db000000-0000-0000-0000-000000000001','e2000000-0000-4000-8000-000000000001','cloudflare-fixture.com','apex','customer_owned','pending');
select domain_test.fails('select public.external_dns_release(''e3000000-0000-4000-8000-000000000001'',''da000000-0000-0000-0000-000000000001'')','client token alone does not authorize a production DNS release');
insert into vigil.domain_dns_releases(domain_id,organization_id,website_id,hostname,approval_reference,approved_by,valid_until) values('e3000000-0000-4000-8000-000000000001','db000000-0000-0000-0000-000000000001','e2000000-0000-4000-8000-000000000001','cloudflare-fixture.com','Synthetic exact DNS test approval','da000000-0000-0000-0000-000000000001',now()+interval '1 day');
select domain_test.fails('select public.external_dns_release(''e3000000-0000-4000-8000-000000000001'',''da000000-0000-0000-0000-000000000002'')','another tenant owner cannot use the DNS release');
do $$
declare id uuid:=gen_random_uuid(); p jsonb; claimed jsonb;
begin
 p:=jsonb_build_object('fqdn','cloudflare-fixture.com','zoneId',repeat('a',32),'snapshotDigest',repeat('b',64),'changes','[{"operation":"create","before":null,"after":{"type":"A","name":"cloudflare-fixture.com","content":"76.76.21.21"}}]'::jsonb,'expected','[{"type":"A","name":"@","value":"76.76.21.21","ttl":300}]'::jsonb);
 perform public.create_external_dns_plan(id,'e3000000-0000-4000-8000-000000000001','da000000-0000-0000-0000-000000000001',repeat('encrypted-fixture',10),p);
 perform domain_test.ok(not (public.external_dns_plan('e3000000-0000-4000-8000-000000000001','da000000-0000-0000-0000-000000000001') ? 'encrypted_token'),'client DNS status never returns a token');
 claimed:=public.claim_external_dns_plan(id,'da000000-0000-0000-0000-000000000001','db000000-0000-0000-0000-000000000001');
 perform domain_test.ok((claimed->>'claimed')::boolean,'DNS write authority is claimed once');
 perform domain_test.ok(not (public.claim_external_dns_plan(id,'da000000-0000-0000-0000-000000000001','db000000-0000-0000-0000-000000000001')->>'claimed')::boolean,'duplicate DNS request has no new write authority');
 perform public.authorize_external_dns_write(id,(claimed->'record'->>'claim_token')::uuid,'db000000-0000-0000-0000-000000000001');
 perform public.finish_external_dns_plan(id,(claimed->'record'->>'claim_token')::uuid,true);
 perform domain_test.ok((select encrypted_token is null and status='applied' from vigil.domain_external_dns_plans where domain_external_dns_plans.id=(claimed->'record'->>'id')::uuid),'successful connection clears encrypted token');
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"da000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
set local role authenticated;
select domain_test.fails('select * from vigil.domain_live_policies','browser cannot read private spending policy');
select domain_test.fails('select * from vigil.domain_external_dns_plans','browser cannot read tokens or full DNS snapshots');
select domain_test.fails('select public.authorize_live_domain_action(gen_random_uuid(),''registration'',''scope'',''acct_fixture'')','browser cannot mint live purchase authority');
reset role;
rollback;

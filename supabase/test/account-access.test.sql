-- Isolated fictional identities; the entire suite rolls back.
begin;
create schema account_test;
create function account_test.ok(v boolean,label text) returns void language plpgsql as $$begin if v is distinct from true then raise exception 'FAIL: %',label;end if;raise notice 'ok - account: %',label;end$$;
create function account_test.fails(command text,code text,label text) returns void language plpgsql as $$begin begin execute command;exception when others then if sqlstate<>code then raise exception 'FAIL: % expected %, got %: %',label,code,sqlstate,sqlerrm;end if;raise notice 'ok - account: % (refused)',label;return;end;raise exception 'FAIL: % was permitted',label;end$$;
grant usage on schema account_test to anon,authenticated,service_role;grant execute on all functions in schema account_test to anon,authenticated,service_role;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
 ('da000000-0000-4000-8000-000000000001','account-fixture-buyer@example.test',now(),'{"full_name":"Account Fixture Buyer"}'),
 ('da000000-0000-4000-8000-000000000002','account-fixture-other@example.test',now(),'{"full_name":"Account Fixture Other"}'),
 ('da000000-0000-4000-8000-000000000003','account-fixture-unverified@example.test',null,'{}'),
 ('da000000-0000-4000-8000-000000000004','account-fixture-staff@example.test',now(),'{}'),
 ('da000000-0000-4000-8000-000000000005','account-fixture-prospect@example.test',now(),'{}');
insert into public.staff_members(user_id,role) values('da000000-0000-4000-8000-000000000004','admin');
select account_test.ok((select count(*)=5 from public.profiles where id::text like 'da%'),'registration creates profiles');
select account_test.ok(not exists(select 1 from public.organization_members where user_id::text like 'da%'),'registration creates no paid business or membership');
-- A lookalike name and billing email are not proof of ownership.
insert into public.organizations(id,name,slug,billing_email) values('da000000-0000-4000-8000-000000000011','Account Fixture Studio','account-fixture-private','account-fixture-buyer@example.test');
insert into public.organization_members(organization_id,user_id,role,status) values('da000000-0000-4000-8000-000000000011','da000000-0000-4000-8000-000000000002','owner','active');
insert into public.orders(id,email,business_name,project_kind,checkout_token) values('da000000-0000-4000-8000-000000000021','account-fixture-buyer@example.test','Account Fixture Studio','express',repeat('a',64));
select set_config('request.jwt.claim.role','service_role',true);set local role service_role;
select account_test.fails($q$select public.claim_checkout_order('da000000-0000-4000-8000-000000000021','da000000-0000-4000-8000-000000000002',repeat('a',64))$q$,'42501','link possession cannot claim another verified email');
select account_test.fails($q$select public.claim_checkout_order('da000000-0000-4000-8000-000000000021','da000000-0000-4000-8000-000000000003',repeat('a',64))$q$,'42501','unverified account cannot buy');
select account_test.fails($q$select public.claim_checkout_order('da000000-0000-4000-8000-000000000021','da000000-0000-4000-8000-000000000001',repeat('b',64))$q$,'22023','wrong token refused');
select public.claim_checkout_order('da000000-0000-4000-8000-000000000021','da000000-0000-4000-8000-000000000001',repeat('a',64));
select account_test.ok((select buyer_user_id='da000000-0000-4000-8000-000000000001' from public.orders where id='da000000-0000-4000-8000-000000000021'),'prepared order binds to exact verified account');
select account_test.fails($q$update public.orders set buyer_user_id='da000000-0000-4000-8000-000000000002' where id='da000000-0000-4000-8000-000000000021'$q$,'23514','bound buyer cannot be reassigned');
select account_test.fails($q$insert into public.orders(email,business_name,buyer_user_id) values('account-fixture-other@example.test','Forged','da000000-0000-4000-8000-000000000001')$q$,'42501','new purchase email must match verified buyer');
reset role;
insert into public.organization_members(organization_id,user_id,role,status) values('da000000-0000-4000-8000-000000000011','da000000-0000-4000-8000-000000000001','manager','active');
insert into public.orders(id,email,business_name,organization_id,checkout_token) values('da000000-0000-4000-8000-000000000024','account-fixture-buyer@example.test','Prepared business','da000000-0000-4000-8000-000000000011',repeat('c',64));
set local role service_role;
select account_test.fails($q$select public.claim_checkout_order('da000000-0000-4000-8000-000000000024','da000000-0000-4000-8000-000000000001',repeat('c',64))$q$,'42501','manager cannot pay an owner-bound business quote that provisioning would reject');
reset role;
delete from public.orders where id='da000000-0000-4000-8000-000000000024';
delete from public.organization_members where organization_id='da000000-0000-4000-8000-000000000011' and user_id='da000000-0000-4000-8000-000000000001';
reset role;select set_config('request.jwt.claim.role','authenticated',true);select set_config('request.jwt.claim.sub','da000000-0000-4000-8000-000000000001',true);set local role authenticated;
select account_test.ok((select count(*)=1 from public.my_purchase_orders),'buyer sees own pending purchase before business provisioning');
select account_test.ok((select not(to_jsonb(p)?'checkout_token') and not(to_jsonb(p)?'metadata') and not(to_jsonb(p)?'notes') and not(to_jsonb(p)?'error') from public.my_purchase_orders p limit 1),'customer purchase DTO excludes capabilities and private staff data');
select account_test.fails($q$select public.list_customer_accounts()$q$,'42501','customer cannot read account directory');
select account_test.fails($q$select public.claim_checkout_order('da000000-0000-4000-8000-000000000021','da000000-0000-4000-8000-000000000001',repeat('a',64))$q$,'42501','browser cannot call service-only claim function');
select account_test.fails($q$select public.allocate_order_project('da000000-0000-4000-8000-000000000021','forged','other')$q$,'42501','browser cannot allocate a business');
reset role;select set_config('request.jwt.claim.sub','da000000-0000-4000-8000-000000000002',true);set local role authenticated;
select account_test.ok((select count(*)=0 from public.my_purchase_orders),'other customer cannot read buyer purchase');
reset role;update public.orders set status='paid',paid_at=now() where id='da000000-0000-4000-8000-000000000021';
select set_config('request.jwt.claim.role','service_role',true);set local role service_role;
select set_config('account_test.allocated',public.allocate_order_project('da000000-0000-4000-8000-000000000021','account-fixture-studio','other')::text,true);
select account_test.ok((current_setting('account_test.allocated')::jsonb->>'organizationId')::uuid<>'da000000-0000-4000-8000-000000000011','billing email and business name cannot adopt another private business');
select account_test.ok(public.allocate_order_project('da000000-0000-4000-8000-000000000021','account-fixture-studio','other')=current_setting('account_test.allocated')::jsonb,'duplicate allocation returns same business/project/site');
reset role;
select account_test.ok((select count(*)=1 from public.organization_members where organization_id=(current_setting('account_test.allocated')::jsonb->>'organizationId')::uuid and user_id='da000000-0000-4000-8000-000000000001' and role='owner' and status='active'),'paid buyer gets direct owner membership without email claiming');
select account_test.ok(not exists(select 1 from public.organization_invites where organization_id=(current_setting('account_test.allocated')::jsonb->>'organizationId')::uuid),'bound purchase creates no email-only ownership invitation');
select account_test.ok((select count(*)=1 from public.projects where source_ref='order:da000000-0000-4000-8000-000000000021'),'retry creates one project');
-- A second purchase of the same business reuses only a business the buyer already owns.
insert into public.orders(id,email,business_name,project_kind,status,buyer_user_id) values('da000000-0000-4000-8000-000000000022','account-fixture-buyer@example.test','Account Fixture Studio','professional','paid','da000000-0000-4000-8000-000000000001');
select set_config('request.jwt.claim.role','service_role',true);set local role service_role;
select account_test.ok(public.allocate_order_project('da000000-0000-4000-8000-000000000022','account-fixture-studio','other')->>'organizationId'=current_setting('account_test.allocated')::jsonb->>'organizationId','subsequent purchase reuses a business owned by the same buyer');
reset role;select set_config('request.jwt.claim.role','authenticated',true);select set_config('request.jwt.claim.sub','da000000-0000-4000-8000-000000000004',true);set local role authenticated;
select account_test.ok((public.list_customer_accounts('all','account-fixture',1)->>'total')::integer=4,'staff directory includes every prospect and customer, excluding internal staff');
select account_test.ok((public.list_customer_accounts('purchased','account-fixture',1)->>'total')::integer=1,'only actual paid purchases count as purchased');
select account_test.ok((public.list_customer_accounts('no_purchase','account-fixture',1)->>'total')::integer=3,'unpaid and unverified prospects remain visible');
select account_test.ok((public.list_customer_accounts('pending','account-fixture',1)->>'total')::integer=0,'paid orders are not labelled pending');
select account_test.fails($q$select public.list_customer_accounts('all','',0)$q$,'22023','invalid pagination refused');
reset role;select set_config('request.jwt.claim.role','anon',true);set local role anon;
select account_test.fails($q$select * from public.my_purchase_orders$q$,'42501','anonymous has no purchase projection');
select account_test.fails($q$select public.list_customer_accounts()$q$,'42501','anonymous cannot list accounts');
reset role;rollback;

-- Fictional fixtures in the disposable validation database only.
begin;
create schema booking_test;
create function booking_test.ok(v boolean,label text) returns void language plpgsql as $$begin if v is distinct from true then raise exception 'FAIL: %',label;end if;raise notice 'ok - booking: %',label;end$$;
create function booking_test.fails(command text,code text,label text) returns void language plpgsql as $$begin begin execute command;exception when others then if sqlstate<>code then raise exception 'FAIL: % expected %, got %: %',label,code,sqlstate,sqlerrm;end if;raise notice 'ok - booking: % (refused)',label;return;end;raise exception 'FAIL: % was permitted',label;end$$;
grant usage on schema booking_test to anon,authenticated,service_role;grant execute on all functions in schema booking_test to anon,authenticated,service_role;
insert into auth.users(id,email) values('ba000000-0000-4000-8000-000000000001','booking-owner@example.test'),('ba000000-0000-4000-8000-000000000002','booking-other@example.test'),('ba000000-0000-4000-8000-000000000003','booking-member@example.test');
insert into public.organizations(id,name,slug) values('ba000000-0000-4000-8000-000000000011','Booking A','booking-a'),('ba000000-0000-4000-8000-000000000012','Booking B','booking-b');
insert into public.organization_members(organization_id,user_id,role,status) values('ba000000-0000-4000-8000-000000000011','ba000000-0000-4000-8000-000000000001','owner','active'),('ba000000-0000-4000-8000-000000000012','ba000000-0000-4000-8000-000000000002','owner','active'),('ba000000-0000-4000-8000-000000000011','ba000000-0000-4000-8000-000000000003','member','active');
insert into public.websites(id,organization_id,name,status,live_url) values('ba000000-0000-4000-8000-000000000021','ba000000-0000-4000-8000-000000000011','Booking A','live','https://booking-a.example.test'),('ba000000-0000-4000-8000-000000000022','ba000000-0000-4000-8000-000000000012','Booking B','live','https://booking-b.example.test');
insert into public.subscriptions(organization_id,website_id,plan_id,status,current_period_end) select organization_id,id,(select id from public.plans where code=case when w.name='Booking A' then 'care' else 'basic' end),'active',now()+interval '30 days' from public.websites w where id::text like 'ba%';
insert into public.website_contact_settings(website_id,organization_id,notification_email,allowed_origins,enabled) select id,organization_id,'owner@example.test',array[live_url],true from public.websites where id::text like 'ba%';

insert into public.booking_settings(website_id,organization_id) select id,organization_id from public.websites where id::text like 'ba%';
insert into public.booking_resources(id,website_id,organization_id,name) values('ba000000-0000-4000-8000-000000000031','ba000000-0000-4000-8000-000000000021','ba000000-0000-4000-8000-000000000011','Consultant');
insert into public.booking_services(id,resource_id,website_id,organization_id,name,duration,mode) values('ba000000-0000-4000-8000-000000000041','ba000000-0000-4000-8000-000000000031','ba000000-0000-4000-8000-000000000021','ba000000-0000-4000-8000-000000000011','Consultation',30,'instant');
insert into public.appointments(id,website_id,organization_id,service_id,resource_id,service_name,time_zone,confirmation_mode,status,starts_at,ends_at,reserved_from,reserved_until,duration,buffer_before,buffer_after,contact)
values('ba000000-0000-4000-8000-000000000051','ba000000-0000-4000-8000-000000000021','ba000000-0000-4000-8000-000000000011','ba000000-0000-4000-8000-000000000041','ba000000-0000-4000-8000-000000000031','Consultation','UTC','instant','confirmed',now()+interval '1 day',now()+interval '1 day 30 minutes',now()+interval '1 day',now()+interval '1 day 30 minutes',30,0,0,'{"name":"Fictional customer"}');
select booking_test.ok((select count(*)=0 from vigil.booking_calendar_queue),'appointments alone do not activate Google communications');
select set_config('request.jwt.claim.role','service_role',true);set local role service_role;
select booking_test.fails($q$select public.save_booking_calendar('ba000000-0000-4000-8000-000000000003','ba000000-0000-4000-8000-000000000021','member@example.test','private-refresh-token','calendar-member')$q$,'42501','ordinary members cannot connect');
select booking_test.fails($q$select public.save_booking_calendar('ba000000-0000-4000-8000-000000000002','ba000000-0000-4000-8000-000000000022','basic@example.test','private-refresh-token','calendar-basic')$q$,'42501','Basic cannot connect');
select booking_test.fails($q$select public.save_booking_calendar('ba000000-0000-4000-8000-000000000002','ba000000-0000-4000-8000-000000000021','wrong@example.test','private-refresh-token','calendar-other')$q$,'42501','another tenant cannot connect');
select public.save_booking_calendar('ba000000-0000-4000-8000-000000000001','ba000000-0000-4000-8000-000000000021','owner@example.test','private-refresh-token','calendar-owned') as cid \gset
select booking_test.ok(public.booking_calendar_status('ba000000-0000-4000-8000-000000000002','ba000000-0000-4000-8000-000000000021') is null,'status is personal and tenant scoped');
select booking_test.ok(not(public.booking_calendar_status('ba000000-0000-4000-8000-000000000001','ba000000-0000-4000-8000-000000000021') ? 'refreshToken'),'status never contains credentials');
select public.claim_booking_calendar(:'cid') as job \gset
select booking_test.ok(:'job'::jsonb->>'refreshToken'='private-refresh-token','only leased server work obtains credentials');
select booking_test.ok(public.claim_booking_calendar(:'cid') is null,'competing worker cannot claim leased connection');
select booking_test.ok(not public.remove_booking_calendar('ba000000-0000-4000-8000-000000000001','ba000000-0000-4000-8000-000000000021'),'disconnect waits for active in-flight work');
select booking_test.ok(not public.finish_booking_calendar(:'cid','ba000000-0000-4000-8000-000000000099','appointment','ba000000-0000-4000-8000-000000000051',(:'job'::jsonb->>'version')::bigint,'vstale'),'stale lease cannot finish');
reset role;
update public.appointments set starts_at=starts_at+interval '1 day',ends_at=ends_at+interval '1 day',reserved_from=reserved_from+interval '1 day',reserved_until=reserved_until+interval '1 day' where id='ba000000-0000-4000-8000-000000000051';
set local role service_role;
select booking_test.ok(not public.booking_calendar_lease_valid(:'cid',(:'job'::jsonb->>'lease')::uuid,'appointment','ba000000-0000-4000-8000-000000000051',(:'job'::jsonb->>'version')::bigint),'changed snapshot is revalidated before Google write');
select booking_test.ok(public.finish_booking_calendar(:'cid',(:'job'::jsonb->>'lease')::uuid,'appointment','ba000000-0000-4000-8000-000000000051',(:'job'::jsonb->>'version')::bigint,'vfirst'),'leased completion is accepted without deleting newer work');
select public.claim_booking_calendar(:'cid') as nextjob \gset
select booking_test.ok((:'nextjob'::jsonb->>'version')::bigint>(:'job'::jsonb->>'version')::bigint,'newer changes survive old completion');
select booking_test.ok(public.finish_booking_calendar(:'cid',(:'nextjob'::jsonb->>'lease')::uuid,'appointment','ba000000-0000-4000-8000-000000000051',(:'nextjob'::jsonb->>'version')::bigint,'vlatest'),'latest work completes');
select booking_test.ok(public.remove_booking_calendar('ba000000-0000-4000-8000-000000000001','ba000000-0000-4000-8000-000000000021'),'owner can disconnect');
select booking_test.ok(public.claim_booking_calendar(:'cid') is null,'disconnected copy stops');
reset role;
select booking_test.ok((select count(*)=0 from vault.secrets where name='vigil.booking.calendar.'||:'cid'),'disconnect removes Vault credential');
select booking_test.ok((select count(*)=1 from public.provider_links where resource_kind='booking_google_event' and entity_id='ba000000-0000-4000-8000-000000000051'),'only the latest provider identity is retained');
select set_config('request.jwt.claim.role','authenticated',true);set local role authenticated;
select booking_test.fails('select * from vigil.booking_calendar_connections','42501','customer cannot read connection secrets');
select booking_test.fails('select public.claim_booking_calendar()','42501','customer cannot claim server work');
select booking_test.fails($q$select public.booking_calendar_target('ba000000-0000-4000-8000-000000000001','ba000000-0000-4000-8000-000000000021')$q$,'42501','customer cannot read provider identifiers through RPC');
reset role;
select set_config('request.jwt.claim.role','service_role',true);set local role service_role;
select public.save_booking_calendar('ba000000-0000-4000-8000-000000000001','ba000000-0000-4000-8000-000000000021','owner@example.test','replacement-refresh-token','calendar-owned');
reset role;
update public.organization_members set role='owner' where user_id='ba000000-0000-4000-8000-000000000003';
update public.organization_members set role='member' where user_id='ba000000-0000-4000-8000-000000000001';
select booking_test.ok((select count(*)=0 from vigil.booking_calendar_connections),'membership downgrade deletes saved access');
select booking_test.ok((select count(*)=0 from vault.secrets where name='vigil.booking.calendar.'||:'cid'),'membership downgrade removes credential');
select booking_test.ok((select count(*)=0 from public.provider_links where resource_kind in ('booking_google_calendar','booking_google_event')),'membership downgrade cleans provider mappings');
rollback;

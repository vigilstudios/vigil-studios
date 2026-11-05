"""Actual competing transactions against db-validate's disposable database only."""
import concurrent.futures,os,subprocess,sys
url=sys.argv[1]
if '/vigil_validate_' not in url:raise SystemExit('Disposable validation database required')
def sql(command,check=True):
 result=subprocess.run(['psql',url,'-X','-qAt','-v','ON_ERROR_STOP=1','-v','VERBOSITY=verbose','-c',"set timezone='UTC';"+command],capture_output=True,text=True)
 if check and result.returncode:raise RuntimeError(result.stderr)
 return result
org='bb000000-0000-4000-8000-000000000011';site='bb000000-0000-4000-8000-000000000021';resource='bb000000-0000-4000-8000-000000000031';instant='bb000000-0000-4000-8000-000000000041';approval='bb000000-0000-4000-8000-000000000042';user='bb000000-0000-4000-8000-000000000001'
sql(f"""insert into auth.users(id,email) values('{user}','booking-race@example.test');
insert into public.organizations(id,name,slug) values('{org}','Booking race','booking-race');
insert into public.organization_members(organization_id,user_id,role,status) values('{org}','{user}','owner','active');
insert into public.websites(id,organization_id,name,status,live_url) values('{site}','{org}','Booking race','live','https://race.example.test');
insert into public.subscriptions(organization_id,website_id,plan_id,status) select '{org}','{site}',id,'active' from public.plans where code='care';
insert into public.website_contact_settings(website_id,organization_id,notification_email,allowed_origins,enabled) values('{site}','{org}','owner@example.test',array['https://race.example.test'],true);
insert into public.booking_settings(website_id,organization_id,enabled,component_ready,availability_acknowledged_at) values('{site}','{org}',true,true,now());
insert into public.booking_resources(id,website_id,organization_id,name,hours) values('{resource}','{site}','{org}','Single resource',(select jsonb_agg(jsonb_build_object('day',d,'start','00:00','end','23:45')) from generate_series(0,6)d));
insert into public.booking_services(id,website_id,organization_id,resource_id,name,duration,mode,active) values('{instant}','{site}','{org}','{resource}','Instant',30,'instant',true),('{approval}','{site}','{org}','{resource}','Approval',30,'approval',true);""")
service_claims="select set_config('request.jwt.claim.role','service_role',true);set local role service_role;"
manager_claims=f"select set_config('request.jwt.claim.role','authenticated',true);select set_config('request.jwt.claim.sub','{user}',true);set local role authenticated;"
def create(service,hour,key):
 return f"select public.create_public_booking('{site}','https://race.example.test','{service}',(current_date+3)+time '{hour}:00','bb000000-0000-4000-8000-{key:012d}',repeat('a',64),repeat('b',64),'{{\"name\":\"Race visitor\",\"email\":\"visitor@example.test\"}}','')->>'id';"
def compete(claims,commands,label):
 def run(command):return sql('begin;'+claims+command+'select pg_sleep(0.15);commit;',False)
 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:results=list(executor.map(run,commands))
 if sorted(r.returncode for r in results)!=[0,1] or not any('23P01' in r.stderr for r in results):raise RuntimeError(label+': '+str([(r.returncode,r.stderr) for r in results]))
 print('ok - booking concurrency: '+label)
compete(service_claims,[create(instant,10,1),create(instant,10,2)],'one confirmed booking wins a competing public reservation')
# Requests do not reserve capacity; approval must serialize and recheck.
for key in [3,4]:sql('begin;'+service_claims+create(approval,12,key)+'commit;')
ids=sql(f"select id from public.appointments where website_id='{site}' and status='requested' order by id").stdout.splitlines()
compete(manager_claims,[f"select public.manage_booking('{id}','confirm',1);" for id in ids],'only one of two competing approvals wins')
# Two already confirmed reservations try to move to the same third slot.
for key,hour in [(5,14),(6,16)]:sql('begin;'+service_claims+create(instant,hour,key)+'commit;')
ids=sql(f"select id from public.appointments where website_id='{site}' and extract(hour from starts_at at time zone 'UTC') in (14,16) order by id").stdout.splitlines()
compete(manager_claims,[f"select public.manage_booking('{id}','reschedule',1,(current_date+3)+time '18:00');" for id in ids],'failed competing reschedule retains its original reservation')
remaining=sql(f"select count(*) from public.appointments where id in ('{ids[0]}','{ids[1]}') and status='confirmed'").stdout.strip()
original=sql(f"select count(*) from public.appointments where id in ('{ids[0]}','{ids[1]}') and extract(hour from starts_at at time zone 'UTC') in (14,16)").stdout.strip()
if remaining!='2' or original!='1':raise RuntimeError('Reschedule lost an existing reservation')
print('ok - booking concurrency: both reservations retained, with one original slot unchanged')
# The optional Google copy worker uses a per-connection lease independently of booking reservations.
sql("begin;"+service_claims+f"select public.save_booking_calendar('{user}','{site}','race-owner@example.test','fictional-refresh-token','fictional-race-calendar');commit;")
connection=sql(f"select id from vigil.booking_calendar_connections where user_id='{user}' and website_id='{site}'").stdout.strip()
def claim_copy(_):
 return subprocess.run(['psql',url,'-X','-qAt','-v','ON_ERROR_STOP=1'],input='begin;\n'+service_claims+f"\nselect coalesce(public.claim_booking_calendar('{connection}')->>'connectionId','none');\nselect pg_sleep(0.2);\ncommit;\n",capture_output=True,text=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
 claims=list(executor.map(claim_copy,range(2)))
if any(r.returncode for r in claims) or sum(connection in r.stdout.splitlines() for r in claims)!=1:
 raise RuntimeError('Calendar copy lease permitted competing workers')
print('ok - Google Calendar concurrency: only one worker claims the same connection')

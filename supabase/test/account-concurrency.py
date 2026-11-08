"""Real transactions against db-validate's disposable database; never a hosted project."""
import concurrent.futures,subprocess,sys
url=sys.argv[1]
if '/vigil_validate_' not in url:raise SystemExit('Disposable validation database required')
def sql(command,check=True):
 r=subprocess.run(['psql',url,'-X','-qAt','-v','ON_ERROR_STOP=1','-c',command],capture_output=True,text=True)
 if check and r.returncode:raise RuntimeError(r.stderr)
 return r
buyer='db000000-0000-4000-8000-000000000001'
orders=['db000000-0000-4000-8000-000000000021','db000000-0000-4000-8000-000000000022']
sql(f"insert into auth.users(id,email,email_confirmed_at) values('{buyer}','account-race@example.test',now());")
for order in orders:
 sql(f"insert into public.orders(id,email,business_name,status,buyer_user_id) values('{order}','account-race@example.test','Account concurrency studio','paid','{buyer}');")
def allocate(order):
 return sql("begin;select set_config('request.jwt.claim.role','service_role',true);set local role service_role;"+f"select public.allocate_order_project('{order}','account-concurrency-studio','other');"+"select pg_sleep(0.15);commit;",False)
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:results=list(executor.map(allocate,orders))
if any(r.returncode for r in results):raise RuntimeError(str([r.stderr for r in results]))
counts=sql(f"select count(distinct organization_id)||','||count(distinct project_id) from public.orders where buyer_user_id='{buyer}'").stdout.strip()
if counts!='1,2':raise RuntimeError('Distinct purchases duplicated business identity: '+counts)
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:results=list(executor.map(allocate,[orders[0],orders[0]]))
if any(r.returncode for r in results):raise RuntimeError('Repeated allocation failed')
projects=sql(f"select count(*) from public.projects where source_ref in ('order:{orders[0]}','order:{orders[1]}')").stdout.strip()
members=sql(f"select count(*) from public.organization_members where user_id='{buyer}' and role='owner' and status='active'").stdout.strip()
if projects!='2' or members!='1':raise RuntimeError('Repeated payment work duplicated a project or owner membership')
print('ok - account concurrency: competing purchases reuse one owned business, distinct projects, one exact owner')
print('ok - account concurrency: replayed allocation never duplicates identity rows')

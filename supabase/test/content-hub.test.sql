begin;
do $$declare f regprocedure;begin
 foreach f in array array[
 'public.save_website_content(uuid,integer,jsonb,text,uuid)'::regprocedure,
 'public.save_content_design_workspace(uuid,integer,jsonb,jsonb,uuid,text)'::regprocedure,
 'public.save_website_blog_post(uuid,text,text,text,text,boolean,uuid,timestamp with time zone,jsonb)'::regprocedure,
 'public.set_website_blog_post_deleted(uuid,uuid,timestamp with time zone,boolean)'::regprocedure,
 'public.unpublish_website_blog_post(uuid,uuid,timestamp with time zone)'::regprocedure] loop
  if position('PT409' in pg_get_functiondef(f))=0 then raise exception 'Expected HTTP conflict: %',f;end if;
 end loop;
end$$;

create schema hub_test;
create function hub_test.ok(value boolean,label text) returns void language plpgsql as $$begin if value is distinct from true then raise exception 'FAIL: %',label;end if;raise notice 'ok - content: %',label;end$$;
create function hub_test.fails(command text,label text) returns void language plpgsql as $$begin begin execute command;exception when others then raise notice 'ok - content: % (refused)',label;return;end;raise exception 'FAIL: % was permitted',label;end$$;
grant usage on schema hub_test to authenticated,anon,service_role;grant execute on all functions in schema hub_test to authenticated,anon,service_role;
insert into auth.users(id,email) values('cb000000-0000-4000-8000-000000000001','hub-a@example.test'),('cb000000-0000-4000-8000-000000000002','hub-b@example.test'),('cb000000-0000-4000-8000-000000000003','hub-member@example.test');
insert into public.organizations(id,name,slug) values('cb000000-0000-4000-8000-000000000011','Hub A','hub-a'),('cb000000-0000-4000-8000-000000000012','Hub B','hub-b');
insert into public.organization_members(organization_id,user_id,role,status) values('cb000000-0000-4000-8000-000000000011','cb000000-0000-4000-8000-000000000001','owner','active'),('cb000000-0000-4000-8000-000000000012','cb000000-0000-4000-8000-000000000002','owner','active'),('cb000000-0000-4000-8000-000000000011','cb000000-0000-4000-8000-000000000003','member','active');
insert into public.projects(id,organization_id,name,kind) values
('cb000000-0000-4000-8000-000000000031','cb000000-0000-4000-8000-000000000011','Professional','professional'),
('cb000000-0000-4000-8000-000000000032','cb000000-0000-4000-8000-000000000012','Growth','custom'),
('cb000000-0000-4000-8000-000000000033','cb000000-0000-4000-8000-000000000011','Basic','professional'),
('cb000000-0000-4000-8000-000000000034','cb000000-0000-4000-8000-000000000011','Express','express');
insert into public.websites(id,organization_id,project_id,name,status) values
('cb000000-0000-4000-8000-000000000021','cb000000-0000-4000-8000-000000000011','cb000000-0000-4000-8000-000000000031','Professional','building'),
('cb000000-0000-4000-8000-000000000022','cb000000-0000-4000-8000-000000000012','cb000000-0000-4000-8000-000000000032','Growth','live'),
('cb000000-0000-4000-8000-000000000023','cb000000-0000-4000-8000-000000000011','cb000000-0000-4000-8000-000000000033','Basic','live'),
('cb000000-0000-4000-8000-000000000024','cb000000-0000-4000-8000-000000000011','cb000000-0000-4000-8000-000000000034','Express','building');
insert into public.subscriptions(organization_id,website_id,plan_id,status,current_period_end) select w.organization_id,w.id,(select id from public.plans where code=case when w.id='cb000000-0000-4000-8000-000000000023' then 'basic' when w.id='cb000000-0000-4000-8000-000000000024' then 'priority' else 'care' end),'active',now()+interval '30 days' from public.websites w where w.id::text like 'cb%';
insert into public.website_content_collections(id,website_id,organization_id,key,module,label,page_id,section_id,field,adapter) values
('cb000000-0000-4000-8000-000000000041','cb000000-0000-4000-8000-000000000021','cb000000-0000-4000-8000-000000000011','portfolio','portfolio','Portfolio','work','work','projects','standalone'),
('cb000000-0000-4000-8000-000000000042','cb000000-0000-4000-8000-000000000022','cb000000-0000-4000-8000-000000000012','gallery','gallery','Gallery','gallery','gallery','photos','standalone'),
('cb000000-0000-4000-8000-000000000043','cb000000-0000-4000-8000-000000000021','cb000000-0000-4000-8000-000000000011','blog','blog','Blog','blog','blog','posts','blog');
select hub_test.ok(vigil.content_access('cb000000-0000-4000-8000-000000000021'),'paid prelaunch Care authoring preserved');
select hub_test.ok(vigil.content_access('cb000000-0000-4000-8000-000000000022'),'second tenant Growth Site eligible');
select hub_test.ok(not vigil.content_access('cb000000-0000-4000-8000-000000000023'),'Basic cannot borrow another websites premium subscription');
select hub_test.ok(not vigil.content_access('cb000000-0000-4000-8000-000000000024'),'Express denied with Priority and another eligible website');
select hub_test.ok((select array_agg(module order by module)=array['blog','portfolio'] from public.website_content_collections where website_id='cb000000-0000-4000-8000-000000000021'),'only configured Blog and Portfolio modules');
select set_config('request.jwt.claims','{"sub":"cb000000-0000-4000-8000-000000000001","role":"authenticated"}',true);set local role authenticated;
select hub_test.ok((select count(*)=2 from public.website_content_collections),'tenant A sees only its own bindings');
select hub_test.fails($q$update public.website_content_collections set enabled=true$q$,'customer cannot self-enable capabilities');
select hub_test.fails($q$select public.website_content_access('cb000000-0000-4000-8000-000000000022')$q$,'cross-tenant access resolver denied');
select hub_test.fails($q$select public.save_website_content('cb000000-0000-4000-8000-000000000041',1,'[]','publish','cb000000-0000-4000-8000-000000000001')$q$,'RPC cannot bypass validated renderer publication');
select hub_test.fails($q$select public.reserve_content_media('cb000000-0000-4000-8000-000000000042',gen_random_uuid(),'foreign.mp4','video/mp4',100)$q$,'cross-tenant media reservation denied');
select hub_test.fails($q$insert into storage.objects(bucket_id,name) values('content-media','cb000000-0000-4000-8000-000000000011/forged.mp4')$q$,'storage writes cannot bypass signed reservation');
select public.reserve_content_media('cb000000-0000-4000-8000-000000000041','cb000000-0000-4000-8000-000000000051','clip.mp4','video/mp4',1024);
select hub_test.ok((select count(*)=1 from public.project_assets where id='cb000000-0000-4000-8000-000000000051'),'reservation consumes existing file allowance');
reset role;select set_config('request.jwt.claims','{"role":"service_role"}',true);set local role service_role;
select set_config('hub_test.rows','[{"id":"cb000000-0000-4000-8000-000000000061","slug":"real-work","deleted":false,"featured":false,"data":{"title":"Original title","description":"Owned content","category":"Work","media":[],"brand":"","context":"","tags":[],"link":""}}]',true);
select public.save_website_content('cb000000-0000-4000-8000-000000000041',1,current_setting('hub_test.rows')::jsonb,'publish','cb000000-0000-4000-8000-000000000001');
select hub_test.ok((select revision=2 and published_revision=2 and published->0->'data'->>'title'='Original title' from public.website_content_collections where id='cb000000-0000-4000-8000-000000000041'),'validated publish records a public revision');
select public.save_website_content('cb000000-0000-4000-8000-000000000041',2,jsonb_set(current_setting('hub_test.rows')::jsonb,'{0,data,title}','"Draft title"'),'draft','cb000000-0000-4000-8000-000000000001');
select hub_test.ok((select draft->0->'data'->>'title'='Draft title' and published->0->'data'->>'title'='Original title' from public.website_content_collections where id='cb000000-0000-4000-8000-000000000041'),'draft save leaves publication unchanged');
select hub_test.fails($q$select public.save_website_content('cb000000-0000-4000-8000-000000000041',2,'[]','publish','cb000000-0000-4000-8000-000000000001')$q$,'stale concurrent editor denied');
select hub_test.fails($q$select public.save_website_content('cb000000-0000-4000-8000-000000000041',3,jsonb_set(current_setting('hub_test.rows')::jsonb,'{0,data,secret}','"exposed"'),'publish','cb000000-0000-4000-8000-000000000001')$q$,'unknown payload fields denied');
select hub_test.fails($q$select public.save_website_content('cb000000-0000-4000-8000-000000000041',3,current_setting('hub_test.rows')::jsonb,'publish','cb000000-0000-4000-8000-000000000002')$q$,'foreign actor denied even at service boundary');
select hub_test.fails($q$select public.save_website_content('cb000000-0000-4000-8000-000000000041',3,current_setting('hub_test.rows')::jsonb,'draft','cb000000-0000-4000-8000-000000000003')$q$,'member remains read-only');
select public.save_website_content('cb000000-0000-4000-8000-000000000041',3,jsonb_set(current_setting('hub_test.rows')::jsonb,'{0,deleted}','true'),'trash','cb000000-0000-4000-8000-000000000001');
select hub_test.ok((select jsonb_array_length(published)=0 and draft->0->'deleted'='true'::jsonb from public.website_content_collections where id='cb000000-0000-4000-8000-000000000041'),'Trash reversibly removes public entry');
select public.save_website_content('cb000000-0000-4000-8000-000000000041',4,current_setting('hub_test.rows')::jsonb,'draft','cb000000-0000-4000-8000-000000000001');
select hub_test.ok((select jsonb_array_length(published)=0 and draft->0->'deleted'='false'::jsonb from public.website_content_collections where id='cb000000-0000-4000-8000-000000000041'),'Restore returns a draft without implicit publication');
select public.save_website_content('cb000000-0000-4000-8000-000000000041',5,current_setting('hub_test.rows')::jsonb,'publish','cb000000-0000-4000-8000-000000000001');
select public.save_website_content('cb000000-0000-4000-8000-000000000041',6,current_setting('hub_test.rows')::jsonb,'unpublish','cb000000-0000-4000-8000-000000000001');
select hub_test.fails($q$select public.save_website_content('cb000000-0000-4000-8000-000000000041',7,jsonb_set(current_setting('hub_test.rows')::jsonb,'{0,slug}','"new-address"'),'draft','cb000000-0000-4000-8000-000000000001')$q$,'unpublish cannot release a previously published address');
select hub_test.ok((select jsonb_array_length(published)=0 and jsonb_array_length(draft)=1 from public.website_content_collections where id='cb000000-0000-4000-8000-000000000041'),'unpublish retains customer data');
reset role;
update public.subscriptions set status='canceled',current_period_end=now()+interval '1 day' where website_id='cb000000-0000-4000-8000-000000000021';
select hub_test.ok(vigil.content_access('cb000000-0000-4000-8000-000000000021'),'cancellation preserves paid-period authoring');
update public.subscriptions set current_period_end=now()-interval '1 second' where website_id='cb000000-0000-4000-8000-000000000021';
select hub_test.ok(not vigil.content_access('cb000000-0000-4000-8000-000000000021'),'expired cancellation denies authoring while records remain');
select hub_test.ok((select jsonb_array_length(draft)=1 from public.website_content_collections where id='cb000000-0000-4000-8000-000000000041'),'canceled content retained');

insert into public.staff_members(user_id,role) values('cb000000-0000-4000-8000-000000000001','admin');
update public.subscriptions set status='active',current_period_end=now()+interval '30 days' where website_id='cb000000-0000-4000-8000-000000000021';
insert into public.design_workspaces(project_id,website_id,organization_id,site_definition,engine_version) values('cb000000-0000-4000-8000-000000000031','cb000000-0000-4000-8000-000000000021','cb000000-0000-4000-8000-000000000011','{}','v1-test');
insert into public.website_content_collections(id,website_id,organization_id,key,module,label,page_id,section_id,field,adapter) values('cb000000-0000-4000-8000-000000000044','cb000000-0000-4000-8000-000000000021','cb000000-0000-4000-8000-000000000011','lab-portfolio','portfolio','Lab Portfolio','work','portfolio','projects','professional');
select set_config('request.jwt.claims','{"role":"service_role"}',true);set local role service_role;
select public.save_content_design_workspace('cb000000-0000-4000-8000-000000000031',1,'{"title":"Lab design"}',jsonb_build_array(jsonb_build_object('id','cb000000-0000-4000-8000-000000000044','revision',1,'records',current_setting('hub_test.rows')::jsonb)),'cb000000-0000-4000-8000-000000000001','v1-test');
select hub_test.ok((select revision=2 from public.design_workspaces where project_id='cb000000-0000-4000-8000-000000000031') and (select revision=2 from public.website_content_collections where id='cb000000-0000-4000-8000-000000000044'),'Lab design and shared draft save atomically');
select public.save_website_content('cb000000-0000-4000-8000-000000000044',2,jsonb_set(current_setting('hub_test.rows')::jsonb,'{0,data,title}','"Newer Hub edit"'),'draft','cb000000-0000-4000-8000-000000000001');
select hub_test.fails($q$select public.save_content_design_workspace('cb000000-0000-4000-8000-000000000031',2,'{"title":"Stale"}',jsonb_build_array(jsonb_build_object('id','cb000000-0000-4000-8000-000000000044','revision',2,'records',current_setting('hub_test.rows')::jsonb)),'cb000000-0000-4000-8000-000000000001','v1-test')$q$,'stale Lab cannot overwrite newer Hub draft');
select hub_test.ok((select revision=2 and site_definition->>'title'='Lab design' from public.design_workspaces where project_id='cb000000-0000-4000-8000-000000000031') and (select draft->0->'data'->>'title'='Newer Hub edit' from public.website_content_collections where id='cb000000-0000-4000-8000-000000000044'),'failed Lab save rolls back design and retains Hub edits');
reset role;

update public.websites set status='archived' where id='cb000000-0000-4000-8000-000000000022';
select hub_test.ok(not vigil.content_access('cb000000-0000-4000-8000-000000000022'),'archived website denied');
select set_config('request.jwt.claims','{"role":"anon"}',true);set local role anon;
select hub_test.fails('select * from public.website_content_collections','anonymous cannot read drafts or publication table directly');
select hub_test.ok((select count(*)=0 from storage.objects where bucket_id='content-media'),'private media never has public bucket reads');
reset role;rollback;

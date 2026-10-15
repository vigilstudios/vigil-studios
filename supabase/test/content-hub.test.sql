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
select hub_test.ok(vigil.content_access('cb000000-0000-4000-8000-000000000021'),'paid Care eligibility preserved independently of launch');
select hub_test.ok(vigil.content_access('cb000000-0000-4000-8000-000000000022'),'second tenant Growth Site eligible');
select hub_test.ok(not vigil.content_access('cb000000-0000-4000-8000-000000000023'),'Basic cannot borrow another websites premium subscription');
select hub_test.ok(not vigil.content_access('cb000000-0000-4000-8000-000000000024'),'Express denied with Priority and another eligible website');
-- Before launch customers cannot read or mutate through any authoring boundary.
select set_config('request.jwt.claims','{"sub":"cb000000-0000-4000-8000-000000000001","role":"authenticated"}',true);set local role authenticated;
select hub_test.ok(public.website_content_eligibility('cb000000-0000-4000-8000-000000000021') and not public.website_content_access('cb000000-0000-4000-8000-000000000021'),'eligible prelaunch customer receives launch wall');
select hub_test.ok((select count(*)=0 from public.website_content_collections),'prelaunch collections hidden by RLS');
select hub_test.fails($q$select public.save_website_blog_post('cb000000-0000-4000-8000-000000000021','blocked','Blocked','Excerpt','Body',false)$q$,'legacy Blog authoring also locked before launch');
select hub_test.fails($q$select public.reserve_content_media('cb000000-0000-4000-8000-000000000041',gen_random_uuid(),'blocked.mp4','video/mp4',100)$q$,'prelaunch media reservation denied');
reset role;select set_config('request.jwt.claims','{"role":"service_role"}',true);set local role service_role;
select hub_test.fails($q$select public.save_website_content('cb000000-0000-4000-8000-000000000041',1,'[]','draft','cb000000-0000-4000-8000-000000000001')$q$,'service boundary cannot bypass prelaunch owner gate');
reset role;
update public.websites set status='live' where id='cb000000-0000-4000-8000-000000000021';
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

insert into public.website_content_collections(id,website_id,organization_id,key,module,label,page_id,section_id,field,adapter) values
('cb000000-0000-4000-8000-000000000045','cb000000-0000-4000-8000-000000000023','cb000000-0000-4000-8000-000000000011','basic-lab','portfolio','Portfolio','work','work','projects','professional'),
('cb000000-0000-4000-8000-000000000046','cb000000-0000-4000-8000-000000000024','cb000000-0000-4000-8000-000000000011','express-forged','portfolio','Portfolio','work','work','projects','professional');
select hub_test.fails($q$select public.save_website_content('cb000000-0000-4000-8000-000000000045',1,current_setting('hub_test.rows')::jsonb,'draft','cb000000-0000-4000-8000-000000000001')$q$,'Basic owner remains locked even through trusted actor-bound RPC');
insert into public.staff_members(user_id,role) values('cb000000-0000-4000-8000-000000000001','admin');
insert into public.design_workspaces(project_id,website_id,organization_id,site_definition,engine_version) values('cb000000-0000-4000-8000-000000000033','cb000000-0000-4000-8000-000000000023','cb000000-0000-4000-8000-000000000011','{}','v1-test');
select public.save_content_design_workspace('cb000000-0000-4000-8000-000000000033',1,'{"title":"Staff Basic build"}',jsonb_build_array(jsonb_build_object('id','cb000000-0000-4000-8000-000000000045','revision',1,'records',current_setting('hub_test.rows')::jsonb)),'cb000000-0000-4000-8000-000000000001','v1-test');
select hub_test.ok((select revision=2 from public.design_workspaces where project_id='cb000000-0000-4000-8000-000000000033'),'staff-only Lab still builds a paid Professional Basic website');
select set_config('request.jwt.claims','{"sub":"cb000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select hub_test.ok(public.website_content_access('cb000000-0000-4000-8000-000000000023'),'staff customer view retains Basic authoring access');
select set_config('request.jwt.claims','{"role":"service_role"}',true);
select hub_test.fails($q$select public.save_website_content('cb000000-0000-4000-8000-000000000046',1,current_setting('hub_test.rows')::jsonb,'draft','cb000000-0000-4000-8000-000000000001')$q$,'staff Lab cannot enable Express collections');

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

-- Existing Files media is linked by stable ID, without consuming another asset/quota slot.
insert into public.website_content_collections(id,website_id,organization_id,key,module,label,page_id,section_id,field,adapter) values
('cb000000-0000-4000-8000-000000000047','cb000000-0000-4000-8000-000000000021','cb000000-0000-4000-8000-000000000011','reuse-gallery','gallery','Gallery','gallery','gallery','items','standalone');
insert into public.project_assets(id,project_id,organization_id,kind,bucket_id,object_path,file_name,content_type,size_bytes) values
('cb000000-0000-4000-8000-000000000052','cb000000-0000-4000-8000-000000000031','cb000000-0000-4000-8000-000000000011','video','project-assets','cb000000-0000-4000-8000-000000000011/cb000000-0000-4000-8000-000000000031/original.mov','original.mov','video/quicktime',1024),
('cb000000-0000-4000-8000-000000000053','cb000000-0000-4000-8000-000000000031','cb000000-0000-4000-8000-000000000011','photo','project-assets','cb000000-0000-4000-8000-000000000011/cb000000-0000-4000-8000-000000000031/poster.jpg','poster.jpg','image/jpeg',100),
('cb000000-0000-4000-8000-000000000054','cb000000-0000-4000-8000-000000000033','cb000000-0000-4000-8000-000000000011','video','project-assets','cb000000-0000-4000-8000-000000000011/cb000000-0000-4000-8000-000000000033/other.mov','other.mov','video/quicktime',1024),
('cb000000-0000-4000-8000-000000000055','cb000000-0000-4000-8000-000000000031','cb000000-0000-4000-8000-000000000011','document','project-assets','cb000000-0000-4000-8000-000000000011/cb000000-0000-4000-8000-000000000031/doc.pdf','doc.pdf','application/pdf',100);
insert into storage.objects(bucket_id,name,metadata) select bucket_id,object_path,jsonb_build_object('size',size_bytes,'mimetype',content_type) from public.project_assets where id in ('cb000000-0000-4000-8000-000000000052','cb000000-0000-4000-8000-000000000054','cb000000-0000-4000-8000-000000000055');
select set_config('hub_test.asset_count',(select count(*)::text from public.project_assets),true);
select set_config('hub_test.asset_bytes',(select sum(size_bytes)::text from public.project_assets),true);
select set_config('request.jwt.claims','{"sub":"cb000000-0000-4000-8000-000000000001","role":"authenticated"}',true);set local role authenticated;
select hub_test.fails($q$select public.attach_content_library_media('cb000000-0000-4000-8000-000000000047','cb000000-0000-4000-8000-000000000054')$q$,'same organization different project file denied');
select hub_test.fails($q$select public.attach_content_library_media('cb000000-0000-4000-8000-000000000047','cb000000-0000-4000-8000-000000000055')$q$,'document cannot become playable content');
select hub_test.fails($q$select public.attach_content_library_media('cb000000-0000-4000-8000-000000000047','cb000000-0000-4000-8000-000000000053')$q$,'unuploaded Files row denied');
select hub_test.fails($q$select public.attach_content_library_media('cb000000-0000-4000-8000-000000000043','cb000000-0000-4000-8000-000000000052')$q$,'Blog cannot borrow collection media authority');
select hub_test.fails($q$select public.attach_content_library_media('cb000000-0000-4000-8000-000000000045','cb000000-0000-4000-8000-000000000052')$q$,'staff cannot reuse a different project file');
select public.attach_content_library_media('cb000000-0000-4000-8000-000000000047','cb000000-0000-4000-8000-000000000052');
select public.attach_content_library_media('cb000000-0000-4000-8000-000000000047','cb000000-0000-4000-8000-000000000052');
reset role;
select hub_test.ok((select count(*)::text=current_setting('hub_test.asset_count') and sum(size_bytes)::text=current_setting('hub_test.asset_bytes') from public.project_assets),'repeated MOV reuse creates no asset or storage usage duplicate');
select hub_test.ok((select count(*)=1 from public.website_content_media where id='cb000000-0000-4000-8000-000000000052' and ready and type='video'),'MOV registered once as ready video');
select hub_test.ok((select jsonb_array_length(published)=0 from public.website_content_collections where id='cb000000-0000-4000-8000-000000000047'),'choosing media does not publish a post');
select set_config('request.jwt.claims','{"sub":"cb000000-0000-4000-8000-000000000003","role":"authenticated"}',true);set local role authenticated;
select hub_test.fails($q$select public.attach_content_library_media('cb000000-0000-4000-8000-000000000047','cb000000-0000-4000-8000-000000000052')$q$,'member cannot register existing media');
reset role;select set_config('request.jwt.claims','{"sub":"cb000000-0000-4000-8000-000000000002","role":"authenticated"}',true);set local role authenticated;
select hub_test.fails($q$select public.attach_content_library_media('cb000000-0000-4000-8000-000000000047','cb000000-0000-4000-8000-000000000052')$q$,'foreign tenant cannot register existing media');
reset role;
update storage.objects set metadata=jsonb_build_object('size',999,'mimetype','video/quicktime') where name like '%/original.mov';
select set_config('request.jwt.claims','{"sub":"cb000000-0000-4000-8000-000000000001","role":"authenticated"}',true);set local role authenticated;
select hub_test.fails($q$select public.attach_content_library_media('cb000000-0000-4000-8000-000000000047','cb000000-0000-4000-8000-000000000052')$q$,'storage size mismatch denied');
reset role;
update storage.objects set metadata=jsonb_build_object('size',1024,'mimetype','video/quicktime') where name like '%/original.mov';
select set_config('request.jwt.claims','{"role":"service_role"}',true);set local role service_role;
select public.save_website_content('cb000000-0000-4000-8000-000000000047',1,'[{"id":"cb000000-0000-4000-8000-000000000062","slug":"reused-mov","deleted":false,"featured":false,"data":{"title":"Reused MOV","media":[{"id":"cb000000-0000-4000-8000-000000000052","type":"video","src":"","alt":"Original video","caption":""}]}}]','draft','cb000000-0000-4000-8000-000000000001');
select hub_test.ok((select count(*)=1 from public.website_content_media_refs where media_id='cb000000-0000-4000-8000-000000000052'),'saved draft tracks original Files reference');
select hub_test.fails($q$delete from public.project_assets where id='cb000000-0000-4000-8000-000000000052'$q$,'referenced original asset cannot be deleted');
reset role;

-- Configured featured positions: capacity and independent order are checked even at the RPC boundary.
insert into public.website_content_collections(id,website_id,organization_id,key,module,label,page_id,section_id,field,adapter,config) values
('cb000000-0000-4000-8000-000000000048','cb000000-0000-4000-8000-000000000021','cb000000-0000-4000-8000-000000000011','featured-gallery','gallery','Featured videos','home','featured','videos','standalone','{"featuredSlotBudget":2,"featuredMediaType":"video","featuredRequireFull":true}');
select set_config('hub_test.feature_rows','[{"id":"cb000000-0000-4000-8000-000000000071","slug":"feature-one","featured":true,"featuredOrder":2,"deleted":false,"data":{"title":"One","media":[{"type":"video","src":"/assets/one.mp4","poster":"/assets/one.webp","alt":"One","caption":""}]}},{"id":"cb000000-0000-4000-8000-000000000072","slug":"feature-two","featured":true,"featuredOrder":1,"deleted":false,"data":{"title":"Two","media":[{"type":"video","src":"/assets/two.mp4","poster":"/assets/two.webp","alt":"Two","caption":""}]}},{"id":"cb000000-0000-4000-8000-000000000073","slug":"feature-three","featured":false,"deleted":false,"data":{"title":"Three","media":[{"type":"video","src":"/assets/three.mp4","poster":"/assets/three.webp","alt":"Three","caption":""}]}}]',true);
select set_config('request.jwt.claims','{"role":"service_role"}',true);set local role service_role;
select public.save_website_content('cb000000-0000-4000-8000-000000000048',1,current_setting('hub_test.feature_rows')::jsonb,'publish','cb000000-0000-4000-8000-000000000001');
select hub_test.ok((select published->0->>'slug'='feature-one' and published->0->>'featuredOrder'='2' and published->1->>'featuredOrder'='1' from public.website_content_collections where id='cb000000-0000-4000-8000-000000000048'),'featured order persists independently of full-collection order');
select hub_test.fails($q$select public.save_website_content('cb000000-0000-4000-8000-000000000048',2,jsonb_set(current_setting('hub_test.feature_rows')::jsonb,'{2,featured}','true'),'draft','cb000000-0000-4000-8000-000000000001')$q$,'featured capacity cannot be exceeded by direct RPC');
select hub_test.fails($q$select public.save_website_content('cb000000-0000-4000-8000-000000000048',2,jsonb_set(current_setting('hub_test.feature_rows')::jsonb,'{1,featuredOrder}','2'),'draft','cb000000-0000-4000-8000-000000000001')$q$,'duplicate featured positions refused');
select hub_test.fails($q$select public.save_website_content('cb000000-0000-4000-8000-000000000048',2,jsonb_set(current_setting('hub_test.feature_rows')::jsonb,'{0,featuredOrder}','3'),'draft','cb000000-0000-4000-8000-000000000001')$q$,'position beyond section capacity refused');
select hub_test.fails($q$select public.save_website_content('cb000000-0000-4000-8000-000000000048',2,jsonb_set(current_setting('hub_test.feature_rows')::jsonb,'{0,featuredOrder}','1.5'),'draft','cb000000-0000-4000-8000-000000000001')$q$,'fractional featured position refused');
select hub_test.fails($q$select public.save_website_content('cb000000-0000-4000-8000-000000000048',2,jsonb_set(current_setting('hub_test.feature_rows')::jsonb,'{0,data,media,0,type}','"image"'),'draft','cb000000-0000-4000-8000-000000000001')$q$,'wrong media type for a video slot refused');
select hub_test.fails($q$select public.save_website_content('cb000000-0000-4000-8000-000000000048',2,jsonb_set(current_setting('hub_test.feature_rows')::jsonb,'{2,featuredOrder}','1'),'draft','cb000000-0000-4000-8000-000000000001')$q$,'unfeatured record cannot claim a position');
select set_config('hub_test.feature_partial',jsonb_set(current_setting('hub_test.feature_rows')::jsonb #- '{0,featuredOrder}','{0,featured}','false')::text,true);
select hub_test.fails($q$select public.save_website_content('cb000000-0000-4000-8000-000000000048',2,current_setting('hub_test.feature_partial')::jsonb,'publish','cb000000-0000-4000-8000-000000000001')$q$,'incomplete fixed-slot publication refused');
select public.save_website_content('cb000000-0000-4000-8000-000000000048',2,current_setting('hub_test.feature_partial')::jsonb,'draft','cb000000-0000-4000-8000-000000000001');
select hub_test.ok((select revision=3 and published_revision=2 and draft->0->'featured'='false'::jsonb and published->0->>'featuredOrder'='2' from public.website_content_collections where id='cb000000-0000-4000-8000-000000000048'),'incomplete draft remains private and previous positions stay published');
select public.save_website_content('cb000000-0000-4000-8000-000000000048',3,current_setting('hub_test.feature_partial')::jsonb,'unpublish','cb000000-0000-4000-8000-000000000001');
select hub_test.ok((select published='[]'::jsonb from public.website_content_collections where id='cb000000-0000-4000-8000-000000000048'),'unpublish still preserves incomplete draft without public slots');
reset role;

update public.website_content_collections set adapter='professional' where id='cb000000-0000-4000-8000-000000000048';
-- Changing Lab capacity must preserve the old published policy and rows until Publish.
select set_config('request.jwt.claims','{"role":"service_role"}',true);set local role service_role;
select public.save_website_content('cb000000-0000-4000-8000-000000000048',4,current_setting('hub_test.feature_rows')::jsonb,'publish','cb000000-0000-4000-8000-000000000001');
select set_config('hub_test.one_feature',jsonb_set(current_setting('hub_test.feature_rows')::jsonb #- '{0,featuredOrder}','{0,featured}','false')::text,true);
select public.save_content_design_workspace('cb000000-0000-4000-8000-000000000031',2,'{"title":"New capacity"}',jsonb_build_array(jsonb_build_object('id','cb000000-0000-4000-8000-000000000048','revision',5,'config','{"featuredSlotBudget":1,"featuredMediaType":"video","featuredRequireFull":true}'::jsonb,'records',current_setting('hub_test.one_feature')::jsonb)),'cb000000-0000-4000-8000-000000000001','v1-test');
select hub_test.ok((select config->>'featuredSlotBudget'='1' and config->'publishedFeatured'->>'featuredSlotBudget'='2' and published_revision=5 and published->0->>'featuredOrder'='2' from public.website_content_collections where id='cb000000-0000-4000-8000-000000000048'),'Lab saves draft capacity without rewriting published positions');
select public.save_website_content('cb000000-0000-4000-8000-000000000048',6,current_setting('hub_test.one_feature')::jsonb,'publish','cb000000-0000-4000-8000-000000000001');
select hub_test.ok((select config->'publishedFeatured'->>'featuredSlotBudget'='1' and published_revision=7 from public.website_content_collections where id='cb000000-0000-4000-8000-000000000048'),'Publish commits policy and selected rows atomically');
reset role;

update public.websites set status='archived' where id='cb000000-0000-4000-8000-000000000022';
select hub_test.ok(not vigil.content_access('cb000000-0000-4000-8000-000000000022'),'archived website denied');
select set_config('request.jwt.claims','{"role":"anon"}',true);set local role anon;
select hub_test.fails('select * from public.website_content_collections','anonymous cannot read drafts or publication table directly');
select hub_test.ok((select count(*)=0 from storage.objects where bucket_id='content-media'),'private media never has public bucket reads');
reset role;rollback;

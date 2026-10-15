begin;
create schema blog_test;
create function blog_test.ok(value boolean,label text) returns void language plpgsql as $$begin if value is distinct from true then raise exception 'FAIL: %',label;end if;raise notice 'ok - blog: %',label;end$$;
create function blog_test.fails(command text,label text) returns void language plpgsql as $$begin begin execute command;exception when others then raise notice 'ok - blog: % (refused)',label;return;end;raise exception 'FAIL: % was permitted',label;end$$;
grant usage on schema blog_test to anon,authenticated,service_role;
grant execute on all functions in schema blog_test to anon,authenticated,service_role;
insert into auth.users(id,email) values('ba000000-0000-4000-8000-000000000001','owner-a@example.test'),('ba000000-0000-4000-8000-000000000002','owner-b@example.test'),('ba000000-0000-4000-8000-000000000003','member@example.test');
insert into public.organizations(id,name,slug) values('ba000000-0000-4000-8000-000000000011','Blog A','blog-a'),('ba000000-0000-4000-8000-000000000012','Blog B','blog-b');
insert into public.organization_members(organization_id,user_id,role,status) values('ba000000-0000-4000-8000-000000000011','ba000000-0000-4000-8000-000000000001','owner','active'),('ba000000-0000-4000-8000-000000000012','ba000000-0000-4000-8000-000000000002','owner','active'),('ba000000-0000-4000-8000-000000000011','ba000000-0000-4000-8000-000000000003','member','active');
insert into public.projects(id,organization_id,name,kind,brief) values
('ba000000-0000-4000-8000-000000000031','ba000000-0000-4000-8000-000000000011','Professional Blog','professional','{"strategy":{"pages":["blog"]}}'),
('ba000000-0000-4000-8000-000000000032','ba000000-0000-4000-8000-000000000012','Growth Blog','custom','{"strategy":{"features":["blog"]}}'),
('ba000000-0000-4000-8000-000000000033','ba000000-0000-4000-8000-000000000011','CMS portfolio only','professional','{"strategy":{"features":["cms_blog"]}}'),
('ba000000-0000-4000-8000-000000000034','ba000000-0000-4000-8000-000000000011','Express','express','{"strategy":{"pages":["blog"]}}');
insert into public.websites(id,organization_id,project_id,name,status) values
('ba000000-0000-4000-8000-000000000021','ba000000-0000-4000-8000-000000000011','ba000000-0000-4000-8000-000000000031','Professional Blog','live'),
('ba000000-0000-4000-8000-000000000022','ba000000-0000-4000-8000-000000000012','ba000000-0000-4000-8000-000000000032','Growth Blog','live'),
('ba000000-0000-4000-8000-000000000023','ba000000-0000-4000-8000-000000000011','ba000000-0000-4000-8000-000000000033','Portfolio','live'),
('ba000000-0000-4000-8000-000000000024','ba000000-0000-4000-8000-000000000011','ba000000-0000-4000-8000-000000000034','Express','building');
insert into public.subscriptions(organization_id,website_id,plan_id,status) select organization_id,id,(select id from public.plans where code='care'),'active' from public.websites where id in ('ba000000-0000-4000-8000-000000000021','ba000000-0000-4000-8000-000000000022');
insert into public.website_content_collections(website_id,organization_id,key,module,label,page_id,section_id,field,adapter) select id,organization_id,'blog','blog','Blog','blog','blog','posts','blog' from public.websites where id in ('ba000000-0000-4000-8000-000000000021','ba000000-0000-4000-8000-000000000022');

select blog_test.ok(vigil.website_blog_enabled('ba000000-0000-4000-8000-000000000021'),'Professional explicit Blog page enabled');
select blog_test.ok(vigil.website_blog_enabled('ba000000-0000-4000-8000-000000000022'),'Growth Site explicit blog feature enabled');
select blog_test.ok(not vigil.website_blog_enabled('ba000000-0000-4000-8000-000000000023'),'generic CMS selection does not invent a blog request');
select blog_test.ok(not vigil.website_blog_enabled('ba000000-0000-4000-8000-000000000024'),'Express not entitled by forged blog choice');
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','ba000000-0000-4000-8000-000000000001',true);
set local role authenticated;
select set_config('blog_test.post',public.save_website_blog_post('ba000000-0000-4000-8000-000000000021','first-post','First post','','',false)::text,true);
select blog_test.ok((select status='draft' and organization_id='ba000000-0000-4000-8000-000000000011' and created_by='ba000000-0000-4000-8000-000000000001' from public.website_blog_posts),'server derives tenant and author');
select blog_test.fails($q$select public.save_website_blog_post('ba000000-0000-4000-8000-000000000022','forged','Forged','','Body',true)$q$,'tenant A cannot publish into B');
select blog_test.fails($q$select public.save_website_blog_post('ba000000-0000-4000-8000-000000000023','forged','Forged','','Body',true)$q$,'no-request site cannot create posts');
select blog_test.fails($q$insert into public.website_blog_posts(website_id,organization_id,slug,title) values('ba000000-0000-4000-8000-000000000021','ba000000-0000-4000-8000-000000000011','forged','Forged')$q$,'direct writes bypassing validated RPC refused');
select blog_test.fails($q$select public.set_website_blog_requested('ba000000-0000-4000-8000-000000000023',true)$q$,'customer cannot enable service outside approved scope');
select public.save_website_blog_post('ba000000-0000-4000-8000-000000000021','first-post','First post','Introduction','## Heading

<script>literal text</script>',true,current_setting('blog_test.post')::uuid,(select updated_at from public.website_blog_posts where id=current_setting('blog_test.post')::uuid));
select blog_test.ok((select status='published' and published_at is not null from public.website_blog_posts),'owner can publish current draft');
select blog_test.fails($q$select public.save_website_blog_post('ba000000-0000-4000-8000-000000000021','first-post','Stale','','Body',true,current_setting('blog_test.post')::uuid,'2000-01-01')$q$,'stale editor cannot overwrite');
select blog_test.fails($q$select public.save_website_blog_post('ba000000-0000-4000-8000-000000000021','changed-link','Changed','','Body',true,current_setting('blog_test.post')::uuid,(select updated_at from public.website_blog_posts where id=current_setting('blog_test.post')::uuid))$q$,'published address remains stable');
select public.save_website_blog_post('ba000000-0000-4000-8000-000000000021','first-post','First post','Introduction','Retained body',false,current_setting('blog_test.post')::uuid,(select updated_at from public.website_blog_posts where id=current_setting('blog_test.post')::uuid));
select blog_test.ok((select status='draft' and body='Retained body' from public.website_blog_posts),'unpublish retains article');
select blog_test.fails($q$update public.website_blog_posts set review_sample=true$q$,'customer cannot grant public sample visibility');
reset role;
update public.website_blog_posts set review_sample=true where id=current_setting('blog_test.post')::uuid;
set local role authenticated;
select public.save_website_blog_post('ba000000-0000-4000-8000-000000000021','first-post','Edited sample','Introduction','Updated sample body',false,current_setting('blog_test.post')::uuid,(select updated_at from public.website_blog_posts where id=current_setting('blog_test.post')::uuid));
select blog_test.ok((select review_sample and body='Updated sample body' from public.website_blog_posts),'owner can edit staff-selected sample without changing visibility');
select blog_test.fails($q$select public.save_website_blog_post('ba000000-0000-4000-8000-000000000021','first-post','Sample','Introduction','Body',true,current_setting('blog_test.post')::uuid,(select updated_at from public.website_blog_posts where id=current_setting('blog_test.post')::uuid))$q$,'sample cannot become a published production article');

-- Trash is reversible, version checked, and cannot be edited until restored.
select blog_test.fails($q$select public.set_website_blog_post_deleted('ba000000-0000-4000-8000-000000000021',current_setting('blog_test.post')::uuid,'2000-01-01',true)$q$,'stale delete cannot remove a newer article');
select public.set_website_blog_post_deleted('ba000000-0000-4000-8000-000000000021',current_setting('blog_test.post')::uuid,(select updated_at from public.website_blog_posts where id=current_setting('blog_test.post')::uuid),true);
select blog_test.ok((select deleted_at is not null from public.website_blog_posts),'trash keeps article content');
select blog_test.fails($q$select public.save_website_blog_post('ba000000-0000-4000-8000-000000000021','first-post','Changed','','Body',false,current_setting('blog_test.post')::uuid,(select updated_at from public.website_blog_posts where id=current_setting('blog_test.post')::uuid))$q$,'trashed post cannot be edited or republished');
select public.set_website_blog_post_deleted('ba000000-0000-4000-8000-000000000021',current_setting('blog_test.post')::uuid,(select updated_at from public.website_blog_posts where id=current_setting('blog_test.post')::uuid),false);
select blog_test.ok((select deleted_at is null from public.website_blog_posts),'owner can restore');
reset role;
select set_config('request.jwt.claim.sub','ba000000-0000-4000-8000-000000000002',true);
set local role authenticated;
select blog_test.ok((select count(*)=0 from public.website_blog_posts),'cross-tenant drafts hidden even by known post ID');
select blog_test.fails($q$select public.set_website_blog_post_deleted('ba000000-0000-4000-8000-000000000021',current_setting('blog_test.post')::uuid,now(),true)$q$,'tenant B cannot trash A article');
select blog_test.fails($q$select public.website_blog_available('ba000000-0000-4000-8000-000000000021')$q$,'tenant B cannot inspect A service scope');
select public.save_website_blog_post('ba000000-0000-4000-8000-000000000022','first-post','Growth first post','','Body',true);
reset role;
select set_config('request.jwt.claim.sub','ba000000-0000-4000-8000-000000000003',true);
set local role authenticated;
select blog_test.fails($q$select public.save_website_blog_post('ba000000-0000-4000-8000-000000000021','member-post','Member post','','Body',true)$q$,'ordinary member cannot publish');
select blog_test.fails($q$select public.set_website_blog_post_deleted('ba000000-0000-4000-8000-000000000021',current_setting('blog_test.post')::uuid,now(),true)$q$,'ordinary member cannot delete');
reset role;
select set_config('request.jwt.claim.role','anon',true);
select set_config('request.jwt.claim.sub','',true);
set local role anon;
select blog_test.fails('select * from public.website_blog_posts','anonymous cannot read any table drafts or published rows directly');
select blog_test.fails($q$select public.set_website_blog_post_deleted('ba000000-0000-4000-8000-000000000021',current_setting('blog_test.post')::uuid,now(),true)$q$,'anonymous cannot delete');
select blog_test.fails($q$select public.save_website_blog_post('ba000000-0000-4000-8000-000000000021','anon','Anon','','Body',true)$q$,'anonymous cannot write');
reset role;
update public.organizations set archived_at=now() where id='ba000000-0000-4000-8000-000000000012';
select blog_test.ok(not vigil.website_blog_enabled('ba000000-0000-4000-8000-000000000022'),'archived organization blog unavailable');
update public.website_content_collections set enabled=false where website_id='ba000000-0000-4000-8000-000000000021';
select blog_test.ok(not vigil.website_blog_enabled('ba000000-0000-4000-8000-000000000021'),'unchecking request disables service without removing content');
select blog_test.ok((select count(*)=2 from public.website_blog_posts),'scope removal retains both tenants articles');
rollback;

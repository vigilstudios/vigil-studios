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
('ba000000-0000-4000-8000-000000000021','ba000000-0000-4000-8000-000000000011','ba000000-0000-4000-8000-000000000031','Professional Blog','building'),
('ba000000-0000-4000-8000-000000000022','ba000000-0000-4000-8000-000000000012','ba000000-0000-4000-8000-000000000032','Growth Blog','building'),
('ba000000-0000-4000-8000-000000000023','ba000000-0000-4000-8000-000000000011','ba000000-0000-4000-8000-000000000033','Portfolio','building'),
('ba000000-0000-4000-8000-000000000024','ba000000-0000-4000-8000-000000000011','ba000000-0000-4000-8000-000000000034','Express','building');

insert into public.project_assets(id,organization_id,project_id,kind,bucket_id,object_path,file_name,content_type,size_bytes) values
('ba000000-0000-4000-8000-000000000041','ba000000-0000-4000-8000-000000000011','ba000000-0000-4000-8000-000000000031','photo','blog-images','ba000000-0000-4000-8000-000000000011/a.webp','a.webp','image/webp',120),
('ba000000-0000-4000-8000-000000000042','ba000000-0000-4000-8000-000000000012','ba000000-0000-4000-8000-000000000032','photo','blog-images','ba000000-0000-4000-8000-000000000012/b.webp','b.webp','image/webp',120);
insert into public.website_blog_images(id,organization_id,website_id,object_path,width,height) values
('ba000000-0000-4000-8000-000000000041','ba000000-0000-4000-8000-000000000011','ba000000-0000-4000-8000-000000000021','ba000000-0000-4000-8000-000000000011/a.webp',100,100),
('ba000000-0000-4000-8000-000000000042','ba000000-0000-4000-8000-000000000012','ba000000-0000-4000-8000-000000000022','ba000000-0000-4000-8000-000000000012/b.webp',100,100);
insert into storage.objects(bucket_id,name) values('blog-images','ba000000-0000-4000-8000-000000000011/a.webp'),('blog-images','ba000000-0000-4000-8000-000000000012/b.webp');
select blog_test.ok((select not public and allowed_mime_types=array['image/webp'] and file_size_limit=3145728 from storage.buckets where id='blog-images'),'private bucket has raster-only output limits');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"ba000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select blog_test.ok((select count(*)=1 from public.website_blog_images),'image row tenant isolation');
select blog_test.ok((select count(*)=1 from storage.objects where bucket_id='blog-images'),'private storage tenant isolation');
select blog_test.fails($q$insert into storage.objects(bucket_id,name) values('blog-images','ba000000-0000-4000-8000-000000000011/forged.webp')$q$,'browser cannot bypass sanitizer');
select blog_test.fails($q$insert into public.website_blog_images(id,website_id,organization_id,object_path,width,height) values('ba000000-0000-4000-8000-000000000043','ba000000-0000-4000-8000-000000000021','ba000000-0000-4000-8000-000000000011','ba000000-0000-4000-8000-000000000011/forged.webp',100,100)$q$,'browser cannot forge registered image');
select blog_test.fails($q$select public.save_website_blog_post('ba000000-0000-4000-8000-000000000021','foreign','Foreign','','body',true,p_media:='{"cover":null,"images":[{"id":"ba000000-0000-4000-8000-000000000042","alt":"foreign","caption":""}]}')$q$,'known cross-tenant image rejected');
select blog_test.fails($q$select public.save_website_blog_post('ba000000-0000-4000-8000-000000000021','no-alt','No alt','','body',true,p_media:='{"cover":null,"images":[{"id":"ba000000-0000-4000-8000-000000000041","alt":"","caption":""}]}')$q$,'published photo needs alt text');
select blog_test.fails($q$select public.save_website_blog_post('ba000000-0000-4000-8000-000000000021','unknown-marker','Unknown','','[[image:ba000000-0000-4000-8000-000000000042]]',true,p_media:='{"cover":null,"images":[]}')$q$,'unattached inline marker rejected');
select blog_test.fails($q$select public.save_website_blog_post('ba000000-0000-4000-8000-000000000021','unknown-cover','Unknown','','body',true,p_media:='{"cover":"ba000000-0000-4000-8000-000000000042","images":[]}')$q$,'cover must be an attached image');
select public.save_website_blog_post('ba000000-0000-4000-8000-000000000021','with-images','Images','','## Heading'||chr(10)||chr(10)||'[[image:ba000000-0000-4000-8000-000000000041]]',true,p_media:='{"cover":"ba000000-0000-4000-8000-000000000041","images":[{"id":"ba000000-0000-4000-8000-000000000041","alt":"Image description","caption":"Caption","url":"https://untrusted.example/"}]}');
select blog_test.ok((select media->'images'->0->>'alt'='Image description' and not(media->'images'->0 ? 'url') from public.website_blog_posts where slug='with-images'),'trusted images save and untrusted URLs are stripped');
select public.save_website_blog_post('ba000000-0000-4000-8000-000000000021','with-images','Images','','Updated body',true,p_post:=(select id from public.website_blog_posts where slug='with-images'),p_expected:=(select updated_at from public.website_blog_posts where slug='with-images'));
select blog_test.ok((select jsonb_array_length(media->'images')=1 from public.website_blog_posts where slug='with-images'),'older text clients preserve existing media');
set local role anon;
select blog_test.fails($q$select * from public.website_blog_images$q$,'anonymous cannot read draft image registry');
select blog_test.ok((select count(*)=0 from storage.objects where bucket_id='blog-images'),'anonymous cannot read private images');
reset role;
rollback;

-- Reversible author deletion. No new direct browser writes or anonymous grants.
alter table public.website_blog_posts add column deleted_at timestamptz;
create index website_blog_active_posts on public.website_blog_posts(website_id,published_at desc,id) where deleted_at is null and status='published' and not review_sample;
create function public.set_website_blog_post_deleted(p_website uuid,p_post uuid,p_expected timestamptz,p_deleted boolean)
returns uuid language plpgsql security definer set search_path='' as $$
declare org uuid; post public.website_blog_posts;
begin
 select organization_id into org from public.websites where id=p_website;
 if auth.uid() is null or org is null or not(vigil.is_staff() or vigil.has_org_role(org,array['owner','manager']::public.org_role[])) then raise exception 'Not authorized' using errcode='42501';end if;
 if not vigil.website_blog_enabled(p_website) then raise exception 'Blog unavailable' using errcode='42501';end if;
 select * into post from public.website_blog_posts where id=p_post and website_id=p_website and organization_id=org for update;
 if post.id is null then raise exception 'Post unavailable' using errcode='42501';end if;
 if p_expected is null or p_expected is distinct from post.updated_at then raise exception 'Post changed; reload before continuing' using errcode='40001';end if;
 if p_deleted is null then raise exception 'Choose an action' using errcode='22023';end if;
 update public.website_blog_posts set deleted_at=case when p_deleted then coalesce(post.deleted_at,clock_timestamp()) else null end where id=p_post;
 return p_post;
end$$;
revoke all on function public.set_website_blog_post_deleted(uuid,uuid,timestamptz,boolean) from public,anon;
grant execute on function public.set_website_blog_post_deleted(uuid,uuid,timestamptz,boolean) to authenticated;
create or replace function public.save_website_blog_post(p_website uuid,p_slug text,p_title text,p_excerpt text,p_body text,p_publish boolean,p_post uuid default null,p_expected timestamptz default null,p_media jsonb default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare org uuid; post public.website_blog_posts; result uuid; v_media jsonb; image jsonb; marker text;
begin
 select organization_id into org from public.websites where id=p_website;
 if auth.uid() is null or org is null or not(vigil.is_staff() or vigil.has_org_role(org,array['owner','manager']::public.org_role[])) then raise exception 'Not authorized' using errcode='42501';end if;
 if not vigil.website_blog_enabled(p_website) then raise exception 'Blog was not requested for this website' using errcode='42501';end if;
 if p_publish is null or p_slug is null or p_title is null or p_body is null or p_excerpt is null then raise exception 'Invalid post' using errcode='22023';end if;
 if p_post is not null then
  select * into post from public.website_blog_posts where id=p_post and website_id=p_website and organization_id=org for update;
  if post.deleted_at is not null then raise exception 'Restore this post before editing' using errcode='22023';end if;
  if post.id is null then raise exception 'Post unavailable' using errcode='42501';end if;
  if p_expected is null or p_expected is distinct from post.updated_at then raise exception 'Post changed; reload before saving' using errcode='40001';end if;
  if post.published_at is not null and p_slug is distinct from post.slug then raise exception 'Published post address cannot change' using errcode='22023';end if;
 end if;
 v_media=coalesce(p_media,post.media,'{"cover":null,"images":[]}'::jsonb);
 if jsonb_typeof(v_media)<>'object' or jsonb_typeof(v_media->'images') is distinct from 'array' or jsonb_array_length(v_media->'images')>10 or not(v_media ? 'cover') or jsonb_typeof(v_media->'cover') not in ('null','string') then raise exception 'Invalid images' using errcode='22023';end if;
 if (select count(*)<>count(distinct (i->>'id')::uuid) from jsonb_array_elements(v_media->'images') i) then raise exception 'Duplicate images' using errcode='22023';end if;
 for image in select value from jsonb_array_elements(v_media->'images') loop
  if jsonb_typeof(image->'id') is distinct from 'string' or jsonb_typeof(image->'alt') is distinct from 'string' or jsonb_typeof(image->'caption') is distinct from 'string' or length(image->>'alt')>240 or length(image->>'caption')>400 or (p_publish and length(trim(image->>'alt'))=0) then raise exception 'Add image descriptions' using errcode='22023';end if;
  if not exists(select 1 from public.website_blog_images i where i.id=(image->>'id')::uuid and i.website_id=p_website and i.organization_id=org) then raise exception 'Image unavailable' using errcode='42501';end if;
 end loop;
 if v_media->'cover'<>'null'::jsonb and not exists(select 1 from jsonb_array_elements(v_media->'images') i where i->>'id'=v_media->>'cover') then raise exception 'Cover unavailable' using errcode='22023';end if;
 for marker in select m[1] from regexp_matches(p_body,'\[\[image:([0-9a-f-]{36})\]\]','g') m loop
  if not exists(select 1 from jsonb_array_elements(v_media->'images') i where i->>'id'=marker) then raise exception 'Insert an uploaded image' using errcode='22023';end if;
 end loop;
 -- Normalize to an allowlist: persisted metadata never includes client URLs or storage paths.
 v_media=jsonb_build_object('cover',v_media->'cover','images',coalesce((select jsonb_agg(jsonb_build_object('id',(i->>'id')::uuid::text,'alt',trim(i->>'alt'),'caption',trim(i->>'caption'))) from jsonb_array_elements(v_media->'images') i),'[]'::jsonb));
 if p_post is not null then
  update public.website_blog_posts set media=v_media, slug=p_slug,title=trim(p_title),excerpt=trim(p_excerpt),body=p_body,status=case when p_publish then 'published' else 'draft' end,
   published_at=case when p_publish then coalesce(post.published_at,now()) else post.published_at end where id=p_post returning id into result;
 else
  insert into public.website_blog_posts(website_id,organization_id,slug,title,excerpt,body,status,published_at,created_by,media)
  values(p_website,org,p_slug,trim(p_title),trim(p_excerpt),p_body,case when p_publish then 'published' else 'draft' end,case when p_publish then now() else null end,auth.uid(),v_media) returning id into result;
 end if;
 return result;
end$$;
revoke all on function public.save_website_blog_post(uuid,text,text,text,text,boolean,uuid,timestamptz,jsonb) from public,anon;
grant execute on function public.save_website_blog_post(uuid,text,text,text,text,boolean,uuid,timestamptz,jsonb) to authenticated;

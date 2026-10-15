-- Reuse the original Files object and project_assets ID. No quota-consuming duplicate.
create function public.attach_content_library_media(p_collection uuid,p_asset uuid) returns void
language plpgsql security definer set search_path='' as $$
declare c public.website_content_collections;a public.project_assets;project uuid;
begin
 select * into c from public.website_content_collections where id=p_collection;
 if auth.uid() is null or c.id is null or not c.enabled or c.module not in ('portfolio','gallery','testimonials','products','services') or not vigil.content_access(c.website_id) or not(vigil.is_staff() or vigil.has_org_role(c.organization_id,array['owner','manager']::public.org_role[])) then raise exception 'Not authorized' using errcode='42501';end if;
 select project_id into project from public.websites where id=c.website_id;
 select * into a from public.project_assets where id=p_asset for update;
 if a.id is null or a.organization_id<>c.organization_id or a.project_id is distinct from project or a.bucket_id<>'project-assets' or a.object_path not like c.organization_id::text||'/'||project::text||'/%' or a.content_type not in ('image/jpeg','image/png','image/webp','image/gif','video/mp4','video/quicktime','video/webm','video/x-m4v') or a.size_bytes<=0 then raise exception 'File unavailable' using errcode='42501';end if;
 if not exists(select 1 from storage.objects where bucket_id=a.bucket_id and name=a.object_path and (metadata->>'size')::bigint=a.size_bytes and metadata->>'mimetype'=a.content_type) then raise exception 'File upload is incomplete' using errcode='22023';end if;
 insert into public.website_content_media(id,website_id,organization_id,type,ready)
 values(a.id,c.website_id,c.organization_id,case when a.content_type like 'video/%' then 'video' else 'image' end,true)
 on conflict(id) do nothing;
 if not exists(select 1 from public.website_content_media where id=a.id and website_id=c.website_id and organization_id=c.organization_id and ready) then raise exception 'File belongs to another website' using errcode='42501';end if;
end$$;
revoke all on function public.attach_content_library_media(uuid,uuid) from public,anon;
grant execute on function public.attach_content_library_media(uuid,uuid) to authenticated;

-- Direct reservations must use a collection that supports media; Blog keeps its dedicated normalized-image flow.
create or replace function public.reserve_content_media(p_collection uuid,p_id uuid,p_name text,p_type text,p_size bigint) returns text language plpgsql security definer set search_path='' as $$
declare c public.website_content_collections;project uuid;path text;extension text;limits record;usage record;
begin
 select * into c from public.website_content_collections where id=p_collection;
 if auth.uid() is null or c.id is null or not c.enabled or c.module not in ('portfolio','gallery','testimonials','products','services') or not vigil.content_access(c.website_id) or not(vigil.is_staff() or vigil.has_org_role(c.organization_id,array['owner','manager']::public.org_role[])) then raise exception 'Not authorized' using errcode='42501';end if;
 if p_type not in ('image/webp','video/mp4','video/webm') or p_size<=0 or p_size>524288000 or length(p_name)>180 then raise exception 'Unsupported file' using errcode='22023';end if;
 perform 1 from public.organizations where id=c.organization_id for update;
 select max(case when feature_code='files.max_count' and jsonb_typeof(value)='number' then (value#>>'{}')::numeric end) as count,
 max(case when feature_code='files.max_file_mb' and jsonb_typeof(value)='number' then (value#>>'{}')::numeric*1048576 end) as file,
 max(case when feature_code='files.max_total_mb' and jsonb_typeof(value)='number' then (value#>>'{}')::numeric*1048576 end) as bytes,
 bool_or(feature_code='files.video_enabled' and value='true'::jsonb) as video into limits from vigil.website_features(c.website_id);
 select count(*) as count,coalesce(sum(size_bytes),0) as bytes into usage from public.project_assets where organization_id=c.organization_id;
 if limits.count is not null and usage.count>=limits.count or limits.file is not null and p_size>limits.file or limits.bytes is not null and usage.bytes+p_size>limits.bytes or p_type like 'video/%' and not coalesce(limits.video,false) then raise exception 'File-library allowance exceeded' using errcode='23514';end if;
 select project_id into project from public.websites where id=c.website_id;
 extension=case p_type when 'image/webp' then 'webp' when 'video/mp4' then 'mp4' else 'webm' end;
 path=c.organization_id::text||'/'||project::text||'/'||p_id::text||'.'||extension;
 insert into public.project_assets(id,project_id,organization_id,kind,bucket_id,object_path,file_name,content_type,size_bytes,uploaded_by)
 values(p_id,project,c.organization_id,case when p_type like 'video/%' then 'video'::public.project_asset_kind else 'photo'::public.project_asset_kind end,'content-media',path,p_name,p_type,p_size,auth.uid());
 insert into public.website_content_media(id,website_id,organization_id,type) values(p_id,c.website_id,c.organization_id,case when p_type like 'video/%' then 'video' else 'image' end);
 return path;
end$$;

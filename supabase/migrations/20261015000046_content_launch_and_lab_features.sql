-- Authoring opens to customers at go-live; staff retain prelaunch editing independently of customer plans.
create function vigil.content_eligible(p_website uuid) returns boolean language sql stable security definer set search_path='' as $$
 select coalesce((select p.kind in ('professional','custom') and o.archived_at is null and o.status='active' and p.status not in ('cancelled','closed') and w.status<>'archived'
 and exists(select 1 from vigil.website_features(w.id) f where f.feature_code='hosting.managed' and f.value='true'::jsonb and f.plan_code is not null)
 and exists(select 1 from vigil.website_features(w.id) f where f.feature_code='content.self_service' and f.value='true'::jsonb and f.plan_code in ('care','growth','priority'))
 from public.websites w join public.projects p on p.id=w.project_id join public.organizations o on o.id=w.organization_id where w.id=p_website),false);
$$;
create function vigil.content_authoring_access(p_website uuid,p_actor uuid) returns boolean language sql stable security definer set search_path='' as $$
 select coalesce((select o.archived_at is null and o.status='active' and p.kind in ('professional','custom') and p.status not in ('cancelled','closed') and w.status<>'archived'
 and (exists(select 1 from public.staff_members s where s.user_id=p_actor) or w.status='live' and vigil.content_eligible(w.id))
 from public.websites w join public.projects p on p.id=w.project_id join public.organizations o on o.id=w.organization_id where w.id=p_website),false);
$$;
revoke all on function vigil.content_eligible(uuid),vigil.content_authoring_access(uuid,uuid) from public,anon,authenticated;
grant execute on function vigil.content_eligible(uuid),vigil.content_authoring_access(uuid,uuid) to service_role;
create function public.website_content_eligibility(p_website uuid) returns boolean language plpgsql stable security definer set search_path='' as $$begin
 if not exists(select 1 from public.websites w where w.id=p_website and (auth.role()='service_role' or vigil.is_staff() or vigil.is_org_member(w.organization_id))) then raise exception 'Not authorized' using errcode='42501';end if;
 return vigil.content_eligible(p_website);
end$$;
revoke all on function public.website_content_eligibility(uuid) from public,anon;grant execute on function public.website_content_eligibility(uuid) to authenticated,service_role;
create or replace function public.website_content_access(p_website uuid) returns boolean language plpgsql stable security definer set search_path='' as $$begin
 if not exists(select 1 from public.websites w where w.id=p_website and (auth.role()='service_role' or vigil.is_staff() or vigil.is_org_member(w.organization_id))) then raise exception 'Not authorized' using errcode='42501';end if;
 return case when auth.role()='service_role' then vigil.content_eligible(p_website) else vigil.content_authoring_access(p_website,auth.uid()) end;
end$$;
create function vigil.content_viewable(p_website uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.websites w where w.id=p_website and (vigil.is_staff() or vigil.is_org_member(w.organization_id) and vigil.content_authoring_access(w.id,auth.uid())));
$$;
revoke all on function vigil.content_viewable(uuid) from public,anon;grant execute on function vigil.content_viewable(uuid) to authenticated,service_role;
drop policy content_collection_read on public.website_content_collections;
create policy content_collection_read on public.website_content_collections for select to authenticated using(vigil.content_viewable(website_id));
drop policy content_history_read on public.website_content_history;
create policy content_history_read on public.website_content_history for select to authenticated using(vigil.content_viewable(website_id));
drop policy content_media_read on public.website_content_media;
create policy content_media_read on public.website_content_media for select to authenticated using(vigil.content_viewable(website_id));
create or replace function vigil.website_blog_enabled(p_website uuid) returns boolean language sql stable security definer set search_path='' as $$
 select vigil.content_authoring_access(p_website,auth.uid()) and exists(select 1 from public.website_content_collections c where c.website_id=p_website and c.module='blog' and c.enabled);
$$;
create function vigil.content_feature_config(p_config jsonb) returns jsonb language sql immutable set search_path='' as $$
 select jsonb_strip_nulls(jsonb_build_object('featuredSlotBudget',coalesce(p_config->'featuredSlotBudget','0'::jsonb),'featuredLabel',p_config->'featuredLabel','featuredMediaType',p_config->'featuredMediaType','featuredMinimum',coalesce(p_config->'featuredMinimum','0'::jsonb),'featuredRequireFull',p_config->'featuredRequireFull'));
$$;
revoke all on function vigil.content_feature_config(jsonb) from public,anon,authenticated;
-- Preserve all existing ownership, quota, concurrency, and role checks while adding the actor-specific gate.
do $$declare source text;guard text;fn regprocedure;begin
 guard:='(not vigil.content_access(c.website_id) and not (exists(select 1 from public.staff_members staff where staff.user_id=p_actor) and public.website_content_delivery(c.website_id,true)))';
 source:=pg_get_functiondef('public.save_website_content(uuid,integer,jsonb,text,uuid)'::regprocedure);
 if position(guard in source)=0 then raise exception 'Expected content authoring guard missing';end if;
 source:=replace(source,guard,'not vigil.content_authoring_access(c.website_id,p_actor)');
 source:=replace(source,'draft=p_records,published=next_public,','draft=p_records,published=next_public,config=case when p_intent in (''publish'',''unpublish'') then jsonb_set(config,''{publishedFeatured}'',vigil.content_feature_config(config)) else config end,');
 execute source;
 foreach fn in array array['public.reserve_content_media(uuid,uuid,text,text,bigint)'::regprocedure,'public.attach_content_library_media(uuid,uuid)'::regprocedure] loop
  source:=pg_get_functiondef(fn);guard:='not vigil.content_access(c.website_id)';
  if position(guard in source)=0 then raise exception 'Expected media authoring guard missing';end if;
  execute replace(source,guard,'not vigil.content_authoring_access(c.website_id,auth.uid())');
 end loop;
end$$;

-- Lab commits settings and draft records together. Its save never changes the published feature policy.
do $$declare source text;guard text;begin
 source:=pg_get_functiondef('public.save_content_design_workspace(uuid,integer,jsonb,jsonb,uuid,text)'::regprocedure);
 guard:='draft=change->''records'',revision=revision+1';
 if position(guard in source)=0 then raise exception 'Expected atomic Lab update missing';end if;
 execute replace(source,guard,'draft=change->''records'',config=case when jsonb_typeof(change->''config'')=''object'' then ((change->''config'')-''publishedFeatured'')||jsonb_build_object(''publishedFeatured'',coalesce(c.config->''publishedFeatured'',vigil.content_feature_config(c.config))) else c.config end,revision=revision+1');
end$$;

create or replace function vigil.enforce_content_feature_slots() returns trigger language plpgsql set search_path='' as $$
declare budget integer;rows jsonb;selected_count integer;media_kind text;require_full boolean;is_public boolean;cfg jsonb;minimum integer;
begin
 foreach is_public in array array[false,true] loop
  cfg=case when is_public then coalesce(new.config->'publishedFeatured',new.config) else new.config end;
 if coalesce(cfg->>'featuredSlotBudget','0') !~ '^[0-9]{1,3}$' then raise exception 'Invalid featured capacity' using errcode='22023';end if;
 budget=coalesce((cfg->>'featuredSlotBudget')::integer,0);
 if budget>500 then raise exception 'Invalid featured capacity' using errcode='22023';end if;
 media_kind=coalesce(cfg->>'featuredMediaType',case when new.adapter='standalone' and new.module='portfolio' and budget>0 then 'video' end);
 require_full=coalesce((cfg->>'featuredRequireFull')::boolean,new.adapter='standalone' and new.module='portfolio' and budget>0);

  minimum=coalesce((cfg->>'featuredMinimum')::integer,0);if minimum<0 or minimum>budget then raise exception 'Invalid featured minimum' using errcode='22023';end if;
  rows=case when is_public then new.published else new.draft end;
  if budget=0 then
   if exists(select 1 from jsonb_array_elements(rows) r where r ? 'featuredOrder') then raise exception 'Featured positions are not configured' using errcode='22023';end if;
   continue;
  end if;
  select count(*) into selected_count from jsonb_array_elements(rows) r where r->'featured'='true'::jsonb and r->'deleted'='false'::jsonb;
  if selected_count>budget then raise exception 'Featured capacity exceeded' using errcode='22023';end if;
  if exists(select 1 from jsonb_array_elements(rows) r where r->'deleted'='false'::jsonb and r ? 'featuredOrder' and (r->'featured'<>'true'::jsonb or jsonb_typeof(r->'featuredOrder') is distinct from 'number' or r->>'featuredOrder' !~ '^[1-9][0-9]{0,2}$' or (r->>'featuredOrder')::numeric>budget)) then raise exception 'Invalid featured position' using errcode='22023';end if;
  if exists(select r->>'featuredOrder' from jsonb_array_elements(rows) r where r->'featured'='true'::jsonb and r->'deleted'='false'::jsonb and r ? 'featuredOrder' group by r->>'featuredOrder' having count(*)>1) then raise exception 'Duplicate featured position' using errcode='22023';end if;
  if media_kind is not null and exists(select 1 from jsonb_array_elements(rows) r where r->'featured'='true'::jsonb and r->'deleted'='false'::jsonb and not exists(select 1 from jsonb_array_elements(coalesce(r->'data'->'media','[]')) m where m->>'type'=media_kind)) then raise exception 'Featured media type required' using errcode='22023';end if;
  if is_public and jsonb_array_length(rows)>0 and selected_count<minimum then raise exception 'Choose enough featured items before publishing' using errcode='22023';end if;
  if is_public and require_full and jsonb_array_length(rows)>0 and selected_count<>budget then raise exception 'Fill every featured position before publishing' using errcode='22023';end if;
 end loop;
 return new;
end$$;
drop policy website_blog_member_read on public.website_blog_posts;
create policy website_blog_member_read on public.website_blog_posts for select to authenticated using(vigil.content_viewable(website_id));
drop policy blog_image_member_read on public.website_blog_images;
create policy blog_image_member_read on public.website_blog_images for select to authenticated using(vigil.content_viewable(website_id));
notify pgrst, 'reload schema';

-- Additive Content Hub. Current founder policy: Care+; build eligibility is independent.
insert into public.features(code,name,description,value_kind,default_value)
values('content.self_service','Content Hub','Self-service content editing on configured Professional/Growth websites.','boolean','false');
insert into public.plan_features(plan_id,feature_code,value)
select id,'content.self_service',to_jsonb(code in ('care','growth','priority')) from public.plans;

create function vigil.website_features(p_website uuid)
returns table(feature_code text,value jsonb,source text,plan_code text)
language sql stable security definer set search_path='' as $$
 with website as(select w.* from public.websites w where w.id=p_website),
 attributed as(
  select s.*,p.code,p.tier_rank,
   case when s.website_id=p_website then 3 when exists(select 1 from public.orders o join website w on o.project_id=w.project_id where o.subscription_id=s.id and o.organization_id=w.organization_id) then 2 else 1 end as attribution
  from public.subscriptions s join public.plans p on p.id=s.plan_id join website w on w.organization_id=s.organization_id
  where s.website_id=p_website or (s.website_id is null and exists(select 1 from public.orders o where o.project_id=w.project_id and o.subscription_id=s.id and o.organization_id=w.organization_id))
   or (s.website_id is null and not exists(select 1 from public.orders o where o.subscription_id=s.id and o.project_id is not null)
       and (select count(*) from public.websites x where x.organization_id=w.organization_id)=1)
 ), chosen as(select * from attributed order by attribution desc,created_at desc limit 1),
 paid as(select * from chosen where (status in ('active','trialing','past_due') and (current_period_end is null or current_period_end>now())) or (status='canceled' and current_period_end>now()))
 select f.code,coalesce(o.value,pf.value,f.default_value),case when o.value is not null then 'override' when pf.value is not null then 'plan' else 'default' end,(select code from paid)
 from public.features f left join paid p on true left join public.plan_features pf on pf.plan_id=p.plan_id and pf.feature_code=f.code
 left join website w on true left join public.entitlement_overrides o on o.organization_id=w.organization_id and o.feature_code=f.code and (o.expires_at is null or o.expires_at>now());
$$;
revoke all on function vigil.website_features(uuid) from public,anon,authenticated;
grant execute on function vigil.website_features(uuid) to service_role;
create function public.resolve_website_entitlements(p_website uuid)
returns table(feature_code text,value jsonb,source text,plan_code text) language plpgsql stable security definer set search_path='' as $$
begin
 if not exists(select 1 from public.websites w where w.id=p_website and (auth.role()='service_role' or vigil.is_staff() or vigil.is_org_member(w.organization_id))) then raise exception 'Not authorized' using errcode='42501';end if;
 return query select * from vigil.website_features(p_website);
end$$;
revoke all on function public.resolve_website_entitlements(uuid) from public,anon;
grant execute on function public.resolve_website_entitlements(uuid) to authenticated,service_role;

create table public.website_content_collections(
 id uuid primary key default gen_random_uuid(),website_id uuid not null references public.websites(id) on delete cascade,
 organization_id uuid not null references public.organizations(id) on delete cascade,
 version integer not null default 1 check(version=1),key text not null check(key ~ '^[a-z0-9][a-z0-9-]*$' and length(key)<=180),
 module text not null check(module in ('blog','portfolio','gallery','testimonials','products','services','faq')),
 label text not null check(length(label) between 1 and 160),page_id text not null,section_id text not null,field text not null,
 adapter text not null check(adapter in ('blog','professional','standalone')),enabled boolean not null default true,
 config jsonb not null default '{}',draft jsonb not null default '[]' check(jsonb_typeof(draft)='array'),
 published jsonb not null default '[]' check(jsonb_typeof(published)='array'),revision integer not null default 1,
 published_revision integer,updated_by uuid references public.profiles(id),updated_at timestamptz not null default now(),
 unique(website_id,key),unique(website_id,page_id,section_id,field),unique(id,website_id,organization_id)
);
create trigger content_collection_org before insert or update on public.website_content_collections for each row execute function vigil.enforce_same_org_references();
alter table public.website_content_collections enable row level security;
revoke all on public.website_content_collections from public,anon,authenticated;
grant select on public.website_content_collections to authenticated;
grant all on public.website_content_collections to service_role;
create policy content_collection_read on public.website_content_collections for select to authenticated using(vigil.is_staff() or vigil.is_org_member(organization_id));
create table public.website_content_history(
 id uuid primary key default gen_random_uuid(),collection_id uuid not null references public.website_content_collections(id) on delete cascade,
 website_id uuid not null references public.websites(id) on delete cascade,organization_id uuid not null references public.organizations(id) on delete cascade,
 revision integer not null,intent text not null,records jsonb not null,actor_id uuid references public.profiles(id),created_at timestamptz not null default now()
);
alter table public.website_content_history enable row level security;
revoke all on public.website_content_history from public,anon,authenticated;
grant select on public.website_content_history to authenticated;grant all on public.website_content_history to service_role;
create policy content_history_read on public.website_content_history for select to authenticated using(vigil.is_staff() or vigil.is_org_member(organization_id));

create function vigil.content_access(p_website uuid) returns boolean language sql stable security definer set search_path='' as $$
 select coalesce((select p.kind in ('professional','custom') and o.archived_at is null and o.status='active' and p.status not in ('cancelled','closed')
  and w.status in ('provisioning','building','live')
  and exists(select 1 from vigil.website_features(w.id) f where f.feature_code='hosting.managed' and f.value='true'::jsonb and f.plan_code is not null)
  and exists(select 1 from vigil.website_features(w.id) f where f.feature_code='content.self_service' and f.value='true'::jsonb and f.plan_code in ('care','growth','priority'))
 from public.websites w join public.projects p on p.id=w.project_id join public.organizations o on o.id=w.organization_id where w.id=p_website),false);
$$;
revoke all on function vigil.content_access(uuid) from public,anon,authenticated;grant execute on function vigil.content_access(uuid) to service_role;
create function public.website_content_access(p_website uuid) returns boolean language plpgsql stable security definer set search_path='' as $$begin
 if not exists(select 1 from public.websites w where w.id=p_website and (auth.role()='service_role' or vigil.is_staff() or vigil.is_org_member(w.organization_id))) then raise exception 'Not authorized' using errcode='42501';end if;
 return vigil.content_access(p_website);
end$$;
revoke all on function public.website_content_access(uuid) from public,anon;grant execute on function public.website_content_access(uuid) to authenticated,service_role;

-- Existing delivered Blog is a verified binding, without changing briefs or any posts.
insert into public.website_content_collections(website_id,organization_id,key,module,label,page_id,section_id,field,adapter)
select distinct w.id,w.organization_id,'blog','blog','Blog','blog','blog','posts','blog'
from public.websites w join public.projects p on p.id=w.project_id
where p.kind in ('professional','custom') and (exists(select 1 from public.website_blog_posts b where b.website_id=w.id) or w.metadata->'blog_requested'='true'::jsonb);
create or replace function vigil.website_blog_enabled(p_website uuid) returns boolean language sql stable security definer set search_path='' as $$
 select vigil.content_access(p_website) and exists(select 1 from public.website_content_collections c where c.website_id=p_website and c.module='blog' and c.enabled);
$$;
-- Scope administration now records an explicit binding; client metadata never enables a module.
create or replace function public.set_website_blog_requested(p_website uuid,p_requested boolean) returns void language plpgsql security definer set search_path='' as $$begin
 if auth.uid() is null or not vigil.is_staff() then raise exception 'Staff access required' using errcode='42501';end if;
 if p_requested is null or not exists(select 1 from public.websites w join public.projects p on p.id=w.project_id where w.id=p_website and p.kind in ('professional','custom')) then raise exception 'Eligible website required' using errcode='22023';end if;
 insert into public.website_content_collections(website_id,organization_id,key,module,label,page_id,section_id,field,adapter,enabled)
 select id,organization_id,'blog','blog','Blog','blog','blog','posts','blog',p_requested from public.websites where id=p_website
 on conflict(website_id,key) do update set enabled=p_requested;
 update public.websites set metadata=metadata||jsonb_build_object('blog_requested',p_requested,'blog_scope_updated_by',auth.uid()) where id=p_website;
end$$;

create table public.website_content_media(
 id uuid primary key references public.project_assets(id) on delete cascade,website_id uuid not null references public.websites(id) on delete cascade,
 organization_id uuid not null references public.organizations(id) on delete cascade,ready boolean not null default false,
 type text not null check(type in ('image','video')),created_at timestamptz not null default now()
);
create trigger content_media_org before insert or update on public.website_content_media for each row execute function vigil.enforce_same_org_references();
alter table public.website_content_media enable row level security;
revoke all on public.website_content_media from public,anon,authenticated;grant select on public.website_content_media to authenticated;grant all on public.website_content_media to service_role;
create policy content_media_read on public.website_content_media for select to authenticated using(vigil.is_staff() or vigil.is_org_member(organization_id));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('content-media','content-media',false,524288000,array['image/jpeg','image/png','image/webp','video/mp4','video/webm']);
create policy content_media_storage_read on storage.objects for select to authenticated using(bucket_id='content-media' and (vigil.is_staff() or vigil.is_org_member(vigil.path_organization(name))));
-- No browser upload/delete/overwrite policy: issue exact-path signed reservations on the server.
create table public.website_content_media_refs(
 collection_id uuid not null references public.website_content_collections(id) on delete cascade,
 media_id uuid not null references public.website_content_media(id) on delete restrict,primary key(collection_id,media_id)
);
alter table public.website_content_media_refs enable row level security;
revoke all on public.website_content_media_refs from public,anon,authenticated;grant all on public.website_content_media_refs to service_role;

create function vigil.validate_content_records(p_module text,p_website uuid,p_rows jsonb,p_publish boolean) returns void language plpgsql set search_path='' as $$
declare row jsonb;d jsonb;m jsonb;allowed text[];name text;v jsonb;
begin
 if jsonb_typeof(p_rows) is distinct from 'array' or jsonb_array_length(p_rows)>500 then raise exception 'Invalid collection' using errcode='22023';end if;
 allowed=case p_module when 'portfolio' then array['title','description','category','media','context','brand','tags','link'] when 'gallery' then array['title','description','category','media','collection'] when 'testimonials' then array['title','quote','attribution','role','company','placeholder','media'] when 'products' then array['title','description','category','media','priceLabel','link','providerRef'] when 'services' then array['title','description','category','media','link'] when 'faq' then array['title','answer'] end;
 if allowed is null then raise exception 'Unsupported module' using errcode='22023';end if;
 if (select count(*)<>count(distinct r->>'id') or count(*)<>count(distinct r->>'slug') from jsonb_array_elements(p_rows) r) then raise exception 'Duplicate entries' using errcode='22023';end if;
 for row in select value from jsonb_array_elements(p_rows) loop
  if jsonb_typeof(row) is distinct from 'object' or row-array['id','slug','data','deleted','featured']<>'{}'::jsonb or (row->>'id')::uuid is null or row->>'slug' !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(row->>'slug')>120 or jsonb_typeof(row->'deleted') is distinct from 'boolean' or jsonb_typeof(row->'featured') is distinct from 'boolean' then raise exception 'Invalid entry' using errcode='22023';end if;
  d=row->'data';if jsonb_typeof(d) is distinct from 'object' or d-allowed<>'{}'::jsonb or jsonb_typeof(d->'title') is distinct from 'string' or length(d->>'title')>160 then raise exception 'Invalid fields' using errcode='22023';end if;
  for name,v in select * from jsonb_each(d) loop
   if name not in ('media','tags','placeholder') and (jsonb_typeof(v)<>'string' or length(v#>>'{}')>4000) then raise exception 'Invalid field' using errcode='22023';end if;
   if name='link' and v#>>'{}'<>'' and ((v#>>'{}') !~ '^(https://|/[^/])' or (v#>>'{}') ~ '[[:space:]\\]') then raise exception 'Invalid link' using errcode='22023';end if;
  end loop;
  if d ? 'placeholder' and jsonb_typeof(d->'placeholder')<>'boolean' then raise exception 'Invalid placeholder' using errcode='22023';end if;
  if d ? 'tags' and (jsonb_typeof(d->'tags')<>'array' or jsonb_array_length(d->'tags')>20 or exists(select 1 from jsonb_array_elements(d->'tags') t where jsonb_typeof(t)<>'string' or length(t#>>'{}')>80)) then raise exception 'Invalid tags' using errcode='22023';end if;
  if p_publish and row->'deleted'='false'::jsonb and (length(trim(d->>'title'))=0 or p_module='testimonials' and (coalesce(length(trim(d->>'quote')),0)=0 or coalesce(length(trim(d->>'attribution')),0)=0) or p_module='faq' and coalesce(length(trim(d->>'answer')),0)=0) then raise exception 'Complete required fields' using errcode='22023';end if;
  if d ? 'media' then
   if jsonb_typeof(d->'media')<>'array' or jsonb_array_length(d->'media')>30 then raise exception 'Invalid media' using errcode='22023';end if;
   for m in select value from jsonb_array_elements(d->'media') loop
    if jsonb_typeof(m)<>'object' or m-array['id','type','src','poster','posterId','alt','caption','width','height']<>'{}'::jsonb or m->>'type' not in ('image','video') or jsonb_typeof(m->'alt') is distinct from 'string' or length(m->>'alt')>240 or jsonb_typeof(m->'src') is distinct from 'string' then raise exception 'Invalid media fields' using errcode='22023';end if;
    if m ? 'id' then
     if not exists(select 1 from public.website_content_media a where a.id=(m->>'id')::uuid and a.website_id=p_website and a.ready) then raise exception 'Media unavailable' using errcode='42501';end if;
     if m->>'src'<>'' then raise exception 'Use the media reference' using errcode='22023';end if;
    elsif m->>'src' !~ '^(https://|/assets/|/_vigil/assets/)' or m->>'src' ~ '[[:space:]\\]' then raise exception 'Invalid media address' using errcode='22023';end if;
    if m ? 'posterId' and not exists(select 1 from public.website_content_media a where a.id=(m->>'posterId')::uuid and a.website_id=p_website and a.ready and a.type='image') then raise exception 'Poster unavailable' using errcode='42501';end if;
    if m ? 'poster' and m->>'poster'<>'' and (m->>'poster' !~ '^(https://|/assets/|/_vigil/assets/)' or m->>'poster' ~ '[[:space:]\\]') then raise exception 'Invalid poster' using errcode='22023';end if;
    if p_publish and row->'deleted'='false'::jsonb and (length(trim(m->>'alt'))=0 or m->>'type'='video' and coalesce(m->>'poster','')='' and not(m ? 'posterId')) then raise exception 'Describe media and add video posters' using errcode='22023';end if;
   end loop;
  end if;
 end loop;
end$$;
revoke all on function vigil.validate_content_records(text,uuid,jsonb,boolean) from public,anon,authenticated;

-- The server validates component-specific publication constraints before this transaction.
-- Generic RPC is service-only so clients cannot skip those renderer checks.
create function public.save_website_content(p_collection uuid,p_expected integer,p_records jsonb,p_intent text,p_actor uuid) returns integer language plpgsql security definer set search_path='' as $$
declare c public.website_content_collections;previous_row jsonb;next_public jsonb;
begin
 if auth.role() is distinct from 'service_role' then raise exception 'Service only' using errcode='42501';end if;
 select * into c from public.website_content_collections where id=p_collection for update;
 if c.id is null or not c.enabled or not vigil.content_access(c.website_id) or not exists(select 1 from public.organization_members a where a.organization_id=c.organization_id and a.user_id=p_actor and a.status='active' and a.role in ('owner','manager')) and not exists(select 1 from public.staff_members s where s.user_id=p_actor) then raise exception 'Not authorized' using errcode='42501';end if;
 if c.revision is distinct from p_expected then raise exception 'Collection changed; reload' using errcode='40001';end if;
 if p_intent not in ('draft','publish','unpublish','trash') then raise exception 'Invalid action' using errcode='22023';end if;
 perform vigil.validate_content_records(c.module,c.website_id,p_records,p_intent='publish');
 for previous_row in select value from jsonb_array_elements(c.published) loop
  if exists(select 1 from jsonb_array_elements(p_records) n where n->>'id'=previous_row->>'id' and n->>'slug' is distinct from previous_row->>'slug') then raise exception 'Keep the published address' using errcode='22023';end if;
 end loop;
 next_public=case p_intent when 'publish' then p_records when 'unpublish' then '[]'::jsonb when 'trash' then coalesce((select jsonb_agg(r) from jsonb_array_elements(c.published) r where not exists(select 1 from jsonb_array_elements(p_records) n where n->>'id'=r->>'id' and n->'deleted'='true'::jsonb)),'[]'::jsonb) else c.published end;
 update public.website_content_collections set draft=p_records,published=next_public,revision=revision+1,published_revision=case when p_intent in ('publish','unpublish','trash') then revision+1 else published_revision end,updated_by=p_actor,updated_at=clock_timestamp() where id=c.id;
 insert into public.website_content_history(collection_id,website_id,organization_id,revision,intent,records,actor_id) values(c.id,c.website_id,c.organization_id,c.revision+1,p_intent,p_records,p_actor);
 delete from public.website_content_media_refs where collection_id=c.id;
 insert into public.website_content_media_refs(collection_id,media_id) select distinct c.id,(m->>'id')::uuid from jsonb_array_elements(p_records||next_public) r cross join lateral jsonb_array_elements(coalesce(r->'data'->'media','[]')) m where m ? 'id' union select distinct c.id,(m->>'posterId')::uuid from jsonb_array_elements(p_records||next_public) r cross join lateral jsonb_array_elements(coalesce(r->'data'->'media','[]')) m where m ? 'posterId';
 return c.revision+1;
end$$;
revoke all on function public.save_website_content(uuid,integer,jsonb,text,uuid) from public,anon,authenticated;grant execute on function public.save_website_content(uuid,integer,jsonb,text,uuid) to service_role;

-- Delivery and authoring are separate: a downgrade may lock editing without deleting/hiding existing published content.
create function public.website_content_delivery(p_website uuid,p_review boolean default false) returns boolean language sql stable security definer set search_path='' as $$
 select auth.role()='service_role' and coalesce((select p.kind in ('professional','custom') and o.archived_at is null and o.status='active' and p.status not in ('cancelled','closed')
 and (w.status='live' or p_review and w.status='building') and exists(select 1 from vigil.website_features(w.id) f where f.feature_code='hosting.managed' and f.value='true'::jsonb and f.plan_code is not null)
 from public.websites w join public.projects p on p.id=w.project_id join public.organizations o on o.id=w.organization_id where w.id=p_website),false);
$$;
revoke all on function public.website_content_delivery(uuid,boolean) from public,anon,authenticated;grant execute on function public.website_content_delivery(uuid,boolean) to service_role;

create function public.reserve_content_media(p_collection uuid,p_id uuid,p_name text,p_type text,p_size bigint) returns text language plpgsql security definer set search_path='' as $$
declare c public.website_content_collections;project uuid;path text;extension text;limits record;usage record;
begin
 select * into c from public.website_content_collections where id=p_collection;
 if auth.uid() is null or c.id is null or not c.enabled or not vigil.content_access(c.website_id) or not(vigil.is_staff() or vigil.has_org_role(c.organization_id,array['owner','manager']::public.org_role[])) then raise exception 'Not authorized' using errcode='42501';end if;
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
revoke all on function public.reserve_content_media(uuid,uuid,text,text,bigint) from public,anon;grant execute on function public.reserve_content_media(uuid,uuid,text,text,bigint) to authenticated;

-- Blog keeps its UUIDs/addresses/editor. Saving a draft retains the preceding publication.
alter table public.website_blog_posts add column published_snapshot jsonb;
update public.website_blog_posts set published_snapshot=jsonb_build_object('slug',slug,'title',title,'excerpt',excerpt,'body',body,'media',media,'published_at',published_at,'updated_at',updated_at) where status='published';
create function vigil.blog_publication_snapshot() returns trigger language plpgsql security definer set search_path='' as $$begin
 if current_setting('vigil.blog_unpublish',true)='true' then new.published_snapshot=null;
 elsif new.status='published' then new.published_snapshot=jsonb_build_object('slug',new.slug,'title',new.title,'excerpt',new.excerpt,'body',new.body,'media',new.media,'published_at',new.published_at,'updated_at',new.updated_at);
 elsif tg_op='UPDATE' then new.published_snapshot=old.published_snapshot;
 end if;return new;
end$$;
revoke all on function vigil.blog_publication_snapshot() from public,anon,authenticated;
create trigger zz_blog_publication before insert or update on public.website_blog_posts for each row execute function vigil.blog_publication_snapshot();
create or replace function vigil.sync_blog_image_references() returns trigger language plpgsql security definer set search_path='' as $$begin
 delete from public.website_blog_image_refs where post_id=new.id;
 insert into public.website_blog_image_refs(post_id,image_id) select distinct new.id,(i->>'id')::uuid from jsonb_array_elements((new.media->'images')||coalesce(new.published_snapshot->'media'->'images','[]'::jsonb)) i;
 return new;
end$$;
drop trigger blog_post_image_refs on public.website_blog_posts;
create trigger blog_post_image_refs after insert or update of media,published_snapshot on public.website_blog_posts for each row execute function vigil.sync_blog_image_references();
create function public.unpublish_website_blog_post(p_website uuid,p_post uuid,p_expected timestamptz) returns uuid language plpgsql security definer set search_path='' as $$
declare org uuid;post public.website_blog_posts;
begin
 select organization_id into org from public.websites where id=p_website;
 if auth.uid() is null or org is null or not(vigil.is_staff() or vigil.has_org_role(org,array['owner','manager']::public.org_role[])) or not vigil.website_blog_enabled(p_website) then raise exception 'Not authorized' using errcode='42501';end if;
 select * into post from public.website_blog_posts where id=p_post and website_id=p_website and organization_id=org for update;
 if post.id is null then raise exception 'Post unavailable' using errcode='42501';end if;
 if p_expected is distinct from post.updated_at then raise exception 'Post changed' using errcode='40001';end if;
 perform set_config('vigil.blog_unpublish','true',true);
 update public.website_blog_posts set status='draft',published_snapshot=null where id=p_post;
 perform set_config('vigil.blog_unpublish','false',true);return p_post;
end$$;
revoke all on function public.unpublish_website_blog_post(uuid,uuid,timestamptz) from public,anon;grant execute on function public.unpublish_website_blog_post(uuid,uuid,timestamptz) to authenticated;

-- Atomic Lab + bound content save. Expected revisions prevent a stale Lab overwriting a Hub author.
create function public.save_content_design_workspace(p_project uuid,p_expected integer,p_site jsonb,p_collections jsonb,p_actor uuid,p_engine text) returns integer language plpgsql security definer set search_path='' as $$
declare workspace public.design_workspaces;change jsonb;c public.website_content_collections;
begin
 if auth.role() is distinct from 'service_role' or not exists(select 1 from public.staff_members where user_id=p_actor) then raise exception 'Staff service required' using errcode='42501';end if;
 select * into workspace from public.design_workspaces where project_id=p_project for update;
 if workspace.id is null or workspace.revision is distinct from p_expected then raise exception 'Workspace changed' using errcode='40001';end if;
 for change in select value from jsonb_array_elements(p_collections) loop
  select * into c from public.website_content_collections where id=(change->>'id')::uuid and website_id=workspace.website_id and organization_id=workspace.organization_id and adapter='professional' for update;
  if c.id is null or c.revision is distinct from (change->>'revision')::integer then raise exception 'Bound content changed' using errcode='40001';end if;
  perform vigil.validate_content_records(c.module,c.website_id,change->'records',false);
  update public.website_content_collections set draft=change->'records',revision=revision+1,updated_by=p_actor,updated_at=clock_timestamp() where id=c.id;
  insert into public.website_content_history(collection_id,website_id,organization_id,revision,intent,records,actor_id) values(c.id,c.website_id,c.organization_id,c.revision+1,'lab',change->'records',p_actor);
 end loop;
 update public.design_workspaces set site_definition=p_site,revision=revision+1,updated_by=p_actor,sync_error=null,engine_version=p_engine where id=workspace.id;
 return workspace.revision+1;
end$$;
revoke all on function public.save_content_design_workspace(uuid,integer,jsonb,jsonb,uuid,text) from public,anon,authenticated;grant execute on function public.save_content_design_workspace(uuid,integer,jsonb,jsonb,uuid,text) to service_role;

-- Immutable exported design snapshots. Content publication can update bound surfaces without promoting a Lab layout draft.
create table public.website_content_runtimes(
 id uuid primary key,website_id uuid not null references public.websites(id) on delete cascade,
 organization_id uuid not null references public.organizations(id) on delete cascade,
 site_definition jsonb not null,engine_version text not null,binding_keys text[] not null,
 created_at timestamptz not null default now(),created_by uuid references public.profiles(id)
);
create trigger content_runtime_org before insert or update on public.website_content_runtimes for each row execute function vigil.enforce_same_org_references();
alter table public.website_content_runtimes enable row level security;
revoke all on public.website_content_runtimes from public,anon,authenticated;grant all on public.website_content_runtimes to service_role;
create function public.website_blog_delivery(p_website uuid,p_review boolean default false) returns boolean language sql stable security definer set search_path='' as $$
 select public.website_content_delivery(p_website,p_review) and exists(select 1 from public.website_content_collections where website_id=p_website and module='blog' and enabled);
$$;
revoke all on function public.website_blog_delivery(uuid,boolean) from public,anon,authenticated;grant execute on function public.website_blog_delivery(uuid,boolean) to service_role;

-- Permanent address registry survives unpublish/Trash/Restore; removed entries never free an old URL for unrelated content.
create table public.website_content_addresses(
 collection_id uuid not null references public.website_content_collections(id) on delete cascade,record_id uuid not null,slug text not null,
 primary key(collection_id,record_id),unique(collection_id,slug)
);
alter table public.website_content_addresses enable row level security;
revoke all on public.website_content_addresses from public,anon,authenticated;grant all on public.website_content_addresses to service_role;
create function vigil.content_reference_guard() returns trigger language plpgsql security definer set search_path='' as $$
declare row jsonb;
begin
 for row in select value from jsonb_array_elements(new.draft||new.published) loop
  if exists(select 1 from public.website_content_addresses a where a.collection_id=new.id and a.record_id=(row->>'id')::uuid and a.slug is distinct from row->>'slug') then raise exception 'Keep the published address' using errcode='22023';end if;
 end loop;
 insert into public.website_content_addresses(collection_id,record_id,slug) select new.id,(r->>'id')::uuid,r->>'slug' from jsonb_array_elements(new.published) r on conflict(collection_id,record_id) do nothing;
 delete from public.website_content_media_refs where collection_id=new.id;
 insert into public.website_content_media_refs(collection_id,media_id)
 select distinct new.id,(m->>'id')::uuid from jsonb_array_elements(new.draft||new.published) r cross join lateral jsonb_array_elements(coalesce(r->'data'->'media','[]')) m where m ? 'id'
 union select distinct new.id,(m->>'posterId')::uuid from jsonb_array_elements(new.draft||new.published) r cross join lateral jsonb_array_elements(coalesce(r->'data'->'media','[]')) m where m ? 'posterId';
 return new;
end$$;
revoke all on function vigil.content_reference_guard() from public,anon,authenticated;
create trigger content_reference_guard after insert or update of draft,published on public.website_content_collections for each row execute function vigil.content_reference_guard();

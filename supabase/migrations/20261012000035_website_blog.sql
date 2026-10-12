-- Website journal authoring uses existing tenant identity. Drafts never have anonymous table access.
create function vigil.website_blog_enabled(p_website uuid) returns boolean language sql stable security definer set search_path='' as $$
 select coalesce((select p.kind in ('professional','custom') and o.archived_at is null and
  case when jsonb_typeof(w.metadata->'blog_requested')='boolean' then w.metadata->'blog_requested'='true'::jsonb
  else coalesce(p.brief->'strategy'->'pages' ? 'blog',false) or coalesce(p.brief->'strategy'->'features' ? 'blog',false) end
 from public.websites w join public.projects p on p.id=w.project_id join public.organizations o on o.id=w.organization_id where w.id=p_website),false);
$$;
revoke all on function vigil.website_blog_enabled(uuid) from public,anon,authenticated;
grant execute on function vigil.website_blog_enabled(uuid) to service_role;
create function public.website_blog_available(p_website uuid) returns boolean language plpgsql stable security definer set search_path='' as $$
declare org uuid;
begin
 select organization_id into org from public.websites where id=p_website;
 if org is null or (auth.role() is distinct from 'service_role' and not vigil.is_staff() and not vigil.is_org_member(org)) then raise exception 'Not authorized' using errcode='42501';end if;
 return vigil.website_blog_enabled(p_website);
end$$;
revoke all on function public.website_blog_available(uuid) from public,anon;
grant execute on function public.website_blog_available(uuid) to authenticated,service_role;
-- Existing completed briefs remain immutable. Staff may record a subsequently approved scope request.
create function public.set_website_blog_requested(p_website uuid,p_requested boolean) returns void language plpgsql security definer set search_path='' as $$begin
 if auth.uid() is null or not vigil.is_staff() then raise exception 'Staff access required' using errcode='42501';end if;
 if p_requested is null or not exists(select 1 from public.websites w join public.projects p on p.id=w.project_id where w.id=p_website and p.kind in ('professional','custom')) then raise exception 'Professional or Growth Site required' using errcode='22023';end if;
 update public.websites set metadata=metadata||jsonb_build_object('blog_requested',p_requested,'blog_scope_updated_by',auth.uid()) where id=p_website;
end$$;
revoke all on function public.set_website_blog_requested(uuid,boolean) from public,anon;
grant execute on function public.set_website_blog_requested(uuid,boolean) to authenticated;

create table public.website_blog_posts (
 id uuid primary key default gen_random_uuid(),
 website_id uuid not null references public.websites(id) on delete cascade,
 organization_id uuid not null references public.organizations(id) on delete cascade,
 slug text not null check(char_length(slug) between 1 and 120 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 title text not null check(char_length(trim(title)) between 1 and 160),
 excerpt text not null default '' check(char_length(excerpt)<=400),
 body text not null default '' check(char_length(body)<=60000),
 status text not null default 'draft' check(status in ('draft','published')),
 published_at timestamptz,
 created_by uuid references public.profiles(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(website_id,slug),
 check(status<>'published' or (published_at is not null and char_length(trim(body))>0))
);
create index website_blog_public on public.website_blog_posts(website_id,published_at desc,id) where status='published';
create trigger website_blog_identity before insert or update on public.website_blog_posts for each row execute function vigil.enforce_same_org_references();
create trigger website_blog_updated before update on public.website_blog_posts for each row execute function vigil.set_updated_at();
alter table public.website_blog_posts enable row level security;
revoke all on public.website_blog_posts from public,anon,authenticated;
grant select on public.website_blog_posts to authenticated;
grant all on public.website_blog_posts to service_role;
create policy website_blog_member_read on public.website_blog_posts for select to authenticated using(vigil.is_staff() or vigil.is_org_member(organization_id));

create function public.save_website_blog_post(p_website uuid,p_slug text,p_title text,p_excerpt text,p_body text,p_publish boolean,p_post uuid default null,p_expected timestamptz default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare org uuid; post public.website_blog_posts; result uuid;
begin
 select organization_id into org from public.websites where id=p_website;
 if auth.uid() is null or org is null or not(vigil.is_staff() or vigil.has_org_role(org,array['owner','manager']::public.org_role[])) then raise exception 'Not authorized' using errcode='42501';end if;
 if not vigil.website_blog_enabled(p_website) then raise exception 'Blog was not requested for this website' using errcode='42501';end if;
 if p_publish is null or p_slug is null or p_title is null or p_body is null or p_excerpt is null then raise exception 'Invalid post' using errcode='22023';end if;
 if p_post is not null then
  select * into post from public.website_blog_posts where id=p_post and website_id=p_website and organization_id=org for update;
  if post.id is null then raise exception 'Post unavailable' using errcode='42501';end if;
  if p_expected is null or p_expected is distinct from post.updated_at then raise exception 'Post changed; reload before saving' using errcode='40001';end if;
  if post.published_at is not null and p_slug is distinct from post.slug then raise exception 'Published post address cannot change' using errcode='22023';end if;
  update public.website_blog_posts set slug=p_slug,title=trim(p_title),excerpt=trim(p_excerpt),body=p_body,status=case when p_publish then 'published' else 'draft' end,
   published_at=case when p_publish then coalesce(post.published_at,now()) else post.published_at end where id=p_post returning id into result;
 else
  insert into public.website_blog_posts(website_id,organization_id,slug,title,excerpt,body,status,published_at,created_by)
  values(p_website,org,p_slug,trim(p_title),trim(p_excerpt),p_body,case when p_publish then 'published' else 'draft' end,case when p_publish then now() else null end,auth.uid()) returning id into result;
 end if;
 return result;
end$$;
revoke all on function public.save_website_blog_post(uuid,text,text,text,text,boolean,uuid,timestamptz) from public,anon;
grant execute on function public.save_website_blog_post(uuid,text,text,text,text,boolean,uuid,timestamptz) to authenticated;

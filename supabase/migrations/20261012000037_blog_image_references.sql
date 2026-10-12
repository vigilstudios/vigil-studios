-- Keep file-library deletion from breaking an image still attached to any Blog draft/post.
create table public.website_blog_image_refs(
 post_id uuid not null references public.website_blog_posts(id) on delete cascade,
 image_id uuid not null references public.website_blog_images(id) on delete restrict,
 primary key(post_id,image_id)
);
alter table public.website_blog_image_refs enable row level security;
revoke all on public.website_blog_image_refs from public,anon,authenticated;
grant all on public.website_blog_image_refs to service_role;
insert into public.website_blog_image_refs(post_id,image_id)
select p.id,(i->>'id')::uuid from public.website_blog_posts p cross join lateral jsonb_array_elements(p.media->'images') i;
create function vigil.sync_blog_image_references() returns trigger language plpgsql security definer set search_path='' as $$begin
 delete from public.website_blog_image_refs where post_id=new.id;
 insert into public.website_blog_image_refs(post_id,image_id) select new.id,(i->>'id')::uuid from jsonb_array_elements(new.media->'images') i;
 return new;
end$$;
revoke all on function vigil.sync_blog_image_references() from public,anon,authenticated;
create trigger blog_post_image_refs after insert or update of media on public.website_blog_posts for each row execute function vigil.sync_blog_image_references();

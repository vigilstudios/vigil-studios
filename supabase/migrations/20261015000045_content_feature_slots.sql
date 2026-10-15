-- Optional ordered positions preserve legacy checkbox selections and full collection order.
-- Capacity belongs to the delivered binding's staff-controlled configuration.
create or replace function vigil.validate_content_records(p_module text,p_website uuid,p_rows jsonb,p_publish boolean) returns void language plpgsql set search_path='' as $$
declare row jsonb;d jsonb;m jsonb;allowed text[];name text;v jsonb;
begin
 if jsonb_typeof(p_rows) is distinct from 'array' or jsonb_array_length(p_rows)>500 then raise exception 'Invalid collection' using errcode='22023';end if;
 allowed=case p_module when 'portfolio' then array['title','description','category','media','context','brand','tags','link'] when 'gallery' then array['title','description','category','media','collection'] when 'testimonials' then array['title','quote','attribution','role','company','placeholder','media'] when 'products' then array['title','description','category','media','priceLabel','link','providerRef'] when 'services' then array['title','description','category','media','link'] when 'faq' then array['title','answer'] end;
 if allowed is null then raise exception 'Unsupported module' using errcode='22023';end if;
 if (select count(*)<>count(distinct r->>'id') or count(*)<>count(distinct r->>'slug') from jsonb_array_elements(p_rows) r) then raise exception 'Duplicate entries' using errcode='22023';end if;
 for row in select value from jsonb_array_elements(p_rows) loop
  if jsonb_typeof(row) is distinct from 'object' or row-array['id','slug','data','deleted','featured','featuredOrder']<>'{}'::jsonb or (row->>'id')::uuid is null or row->>'slug' !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(row->>'slug')>120 or jsonb_typeof(row->'deleted') is distinct from 'boolean' or jsonb_typeof(row->'featured') is distinct from 'boolean' then raise exception 'Invalid entry' using errcode='22023';end if;
  if row ? 'featuredOrder' and (jsonb_typeof(row->'featuredOrder') is distinct from 'number' or row->>'featuredOrder' !~ '^[1-9][0-9]{0,2}$' or (row->>'featuredOrder')::numeric>500 or row->'featured'<>'true'::jsonb) then raise exception 'Invalid featured position' using errcode='22023';end if;
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

create function vigil.enforce_content_feature_slots() returns trigger language plpgsql set search_path='' as $$
declare budget integer;rows jsonb;selected_count integer;media_kind text;require_full boolean;is_public boolean;
begin
 if coalesce(new.config->>'featuredSlotBudget','0') !~ '^[0-9]{1,3}$' then raise exception 'Invalid featured capacity' using errcode='22023';end if;
 budget=coalesce((new.config->>'featuredSlotBudget')::integer,0);
 if budget>500 then raise exception 'Invalid featured capacity' using errcode='22023';end if;
 media_kind=coalesce(new.config->>'featuredMediaType',case when new.adapter='standalone' and new.module='portfolio' and budget>0 then 'video' end);
 require_full=coalesce((new.config->>'featuredRequireFull')::boolean,new.adapter='standalone' and new.module='portfolio' and budget>0);
 foreach is_public in array array[false,true] loop
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
  if is_public and require_full and jsonb_array_length(rows)>0 and selected_count<>budget then raise exception 'Fill every featured position before publishing' using errcode='22023';end if;
 end loop;
 return new;
end$$;
revoke all on function vigil.enforce_content_feature_slots() from public,anon,authenticated;
create trigger content_feature_slots before insert or update of draft,published,config on public.website_content_collections for each row execute function vigil.enforce_content_feature_slots();

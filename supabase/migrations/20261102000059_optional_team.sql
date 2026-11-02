-- Optional employee profiles use Content Hub records and the existing private Files library.
alter table public.website_content_collections drop constraint website_content_collections_module_check;
alter table public.website_content_collections add constraint website_content_collections_module_check check(module in ('blog','portfolio','gallery','testimonials','products','services','faq','team'));

do $$declare source text;guard text;fn regprocedure;begin
 source:=pg_get_functiondef('vigil.validate_content_records(text,uuid,jsonb,boolean)'::regprocedure);
 guard:='when ''faq'' then array[''title'',''answer''] end';
 if position(guard in source)=0 then raise exception 'Expected content payload module guard missing';end if;
 source:=replace(source,guard,'when ''faq'' then array[''title'',''answer''] when ''team'' then array[''title'',''role'',''description'',''media''] end');
 guard:='if d ? ''media'' then';
 if position(guard in source)=0 then raise exception 'Expected media validation guard missing';end if;
 source:=replace(source,guard,'if p_module=''team'' and (length(coalesce(d->>''role'',''''))>160 or length(coalesce(d->>''description'',''''))>2000 or jsonb_array_length(coalesce(d->''media'',''[]''))>1 or exists(select 1 from jsonb_array_elements(coalesce(d->''media'',''[]'')) as team_media(value) where team_media.value->>''type''<>''image'')) then raise exception ''Use one portrait image and a short team biography'' using errcode=''22023'';end if; if d ? ''media'' then');
 execute source;
 -- Extend the explicitly approved Express catalogue scope to optional employees.
 foreach fn in array array['public.save_website_content(uuid,integer,jsonb,text,uuid)'::regprocedure,'public.reserve_content_media(uuid,uuid,text,text,bigint)'::regprocedure,'public.attach_content_library_media(uuid,uuid)'::regprocedure] loop
  source:=pg_get_functiondef(fn);
  if position('c.module not in (''products'',''services'')' in source)=0 then raise exception 'Expected Express scope guard missing';end if;
  source:=replace(source,'c.module not in (''products'',''services'')','c.module not in (''products'',''services'',''team'')');
  source:=replace(source,'c.module not in (''portfolio'',''gallery'',''testimonials'',''products'',''services'')','c.module not in (''portfolio'',''gallery'',''testimonials'',''products'',''services'',''team'')');
  if fn='public.reserve_content_media(uuid,uuid,text,text,bigint)'::regprocedure then
   source:=replace(source,'select * into c from public.website_content_collections where id=p_collection;','select * into c from public.website_content_collections where id=p_collection; if c.module=''team'' and p_type not like ''image/%'' then raise exception ''Team portraits must be images'' using errcode=''22023'';end if;');
  end if;
  if fn='public.attach_content_library_media(uuid,uuid)'::regprocedure then
   source:=replace(source,'if a.id is null or','if c.module=''team'' and a.content_type not like ''image/%'' then raise exception ''Team portraits must be images'' using errcode=''22023'';end if; if a.id is null or');
  end if;
  execute source;
 end loop;
end$$;

drop policy content_collection_read on public.website_content_collections;
create policy content_collection_read on public.website_content_collections for select to authenticated using(
 vigil.content_viewable(website_id) and (module in ('products','services','team') or not exists(select 1 from public.websites w join public.projects p on p.id=w.project_id where w.id=website_id and p.kind='express'))
);

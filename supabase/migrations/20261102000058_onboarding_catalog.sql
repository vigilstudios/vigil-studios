-- Express Care+ may maintain its configured service/product/menu catalogue.
-- Keep plan attribution, paid hosting, live-only customer authoring and tenant RLS.
do $$declare source text;fn regprocedure;begin
 foreach fn in array array['vigil.content_eligible(uuid)'::regprocedure,'vigil.content_authoring_access(uuid,uuid)'::regprocedure,'public.website_content_delivery(uuid,boolean)'::regprocedure] loop
  source:=pg_get_functiondef(fn);
  if position('p.kind in (''professional'',''custom'')' in source)=0 then raise exception 'Expected website eligibility guard missing';end if;
  execute replace(source,'p.kind in (''professional'',''custom'')','p.kind in (''professional'',''custom'',''express'')');
 end loop;
end$$;

-- Services retain editable prices, just as products/menu items already do.
do $$declare source text;begin
 source:=pg_get_functiondef('vigil.validate_content_records(text,uuid,jsonb,boolean)'::regprocedure);
 if position('when ''services'' then array[''title'',''description'',''category'',''media'',''link'']' in source)=0 then raise exception 'Expected service payload guard missing';end if;
 execute replace(source,'when ''services'' then array[''title'',''description'',''category'',''media'',''link'']','when ''services'' then array[''title'',''description'',''category'',''media'',''priceLabel'',''link'']');
end$$;

-- Express scope is a catalogue, not a grant of Blog/Portfolio or arbitrary modules.
-- Pending intake collections can save drafts but cannot claim live publication.
do $$declare source text;guard text;fn regprocedure;begin
 guard:='not c.enabled or';
 foreach fn in array array['public.save_website_content(uuid,integer,jsonb,text,uuid)'::regprocedure,'public.reserve_content_media(uuid,uuid,text,text,bigint)'::regprocedure,'public.attach_content_library_media(uuid,uuid)'::regprocedure] loop
  source:=pg_get_functiondef(fn);
  if position(guard in source)=0 then raise exception 'Expected collection access guard missing';end if;
  execute replace(source,guard,'not c.enabled or (c.module not in (''products'',''services'') and exists(select 1 from public.websites w join public.projects p on p.id=w.project_id where w.id=c.website_id and p.kind=''express'')) or');
 end loop;
 source:=pg_get_functiondef('public.save_website_content(uuid,integer,jsonb,text,uuid)'::regprocedure);
 guard:='if c.revision is distinct from p_expected';
 if position(guard in source)=0 then raise exception 'Expected collection revision guard missing';end if;
 execute replace(source,guard,'if p_intent=''publish'' and c.config->>''deliveryPending''=''true'' then raise exception ''Connect this catalogue to the delivered website before publishing'' using errcode=''22023'';end if; if c.revision is distinct from p_expected');
end$$;

drop policy content_collection_read on public.website_content_collections;
create policy content_collection_read on public.website_content_collections for select to authenticated using(
 vigil.content_viewable(website_id) and (module in ('products','services') or not exists(
  select 1 from public.websites w join public.projects p on p.id=w.project_id where w.id=website_id and p.kind='express'
 ))
);

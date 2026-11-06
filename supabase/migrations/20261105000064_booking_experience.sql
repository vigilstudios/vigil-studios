-- Presentation preferences only; activation, entitlement and availability rules stay authoritative.
alter table public.booking_settings add column experience jsonb not null default '{"presentation":"inline","datePicker":"calendar","showResource":false,"resourceLabel":"Person or space","title":"Choose a time","introduction":"Find an appointment that works for you.","buttonLabel":"Book an appointment","accent":"royal"}'::jsonb;
create function vigil.booking_experience_valid(v jsonb) returns boolean language sql immutable set search_path='' as $$
 select coalesce(jsonb_typeof(v)='object' and (select count(*) from jsonb_object_keys(v))=8
 and v ?& array['presentation','datePicker','showResource','resourceLabel','title','introduction','buttonLabel','accent']
 and v->>'presentation' in ('inline','popup') and v->>'datePicker' in ('calendar','date')
 and v->>'accent' in ('royal','graphite','plum') and jsonb_typeof(v->'showResource')='boolean'
 and jsonb_typeof(v->'resourceLabel')='string' and length(btrim(v->>'resourceLabel')) between 1 and 30
 and jsonb_typeof(v->'title')='string' and length(btrim(v->>'title')) between 1 and 80
 and jsonb_typeof(v->'introduction')='string' and length(v->>'introduction')<=160
 and jsonb_typeof(v->'buttonLabel')='string' and length(btrim(v->>'buttonLabel')) between 1 and 40,false)
$$;
alter table public.booking_settings add constraint booking_experience_valid check(vigil.booking_experience_valid(experience));
create function public.save_booking_experience(p_website uuid,p_experience jsonb) returns void language plpgsql security definer set search_path='' as $$
declare org uuid;begin
 org:=vigil.booking_manage(p_website);
 if not vigil.booking_entitled(p_website) then raise exception 'Booking plan required' using errcode='42501';end if;
 if not vigil.booking_experience_valid(p_experience) then raise exception 'Invalid booking experience' using errcode='22023';end if;
 insert into public.booking_settings(website_id,organization_id) values(p_website,org) on conflict do nothing;
 update public.booking_settings set experience=p_experience,updated_at=now() where website_id=p_website and organization_id=org;
 perform vigil.booking_audit('booking.experience_updated','website',p_website,org,p_after=>p_experience);
end$$;
create or replace function public.booking_public_config(p_website uuid,p_origin text) returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.booking_settings;begin
 s:=vigil.booking_public_site(p_website,p_origin);
 return jsonb_build_object('websiteId',p_website,'businessName',(select name from public.websites where id=p_website),'timeZone',s.time_zone,'experience',s.experience,'minDate',to_char(now() at time zone s.time_zone,'YYYY-MM-DD'),'maxDate',to_char((now() at time zone s.time_zone)::date+s.horizon_days,'YYYY-MM-DD'),'services',coalesce((select jsonb_agg(jsonb_build_object('id',b.id,'name',b.name,'description',b.description,'duration',b.duration,'mode',b.mode,'resourceId',r.id,'resourceName',case when (s.experience->>'showResource')::boolean then r.name else null end) order by b.name,b.id) from public.booking_services b join public.booking_resources r on r.id=b.resource_id where b.website_id=p_website and b.active and r.active),'[]'::jsonb));
end$$;
revoke all on function vigil.booking_experience_valid(jsonb) from public,anon,authenticated;
grant execute on function vigil.booking_experience_valid(jsonb) to authenticated,service_role;
revoke all on function public.save_booking_experience(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.save_booking_experience(uuid,jsonb) to authenticated;

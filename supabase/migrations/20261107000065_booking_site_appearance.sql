-- Inherit the authored site palette, with validated owner-selected color overrides.
create or replace function vigil.booking_experience_valid(v jsonb) returns boolean language sql immutable set search_path='' as $$
 select coalesce(jsonb_typeof(v)='object' and (select count(*) from jsonb_object_keys(v))=8
 and v ?& array['presentation','datePicker','showResource','resourceLabel','title','introduction','buttonLabel','accent']
 and v->>'presentation' in ('inline','popup') and v->>'datePicker' in ('calendar','date')
 and (v->>'accent' in ('site','royal','graphite','plum') or v->>'accent' ~ '^#[0-9a-fA-F]{6}$') and jsonb_typeof(v->'showResource')='boolean'
 and jsonb_typeof(v->'resourceLabel')='string' and length(btrim(v->>'resourceLabel')) between 1 and 30
 and jsonb_typeof(v->'title')='string' and length(btrim(v->>'title')) between 1 and 80
 and jsonb_typeof(v->'introduction')='string' and length(v->>'introduction')<=160
 and jsonb_typeof(v->'buttonLabel')='string' and length(btrim(v->>'buttonLabel')) between 1 and 40,false)
$$;
alter table public.booking_settings alter column experience set default '{"presentation":"inline","datePicker":"calendar","showResource":false,"resourceLabel":"Person or space","title":"Choose a time","introduction":"Find an appointment that works for you.","buttonLabel":"Book an appointment","accent":"site"}'::jsonb;
-- Replace only the unreleased, untouched presentation default; preserve customized preferences.
update public.booking_settings set experience=jsonb_set(experience,'{accent}','"site"'),updated_at=now() where experience='{"presentation":"inline","datePicker":"calendar","showResource":false,"resourceLabel":"Person or space","title":"Choose a time","introduction":"Find an appointment that works for you.","buttonLabel":"Book an appointment","accent":"royal"}'::jsonb;

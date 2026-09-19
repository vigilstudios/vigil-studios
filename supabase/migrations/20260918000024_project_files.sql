-- 0024 Project files: the customer's media library after onboarding.
--
-- Customers keep adding photos, videos and documents to their project long
-- after the brief is sent, without touching change requests. How much they
-- may keep is an entitlement (rows, overridable per organization from the
-- admin customer page), enforced here so the limits hold whatever client
-- writes the row.

alter type public.project_asset_kind add value if not exists 'video';

insert into public.features (code, name, description, value_kind, default_value) values
  ('files.max_count',     'Project files',          'How many files a customer may keep in their project library. NULL = unlimited.', 'limit',   '60'),
  ('files.max_file_mb',   'Largest single file',    'Ceiling for one file in the project library, in MB. NULL = bucket limit only.',   'limit',   '500'),
  ('files.max_total_mb',  'Project library size',   'Total size of a customer''s project files, in MB. NULL = unlimited.',            'limit',   '10240'),
  ('files.video_enabled', 'Video uploads',          'Customers may add video files to their project library.',                        'boolean', 'true')
on conflict (code) do nothing;

-- Videos are welcome and files can be large; the per-organization ceiling
-- lives in the entitlements above, this is the bucket's hard stop.
update storage.buckets
   set file_size_limit = 524288000,
       allowed_mime_types = array[
         'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml', 'image/heic', 'image/heif',
         'application/pdf',
         'video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'
       ]
 where id = 'project-assets';

alter table public.project_assets drop constraint project_assets_size;
alter table public.project_assets add constraint project_assets_size check (size_bytes >= 0);

create or replace function vigil.enforce_project_file_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count     integer;
  v_bytes     bigint;
  v_max_count numeric;
  v_max_file  numeric;
  v_max_total numeric;
  v_video     boolean;
begin
  if (select auth.uid()) is null or vigil.is_staff() then
    return new;
  end if;

  select
    max(case when feature_code = 'files.max_count'   and jsonb_typeof(value) = 'number' then (value #>> '{}')::numeric end),
    max(case when feature_code = 'files.max_file_mb' and jsonb_typeof(value) = 'number' then (value #>> '{}')::numeric end),
    max(case when feature_code = 'files.max_total_mb' and jsonb_typeof(value) = 'number' then (value #>> '{}')::numeric end),
    bool_or(feature_code = 'files.video_enabled' and value = 'true'::jsonb)
  into v_max_count, v_max_file, v_max_total, v_video
  from vigil.resolve_entitlements(new.organization_id);

  select count(*), coalesce(sum(size_bytes), 0)
    into v_count, v_bytes
    from public.project_assets
   where organization_id = new.organization_id;

  if v_max_count is not null and v_count >= v_max_count then
    raise exception 'Your project library is full (% files). Remove something or ask Vigil for more room.', v_max_count::integer using errcode = '23514';
  end if;
  if v_max_file is not null and new.size_bytes > v_max_file * 1048576 then
    raise exception 'That file is larger than % MB.', v_max_file::integer using errcode = '23514';
  end if;
  if v_max_total is not null and v_bytes + new.size_bytes > v_max_total * 1048576 then
    raise exception 'Your project library is out of space (% MB).', v_max_total::integer using errcode = '23514';
  end if;
  if new.content_type like 'video/%' and not coalesce(v_video, false) then
    raise exception 'Video uploads are not enabled for this account.' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger project_assets_enforce_quota
  before insert on public.project_assets
  for each row execute function vigil.enforce_project_file_quota();

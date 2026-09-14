-- 0009 Onboarding uploads: members may edit the caption (and kind) of files
-- in their organization; every other column stays as uploaded.

create policy project_assets_update on public.project_assets for update to authenticated
  using (vigil.is_staff() or vigil.is_org_member(organization_id))
  with check (vigil.is_staff() or vigil.is_org_member(organization_id));

create trigger project_assets_protect_columns
  before update on public.project_assets
  for each row execute function vigil.protect_columns_from_customers(
    'id', 'organization_id', 'project_id', 'bucket_id', 'object_path', 'file_name',
    'content_type', 'size_bytes', 'uploaded_by', 'created_at'
  );

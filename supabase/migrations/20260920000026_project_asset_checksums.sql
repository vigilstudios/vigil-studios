-- 0026 Upload-time checksums for project files.
--
-- The browser hashes each file (SHA-256, streamed) before recording it, so
-- every asset carries a fingerprint from the moment it exists: the creative
-- workspace manifest can list it for files that stay in storage, and verify
-- it for files it copies into Git. Nullable for rows that predate this.

alter table public.project_assets
  add column checksum text,
  add constraint project_assets_checksum_format check (checksum is null or checksum ~ '^[0-9a-f]{64}$');

-- The fingerprint is set once with the upload; customers keep editing only
-- the caption (and kind), as before.
drop trigger project_assets_protect_columns on public.project_assets;
create trigger project_assets_protect_columns
  before update on public.project_assets
  for each row execute function vigil.protect_columns_from_customers(
    'id', 'organization_id', 'project_id', 'bucket_id', 'object_path', 'file_name',
    'content_type', 'size_bytes', 'checksum', 'uploaded_by', 'created_at'
  );

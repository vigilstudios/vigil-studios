"use client";

import * as tus from "tus-js-client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { RESUMABLE_THRESHOLD_BYTES } from "@/lib/vigil/files";

/**
 * Browser-direct upload to a private bucket. Small files use the plain
 * upload; anything larger goes through Supabase's resumable (TUS) endpoint in
 * 6 MB chunks, so a phone video survives a dropped connection and never
 * passes through Vercel's request body limit. Both paths run under the
 * signed-in user's storage policies.
 */
export async function uploadToBucket(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
  file: File,
  onProgress?: (fraction: number) => void,
): Promise<void> {
  if (file.size <= RESUMABLE_THRESHOLD_BYTES) {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw new Error(error.message);
    onProgress?.(1);
    return;
  }
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Your session has expired. Sign in again to upload.");
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) throw new Error("Uploads are not configured.");
  await new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: `${base}/storage/v1/upload/resumable`,
      retryDelays: [0, 1000, 3000, 5000, 10000],
      headers: { authorization: `Bearer ${token}`, "x-upsert": "false" },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: { bucketName: bucket, objectName: path, contentType: file.type, cacheControl: "3600" },
      // Supabase requires exactly 6 MB chunks.
      chunkSize: 6 * 1024 * 1024,
      onError: (error) => reject(error instanceof Error ? error : new Error(String(error))),
      onProgress: (sent, total) => onProgress?.(total > 0 ? sent / total : 0),
      onSuccess: () => resolve(),
    });
    upload.start();
  });
}

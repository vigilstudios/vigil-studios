"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, X } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { attachUploadedFiles, createChangeRequest } from "@/lib/vigil/actions/requests";
import { ACCEPT_ATTRIBUTE, ATTACHMENTS_BUCKET, MAX_ATTACHMENTS_PER_REQUEST, attachmentPath, formatBytes, validateAttachments } from "@/lib/vigil/attachments";
import { FormError, FormSuccess, inputClass, labelClass } from "@/components/vigil/ui";

type Phase = "idle" | "creating" | "uploading" | "recording";

/**
 * Three steps so large files never pass through the server: create the
 * request, upload each file from the browser straight to Storage (RLS only
 * allows this organization's folder), then record the rows.
 */
export function NewRequestForm({ websites, organizationId }: { websites: { id: string; name: string }[]; organizationId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<Record<string, string[]>>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const formRef = useRef<HTMLFormElement | null>(null);
  const problems = validateAttachments(files);
  const busy = pending || phase !== "idle";

  const submit = (fd: FormData) => {
    setError(null);
    setIssues({});
    setSuccess(null);
    startTransition(async () => {
      setPhase("creating");
      const created = await createChangeRequest(null, fd);
      if (!created?.ok) {
        setError(created?.error ?? "Something went wrong.");
        setIssues(created && !created.ok ? created.issues ?? {} : {});
        setPhase("idle");
        return;
      }

      let attached = 0;
      const failed: string[] = [];
      if (files.length > 0) {
        setPhase("uploading");
        setProgress({ done: 0, total: files.length });
        const supabase = createClient();
        const uploaded: { path: string; name: string; type: string; size: number }[] = [];
        for (const file of files) {
          const path = attachmentPath(organizationId, created.data.id, file.type, crypto.randomUUID());
          const { error: uploadError } = await supabase.storage.from(ATTACHMENTS_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
          if (uploadError) failed.push(file.name);
          else uploaded.push({ path, name: file.name, type: file.type, size: file.size });
          setProgress((p) => ({ ...p, done: p.done + 1 }));
        }
        if (uploaded.length > 0) {
          setPhase("recording");
          const recorded = await attachUploadedFiles(created.data.id, uploaded);
          if (recorded.ok) {
            attached = recorded.data.attached;
            failed.push(...recorded.data.failed);
          } else {
            failed.push(...uploaded.map((u) => u.name));
          }
        }
      }

      setSuccess(
        failed.length > 0
          ? `Request submitted. ${attached} file${attached === 1 ? "" : "s"} attached; these did not upload: ${failed.join(", ")}.`
          : attached > 0
            ? `Request submitted with ${attached} attachment${attached === 1 ? "" : "s"}. Vigil will follow up by email.`
            : "Request submitted. Vigil will follow up by email."
      );
      formRef.current?.reset();
      setFiles([]);
      setPhase("idle");
      router.refresh();
    });
  };

  return (
    <form ref={formRef} action={submit} className="mt-3 space-y-4" noValidate>
      <div>
        <label htmlFor="title" className={labelClass}>
          What should change?
        </label>
        <input id="title" name="title" className={inputClass} placeholder="Update our opening hours" maxLength={200} required disabled={busy} />
        {issues.title ? <p className="mt-1 text-xs text-[#ef4444]">{issues.title[0]}</p> : null}
      </div>
      <div>
        <label htmlFor="description" className={labelClass}>
          Details
        </label>
        <textarea id="description" name="description" rows={4} className={inputClass} placeholder="New hours are Mon–Fri 8–6, Sat 9–2. Closed Sunday." disabled={busy} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {websites.length > 1 ? (
          <div>
            <label htmlFor="website_id" className={labelClass}>
              Website
            </label>
            <select id="website_id" name="website_id" className={inputClass} disabled={busy}>
              {websites.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        ) : websites[0] ? (
          <input type="hidden" name="website_id" value={websites[0].id} />
        ) : null}
        <div>
          <label htmlFor="priority" className={labelClass}>
            Priority
          </label>
          <select id="priority" name="priority" className={inputClass} defaultValue="normal" disabled={busy}>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <div>
        <span className={labelClass}>Attachments</span>
        <label
          htmlFor="attachments"
          className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-[color:var(--border)] px-3 py-2.5 text-xs text-[color:var(--text-secondary)] hover:border-[color:var(--accent)] hover:text-[color:var(--text-primary)]"
        >
          <Paperclip className="h-4 w-4" />
          <span>
            Add images or PDFs <span className="opacity-70">· up to {MAX_ATTACHMENTS_PER_REQUEST} files, 10 MB each</span>
          </span>
        </label>
        {/* Not part of the posted form data: files go straight to Storage after the request exists. */}
        <input
          id="attachments"
          type="file"
          multiple
          accept={ACCEPT_ATTRIBUTE}
          className="sr-only"
          disabled={busy}
          onChange={(e) => {
            setFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])].slice(0, MAX_ATTACHMENTS_PER_REQUEST + 1));
            e.target.value = "";
          }}
        />
        {files.length > 0 ? (
          <ul className="mt-2 divide-y divide-[color:var(--border)] rounded-md border border-[color:var(--border)]">
            {files.map((f, i) => {
              const problem = problems.find((p) => p.name === f.name);
              return (
                <li key={`${f.name}-${i}`} className="flex items-center gap-3 px-3 py-1.5 text-xs">
                  {f.type.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
                    <img src={URL.createObjectURL(f)} alt="" className="h-8 w-8 rounded object-cover" />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded bg-[color:var(--bg-surface-soft)] text-[10px] font-semibold">PDF</span>
                  )}
                  <span className="min-w-0 flex-1 truncate">{f.name}</span>
                  <span className="shrink-0 text-[color:var(--text-secondary)]">{formatBytes(f.size)}</span>
                  {problem ? <span className="shrink-0 text-[#ef4444]">{problem.reason}</span> : null}
                  <button type="button" aria-label={`Remove ${f.name}`} disabled={busy} onClick={() => setFiles(files.filter((_, j) => j !== i))} className="shrink-0 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
        {problems.find((p) => p.name === "*") ? <p className="mt-1 text-xs text-[#ef4444]">{problems.find((p) => p.name === "*")!.reason}</p> : null}
      </div>

      <FormError message={error} />
      <FormSuccess message={success} />
      <button type="submit" className="btn-primary text-sm" disabled={busy || problems.length > 0}>
        {phase === "creating" ? "Submitting…" : phase === "uploading" ? `Uploading ${progress.done + 1} of ${progress.total}…` : phase === "recording" ? "Finishing…" : "Submit request"}
      </button>
    </form>
  );
}

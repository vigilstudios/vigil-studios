"use client";

import { useActionState, useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";
import { createChangeRequest, type RequestState } from "@/lib/vigil/actions/requests";
import { ACCEPT_ATTRIBUTE, MAX_ATTACHMENTS_PER_REQUEST, formatBytes, validateAttachments } from "@/lib/vigil/attachments";
import { FormError, FormSuccess, inputClass, labelClass } from "@/components/vigil/ui";

export function NewRequestForm({ websites }: { websites: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<RequestState, FormData>(createChangeRequest, null);
  const issues = state && !state.ok ? state.issues ?? {} : {};
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const problems = validateAttachments(files);

  const setFileList = (list: File[]) => {
    setFiles(list);
    // Keep the real input in step so the server action receives exactly this list.
    if (inputRef.current) {
      const dt = new DataTransfer();
      list.forEach((f) => dt.items.add(f));
      inputRef.current.files = dt.files;
    }
  };

  const successMessage = state?.ok
    ? state.data.failed.length > 0
      ? `Request submitted. ${state.data.attached} file${state.data.attached === 1 ? "" : "s"} attached; these did not upload: ${state.data.failed.join(", ")}.`
      : state.data.attached > 0
        ? `Request submitted with ${state.data.attached} attachment${state.data.attached === 1 ? "" : "s"}. Vigil will follow up by email.`
        : "Request submitted. Vigil will follow up by email."
    : null;

  return (
    <form
      action={(fd) => {
        setFiles([]);
        return action(fd);
      }}
      className="mt-3 space-y-4"
      noValidate
    >
      <div>
        <label htmlFor="title" className={labelClass}>
          What should change?
        </label>
        <input id="title" name="title" className={inputClass} placeholder="Update our opening hours" maxLength={200} required disabled={pending} />
        {issues.title ? <p className="mt-1 text-xs text-[#ef4444]">{issues.title[0]}</p> : null}
      </div>
      <div>
        <label htmlFor="description" className={labelClass}>
          Details
        </label>
        <textarea id="description" name="description" rows={4} className={inputClass} placeholder="New hours are Mon–Fri 8–6, Sat 9–2. Closed Sunday." disabled={pending} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {websites.length > 1 ? (
          <div>
            <label htmlFor="website_id" className={labelClass}>
              Website
            </label>
            <select id="website_id" name="website_id" className={inputClass} disabled={pending}>
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
          <select id="priority" name="priority" className={inputClass} defaultValue="normal" disabled={pending}>
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
        <input
          ref={inputRef}
          id="attachments"
          name="attachments"
          type="file"
          multiple
          accept={ACCEPT_ATTRIBUTE}
          className="sr-only"
          disabled={pending}
          onChange={(e) => setFileList([...files, ...Array.from(e.target.files ?? [])].slice(0, MAX_ATTACHMENTS_PER_REQUEST + 1))}
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
                  <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setFileList(files.filter((_, j) => j !== i))} className="shrink-0 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
        {problems.find((p) => p.name === "*") ? <p className="mt-1 text-xs text-[#ef4444]">{problems.find((p) => p.name === "*")!.reason}</p> : null}
        {issues.attachments ? <p className="mt-1 text-xs text-[#ef4444]">{issues.attachments[0]}</p> : null}
      </div>

      <FormError message={state && !state.ok ? state.error : null} />
      <FormSuccess message={successMessage} />
      <button type="submit" className="btn-primary text-sm" disabled={pending || problems.length > 0}>
        {pending ? "Submitting…" : "Submit request"}
      </button>
    </form>
  );
}

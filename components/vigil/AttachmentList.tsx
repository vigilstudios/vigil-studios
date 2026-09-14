import { FileText, Paperclip } from "lucide-react";
import { formatBytes } from "@/lib/vigil/attachments";
import type { SignedAttachment } from "@/lib/vigil/queries/dashboard";

/** Attachment chips with signed links; images get a thumbnail. */
export function AttachmentList({ items, compact = false }: { items: SignedAttachment[]; compact?: boolean }) {
  if (items.length === 0) return null;
  return (
    <ul className={compact ? "flex flex-wrap gap-1.5" : "flex flex-wrap gap-2"}>
      {items.map((a) => {
        const isImage = a.content_type.startsWith("image/");
        const body = (
          <>
            {isImage && a.url ? (
              // eslint-disable-next-line @next/next/no-img-element -- signed, expiring storage URL
              <img src={a.url} alt="" className={compact ? "h-6 w-6 rounded object-cover" : "h-9 w-9 rounded object-cover"} />
            ) : (
              <span className={`flex items-center justify-center rounded bg-[color:var(--bg-surface-soft)] ${compact ? "h-6 w-6" : "h-9 w-9"}`}>
                {isImage ? <Paperclip className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
              </span>
            )}
            <span className="min-w-0">
              <span className="block max-w-[10rem] truncate">{a.file_name}</span>
              {!compact ? <span className="block text-[10px] text-[color:var(--text-secondary)]">{formatBytes(a.size_bytes)}</span> : null}
            </span>
          </>
        );
        const cls = "inline-flex items-center gap-2 rounded-md border border-[color:var(--border)] px-2 py-1 text-xs hover:border-[color:var(--accent)]";
        return (
          <li key={a.id}>
            {a.url ? (
              <a href={a.url} target="_blank" rel="noreferrer" className={cls} title={a.file_name}>
                {body}
              </a>
            ) : (
              <span className={cls}>{body}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

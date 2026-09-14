"use client";

import { useState } from "react";
import { Download } from "lucide-react";

/** Fetches the export so a failure can be explained instead of landing on a JSON page. */
export function DownloadSiteButton({ websiteId, disabled }: { websiteId: string; disabled?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/websites/${websiteId}/export`);
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        setError(body?.message ?? "The export could not be prepared. Please try again.");
        return;
      }
      const blob = await res.blob();
      const name = res.headers.get("content-disposition")?.match(/filename="([^"]+)"/)?.[1] ?? "site.zip";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("The export could not be prepared. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <button type="button" onClick={download} disabled={busy || disabled} className="btn-secondary !px-2.5 !py-1.5 text-xs">
        <Download className="mr-1.5 h-3.5 w-3.5" />
        {busy ? "Preparing…" : "Download site (.zip)"}
      </button>
      {error ? <p className="mt-1.5 text-xs text-[#ef4444]">{error}</p> : null}
    </div>
  );
}

"use client";

import { useActionState, useState } from "react";
import { resetDomainSetup } from "@/lib/vigil/actions/domain-admin";

type WebsiteSetup = {
  id: string; name: string; canReset: boolean; intentVersion: number;
  domains: { id: string; hostname: string; updated_at: string }[];
};

export function AdminDomainControls({ customer, websites, selectedWebsite }: { customer: string; websites: WebsiteSetup[]; selectedWebsite?: string }) {
  const [website, setWebsite] = useState(selectedWebsite ?? websites[0]?.id ?? "");
  const [confirming, setConfirming] = useState(false);
  const [result, action, pending] = useActionState(resetDomainSetup, null);
  const setup = websites.find(item => item.id === website);
  return <aside aria-label="Admin domain management" className="mb-5 space-y-3 rounded-xl border border-[color:var(--accent)] bg-[color:var(--bg-surface-soft)] p-4">
    <p className="text-sm font-semibold text-[color:var(--accent)]">Admin access · {customer}</p>
    <p className="text-sm text-[color:var(--text-secondary)]">You’re using the customer’s real domain setup. Your changes are saved to this account.</p>
    {websites.length > 1 ? <label className="block text-sm">Website<select className="ml-2 rounded border bg-[color:var(--bg-surface)] p-2" value={website} disabled={pending} onChange={event => { setWebsite(event.target.value); setConfirming(false); }}>{websites.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label> : null}
    {setup?.canReset ? confirming ? <form action={action} className="space-y-3 border-t border-[color:var(--border)] pt-3">
      <p className="text-sm">Clear the saved domain choice and unfinished setup for {setup.name}{setup.domains.length ? ` (${setup.domains.map(domain => domain.hostname).join(", ")})` : ""}? You can then choose a new name or set up the same name again.</p>
      <p className="text-xs text-[color:var(--text-secondary)]">History is kept. This does not cancel a Vercel purchase, edit DNS records or publish the site.</p>
      <input type="hidden" name="website_id" value={setup.id} /><input type="hidden" name="intent_version" value={setup.intentVersion} />
      <input type="hidden" name="domain_snapshot" value={JSON.stringify(setup.domains.map(({ id, updated_at }) => ({ id, updated_at })))} />
      <input type="hidden" name="confirm_reset" value="yes" />
      <div className="flex flex-wrap gap-3"><button type="submit" className="btn-secondary min-h-11 text-sm" disabled={pending}>{pending ? "Clearing setup…" : "Clear setup and choose a domain"}</button><button type="button" className="min-h-11 text-sm underline" disabled={pending} onClick={() => setConfirming(false)}>Keep current setup</button></div>
      {result && !result.ok ? <p role="alert" className="text-sm text-[color:var(--status-bad)]">{result.error}</p> : null}
    </form> : <button type="button" className="min-h-11 text-sm underline" onClick={() => setConfirming(true)}>Start over with another domain</button> : <p className="text-xs text-[color:var(--text-secondary)]">Reset is available for an unpublished setup. Existing production connections need a separate domain change.</p>}
  </aside>;
}

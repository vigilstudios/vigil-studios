"use client";

import { useActionState, useState } from "react";
import { startDomainConnection, type DomainState } from "@/lib/vigil/actions/domain";
import { FormError, inputClass, labelClass } from "@/components/vigil/ui";

export function ConnectDomainForm({ websites, initialHostname = "", initialWebsiteId, registrar = "other" }: { websites: { id: string; name: string }[]; initialHostname?: string; initialWebsiteId?: string; registrar?: "vercel" | "other" }) {
  const [state, action, pending] = useActionState<DomainState, FormData>(startDomainConnection, null);
  const [website, setWebsite] = useState(initialWebsiteId ?? websites[0]?.id ?? "");
  const [choosingSite, setChoosingSite] = useState(websites.length > 1 && !initialWebsiteId);
  if (choosingSite) return <div className="mt-4 space-y-4">
    <label className={labelClass} htmlFor="domain-website">Which website is this for?</label>
    <select id="domain-website" value={website} onChange={event => setWebsite(event.target.value)} className={inputClass}>{websites.map(site => <option key={site.id} value={site.id}>{site.name}</option>)}</select>
    <button type="button" className="btn-primary min-h-11 text-sm" onClick={() => setChoosingSite(false)}>Continue</button>
  </div>;
  return <form action={action} className="mt-4 space-y-4" noValidate>
    <label htmlFor="hostname" className={labelClass}>{initialHostname ? "Confirm your domain" : "Your domain"}</label>
    <input id="hostname" name="hostname" type="text" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="yourbusiness.com" defaultValue={initialHostname} className={inputClass} required disabled={pending} />
    <input type="hidden" name="website_id" value={website} />
    <input type="hidden" name="registrar" value={registrar} />
    <p className="text-xs text-[color:var(--text-secondary)]">Enter a domain you control. We’ll verify ownership before it can be connected.</p>
    <button type="submit" className="btn-primary min-h-11 text-sm" disabled={pending}>{pending ? "Preparing guide…" : "Continue to setup"}</button>
    {websites.length > 1 ? <div><button type="button" className="min-h-11 text-sm underline" onClick={() => setChoosingSite(true)}>Change website</button></div> : null}
    <FormError message={state && !state.ok ? state.error : null} />
  </form>;
}

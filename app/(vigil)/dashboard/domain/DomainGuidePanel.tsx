"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DomainGuide, type GuideDomain } from "@/components/vigil/DomainGuide";
import { confirmDnsAdded, getDomainSetup } from "@/lib/vigil/actions/onboarding";
import type { RegistrarKey } from "@/lib/vigil/onboarding/brief";

/** The same walkthrough as the wizard, for a domain the customer chose to finish later. */
export function DomainGuidePanel({ domain, initialRegistrar, canManage }: { domain: GuideDomain; initialRegistrar: RegistrarKey; canManage: boolean }) {
  const router = useRouter();
  const [state, setState] = useState<GuideDomain>(domain);
  const [registrar, setRegistrar] = useState<RegistrarKey>(initialRegistrar);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (state.status === "connected" || state.status === "released") return;
    let active = true;
    let inFlight = false;
    const id = window.setInterval(async () => {
      if (inFlight || document.visibilityState !== "visible" || !navigator.onLine) return;
      inFlight = true;
      try {
      const res = await getDomainSetup(state.domainId, registrar);
      if (active && res.ok) {
        setState(res.data);
        if (res.data.status === "connected") router.refresh();
      }
      } catch { /* Keep the current step on a temporary network failure. */ } finally { inFlight = false; }
    }, 20_000);
    return () => { active = false; window.clearInterval(id); };
  }, [state.status, state.launchReady, state.domainId, registrar, router]);

  return (
    <div className="space-y-3">
      <DomainGuide
        domain={state}
        registrar={registrar}
        onRegistrarChange={setRegistrar}
        onRefresh={async () => {
          setConfirming(true); setError(null);
          try { const res = await getDomainSetup(state.domainId, registrar); if (res.ok) setState(res.data); else setError(res.error); }
          catch { setError("The status could not be refreshed. Please retry."); } finally { setConfirming(false); }
        }}
        onConfirm={
          canManage
            ? async () => {
                setError(null);
                setConfirming(true);
                try {
                const res = await confirmDnsAdded(state.domainId, registrar);
                if (res.ok) setState(res.data);
                else setError(res.error);
                } catch { setError("The check could not finish. Please try again."); } finally { setConfirming(false); }
              }
            : undefined
        }
        confirming={confirming}
        compact
      />
      {error ? <p role="alert" className="text-xs text-[color:var(--status-bad)]">{error}</p> : null}
    </div>
  );
}

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
    if (state.status !== "verifying" || state.launchReady) return;
    const id = window.setInterval(async () => {
      const res = await getDomainSetup(state.domainId, registrar);
      if (res.ok) {
        setState(res.data);
        if (res.data.status === "connected") router.refresh();
      }
    }, 20_000);
    return () => window.clearInterval(id);
  }, [state.status, state.launchReady, state.domainId, registrar, router]);

  return (
    <div className="space-y-3">
      <DomainGuide
        domain={state}
        registrar={registrar}
        onRegistrarChange={setRegistrar}
        onConfirm={
          canManage
            ? async () => {
                setError(null);
                setConfirming(true);
                const res = await confirmDnsAdded(state.domainId, registrar);
                setConfirming(false);
                if (res.ok) setState(res.data);
                else setError(res.error);
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

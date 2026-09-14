"use client";

import type { DomainSetup } from "@/lib/vigil/actions/onboarding";
import { BriefSummary } from "@/components/vigil/BriefSummary";
import { briefCompletion, type Brief, type StepKey } from "@/lib/vigil/onboarding/brief";
import type { SignedAsset } from "@/lib/vigil/queries/onboarding";
import { StepFooter, VirtueAside } from "../wizard-ui";

type Props = {
  brief: Brief;
  assets: SignedAsset[];
  domain: DomainSetup | null;
  onEdit: (step: StepKey) => void;
  onSend: () => void;
  sending: boolean;
  error: string | null;
  onBack?: () => void;
};

export function ReviewStep({ brief, assets, domain, onEdit, onSend, sending, error, onBack }: Props) {
  const missing = briefCompletion(brief).filter((c) => !c.done);
  return (
    <div className="space-y-4">
      {missing.length > 0 ? (
        <VirtueAside>
          You can send now; a few things are still blank ({missing.map((m) => m.label.toLowerCase()).join(", ")}). The team will ask if they need them.
        </VirtueAside>
      ) : null}
      <BriefSummary brief={brief} assets={assets} domain={domain} onEdit={onEdit} />
      {error ? <p role="alert" className="text-xs text-[color:var(--status-bad)]">{error}</p> : null}
      <StepFooter onBack={onBack} onNext={onSend} nextLabel="Send to Vigil" busy={sending} />
    </div>
  );
}

"use client";

import { useState } from "react";
import type { WorkspaceBrand } from "./nav";
import { Logo } from "./Logo";

export function WorkspaceSiteIcon({ name, iconUrl }: WorkspaceBrand) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!iconUrl || failed === iconUrl) return <Logo size="sm" />;
  return (
    <span className="vigil-workspace-icon" title={name}>
      {
        // A public customer asset; keep it outside the server image optimizer.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={iconUrl}
          alt={`${name} site icon`}
          width={30}
          height={30}
          referrerPolicy="no-referrer"
          onError={() => setFailed(iconUrl)}
        />
      }
    </span>
  );
}

"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown } from "lucide-react";
import { switchOrganization } from "@/lib/vigil/actions/organization";

/** Workspace picker at the top of the sidebar. A plain label when there is only one. */
export function OrgSwitcher({
  organizations,
  activeId,
  staffView = false,
}: {
  organizations: { id: string; name: string }[];
  activeId: string;
  staffView?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const active = organizations.find((o) => o.id === activeId);

  if (organizations.length < 2) {
    return (
      <div className="min-w-0">
        <div className="truncate text-[13px] font-semibold">{active?.name}</div>
        {staffView ? <div className="text-[10px] uppercase tracking-wide text-[color:var(--accent)]">Staff view</div> : null}
      </div>
    );
  }

  return (
    <label className="relative block min-w-0">
      <span className="sr-only">Switch business</span>
      <select
        value={activeId}
        disabled={pending}
        onChange={(e) => {
          const id = e.target.value;
          startTransition(async () => {
            await switchOrganization(id);
            router.refresh();
          });
        }}
        className="w-full appearance-none truncate rounded-md bg-transparent py-1 pl-1 pr-6 text-[13px] font-semibold hover:bg-[color:var(--bg-surface-soft)]"
      >
        {organizations.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      <ChevronsUpDown className="pointer-events-none absolute right-1 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[color:var(--text-secondary)]" />
    </label>
  );
}

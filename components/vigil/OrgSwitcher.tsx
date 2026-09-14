"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { switchOrganization } from "@/lib/vigil/actions/organization";

export function OrgSwitcher({
  organizations,
  activeId,
}: {
  organizations: { id: string; name: string }[];
  activeId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (organizations.length < 2) {
    return <span className="truncate">{organizations.find((o) => o.id === activeId)?.name}</span>;
  }

  return (
    <select
      aria-label="Switch business"
      value={activeId}
      disabled={pending}
      onChange={(e) => {
        const id = e.target.value;
        startTransition(async () => {
          await switchOrganization(id);
          router.refresh();
        });
      }}
      className="max-w-[12rem] truncate rounded-md border border-[color:var(--border)] bg-transparent px-2 py-1 text-sm"
    >
      {organizations.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </select>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, StatusPill, Table, tdClass, thClass } from "@/components/vigil/ui";
import { requireStaff } from "@/lib/vigil/auth/session";
import { formatRelative, titleCase } from "@/lib/vigil/format";
import { listWebsites } from "@/lib/vigil/queries/admin";

export const metadata: Metadata = { title: "Websites" };

const tone = (s: string) => (s === "live" ? "good" : s === "error" || s === "suspended" ? "bad" : s === "archived" ? "neutral" : "info");

export default async function WebsitesPage() {
  await requireStaff("/admin/websites");
  const websites = await listWebsites();
  return (
    <div>
      <PageHeader title="Websites" description="Every site Vigil operates, by lifecycle state." />
      <Table>
        <thead>
          <tr>
            <th className={thClass}>Website</th>
            <th className={thClass}>Customer</th>
            <th className={thClass}>Status</th>
            <th className={thClass}>Live URL</th>
            <th className={thClass}>Updated</th>
          </tr>
        </thead>
        <tbody>
          {websites.map((w) => (
            <tr key={w.id}>
              <td className={tdClass}>
                <Link href={`/admin/websites/${w.id}`} className="font-medium underline">{w.name}</Link>
                {w.template_slug ? <div className="text-xs text-[color:var(--text-secondary)]">{w.template_slug}</div> : null}
              </td>
              <td className={tdClass}>
                <Link href={`/admin/organizations/${w.organization?.id}`} className="underline">{w.organization?.name}</Link>
              </td>
              <td className={tdClass}><StatusPill tone={tone(w.status)}>{titleCase(w.status)}</StatusPill></td>
              <td className={tdClass}>{w.live_url ?? "Not set"}</td>
              <td className={tdClass}>{formatRelative(w.updated_at)}</td>
            </tr>
          ))}
          {websites.length === 0 ? (
            <tr><td className={tdClass} colSpan={5}>No websites yet.</td></tr>
          ) : null}
        </tbody>
      </Table>
    </div>
  );
}

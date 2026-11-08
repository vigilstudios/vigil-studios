import Link from "next/link";
import {
  ArrowRight,
  Search,
  Users,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import {
  accountFilterLabels,
  accountFilters,
  accountStatus,
  type AccountFilter,
  type accountDirectorySchema,
} from "@/lib/vigil/accounts/directory";
import type { z } from "zod";
import { Card, PageHeader, StatusPill, Table, tdClass, thClass } from "./ui";
import { formatDate } from "@/lib/vigil/format";
export function CustomerAccounts({
  data,
  filter,
  query,
  page,
}: {
  data: z.infer<typeof accountDirectorySchema>;
  filter: AccountFilter;
  query: string;
  page: number;
}) {
  const href = (f = filter, p = 1) =>
    `/admin/organizations?${new URLSearchParams({ status: f, ...(query ? { q: query } : {}), ...(p > 1 ? { page: String(p) } : {}) })}`;
  return (
    <div className="space-y-5">
      <PageHeader
        title="Customer accounts"
        description="Everyone who created a Vigil account, with purchase and project status."
        actions={
          <Link
            href="/admin/organizations?view=businesses"
            className="btn-secondary min-h-11 text-xs"
          >
            Manage businesses <ArrowRight size={14} />
          </Link>
        }
      />
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: Users, key: "all" as const, label: "Accounts" },
          {
            icon: ShoppingBag,
            key: "purchased" as const,
            label: "With a purchase",
          },
          {
            icon: UserRound,
            key: "no_purchase" as const,
            label: "Without a purchase",
          },
        ].map((c) => (
          <Link key={c.key} href={href(c.key)}>
            <Card className="!rounded-2xl !p-5">
              <div className="flex items-center justify-between text-xs text-[color:var(--text-secondary)]">
                {c.label}
                <c.icon size={17} />
              </div>
              <p className="mt-4 text-2xl font-semibold tabular-nums">
                {data.counts[c.key]}
              </p>
            </Card>
          </Link>
        ))}
      </div>
      <Card className="!rounded-2xl !p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--border)] p-4">
          <nav
            className="flex flex-wrap gap-1"
            aria-label="Customer account filters"
          >
            {accountFilters.map((f) => (
              <Link
                key={f}
                href={href(f)}
                aria-current={f === filter ? "page" : undefined}
                className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-xs font-medium ${filter === f ? "bg-[color:var(--bg-surface-soft)] text-[color:var(--text-primary)]" : "text-[color:var(--text-secondary)]"}`}
              >
                {accountFilterLabels[f]}
                <span className="text-[10px] opacity-60">{data.counts[f]}</span>
              </Link>
            ))}
          </nav>
          <form action="/admin/organizations" className="flex gap-2">
            <input type="hidden" name="status" value={filter} />
            <label className="relative">
              <span className="sr-only">Search customer accounts</span>
              <Search className="absolute left-3 top-3 h-4 w-4 text-[color:var(--text-secondary)]" />
              <input
                name="q"
                defaultValue={query}
                maxLength={120}
                placeholder="Name or email"
                className="min-h-10 w-48 rounded-lg border border-[color:var(--border)] bg-transparent pl-9 pr-3 text-xs"
              />
            </label>
            <button className="btn-secondary min-h-10 !px-3 text-xs">
              Search
            </button>
          </form>
        </div>
        <Table>
          <thead>
            <tr>
              {["Account", "Purchase status", "Business", "Joined", ""].map(
                (h, i) => (
                  <th key={i} className={thClass}>
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {data.rows.length ? (
              data.rows.map((a) => (
                <tr key={a.id}>
                  <td className={tdClass}>
                    <Link
                      className="font-medium hover:underline"
                      href={`/admin/accounts/${a.id}`}
                    >
                      {a.full_name || "Name not provided"}
                    </Link>
                    <p className="mt-1 text-xs text-[color:var(--text-secondary)]">
                      {a.email}
                    </p>
                    {!a.email_verified && (
                      <p className="mt-1 text-[10px] text-[color:var(--text-secondary)]">
                        Email verification pending
                      </p>
                    )}
                  </td>
                  <td className={tdClass}>
                    <StatusPill
                      tone={
                        a.purchase_count > 0
                          ? "good"
                          : a.pending_count > 0
                            ? "warn"
                            : "neutral"
                      }
                    >
                      {accountStatus(a)}
                    </StatusPill>
                    {a.live_sites > 0 && (
                      <p className="mt-1 text-[11px] text-[color:var(--text-secondary)]">
                        {a.live_sites} live{" "}
                        {a.live_sites === 1 ? "website" : "websites"}
                      </p>
                    )}
                  </td>
                  <td className={tdClass}>
                    {a.businesses.length ? (
                      a.businesses.map((b) => (
                        <Link
                          key={b.id}
                          className="block text-xs hover:underline"
                          href={`/admin/organizations/${b.id}`}
                        >
                          {b.name}
                        </Link>
                      ))
                    ) : (
                      <span className="text-xs text-[color:var(--text-secondary)]">
                        Not started
                      </span>
                    )}
                  </td>
                  <td className={tdClass}>{formatDate(a.created_at)}</td>
                  <td className={tdClass}>
                    <Link
                      href={`/admin/accounts/${a.id}`}
                      className="text-xs font-medium underline"
                    >
                      View account
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className={`${tdClass} !py-12 text-center text-[color:var(--text-secondary)]`}
                >
                  No accounts match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
        <footer className="flex items-center justify-between border-t border-[color:var(--border)] px-5 py-4 text-xs text-[color:var(--text-secondary)]">
          <span>
            {data.total} {data.total === 1 ? "account" : "accounts"}
            {query ? ` matching “${query}”` : ""}
          </span>
          <div className="flex gap-4">
            {page > 1 && (
              <Link className="underline" href={href(filter, page - 1)}>
                Previous
              </Link>
            )}
            {page * 25 < data.total && (
              <Link className="underline" href={href(filter, page + 1)}>
                Next
              </Link>
            )}
          </div>
        </footer>
      </Card>
      <p className="text-[11px] text-[color:var(--text-secondary)]">
        A started checkout is not a purchase. Refunded orders are listed
        separately; invitations and existing businesses remain available under
        Manage businesses.
      </p>
    </div>
  );
}
